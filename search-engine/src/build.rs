//! Index writer with the same tokenizer as the query engine.

use crate::format::{
    write_u32, write_varint, CHECKPOINT_STRIDE, DOC_ENTRY_LEN, HEADER_LEN, MAGIC, TERM_ENTRY_LEN,
    VERSION,
};
use crate::tokenize::tokenize;
use std::collections::BTreeMap;

struct Entry {
    slug: String,
    title: String,
    date: String,
    label: String,
    body: String,
    token_count: u32,
    /// One per `CHECKPOINT_STRIDE` ordinals, packed as `offset << 1 | line gap`.
    checkpoints: Vec<u32>,
}

/// Document IDs and token ordinals, both in ascending order.
type Postings = Vec<(u32, Vec<u32>)>;

#[derive(Default)]
pub struct Builder {
    entries: Vec<Entry>,
    terms: BTreeMap<String, Postings>,
}

/// Records where a walk can resume, one ordinal in every `CHECKPOINT_STRIDE`.
///
/// The flag says whether the ordinal is the line gap the tokenizer opens before
/// a word rather than the word itself. A gap carries the offset of the word it
/// precedes, so the two are indistinguishable in the text and only a stored bit
/// tells a resumed walk which ordinal its first word answers to.
fn checkpoints(starts: &[u32]) -> Vec<u32> {
    let mut out = Vec::with_capacity(starts.len() / CHECKPOINT_STRIDE as usize + 1);
    let mut at = 0usize;

    while at < starts.len() {
        let gap = starts.get(at + 1) == Some(&starts[at]);

        /* One entry stays under 2 GiB, which the whole pool already had to be
           for its `u32` offsets, so the low bit is free to carry the flag. */
        debug_assert!(starts[at] <= u32::MAX >> 1);
        out.push((starts[at] << 1) | u32::from(gap));
        at += CHECKPOINT_STRIDE as usize;
    }

    out
}

impl Builder {
    pub fn add(&mut self, slug: &str, title: &str, date: &str, label: &str, body: &str) {
        let doc = self.entries.len() as u32;
        let read = tokenize(body);

        for term in &read.terms {
            let postings = self.terms.entry(term.text.clone()).or_default();

            match postings.last_mut() {
                Some((last_doc, ordinals)) if *last_doc == doc => {
                    // A compound and a piece can fold to the same text at one ordinal.
                    if ordinals.last() != Some(&term.ordinal) {
                        ordinals.push(term.ordinal);
                    }
                }
                _ => postings.push((doc, vec![term.ordinal])),
            }
        }

        self.entries.push(Entry {
            slug: slug.to_string(),
            title: title.to_string(),
            date: date.to_string(),
            label: label.to_string(),
            body: body.to_string(),
            token_count: read.starts.len() as u32,
            checkpoints: checkpoints(&read.starts),
        });
    }

    /// Writes the three artifacts a build publishes: the index, the postings,
    /// and the reading text every snippet is cut from.
    ///
    /// They part because they are read on different schedules. The index is
    /// what a query needs before it can do anything, and it is the only one
    /// fetched whole. A query reads the postings of its own terms and no
    /// others, and one window of one entry for each result it prints, so the
    /// other two are the large ones and the least of them any query touches.
    /// Split, the index is compressed while the other two stay as written and
    /// are reached by byte range, which is meaningful only because the term
    /// table turns a prefix into one contiguous stretch of the postings and the
    /// checkpoints turn an ordinal into an offset without a walk from the first
    /// byte of the entry.
    pub fn finish(self) -> (Vec<u8>, Vec<u8>, Vec<u8>) {
        let mut pool: Vec<u8> = Vec::new();

        // Contiguous dictionary text lets the next term offset define each term's length.
        let mut term_text_starts = Vec::with_capacity(self.terms.len() + 1);
        for term in self.terms.keys() {
            term_text_starts.push(pool.len() as u32);
            pool.extend_from_slice(term.as_bytes());
        }
        term_text_starts.push(pool.len() as u32);

        let push = |pool: &mut Vec<u8>, text: &str| -> (u32, u32) {
            let start = pool.len() as u32;
            pool.extend_from_slice(text.as_bytes());
            (start, text.len() as u32)
        };

        let mut body: Vec<u8> = Vec::new();
        let mut doc_ranges = Vec::with_capacity(self.entries.len());
        let mut checkpoint_table: Vec<u32> = Vec::new();

        for entry in &self.entries {
            let body_start = body.len() as u32;
            body.extend_from_slice(entry.body.as_bytes());

            doc_ranges.push((
                [
                    (body_start, entry.body.len() as u32),
                    push(&mut pool, &entry.slug),
                    push(&mut pool, &entry.title),
                    push(&mut pool, &entry.date),
                    push(&mut pool, &entry.label),
                ],
                checkpoint_table.len() as u32,
            ));

            checkpoint_table.extend_from_slice(&entry.checkpoints);
        }

        let mut postings: Vec<u8> = Vec::new();
        let mut postings_starts = Vec::with_capacity(self.terms.len() + 1);
        for runs in self.terms.values() {
            postings_starts.push(postings.len() as u32);
            write_varint(&mut postings, runs.len() as u32);

            let mut previous_doc = 0u32;
            for (doc, ordinals) in runs {
                write_varint(&mut postings, doc - previous_doc);
                previous_doc = *doc;

                write_varint(&mut postings, ordinals.len() as u32);

                let mut previous = 0u32;
                for ordinal in ordinals {
                    write_varint(&mut postings, ordinal - previous);
                    previous = *ordinal;
                }
            }
        }
        postings_starts.push(postings.len() as u32);

        let total_tokens: u64 = self.entries.iter().map(|e| e.token_count as u64).sum();
        let average_length = if self.entries.is_empty() {
            0.0
        } else {
            total_tokens as f32 / self.entries.len() as f32
        };

        let docs_off = HEADER_LEN;
        let terms_off = docs_off + self.entries.len() * DOC_ENTRY_LEN;
        let checkpoints_off = terms_off + (self.terms.len() + 1) * TERM_ENTRY_LEN;
        let pool_off = checkpoints_off + checkpoint_table.len() * 4;

        let mut out = Vec::with_capacity(pool_off + pool.len());
        out.extend_from_slice(&MAGIC);
        write_u32(&mut out, VERSION);
        write_u32(&mut out, self.entries.len() as u32);
        write_u32(&mut out, self.terms.len() as u32);
        write_u32(&mut out, docs_off as u32);
        write_u32(&mut out, terms_off as u32);
        write_u32(&mut out, checkpoints_off as u32);
        write_u32(&mut out, checkpoint_table.len() as u32);
        write_u32(&mut out, CHECKPOINT_STRIDE);
        write_u32(&mut out, pool_off as u32);
        write_u32(&mut out, pool.len() as u32);
        write_u32(&mut out, average_length.to_bits());

        for (entry, (ranges, checkpoint_start)) in self.entries.iter().zip(&doc_ranges) {
            for (start, len) in ranges {
                write_u32(&mut out, *start);
                write_u32(&mut out, *len);
            }
            write_u32(&mut out, entry.token_count);
            write_u32(&mut out, *checkpoint_start);
        }

        for index in 0..=self.terms.len() {
            write_u32(&mut out, term_text_starts[index]);
            write_u32(&mut out, postings_starts[index]);
        }

        for checkpoint in &checkpoint_table {
            write_u32(&mut out, *checkpoint);
        }

        out.extend_from_slice(&pool);

        (out, postings, body)
    }
}

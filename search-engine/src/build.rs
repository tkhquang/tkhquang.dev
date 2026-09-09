//! Index writer with the same tokenizer as the query engine.

use crate::format::{
    write_u32, write_varint, DOC_ENTRY_LEN, HEADER_LEN, MAGIC, TERM_ENTRY_LEN, VERSION,
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
}

/// Document IDs and token ordinals, both in ascending order.
type Postings = Vec<(u32, Vec<u32>)>;

#[derive(Default)]
pub struct Builder {
    entries: Vec<Entry>,
    terms: BTreeMap<String, Postings>,
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
        });
    }

    pub fn finish(self) -> Vec<u8> {
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

        let mut doc_ranges = Vec::with_capacity(self.entries.len());
        for entry in &self.entries {
            doc_ranges.push([
                push(&mut pool, &entry.body),
                push(&mut pool, &entry.slug),
                push(&mut pool, &entry.title),
                push(&mut pool, &entry.date),
                push(&mut pool, &entry.label),
            ]);
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
        let postings_off = terms_off + (self.terms.len() + 1) * TERM_ENTRY_LEN;
        let pool_off = postings_off + postings.len();

        let mut out = Vec::with_capacity(pool_off + pool.len());
        out.extend_from_slice(&MAGIC);
        write_u32(&mut out, VERSION);
        write_u32(&mut out, self.entries.len() as u32);
        write_u32(&mut out, self.terms.len() as u32);
        write_u32(&mut out, docs_off as u32);
        write_u32(&mut out, terms_off as u32);
        write_u32(&mut out, postings_off as u32);
        write_u32(&mut out, pool_off as u32);
        write_u32(&mut out, pool.len() as u32);
        write_u32(&mut out, average_length.to_bits());

        for (entry, ranges) in self.entries.iter().zip(&doc_ranges) {
            for (start, len) in ranges {
                write_u32(&mut out, *start);
                write_u32(&mut out, *len);
            }
            write_u32(&mut out, entry.token_count);
        }

        for index in 0..=self.terms.len() {
            write_u32(&mut out, term_text_starts[index]);
            write_u32(&mut out, postings_starts[index]);
        }

        out.extend_from_slice(&postings);
        out.extend_from_slice(&pool);

        out
    }
}

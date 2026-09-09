//! Binary index reader with little-endian fixed tables and LEB128 posting gaps.

pub const MAGIC: [u8; 4] = *b"LJIX";

/// Increment when the layout, tokenizer, or ordinal semantics become incompatible.
pub const VERSION: u32 = 3;

pub const HEADER_LEN: usize = 48;

/// `u32` fields of a doc table entry, in order.
pub const DOC_FIELDS: usize = 12;
pub const DOC_ENTRY_LEN: usize = DOC_FIELDS * 4;

/// `text_start` and `postings_start`. A sentinel supplies the final term's end
/// offsets. The postings offset addresses the postings artifact, which the
/// index does not carry: a query reads the lists of its own terms and no others.
pub const TERM_ENTRY_LEN: usize = 8;

/// Ordinals between checkpoints. Four bytes buys the byte offset of every 64th
/// ordinal, which costs `tokens / 16` over the corpus, and turns rendering a
/// snippet from a walk of the whole entry into a walk of at most this many words.
pub const CHECKPOINT_STRIDE: u32 = 64;

pub fn write_u32(out: &mut Vec<u8>, value: u32) {
    out.extend_from_slice(&value.to_le_bytes());
}

pub fn write_varint(out: &mut Vec<u8>, mut value: u32) {
    while value >= 0x80 {
        out.push((value as u8) | 0x80);
        value >>= 7;
    }
    out.push(value as u8);
}

/// Advances `at` past a varint. Truncated or overflowing sequences return `None`.
pub fn read_varint(bytes: &[u8], at: &mut usize) -> Option<u32> {
    let mut value = 0u32;
    let mut shift = 0u32;

    loop {
        let byte = *bytes.get(*at)?;
        *at += 1;

        if shift > 28 || (shift == 28 && byte & 0xF0 != 0) {
            return None;
        }

        value |= ((byte & 0x7F) as u32) << shift;

        if byte & 0x80 == 0 {
            return Some(value);
        }

        shift += 7;
    }
}

fn read_u32(bytes: &[u8], at: usize) -> Option<u32> {
    let slice = bytes.get(at..at.checked_add(4)?)?;
    Some(u32::from_le_bytes([slice[0], slice[1], slice[2], slice[3]]))
}

/// One entry, as the doc table holds it.
#[derive(Clone, Copy)]
pub struct Doc {
    /// Range in the body file, which the index itself does not carry.
    pub body: (u32, u32),
    pub slug: (u32, u32),
    pub title: (u32, u32),
    pub date: (u32, u32),
    pub label: (u32, u32),
    /// Words in the body, for the length normalization in BM25.
    pub token_count: u32,
    /// Where this entry's checkpoints begin in the checkpoint table.
    pub checkpoints: u32,
}

impl Doc {
    /// Checkpoints this entry owns, one per `stride` ordinals.
    pub fn checkpoint_count(&self, stride: u32) -> u32 {
        self.token_count.div_ceil(stride.max(1))
    }
}

pub struct Index<'a> {
    bytes: &'a [u8],
    pub doc_count: u32,
    pub term_count: u32,
    docs_off: usize,
    terms_off: usize,
    pool_off: usize,
    pool_len: usize,
    checkpoints_off: usize,
    checkpoint_count: u32,
    pub checkpoint_stride: u32,
    /// Stored mean token count for BM25 normalization.
    pub average_length: f32,
}

impl<'a> Index<'a> {
    /// Checks the compatibility version and outer table bounds. Accessors check individual ranges.
    pub fn open(bytes: &'a [u8]) -> Option<Index<'a>> {
        if bytes.len() < HEADER_LEN || bytes[0..4] != MAGIC {
            return None;
        }

        if read_u32(bytes, 4)? != VERSION {
            return None;
        }

        let doc_count = read_u32(bytes, 8)?;
        let term_count = read_u32(bytes, 12)?;
        let docs_off = read_u32(bytes, 16)? as usize;
        let terms_off = read_u32(bytes, 20)? as usize;
        let checkpoints_off = read_u32(bytes, 24)? as usize;
        let checkpoint_count = read_u32(bytes, 28)?;
        let checkpoint_stride = read_u32(bytes, 32)?;
        let pool_off = read_u32(bytes, 36)? as usize;
        let pool_len = read_u32(bytes, 40)? as usize;
        let average_length = f32::from_bits(read_u32(bytes, 44)?);

        if checkpoint_stride == 0 {
            return None;
        }

        let docs_len = (doc_count as usize).checked_mul(DOC_ENTRY_LEN)?;
        let terms_len = (term_count as usize)
            .checked_add(1)?
            .checked_mul(TERM_ENTRY_LEN)?;
        let checkpoints_len = (checkpoint_count as usize).checked_mul(4)?;

        let fits = |start: usize, len: usize| -> bool {
            start.checked_add(len).is_some_and(|end| end <= bytes.len())
        };

        if !fits(docs_off, docs_len)
            || !fits(terms_off, terms_len)
            || !fits(pool_off, pool_len)
            || !fits(checkpoints_off, checkpoints_len)
        {
            return None;
        }

        Some(Index {
            bytes,
            doc_count,
            term_count,
            docs_off,
            terms_off,
            pool_off,
            pool_len,
            checkpoints_off,
            checkpoint_count,
            checkpoint_stride,
            average_length,
        })
    }

    fn pool_slice(&self, range: (u32, u32)) -> &'a [u8] {
        let start = range.0 as usize;
        let Some(end) = start.checked_add(range.1 as usize) else {
            return &[];
        };

        self.bytes[self.pool_off..self.pool_off + self.pool_len]
            .get(start..end)
            .unwrap_or(&[])
    }

    pub fn pool_str(&self, range: (u32, u32)) -> &'a str {
        std::str::from_utf8(self.pool_slice(range)).unwrap_or("")
    }

    pub fn doc(&self, id: u32) -> Option<Doc> {
        if id >= self.doc_count {
            return None;
        }

        let at = self.docs_off + id as usize * DOC_ENTRY_LEN;
        let field = |n: usize| read_u32(self.bytes, at + n * 4).unwrap_or(0);

        Some(Doc {
            body: (field(0), field(1)),
            slug: (field(2), field(3)),
            title: (field(4), field(5)),
            date: (field(6), field(7)),
            label: (field(8), field(9)),
            token_count: field(10),
            checkpoints: field(11),
        })
    }

    /// The byte offset within an entry of the ordinal a checkpoint stands at,
    /// and whether that ordinal is the line gap the tokenizer opens before a
    /// word rather than the word itself. A walk resumed at a checkpoint needs
    /// the flag to number its first word, because a gap shares its offset with
    /// the word it precedes and the bytes alone cannot tell them apart.
    pub fn checkpoint(&self, entry: &Doc, at: u32) -> Option<(u32, bool)> {
        if at >= entry.checkpoint_count(self.checkpoint_stride) {
            return None;
        }

        let index = entry.checkpoints.checked_add(at)?;
        if index >= self.checkpoint_count {
            return None;
        }

        let packed = read_u32(self.bytes, self.checkpoints_off + index as usize * 4)?;
        Some((packed >> 1, packed & 1 == 1))
    }

    /// The text of one dictionary term, by position.
    pub fn term(&self, ordinal: u32) -> &'a str {
        self.term_text(ordinal)
    }

    fn term_text(&self, ordinal: u32) -> &'a str {
        let at = self.terms_off + ordinal as usize * TERM_ENTRY_LEN;
        let start = read_u32(self.bytes, at).unwrap_or(0);
        let next = read_u32(self.bytes, at + TERM_ENTRY_LEN).unwrap_or(start);
        self.pool_str((start, next.saturating_sub(start)))
    }

    /// Where one term's posting list lies in the postings artifact.
    pub fn postings_span(&self, ordinal: u32) -> (u32, u32) {
        let at = self.terms_off + ordinal as usize * TERM_ENTRY_LEN;
        let start = read_u32(self.bytes, at + 4).unwrap_or(0);
        let next = read_u32(self.bytes, at + TERM_ENTRY_LEN + 4).unwrap_or(start);
        (start, next.saturating_sub(start))
    }

    /// Finds the first term at or after `prefix` in dictionary order.
    fn lower_bound(&self, prefix: &str) -> u32 {
        let mut low = 0u32;
        let mut high = self.term_count;

        while low < high {
            let mid = low + (high - low) / 2;

            if self.term_text(mid) < prefix {
                low = mid + 1;
            } else {
                high = mid;
            }
        }

        low
    }

    /// The dictionary position of one exact term.
    pub fn exact(&self, term: &str) -> Option<u32> {
        let at = self.lower_bound(term);

        if at < self.term_count && self.term_text(at) == term {
            Some(at)
        } else {
            None
        }
    }

    /// Every dictionary term that starts with `prefix`, as one run.
    ///
    /// Terms are stored in dictionary order and their postings are written in
    /// that same order, so this run is also one contiguous stretch of the
    /// postings artifact: a prefix costs one request however many terms it
    /// reaches, and covers every extension of itself.
    pub fn with_prefix(&self, prefix: &str) -> std::ops::Range<u32> {
        let from = self.lower_bound(prefix);
        let mut to = from;

        while to < self.term_count && self.term_text(to).starts_with(prefix) {
            to += 1;
        }

        from..to
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::tokenize::word_starts;
    use crate::Builder;

    #[test]
    fn varints_reject_truncation_and_values_above_u32() {
        assert_eq!(
            read_varint(&[0xFF, 0xFF, 0xFF, 0xFF, 0x0F], &mut 0),
            Some(u32::MAX)
        );
        for bytes in [&[0x80][..], &[0xFF, 0xFF, 0xFF, 0xFF, 0x10], &[0x80; 6]] {
            assert_eq!(read_varint(bytes, &mut 0), None);
        }
    }

    #[test]
    fn invalid_pool_ranges_return_empty_without_offset_overflow() {
        let mut builder = Builder::default();
        builder.add("entry", "Entry", "", "", "word");
        let (bytes, _, _) = builder.finish();
        let index = Index::open(&bytes).unwrap();

        assert_eq!(index.pool_str((u32::MAX, 1)), "");
        assert_eq!(index.pool_str((1, u32::MAX)), "");
        assert_eq!(index.pool_str((index.pool_len as u32, 1)), "");
    }

    #[test]
    fn a_checkpoint_stands_on_the_ordinal_its_stride_names() {
        let body = (0..200)
            .map(|n| format!("word{n}"))
            .collect::<Vec<_>>()
            .join(" ");
        let mut builder = Builder::default();
        builder.add("entry", "Entry", "", "", &body);
        let (bytes, _, _) = builder.finish();
        let index = Index::open(&bytes).unwrap();
        let entry = index.doc(0).unwrap();
        let starts = word_starts(&body);

        assert_eq!(entry.token_count, 200);
        assert_eq!(entry.checkpoint_count(CHECKPOINT_STRIDE), 4);
        assert_eq!(index.checkpoint(&entry, 4), None);

        for at in 0..4 {
            let (offset, gap) = index.checkpoint(&entry, at).unwrap();
            assert_eq!(offset, starts[(at * CHECKPOINT_STRIDE) as usize]);
            assert!(!gap);
        }
    }

    #[test]
    fn a_checkpoint_that_lands_on_a_line_gap_says_so() {
        /* Two words to a line puts a gap ordinal at every third position from
           the second line on, so the stride is bound to land on one. */
        let body = (0..90)
            .map(|n| format!("word{n} tail{n}"))
            .collect::<Vec<_>>()
            .join("\n");
        let mut builder = Builder::default();
        builder.add("entry", "Entry", "", "", &body);
        let (bytes, _, _) = builder.finish();
        let index = Index::open(&bytes).unwrap();
        let entry = index.doc(0).unwrap();
        let starts = word_starts(&body);

        assert_eq!(entry.token_count as usize, starts.len());

        let mut flagged = 0;
        for at in 0..entry.checkpoint_count(index.checkpoint_stride) {
            let ordinal = (at * index.checkpoint_stride) as usize;
            let (offset, gap) = index.checkpoint(&entry, at).unwrap();

            assert_eq!(offset, starts[ordinal]);
            assert_eq!(gap, starts.get(ordinal + 1) == Some(&starts[ordinal]));
            flagged += usize::from(gap);
        }

        assert!(flagged > 0, "no checkpoint landed on a line gap");
    }
}

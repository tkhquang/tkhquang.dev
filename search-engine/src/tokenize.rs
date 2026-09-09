//! Shared word boundaries for index terms, query terms, and snippet offsets.

use crate::fold::{fold_char, is_mark};

/// Internal punctuation preserves names such as `sw.js`, `z-index`, and `use_server`.
const INNER: [char; 3] = ['.', '-', '_'];

/// Suffix punctuation preserves `c++`, `c#`, and `f#`. Sentence punctuation remains outside the token.
const SUFFIX: [char; 2] = ['+', '#'];

/// One occurrence of one term.
pub struct Term {
    /// Folded text, as the dictionary stores it.
    pub text: String,
    /// Position in the entry. Compound pieces share their whole token's ordinal.
    pub ordinal: u32,
}

/// An entry, or a query, read as terms.
pub struct Tokenized {
    pub terms: Vec<Term>,
    /// Byte offsets in the source text, indexed by ordinal.
    pub starts: Vec<u32>,
}

fn is_word(character: char) -> bool {
    character.is_alphanumeric()
}

/// Identifies characters that keep the final query word open for prefix expansion.
pub fn continues_word(character: char) -> bool {
    is_word(character)
        || is_mark(character)
        || INNER.contains(&character)
        || SUFFIX.contains(&character)
}

/// What the scanner does with one character. `MARK`, `SUFFIX_MARK` and
/// `INNER_MARK` act only inside an open word, and `OUTSIDE` closes one.
const OUTSIDE: u8 = 0;
const WORD: u8 = 1;
const MARK: u8 = 2;
const SUFFIX_MARK: u8 = 3;
const INNER_MARK: u8 = 4;
/// A byte that opens a character the table cannot answer for on its own.
const WIDE: u8 = 5;

/// One class per byte. The corpus outside a handful of accented words is ASCII,
/// and reading it a byte at a time is several times the speed of decoding every
/// character. That matters because a snippet recovers the word offsets of an
/// entry by scanning its whole body, which is the largest cost of a first query.
const CLASS: [u8; 256] = {
    let mut table = [WIDE; 256];
    let mut at = 0usize;

    while at < 128 {
        table[at] = match at as u8 {
            b'0'..=b'9' | b'A'..=b'Z' | b'a'..=b'z' => WORD,
            b'+' | b'#' => SUFFIX_MARK,
            b'.' | b'-' | b'_' => INNER_MARK,
            _ => OUTSIDE,
        };
        at += 1;
    }

    table
};

/// Calls `on_word` with each byte range and its preceding line-break flag. A false result stops the scan.
fn scan_words(text: &str, mut on_word: impl FnMut(usize, usize, bool) -> bool) {
    let bytes = text.as_bytes();
    let mut start: Option<usize> = None;
    // Internal punctuation belongs to the token only when a later character extends this edge.
    let mut end = 0usize;
    let mut broke = false;
    let mut at = 0usize;

    while at < bytes.len() {
        let byte = bytes[at];
        let mut class = CLASS[byte as usize];
        let mut width = 1usize;

        // A character above ASCII classifies itself, and a letter there spans up to
        // four bytes. Every step advances by a whole character, so `at` always
        // stands on the boundary the slice below requires.
        if class == WIDE {
            let character = text[at..]
                .chars()
                .next()
                .unwrap_or(char::REPLACEMENT_CHARACTER);

            width = character.len_utf8();
            class = if is_word(character) {
                WORD
            } else if is_mark(character) {
                MARK
            } else {
                OUTSIDE
            };
        }

        match class {
            WORD => {
                start.get_or_insert(at);
                end = at + width;
            }
            MARK | SUFFIX_MARK if start.is_some() => {
                end = at + width;
            }
            INNER_MARK if start.is_some() => {}
            _ => {
                if let Some(from) = start.take() {
                    if !on_word(from, end, std::mem::take(&mut broke)) {
                        return;
                    }
                }

                if byte == b'\n' {
                    broke = true;
                }
            }
        }

        at += width;
    }

    if let Some(from) = start {
        on_word(from, end, broke);
    }
}

/// Inserts an ordinal gap across line breaks so phrase scores cannot cross block boundaries.
/// A duplicate offset keeps ordinal lookup valid for snippets.
fn open_gap(starts: &mut Vec<u32>, from: usize, broke: bool) {
    if broke && !starts.is_empty() {
        starts.push(from as u32);
    }
}

/// Omits single-letter compound pieces because they introduce unrelated matches, such as `c` from `c++`.
fn pieces(token: &str) -> Vec<String> {
    let mut out = Vec::new();
    let mut piece = String::new();

    for character in token.chars() {
        if INNER.contains(&character) || SUFFIX.contains(&character) {
            if piece.chars().count() > 1 {
                out.push(std::mem::take(&mut piece));
            } else {
                piece.clear();
            }
        } else {
            piece.push(character);
        }
    }

    if piece.chars().count() > 1 {
        out.push(piece);
    }

    out
}

/// Reads an entry, or a query, into terms and the positions they stand at.
pub fn tokenize(text: &str) -> Tokenized {
    let mut out = Tokenized {
        terms: Vec::new(),
        starts: Vec::new(),
    };

    scan_words(text, |from, to, broke| {
        let mut whole = String::new();
        for character in text[from..to].chars() {
            fold_char(character, &mut whole);
        }

        open_gap(&mut out.starts, from, broke);

        let ordinal = out.starts.len() as u32;
        out.starts.push(from as u32);

        // A plain word contributes one term, without a duplicate whole-token alternative.
        let split = pieces(&whole);
        if split.len() != 1 || split[0] != whole {
            for piece in split {
                out.terms.push(Term {
                    text: piece,
                    ordinal,
                });
            }
        }

        out.terms.push(Term {
            text: whole,
            ordinal,
        });

        true
    });

    out
}

/// Recovers token offsets without term strings or accent normalization.
pub fn word_starts(text: &str) -> Vec<u32> {
    let mut out = Vec::new();

    scan_words(text, |from, _, broke| {
        open_gap(&mut out, from, broke);
        out.push(from as u32);
        true
    });

    out
}

/// Returns the token length at `start`. The offset must lie on a character boundary within `text`.
pub fn token_len_at(text: &str, start: usize) -> usize {
    let mut len = 0usize;

    scan_words(&text[start..], |from, to, _| {
        if from == 0 {
            len = to;
        }
        false
    });

    len
}

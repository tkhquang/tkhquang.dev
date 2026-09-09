//! Queries require every word, with compound and prefix alternatives within each word.

use crate::format::{read_varint, Index};
use crate::tokenize::{continues_word, token_len_at, tokenize, word_starts};

/// BM25 frequency saturation and document length normalization.
const K1: f32 = 1.2;
const B: f32 = 0.75;

/// Added once per adjacent query pair that occurs in order within a document.
const ADJACENCY_BONUS: f32 = 2.5;

/// Maximum ordinal distance for the match window and its target byte length.
const WINDOW_WORDS: u32 = 24;
const SNIPPET_BYTES: usize = 260;

/// Bounds the whitespace search so a space-free run cannot extend an edge indefinitely.
const EDGE_SLACK: usize = 48;

/// Delimit matched text. The corpus must exclude these control characters.
pub const MARK_OPEN: char = '\u{2}';
pub const MARK_CLOSE: char = '\u{3}';

const ELLIPSIS: char = '\u{2026}';

/// Marks a slot whose ordinals the answer never reads. No arena offset can
/// reach it: the arena holds one `u32` per ordinal of one query.
const UNGATHERED: u32 = u32::MAX;

pub struct Hit {
    pub doc: u32,
    pub score: f32,
    pub snippet: String,
}

/// `total` counts all matches before the result limit applies.
pub struct Answer {
    pub total: usize,
    pub hits: Vec<Hit>,
}

/// Walks one term's postings and calls `on_run` with each document, its ordinal
/// count, and the still-encoded gaps of that document. Returns the documents
/// emitted, which is the document frequency the ranking needs.
///
/// A truncated or corrupt run ends the walk and emits nothing for itself, so the
/// scoring pass and the ordinal pass agree on where a damaged list stops.
fn walk_postings(postings: &[u8], mut on_run: impl FnMut(u32, u32, &[u8])) -> usize {
    let mut at = 0usize;

    let Some(runs) = read_varint(postings, &mut at) else {
        return 0;
    };

    let mut doc = 0u32;
    let mut emitted = 0usize;

    for _ in 0..runs {
        let (Some(gap), Some(count)) = (
            read_varint(postings, &mut at),
            read_varint(postings, &mut at),
        ) else {
            return emitted;
        };

        let Some(next_doc) = doc.checked_add(gap) else {
            return emitted;
        };
        doc = next_doc;

        // Every ordinal requires at least one byte. Reject a corrupt count first.
        if count == 0 || count as usize > postings.len() - at {
            return emitted;
        }

        let from = at;
        let mut ordinal = 0u32;

        for _ in 0..count {
            let Some(step) = read_varint(postings, &mut at) else {
                return emitted;
            };
            let Some(next_ordinal) = ordinal.checked_add(step) else {
                return emitted;
            };
            ordinal = next_ordinal;
        }

        on_run(doc, count, &postings[from..at]);
        emitted += 1;
    }

    emitted
}

/// Decodes the gaps of one run into absolute ordinals.
fn each_ordinal(gaps: &[u8], mut on_ordinal: impl FnMut(u32)) {
    let mut at = 0usize;
    let mut ordinal = 0u32;

    while at < gaps.len() {
        let Some(step) = read_varint(gaps, &mut at) else {
            return;
        };
        let Some(next) = ordinal.checked_add(step) else {
            return;
        };
        ordinal = next;
        on_ordinal(ordinal);
    }
}

/// Sorts one run and returns the length that remains once repeats are removed.
fn sort_run(values: &mut [u32]) -> usize {
    values.sort_unstable();

    let mut len = 0usize;
    let mut at = 0usize;

    while at < values.len() {
        if len == 0 || values[at] != values[len - 1] {
            values[len] = values[at];
            len += 1;
        }
        at += 1;
    }

    len
}

fn idf(doc_count: u32, doc_freq: usize) -> f32 {
    let n = doc_count as f32;
    let df = doc_freq as f32;
    (1.0 + (n - df + 0.5) / (df + 0.5)).ln()
}

/// The alternatives for one typed word, as borrowed postings.
struct Slot<'a> {
    lists: Vec<&'a [u8]>,
}

fn lookup<'a>(index: &Index<'a>, term: &str, growing: bool) -> Vec<&'a [u8]> {
    if growing {
        // A term cap discards documents and gives an incorrect total for AND queries.
        index.with_prefix(term)
    } else {
        index.exact(term).into_iter().collect()
    }
}

fn slots<'a>(index: &Index<'a>, query: &str) -> Vec<Slot<'a>> {
    let read = tokenize(query);

    let Some(last) = read.terms.last() else {
        return Vec::new();
    };

    let last_ordinal = last.ordinal;
    // A delimiter completes the last word and disables prefix expansion.
    let unfinished = query.chars().next_back().is_some_and(continues_word);

    let mut out = Vec::with_capacity(read.starts.len());

    // Terms arrive in ordinal order. Group them once and skip the tokenizer's line gaps.
    for alternatives in read.terms.chunk_by(|a, b| a.ordinal == b.ordinal) {
        let whole = &alternatives[alternatives.len() - 1];
        let growing = whole.ordinal == last_ordinal && unfinished;

        // The compound precedes fallback pieces so `sw.js` does not match every `js` entry.
        let mut lists = lookup(index, &whole.text, growing);

        if lists.is_empty() {
            for piece in alternatives.iter().rev().skip(1) {
                lists.extend(lookup(index, &piece.text, growing));
            }
        }

        // No document can satisfy an absent slot. Avoid all later lookups and scoring.
        if lists.is_empty() {
            return Vec::new();
        }

        out.push(Slot { lists });
    }

    out
}

/// Everything one query writes, kept between keystrokes so that a query
/// allocates nothing once these buffers have reached their working size.
///
/// The per-slot tables are flat, indexed by `doc * width + slot`, because a
/// table of tables costs one allocation per document on every keystroke.
#[derive(Default)]
pub(crate) struct Workspace {
    /// Length normalization per document, so scoring never re-reads the doc table.
    norms: Vec<f32>,
    /// Best score of a slot's alternatives, per document and slot.
    scores: Vec<f32>,
    /// Ordinals a slot's alternatives hit, per document and slot. Zero marks a
    /// slot the document never answered.
    counts: Vec<u32>,
    /// Arena range per document and slot, or `UNGATHERED`.
    bounds: Vec<(u32, u32)>,
    /// Slots answered, per document.
    answered: Vec<u32>,
    /// Ordinals of the gathered documents, grouped and sorted by `bounds`.
    arena: Vec<u32>,
    /// One term's postings, as document and ordinal count pairs.
    run: Vec<(u32, u32)>,
    /// Documents that answered every slot, with their score.
    hits: Vec<(u32, f32)>,
    /// One result's matches, as slot and ordinal pairs in ordinal order.
    window: Vec<(usize, u32)>,
    /// Per slot, the window candidate that last covered it.
    seen: Vec<u32>,
    /// Word offsets per document, filled only for a document a result displays.
    pub(crate) starts: Vec<Option<Vec<u32>>>,
}

impl Workspace {
    /// Discards the word offsets of a previous index.
    pub(crate) fn reset(&mut self, doc_count: usize) {
        self.starts.clear();
        self.starts.resize(doc_count, None);
    }
}

pub fn search(index: &Index, query: &str, limit: usize) -> Answer {
    search_with(index, query, limit, &mut Workspace::default())
}

pub(crate) fn search_with(
    index: &Index,
    query: &str,
    limit: usize,
    work: &mut Workspace,
) -> Answer {
    let empty = Answer {
        total: 0,
        hits: Vec::new(),
    };
    let slots = slots(index, query);

    if slots.is_empty() {
        return empty;
    }

    let docs = index.doc_count as usize;
    let width = slots.len();

    // A header no builder wrote can claim more entries than the tables address.
    let Some(cells) = docs.checked_mul(width) else {
        return empty;
    };

    // Borrowed apart so that one pass can fill a table while it reads another.
    // Each buffer is cleared rather than dropped, which keeps its capacity.
    let Workspace {
        norms,
        scores,
        counts,
        bounds,
        answered,
        arena,
        run,
        hits,
        window,
        seen,
        starts,
    } = work;

    norms.clear();
    norms.reserve(docs);
    scores.clear();
    scores.resize(cells, 0.0);
    counts.clear();
    counts.resize(cells, 0);
    answered.clear();
    answered.resize(docs, 0);
    seen.clear();
    seen.resize(width, u32::MAX);

    // The offset cache belongs to the loaded index, so a query never clears it.
    // A size that disagrees names a caller that skipped `Workspace::reset`, and
    // the offsets it holds then belong to another body.
    if starts.len() != docs {
        starts.clear();
        starts.resize(docs, None);
    }

    let average = index.average_length.max(1.0);
    for doc in 0..index.doc_count {
        let length = index
            .doc(doc)
            .map_or(1.0, |entry| entry.token_count.max(1) as f32);
        norms.push(K1 * (1.0 - B + B * length / average));
    }

    // Scoring reads each document and its ordinal count, and steps over the
    // ordinals themselves. Only the documents an answer prints need them, which
    // for a one-letter prefix is a handful out of every term that starts with it.
    for (slot, alternatives) in slots.iter().enumerate() {
        for postings in &alternatives.lists {
            run.clear();
            let frequency = walk_postings(postings, |doc, count, _| run.push((doc, count)));
            let weight = idf(index.doc_count, frequency);

            for &(doc, count) in run.iter() {
                if doc as usize >= docs {
                    continue;
                }

                let cell = doc as usize * width + slot;
                let tf = count as f32;
                let normalized = tf * (K1 + 1.0) / (tf + norms[doc as usize]);
                let score = weight * normalized;

                if counts[cell] == 0 {
                    answered[doc as usize] += 1;
                    scores[cell] = score;
                } else if score > scores[cell] {
                    // Alternatives describe one word, so only their best score contributes.
                    scores[cell] = score;
                }

                counts[cell] = counts[cell].saturating_add(count);
            }
        }
    }

    hits.clear();

    for (doc, slots_answered) in answered.iter().enumerate() {
        if *slots_answered as usize != width {
            continue;
        }

        let base = doc * width;
        let score: f32 = scores[base..base + width].iter().sum();
        hits.push((doc as u32, score));
    }

    // A phrase bonus reorders the answer, so a query of two words or more holds
    // the ordinals of every document that answered before it can sort. One word
    // has no pair to check, so its ordinals are read after the sort instead, for
    // the few documents the results print.
    let phrases = width > 1;

    if phrases {
        gather(&slots, docs, width, hits, counts, bounds, arena);

        for (doc, score) in hits.iter_mut() {
            let base = *doc as usize * width;

            for pair in bounds[base..base + width].windows(2) {
                let left = &arena[pair[0].0 as usize..pair[0].1 as usize];
                let right = &arena[pair[1].0 as usize..pair[1].1 as usize];

                if left.iter().any(|at| {
                    at.checked_add(1)
                        .is_some_and(|next| right.binary_search(&next).is_ok())
                }) {
                    *score += ADJACENCY_BONUS;
                }
            }
        }
    }

    // Document order resolves equal scores and preserves the builder's newest-first order.
    hits.sort_by(|a, b| b.1.total_cmp(&a.1).then(a.0.cmp(&b.0)));

    let total = hits.len();
    hits.truncate(limit);

    if !phrases {
        gather(&slots, docs, width, hits, counts, bounds, arena);
    }

    let mut out = Vec::with_capacity(hits.len());

    for &(doc, score) in hits.iter() {
        let base = doc as usize * width;

        out.push(Hit {
            doc,
            score,
            snippet: snippet(
                index,
                doc,
                arena,
                &bounds[base..base + width],
                &mut starts[doc as usize],
                window,
                seen,
            ),
        });
    }

    Answer { total, hits: out }
}

/// Collects the ordinals of `wanted` into `arena`, one sorted run per document
/// and slot, and records where each run lies in `bounds`.
///
/// The postings are walked a second time rather than held from the scoring
/// pass. A document gap is written against the document before it, so a list
/// can only be read from its start, and walking it again costs far less than
/// keeping every ordinal of every document a prefix touched.
fn gather(
    slots: &[Slot],
    docs: usize,
    width: usize,
    wanted: &[(u32, f32)],
    counts: &[u32],
    bounds: &mut Vec<(u32, u32)>,
    arena: &mut Vec<u32>,
) {
    bounds.clear();
    bounds.resize(docs * width, (UNGATHERED, UNGATHERED));

    // One region per wanted document and slot, sized from the counts the scoring
    // pass already summed. The second element advances as the walk writes, and
    // comes to rest as the end of the run.
    let mut total = 0usize;

    for &(doc, _) in wanted {
        for slot in 0..width {
            let cell = doc as usize * width + slot;
            let at = total as u32;

            bounds[cell] = (at, at);
            total += counts[cell] as usize;
        }
    }

    arena.clear();
    arena.resize(total, 0);

    for (slot, alternatives) in slots.iter().enumerate() {
        for postings in &alternatives.lists {
            walk_postings(postings, |doc, _, gaps| {
                // Scoring skipped a document the table cannot address, and so does this.
                if doc as usize >= docs {
                    return;
                }

                let cell = doc as usize * width + slot;
                let Some(bound) = bounds.get_mut(cell) else {
                    return;
                };

                if bound.0 == UNGATHERED {
                    return;
                }

                each_ordinal(gaps, |ordinal| {
                    if let Some(slot) = arena.get_mut(bound.1 as usize) {
                        *slot = ordinal;
                        bound.1 += 1;
                    }
                });
            });
        }
    }

    for &(doc, _) in wanted {
        for slot in 0..width {
            let cell = doc as usize * width + slot;
            let (from, to) = bounds[cell];

            bounds[cell].1 = from + sort_run(&mut arena[from as usize..to as usize]) as u32;
        }
    }
}

/// Selects the window with the most distinct query slots and marks each visible match.
fn snippet(
    index: &Index,
    doc: u32,
    ordinals: &[u32],
    rows: &[(u32, u32)],
    starts: &mut Option<Vec<u32>>,
    window: &mut Vec<(usize, u32)>,
    seen: &mut [u32],
) -> String {
    let Some(entry) = index.doc(doc) else {
        return String::new();
    };

    let body = index.pool_str(entry.body);

    window.clear();
    for (slot, row) in rows.iter().enumerate() {
        for ordinal in &ordinals[row.0 as usize..row.1 as usize] {
            window.push((slot, *ordinal));
        }
    }
    window.sort_unstable_by_key(|(_, ordinal)| *ordinal);

    // Cache offsets only for displayed documents, without extra bytes in the downloaded index.
    let starts = starts.get_or_insert_with(|| word_starts(body));
    let offset_of = |ordinal: u32| starts.get(ordinal as usize).map(|at| *at as usize);

    // A candidate stamps every slot it covers with its own position, so counting
    // covered slots needs no allocation and no scan of the previous candidate.
    seen.fill(u32::MAX);

    let mut best = (0usize, 0usize);
    for (candidate, (_, from)) in window.iter().enumerate() {
        let mut covered = 0usize;

        for (slot, ordinal) in &window[candidate..] {
            if ordinal.saturating_sub(*from) > WINDOW_WORDS {
                break;
            }
            if seen[*slot] != candidate as u32 {
                seen[*slot] = candidate as u32;
                covered += 1;
            }
        }

        if covered > best.1 {
            best = (candidate, covered);
            if covered == rows.len() {
                break;
            }
        }
    }

    let anchor = window
        .get(best.0)
        .and_then(|(_, ordinal)| offset_of(*ordinal))
        .unwrap_or(0);
    let (from, to) = window_around(body, anchor, token_len_at(body, anchor));

    // The byte window can contain matches outside the ordinal window that selected it.
    let mut marks: Vec<(usize, usize)> = window
        .iter()
        .filter_map(|(_, ordinal)| offset_of(*ordinal))
        .filter(|start| *start >= from && *start < to)
        .map(|start| (start, token_len_at(body, start)))
        .filter(|(start, len)| *len > 0 && start + len <= to)
        .collect();
    marks.sort_unstable();
    marks.dedup();

    let mut out = String::with_capacity(to - from + marks.len() * 2);
    let mut at = from;

    for (start, len) in marks {
        // A compound and its pieces share a span. Emit overlapping spans only once.
        if start < at {
            continue;
        }

        out.push_str(&body[at..start]);
        out.push(MARK_OPEN);
        out.push_str(&body[start..start + len]);
        out.push(MARK_CLOSE);
        at = start + len;
    }

    out.push_str(&body[at..to]);

    let mut line = one_line(&out);

    if from > 0 {
        line.insert(0, ELLIPSIS);
    }

    if to < body.len() {
        line.push(ELLIPSIS);
    }

    line
}

/// The largest byte offset at or before `at` that begins a character.
fn char_floor(body: &str, at: usize) -> usize {
    let mut at = at.min(body.len());
    while at > 0 && !body.is_char_boundary(at) {
        at -= 1;
    }
    at
}

/// The smallest byte offset at or after `at` that begins a character.
fn char_ceil(body: &str, at: usize) -> usize {
    let mut at = at.min(body.len());
    while at < body.len() && !body.is_char_boundary(at) {
        at += 1;
    }
    at
}

/// Finds the nearest preceding whitespace boundary within `EDGE_SLACK` bytes.
fn edge_back(body: &str, at: usize) -> usize {
    let end = char_floor(body, at);
    let start = char_ceil(body, end.saturating_sub(EDGE_SLACK));
    let mut edge = end;

    for (offset, character) in body[start..end].char_indices() {
        if character.is_whitespace() {
            edge = start + offset + character.len_utf8();
        }
    }

    edge
}

/// Finds the first following whitespace boundary within `EDGE_SLACK` bytes.
fn edge_forward(body: &str, at: usize) -> usize {
    let start = char_ceil(body, at);
    let end = char_ceil(body, start.saturating_add(EDGE_SLACK));

    for (offset, character) in body[start..end].char_indices() {
        if character.is_whitespace() {
            return start + offset;
        }
    }

    end
}

/// Includes the complete anchor word, even when that word exceeds `SNIPPET_BYTES`.
fn window_around(body: &str, anchor: usize, anchor_len: usize) -> (usize, usize) {
    if body.is_empty() {
        return (0, 0);
    }

    let lead = anchor.saturating_sub(SNIPPET_BYTES / 4);
    let from = edge_back(body, lead).min(char_floor(body, anchor));
    let to = edge_forward(body, from.saturating_add(SNIPPET_BYTES))
        .max(char_ceil(body, anchor.saturating_add(anchor_len)));

    (from, to.min(body.len()))
}

/// Collapses whitespace so a snippet remains one line, including excerpts from tables.
fn one_line(text: &str) -> String {
    let mut out = String::with_capacity(text.len());
    let mut spaced = false;

    for character in text.chars() {
        if character.is_whitespace() {
            if !spaced && !out.is_empty() {
                out.push(' ');
                spaced = true;
            }
        } else {
            out.push(character);
            spaced = false;
        }
    }

    out.trim_end().to_string()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::Builder;

    #[test]
    fn corrupt_postings_cannot_allocate_from_an_unbounded_count_or_wrap_ordinals() {
        let runs = |postings: &[u8]| walk_postings(postings, |_, _, _| {});

        assert_eq!(runs(&[1, 0, 0xFF, 0xFF, 0xFF, 0xFF, 0x0F]), 0);
        assert_eq!(runs(&[1, 0, 2, 0xFF, 0xFF, 0xFF, 0xFF, 0x0F, 1]), 0);
    }

    #[test]
    fn a_walk_reports_each_document_once_with_its_own_ordinals() {
        let mut builder = Builder::default();
        builder.add("first", "First", "", "", "camera camera vtable");
        builder.add("second", "Second", "", "", "camera");
        let bytes = builder.finish();
        let index = Index::open(&bytes).unwrap();

        let mut seen: Vec<(u32, u32, Vec<u32>)> = Vec::new();
        let frequency = walk_postings(index.exact("camera").unwrap(), |doc, count, gaps| {
            let mut ordinals = Vec::new();
            each_ordinal(gaps, |ordinal| ordinals.push(ordinal));
            seen.push((doc, count, ordinals));
        });

        assert_eq!(frequency, 2);
        assert_eq!(seen, vec![(0, 2, vec![0, 1]), (1, 1, vec![0])]);
    }

    #[test]
    fn reused_buffers_preserve_ranking_and_snippets() {
        let mut builder = Builder::default();
        builder.add(
            "first",
            "First",
            "",
            "",
            "Camera offsets in sw.js.\nThe vtable follows.",
        );
        builder.add(
            "second",
            "Second",
            "",
            "",
            "The camera moves before its offsets change.",
        );
        let bytes = builder.finish();
        let index = Index::open(&bytes).unwrap();
        let mut work = Workspace::default();
        work.reset(index.doc_count as usize);

        assert_eq!(search_with(&index, "camera ", 0, &mut work).total, 2);
        assert!(work.starts.iter().all(Option::is_none));

        for query in ["vtable ", "camera offsets ", "s", "sw.js ", "camera "] {
            let expected = search(&index, query, 12);
            for _ in 0..2 {
                let actual = search_with(&index, query, 12, &mut work);
                assert_eq!(actual.total, expected.total);
                assert_eq!(actual.hits.len(), expected.hits.len());
                for (actual, expected) in actual.hits.iter().zip(&expected.hits) {
                    assert_eq!(actual.doc, expected.doc);
                    assert_eq!(actual.score, expected.score);
                    assert_eq!(actual.snippet, expected.snippet);
                }
            }
        }

        let pointers: Vec<_> = work
            .starts
            .iter()
            .map(|value| value.as_ref().unwrap().as_ptr())
            .collect();
        search_with(&index, "camera ", 12, &mut work);
        assert_eq!(
            work.starts
                .iter()
                .map(|value| value.as_ref().unwrap().as_ptr())
                .collect::<Vec<_>>(),
            pointers
        );
    }
}

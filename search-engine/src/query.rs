//! Queries require every word, with compound and prefix alternatives within each word.

use crate::format::{read_varint, Doc, Index};
use crate::fuzzy::{self, Repairing};
use crate::segments::{coalesce, Segments};
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

/// The most bytes a snippet can reach behind and ahead of the checkpoint that
/// covers its anchor, which is what decides how far either edge of a fetched
/// range has to stand from that checkpoint.
const LEAD_BYTES: u32 = (SNIPPET_BYTES / 4 + EDGE_SLACK) as u32;
const TRAIL_BYTES: u32 = (SNIPPET_BYTES + EDGE_SLACK) as u32;

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

/// Which artifact a query is waiting on.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Need {
    /// Wanted before anything can be ranked, so an answer without it would be a
    /// lie rather than a thinner answer. A caller that cannot fetch these has
    /// to report that the lookup failed.
    Postings,
    /// Wanted only to quote. A caller that cannot fetch these gets its rows
    /// without their quoted lines.
    Body,
}

/// Bytes one pass could not reach, as ranges into the artifact named.
///
/// A caller supplies them and runs the same query again. Ranking is
/// deterministic, so the second pass asks for what it now holds and moves on.
pub struct Request {
    pub section: Need,
    pub ranges: Vec<(u32, u32)>,
}

/// A word the dictionary did not hold, and the word that answered for it.
pub struct Repair {
    pub typed: String,
    pub chosen: String,
}

/// `total` counts all matches before the result limit applies.
pub struct Answer {
    pub total: usize,
    pub hits: Vec<Hit>,
    pub request: Option<Request>,
    pub repairs: Vec<Repair>,
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

/// One dictionary position a typed word resolves to, and what it cost to
/// reach it. Anything above zero came from a repair.
#[derive(Clone, Copy)]
struct Reached {
    ordinal: u32,
    edits: u32,
}

impl Reached {
    /// Scales the weight of an alternative by how far it stood from the word
    /// typed, so an entry found through a repaired word ranks below one found
    /// exactly in the rare query where both appear.
    fn weight(&self) -> f32 {
        1.0 / (1.0 + self.edits as f32)
    }
}

/// The dictionary positions one typed word resolves to.
///
/// Resolution reads the dictionary alone, which the index carries whole, so the
/// shape of a query is settled before a single posting list has been fetched.
struct Plan {
    terms: Vec<Reached>,
}

/// The alternatives for one typed word, as borrowed posting lists.
struct Slot<'a> {
    lists: Vec<(&'a [u8], f32)>,
}

/// What a query resolved to, and the words that had to be repaired to get there.
struct Reading {
    plans: Vec<Plan>,
    repairs: Vec<Repair>,
}

fn expand(index: &Index, term: &str, growing: bool) -> Vec<Reached> {
    let exact = |ordinal| Reached { ordinal, edits: 0 };

    if growing {
        // A term cap discards documents and gives an incorrect total for AND queries.
        index.with_prefix(term).map(exact).collect()
    } else {
        index.exact(term).into_iter().map(exact).collect()
    }
}

fn plans(index: &Index, query: &str, repairing: &mut Repairing) -> Reading {
    let read = tokenize(query);

    let empty = Reading {
        plans: Vec::new(),
        repairs: Vec::new(),
    };

    let Some(last) = read.terms.last() else {
        return empty;
    };

    let last_ordinal = last.ordinal;
    // A delimiter completes the last word and disables prefix expansion.
    let unfinished = query.chars().next_back().is_some_and(continues_word);

    let mut out = Vec::with_capacity(read.starts.len());
    let mut repairs = Vec::new();

    // Terms arrive in ordinal order. Group them once and skip the tokenizer's line gaps.
    for alternatives in read.terms.chunk_by(|a, b| a.ordinal == b.ordinal) {
        let whole = &alternatives[alternatives.len() - 1];
        let growing = whole.ordinal == last_ordinal && unfinished;

        // The compound precedes fallback pieces so `sw.js` does not match every `js` entry.
        let mut terms = expand(index, &whole.text, growing);

        if terms.is_empty() {
            for piece in alternatives.iter().rev().skip(1) {
                terms.extend(expand(index, &piece.text, growing));
            }
        }

        /* Nothing the reader typed is in the dictionary, so the word is worth
           repairing, whether or not they have finished typing it.

           The worry about repairing a growing word is that edits fight prefix
           expansion, answering `cam` with `can` and `cat` while the reader is
           still on their way to `camera`. Reaching here says that cannot
           happen: the prefix matched no term at all, so there is no expansion
           to fight and nothing else to show. The four character floor below
           keeps a word that short from being repaired in the first place. */
        if terms.is_empty() {
            fuzzy::repairs(index, &whole.text, repairing);
            terms = repairing
                .found
                .iter()
                .map(|&(ordinal, edits)| Reached { ordinal, edits })
                .collect();

            if let Some(nearest) = terms.iter().min_by_key(|reached| reached.edits) {
                repairs.push(Repair {
                    typed: whole.text.clone(),
                    chosen: index.term(nearest.ordinal).to_string(),
                });
            }
        }

        // No document can satisfy an absent slot. Avoid all later work and scoring.
        if terms.is_empty() {
            return empty;
        }

        out.push(Plan { terms });
    }

    Reading {
        plans: out,
        repairs,
    }
}

/// The stretches of the postings artifact one slot reads.
///
/// A prefix expands to consecutive dictionary positions and their lists were
/// written in that same order, so these merge into one range however many terms
/// the prefix reached. That range is also a superset of every extension of the
/// prefix, which is what makes growing a word cost nothing after its first
/// letter.
fn spans(index: &Index, plan: &Plan) -> Vec<(u32, u32)> {
    let mut out: Vec<(u32, u32)> = plan
        .terms
        .iter()
        .map(|reached| index.postings_span(reached.ordinal))
        .filter(|(_, len)| *len > 0)
        .collect();

    coalesce(&mut out);
    out
}

fn missing(index: &Index, plans: &[Plan], postings: &Segments) -> Vec<(u32, u32)> {
    let mut out = Vec::new();

    for plan in plans {
        for (start, len) in spans(index, plan) {
            if postings.slice(start, len).is_none() {
                out.push((start, len));
            }
        }
    }

    coalesce(&mut out);
    out
}

fn slots<'a>(index: &Index, plans: &[Plan], postings: &'a Segments) -> Vec<Slot<'a>> {
    plans
        .iter()
        .map(|plan| Slot {
            lists: plan
                .terms
                .iter()
                .filter_map(|reached| {
                    let (start, len) = index.postings_span(reached.ordinal);
                    Some((postings.slice(start, len)?, reached.weight()))
                })
                .collect(),
        })
        .collect()
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
    /// Scratch for the repair scan, which runs only where a word found nothing.
    repairing: Repairing,
}

pub fn search(
    index: &Index,
    postings: &Segments,
    body: &Segments,
    query: &str,
    limit: usize,
) -> Answer {
    search_with(
        index,
        postings,
        body,
        query,
        limit,
        true,
        &mut Workspace::default(),
    )
}

/// `may_quote_blind` governs the reading text only. The postings are asked for
/// whatever it says, because a ranking without them is not a thinner answer but
/// a wrong one.
pub(crate) fn search_with(
    index: &Index,
    postings: &Segments,
    body: &Segments,
    query: &str,
    limit: usize,
    may_quote_blind: bool,
    work: &mut Workspace,
) -> Answer {
    let nothing = || Answer {
        total: 0,
        hits: Vec::new(),
        request: None,
        repairs: Vec::new(),
    };
    let Reading { plans, repairs } = plans(index, query, &mut work.repairing);

    if plans.is_empty() {
        return nothing();
    }

    let wanted = missing(index, &plans, postings);

    if !wanted.is_empty() {
        return Answer {
            total: 0,
            hits: Vec::new(),
            request: Some(Request {
                section: Need::Postings,
                ranges: wanted,
            }),
            repairs: Vec::new(),
        };
    }

    let slots = slots(index, &plans, postings);

    let docs = index.doc_count as usize;
    let width = slots.len();

    // A header no builder wrote can claim more entries than the tables address.
    let Some(cells) = docs.checked_mul(width) else {
        return nothing();
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
        repairing: _,
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
        for (postings, penalty) in &alternatives.lists {
            run.clear();
            let frequency = walk_postings(postings, |doc, count, _| run.push((doc, count)));
            let weight = idf(index.doc_count, frequency) * penalty;

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
    let mut needs = Vec::new();

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
                body,
                may_quote_blind.then_some(&mut needs),
                window,
                seen,
            ),
        });
    }

    Answer {
        total,
        hits: out,
        request: if needs.is_empty() {
            None
        } else {
            Some(Request {
                section: Need::Body,
                ranges: needs,
            })
        },
        repairs,
    }
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
        for (postings, _) in &alternatives.lists {
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

/// The checkpoint a resumed walk starts from, and the body range it covers.
struct Reach {
    checkpoint: u32,
    /// Offsets within the entry, not within the body artifact.
    start: u32,
    len: u32,
}

/// Chooses the range of an entry that can render the snippet around `anchor`.
///
/// Both edges land on checkpoints, and a checkpoint is always the first byte of
/// a word, so no token straddles either end and every offset the render
/// recovers inside the range is the offset the whole entry would have given.
/// The lead reaches back far enough to cover the bytes a window can open before
/// its anchor, and the tail far enough to cover the bytes it can run past the
/// checkpoint the anchor sits before.
fn reach(index: &Index, entry: &Doc, anchor: u32) -> Reach {
    let stride = index.checkpoint_stride;
    let last = entry.checkpoint_count(stride).saturating_sub(1);
    let at = (anchor / stride).min(last);
    let offset = |n: u32| index.checkpoint(entry, n).map_or(0, |(offset, _)| offset);
    let here = offset(at);

    let mut first = at;
    while first > 0 && here.saturating_sub(offset(first - 1)) < LEAD_BYTES {
        first -= 1;
    }

    let mut past = (at + 1).min(last);
    let base = offset(past);
    while past < last && offset(past).saturating_sub(base) < TRAIL_BYTES {
        past += 1;
    }

    let start = offset(first);
    let end = if past >= last {
        entry.body.1
    } else {
        offset(past)
    };

    Reach {
        checkpoint: first,
        start,
        len: end.saturating_sub(start),
    }
}

/// Selects the window with the most distinct query slots and marks each visible match.
///
/// `needs` is present when the caller can still fetch what is missing. A
/// snippet whose body range is absent records the range there and prints
/// nothing, so a row keeps its title and its date either way.
#[allow(clippy::too_many_arguments)]
fn snippet(
    index: &Index,
    doc: u32,
    ordinals: &[u32],
    rows: &[(u32, u32)],
    store: &Segments,
    needs: Option<&mut Vec<(u32, u32)>>,
    window: &mut Vec<(usize, u32)>,
    seen: &mut [u32],
) -> String {
    let Some(entry) = index.doc(doc) else {
        return String::new();
    };

    window.clear();
    for (slot, row) in rows.iter().enumerate() {
        for ordinal in &ordinals[row.0 as usize..row.1 as usize] {
            window.push((slot, *ordinal));
        }
    }
    window.sort_unstable_by_key(|(_, ordinal)| *ordinal);

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

    let Some(&(_, anchor_ordinal)) = window.get(best.0) else {
        return String::new();
    };

    let reach = reach(index, &entry, anchor_ordinal);
    let at = entry.body.0.saturating_add(reach.start);

    let Some(bytes) = store.slice(at, reach.len) else {
        if let Some(needs) = needs {
            needs.push((at, reach.len));
        }
        return String::new();
    };

    // Both edges are word starts, so the range is whole characters. A range that
    // is not says the artifact and the index disagree, and a row without a
    // snippet is the honest answer to that.
    let Ok(body) = std::str::from_utf8(bytes) else {
        return String::new();
    };

    /* The first word of the range answers to the ordinal its checkpoint names,
       plus one where that checkpoint stands on a line gap. From there the walk
       reproduces the tokenizer's own numbering, gaps included, so an ordinal
       from the postings lands on the byte the whole entry would have given. */
    let starts = word_starts(body);
    let base = reach.checkpoint * index.checkpoint_stride
        + u32::from(index.checkpoint(&entry, reach.checkpoint).is_some_and(|(_, gap)| gap));
    let offset_of = |ordinal: u32| {
        ordinal
            .checked_sub(base)
            .and_then(|n| starts.get(n as usize))
            .map(|at| *at as usize)
    };

    let Some(anchor) = offset_of(anchor_ordinal) else {
        return String::new();
    };
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
    let mut cursor = from;

    for (start, len) in marks {
        // A compound and its pieces share a span. Emit overlapping spans only once.
        if start < cursor {
            continue;
        }

        out.push_str(&body[cursor..start]);
        out.push(MARK_OPEN);
        out.push_str(&body[start..start + len]);
        out.push(MARK_CLOSE);
        cursor = start + len;
    }

    out.push_str(&body[cursor..]);
    out.truncate(out.len() - (body.len() - to));

    let mut line = one_line(&out);

    // The ellipses report the cut in the entry, not the cut in the range.
    if reach.start + (from as u32) > 0 {
        line.insert(0, ELLIPSIS);
    }

    if reach.start + (to as u32) < entry.body.1 {
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

    /// A corpus with both range-read artifacts already in hand, which is the
    /// shape most of these tests want: it leaves nothing for a request to ask
    /// for, so a query answers in one pass.
    struct Corpus {
        index: Vec<u8>,
        lists: Vec<u8>,
        postings: Segments,
        text: Vec<u8>,
        body: Segments,
    }

    fn written(builder: Builder) -> Corpus {
        let (index, lists, text) = builder.finish();
        let mut postings = Segments::default();
        let mut body = Segments::default();

        postings.supply(0, &lists);
        body.supply(0, &text);

        Corpus {
            index,
            lists,
            postings,
            text,
            body,
        }
    }

    fn one(slug: &str, body: &str) -> Corpus {
        let mut builder = Builder::default();
        builder.add(slug, "Entry", "", "", body);
        written(builder)
    }

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
        let archive = written(builder);
        let index = Index::open(&archive.index).unwrap();

        let term = index.exact("camera").unwrap();
        let (start, len) = index.postings_span(term);
        let postings = archive.postings.slice(start, len).unwrap();

        let mut seen: Vec<(u32, u32, Vec<u32>)> = Vec::new();
        let frequency = walk_postings(postings, |doc, count, gaps| {
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
        let archive = written(builder);
        let index = Index::open(&archive.index).unwrap();
        let mut work = Workspace::default();

        for query in ["vtable ", "camera offsets ", "s", "sw.js ", "camera "] {
            let expected = search(&index, &archive.postings, &archive.body, query, 12);
            for _ in 0..2 {
                let actual = search_with(
                    &index,
                    &archive.postings,
                    &archive.body,
                    query,
                    12,
                    true,
                    &mut work,
                );
                assert_eq!(actual.total, expected.total);
                assert_eq!(actual.hits.len(), expected.hits.len());
                assert!(actual.request.is_none());
                for (actual, expected) in actual.hits.iter().zip(&expected.hits) {
                    assert_eq!(actual.doc, expected.doc);
                    assert_eq!(actual.score, expected.score);
                    assert_eq!(actual.snippet, expected.snippet);
                }
            }
        }
    }

    /// The property the split rests on: a snippet cut from a fetched range is
    /// the snippet the whole body would have given, at every anchor in a body
    /// long enough to hold many checkpoints and lines.
    #[test]
    fn a_snippet_from_a_range_matches_the_snippet_from_the_whole_body() {
        let mut lines = Vec::new();
        for line in 0..60 {
            let mut words = Vec::new();
            for word in 0..(3 + line % 7) {
                words.push(format!("word{line}x{word}"));
            }
            /* One rare term per line, so every query below lands on a different
               anchor and walks back to a different checkpoint. */
            words.push(format!("needle{line}"));
            lines.push(words.join(" "));
        }
        let text = lines.join("\n");
        let archive = one("entry", &text);
        let index = Index::open(&archive.index).unwrap();
        let entry = index.doc(0).unwrap();

        assert!(entry.checkpoint_count(index.checkpoint_stride) > 4);

        for line in 0..60 {
            let query = format!("needle{line} ");
            let expected = search(&index, &archive.postings, &archive.body, &query, 12);
            assert_eq!(expected.hits.len(), 1, "{query}");

            /* No reading text: the first pass reports the range, the caller
               supplies exactly that range, and the second pass prints. */
            let mut ranged = Segments::default();
            let asked = search(&index, &archive.postings, &ranged, &query, 12);
            let request = asked.request.expect("a window was asked for");
            assert_eq!(request.section, Need::Body, "{query}");
            assert_eq!(request.ranges.len(), 1, "{query}");
            assert_eq!(asked.hits[0].snippet, "", "{query}");

            let (start, len) = request.ranges[0];
            assert!(len < 2048, "{query} asked for {len} bytes");
            ranged.supply(start, &archive.text[start as usize..(start + len) as usize]);

            let served = search(&index, &archive.postings, &ranged, &query, 12);
            assert!(served.request.is_none(), "{query}");
            assert_eq!(served.hits[0].snippet, expected.hits[0].snippet, "{query}");
        }
    }

    #[test]
    fn a_row_still_prints_when_its_reading_text_cannot_be_fetched() {
        let archive = one("entry", "The vtable holds the camera.");
        let index = Index::open(&archive.index).unwrap();
        let mut work = Workspace::default();

        let last = search_with(
            &index,
            &archive.postings,
            &Segments::default(),
            "vtable ",
            12,
            false,
            &mut work,
        );
        assert_eq!(last.total, 1);
        assert_eq!(last.hits[0].snippet, "");
        assert!(last.request.is_none());
    }

    /// The postings are not optional the way the reading text is: a ranking
    /// without them is a wrong answer, so they are asked for even on the pass
    /// that has been told to stop asking.
    #[test]
    fn postings_are_asked_for_even_when_quoting_blind() {
        let archive = one("entry", "The vtable holds the camera.");
        let index = Index::open(&archive.index).unwrap();
        let mut work = Workspace::default();

        let asked = search_with(
            &index,
            &Segments::default(),
            &archive.body,
            "vtable ",
            12,
            false,
            &mut work,
        );
        let request = asked.request.expect("the postings were asked for");
        assert_eq!(request.section, Need::Postings);
        assert_eq!(asked.total, 0);
    }

    /// A prefix reaches consecutive dictionary positions, and their lists were
    /// written in that order, so however many terms it reaches it costs one
    /// range, and that range answers every extension of the prefix.
    #[test]
    fn a_prefix_is_one_range_that_covers_every_extension_of_itself() {
        let mut builder = Builder::default();
        let filler: String = (0..200).map(|n| format!("consequence{n:03} ")).collect();
        builder.add("filler", "Filler", "", "", &filler);
        let archive = written(builder);
        let index = Index::open(&archive.index).unwrap();

        assert!(index.with_prefix("cons").count() > 100);

        let mut held = Segments::default();
        let asked = search(&index, &held, &archive.body, "cons", 12);
        let request = asked.request.expect("the postings were asked for");

        assert_eq!(request.section, Need::Postings);
        assert_eq!(request.ranges.len(), 1, "a prefix cost more than one range");

        let (start, len) = request.ranges[0];
        held.supply(start, &archive.lists[start as usize..(start + len) as usize]);

        /* Every longer prefix is inside the range already fetched, so nothing
           else goes out for the rest of the word. */
        for query in ["cons", "conse", "consequence", "consequence00", "consequence001 "] {
            let served = search(&index, &held, &archive.body, query, 12);
            assert!(served.request.is_none(), "{query} asked again");
        }
    }
}

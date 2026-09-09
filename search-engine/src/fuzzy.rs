//! Typo tolerance for a finished word the dictionary does not hold.
//!
//! This runs only where the ordinary path has already failed: a word whose
//! compound and every piece of it returned nothing. The common query therefore
//! pays none of it, and a repaired word can never displace an exact one,
//! because the two never compete for the same slot.
//!
//! The scan is linear over the dictionary and needs no automaton. Two prunes
//! stand in front of the edit distance, and between them they reject almost
//! every term for a few nanoseconds each, which leaves full dynamic programming
//! running on the low single-digit percent that survive.
//!
//! The distance counts an adjacent swap as one edit rather than two, which is
//! what every engine that does this counts it as, and what makes a budget of
//! one worth having: a swap is the typo a hand makes when two keys arrive out
//! of order, and it is unreachable inside one edit under the plain metric.

use crate::format::Index;

/// Below this many characters a word is too short to repair: at three letters
/// one edit reaches a large share of the dictionary, and the repair would be a
/// guess rather than a correction.
const SHORTEST: usize = 4;

/// One edit up to this length, two above it, never three.
const ONE_EDIT_UPTO: usize = 7;

/// Stands in for an unreachable cell, far enough above any bound to survive the
/// additions below without wrapping.
const FAR: usize = usize::MAX / 4;

/// Edits allowed for a word of this many characters, or `None` if too short.
fn bound(length: usize) -> Option<usize> {
    match length {
        0..SHORTEST => None,
        SHORTEST..=ONE_EDIT_UPTO => Some(1),
        _ => Some(2),
    }
}

/// The letters a term contains, one bit each.
///
/// Everything outside the Latin alphabet is ignored rather than encoded, which
/// keeps the prune conservative: a pair that differs only in digits or
/// punctuation survives it and is settled by the distance itself.
fn letters(term: &str) -> u32 {
    let mut mask = 0u32;

    for character in term.chars() {
        if character.is_ascii_lowercase() {
            mask |= 1 << (character as u8 - b'a');
        }
    }

    mask
}

/// Everything the scan writes, kept between queries so that a repair
/// allocates nothing once these buffers have reached their working size.
///
/// The two rows are the whole of the dynamic programming: only a diagonal band
/// can hold a value within the bound, so nothing wider than two rows is ever
/// held, and reusing them is what keeps a scan over the whole dictionary from
/// allocating once per candidate that survives the prunes.
#[derive(Default)]
pub(crate) struct Repairing {
    typed: Vec<char>,
    candidate: Vec<char>,
    /// Three rows, because a swap is scored against the row before last.
    before: Vec<usize>,
    previous: Vec<usize>,
    current: Vec<usize>,
    /// Dictionary positions within reach, with the distance that reached them.
    pub(crate) found: Vec<(u32, u32)>,
}

/// The edit distance between two words, or `None` once it is known to exceed
/// `edits`.
///
/// This is optimal string alignment: insert, delete, substitute, and swap two
/// adjacent characters, each costing one. It is the restricted form of
/// Damerau-Levenshtein, which never edits a pair it has already swapped, and it
/// is what the engines that do this ship. The unrestricted form differs only
/// above two edits, and two is the ceiling here.
///
/// Only a diagonal band of width `2 * edits + 1` can hold a value within the
/// bound, so the inner loop is three or five cells wide rather than the length
/// of the word. A row whose every reachable cell has passed the bound ends the
/// comparison there.
fn distance(
    query: &[char],
    term: &[char],
    edits: usize,
    before: &mut Vec<usize>,
    previous: &mut Vec<usize>,
    current: &mut Vec<usize>,
) -> Option<usize> {
    let (rows, columns) = (query.len(), term.len());

    if rows.abs_diff(columns) > edits {
        return None;
    }

    /* Row zero, and a row before it that no cell can read until the swap term
       has a pair of rows behind it to look at. */
    previous.clear();
    previous.extend((0..=columns).map(|at| if at <= edits { at } else { FAR }));
    before.clear();
    before.resize(columns + 1, FAR);
    current.clear();
    current.resize(columns + 1, FAR);

    for row in 1..=rows {
        current.fill(FAR);
        current[0] = if row <= edits { row } else { FAR };

        /* The lengths differ by at most `edits`, so this band is never empty. */
        let from = row.saturating_sub(edits).max(1);
        let to = (row + edits).min(columns);

        for column in from..=to {
            let substitution = usize::from(query[row - 1] != term[column - 1]);

            let mut best = previous[column]
                .saturating_add(1)
                .min(current[column - 1].saturating_add(1))
                .min(previous[column - 1].saturating_add(substitution));

            /* Two characters that arrived the wrong way round: one edit, taken
               from the corner two rows and two columns back. Out of band that
               corner is unreachable, so the branch cannot cheat the bound. */
            if row > 1
                && column > 1
                && query[row - 1] == term[column - 2]
                && query[row - 2] == term[column - 1]
            {
                best = best.min(before[column - 2].saturating_add(1));
            }

            current[column] = best;
        }

        if current[from..=to].iter().all(|&cell| cell > edits) {
            return None;
        }

        /* Rotate: the row just finished becomes the previous one, the previous
           becomes the one before, and the oldest buffer is reused. */
        std::mem::swap(before, previous);
        std::mem::swap(previous, current);
    }

    (previous[columns] <= edits).then_some(previous[columns])
}

/// Fills `scratch.found` with every dictionary term within the allowed
/// distance of `typed`, and the distance that reached it.
pub(crate) fn repairs(index: &Index, typed: &str, scratch: &mut Repairing) {
    let Repairing {
        typed: query,
        candidate,
        before,
        previous,
        current,
        found,
    } = scratch;

    found.clear();
    query.clear();
    query.extend(typed.chars());

    let Some(edits) = bound(query.len()) else {
        return;
    };

    let wanted = letters(typed);

    for ordinal in 0..index.term_count {
        let term = index.term(ordinal);
        let length = term.chars().count();

        // Length first: it costs one comparison and rejects most of the file.
        if length.abs_diff(query.len()) > edits {
            continue;
        }

        /* Then the letters. A term missing more of the letters the query needs
           than there are edits to spend cannot be reached by any alignment. */
        if (wanted & !letters(term)).count_ones() as usize > edits {
            continue;
        }

        candidate.clear();
        candidate.extend(term.chars());

        if let Some(distance) = distance(query, candidate, edits, before, previous, current) {
            found.push((ordinal, distance as u32));
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn edits_between(query: &str, term: &str, allowed: usize) -> Option<usize> {
        let query: Vec<char> = query.chars().collect();
        let term: Vec<char> = term.chars().collect();
        let (mut before, mut previous, mut current) = (Vec::new(), Vec::new(), Vec::new());
        distance(
            &query,
            &term,
            allowed,
            &mut before,
            &mut previous,
            &mut current,
        )
    }

    #[test]
    fn a_bounded_distance_agrees_with_the_edits_it_takes() {
        assert_eq!(edits_between("camera", "camera", 2), Some(0));
        assert_eq!(edits_between("chromiu", "chromium", 1), Some(1));
        assert_eq!(edits_between("camera", "vtable", 2), None);
        assert_eq!(edits_between("a", "abcdef", 2), None);
    }

    #[test]
    fn two_characters_the_wrong_way_round_cost_one_edit() {
        /* The typo a hand makes when two keys arrive out of order. Under the
           plain metric each of these is two edits and unreachable inside the
           budget a word of this length is given. */
        for (typed, meant) in [
            ("camrea", "camera"),
            ("vtabel", "vtable"),
            ("vatble", "vtable"),
            ("skai", "skia"),
            ("hlelo", "hello"),
        ] {
            assert_eq!(edits_between(typed, meant, 1), Some(1), "{typed}");
        }
    }

    #[test]
    fn a_swap_and_another_edit_together_cost_two() {
        assert_eq!(edits_between("cmarea", "camera", 2), Some(2));
        assert_eq!(edits_between("cmarea", "camera", 1), None);
    }

    #[test]
    fn the_distance_a_word_is_allowed_grows_once_and_stops() {
        assert_eq!(bound(3), None);
        assert_eq!(bound(4), Some(1));
        assert_eq!(bound(7), Some(1));
        assert_eq!(bound(8), Some(2));
        assert_eq!(bound(40), Some(2));
    }

    #[test]
    fn the_letter_prune_never_rejects_a_pair_the_distance_would_accept() {
        /* The prune has to be conservative in one direction only: it may let a
           term through that the distance then rejects, but it must never
           reject one the distance would have accepted. */
        for (query, term) in [
            ("camera", "cameras"),
            ("sw.js", "sw.jsx"),
            ("c++", "c++"),
            ("offset", "offsets"),
            ("word12", "word13"),
        ] {
            let allowed = bound(query.chars().count()).unwrap_or(0);

            if edits_between(query, term, allowed).is_some() {
                assert!(
                    (letters(query) & !letters(term)).count_ones() as usize <= allowed,
                    "{query} against {term}"
                );
            }
        }
    }
}

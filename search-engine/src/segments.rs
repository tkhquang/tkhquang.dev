//! Byte ranges of an artifact the caller has handed over.
//!
//! Two of the three artifacts a build writes are never fetched whole: the
//! postings, which a query reads only for its own terms, and the reading text,
//! which it reads only for the results it prints. The engine cannot address
//! either directly. It names the range it needs, the caller fetches it and
//! supplies it here, and the same query runs again and finds it.
//!
//! Ranges repeat far more often than they vary. A prefix range covers every
//! extension of that prefix, and a snippet window is checkpoint-aligned, so a
//! word grown one letter at a time asks for what it already holds.

/// Ranges of one artifact, merged and kept in ascending order.
#[derive(Default)]
pub struct Segments {
    runs: Vec<(u32, Vec<u8>)>,
}

impl Segments {
    /// Discards everything, for an index whose offsets no longer mean anything.
    pub fn clear(&mut self) {
        self.runs.clear();
    }

    pub fn held(&self) -> usize {
        self.runs.iter().map(|(_, bytes)| bytes.len()).sum()
    }

    /// Takes one fetched range. Overlapping and adjacent ranges coalesce, so a
    /// later request that spans two earlier ones is still answered from memory.
    pub fn supply(&mut self, start: u32, bytes: &[u8]) {
        if bytes.is_empty() {
            return;
        }

        self.runs.push((start, bytes.to_vec()));
        self.runs.sort_by_key(|(at, _)| *at);

        let mut merged: Vec<(u32, Vec<u8>)> = Vec::with_capacity(self.runs.len());

        for (at, piece) in self.runs.drain(..) {
            match merged.last_mut() {
                Some((from, held)) if at <= from.saturating_add(held.len() as u32) => {
                    // The artifact is immutable, so where two ranges overlap they agree.
                    let overlap = (from.saturating_add(held.len() as u32) - at) as usize;

                    if overlap < piece.len() {
                        held.extend_from_slice(&piece[overlap..]);
                    }
                }
                _ => merged.push((at, piece)),
            }
        }

        self.runs = merged;
    }

    /// The bytes of one range, or `None` when no single held range covers it.
    pub fn slice(&self, start: u32, len: u32) -> Option<&[u8]> {
        let end = start.checked_add(len)?;

        for (at, bytes) in &self.runs {
            if *at > start {
                break;
            }

            if end <= at.saturating_add(bytes.len() as u32) {
                let from = (start - at) as usize;
                return bytes.get(from..from + len as usize);
            }
        }

        None
    }
}

/// Sorts ranges and merges the ones that touch, so a run of neighbours costs
/// one request rather than one each.
///
/// This is what makes a prefix cheap: terms are stored in dictionary order and
/// their postings are written in that same order, so every term beginning with
/// a prefix occupies one contiguous stretch of the postings artifact.
pub fn coalesce(ranges: &mut Vec<(u32, u32)>) {
    if ranges.len() < 2 {
        return;
    }

    ranges.sort_unstable();

    let mut kept = 0usize;

    for at in 1..ranges.len() {
        let (start, len) = ranges[at];
        let (from, held) = ranges[kept];

        if start <= from.saturating_add(held) {
            ranges[kept].1 = held.max(start.saturating_sub(from).saturating_add(len));
        } else {
            kept += 1;
            ranges[kept] = (start, len);
        }
    }

    ranges.truncate(kept + 1);
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn adjacent_and_overlapping_ranges_answer_as_one() {
        let mut store = Segments::default();

        store.supply(10, b"cde");
        store.supply(0, b"abcd");

        assert_eq!(store.slice(0, 4), Some(&b"abcd"[..]));
        assert_eq!(store.slice(10, 3), Some(&b"cde"[..]));
        assert_eq!(store.slice(3, 8), None);

        /* Bridging the hole leaves one run, and a request across the old seam
           is answered from it. */
        store.supply(2, b"cdefghijk");
        assert_eq!(store.slice(0, 13), Some(&b"abcdefghijkde"[..]));
        assert_eq!(store.held(), 13);
    }

    #[test]
    fn a_range_past_the_end_of_a_run_is_not_invented() {
        let mut store = Segments::default();
        store.supply(4, b"abcd");

        assert_eq!(store.slice(4, 5), None);
        assert_eq!(store.slice(3, 4), None);
        assert_eq!(store.slice(u32::MAX, 1), None);
        assert_eq!(store.slice(6, 2), Some(&b"cd"[..]));

        store.clear();
        assert_eq!(store.slice(4, 4), None);
        assert_eq!(store.held(), 0);
    }

    #[test]
    fn neighbouring_ranges_become_one_request() {
        let mut ranges = vec![(30, 5), (10, 10), (20, 10), (100, 4)];
        coalesce(&mut ranges);
        assert_eq!(ranges, vec![(10, 25), (100, 4)]);

        /* A range wholly inside another leaves the larger one alone. */
        let mut nested = vec![(10, 100), (20, 5)];
        coalesce(&mut nested);
        assert_eq!(nested, vec![(10, 100)]);

        let mut single = vec![(7, 3)];
        coalesce(&mut single);
        assert_eq!(single, vec![(7, 3)]);
    }
}

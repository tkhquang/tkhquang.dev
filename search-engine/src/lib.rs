//! Shared index writer and query engine with an integer ABI over WebAssembly memory.

mod build;
mod fold;
mod format;
mod fuzzy;
mod query;
mod segments;
pub mod tokenize;

pub use build::Builder;
pub use format::{Index, VERSION};
use query::Workspace;
pub use query::{search, Answer, Hit, Need, Repair, Request, MARK_CLOSE, MARK_OPEN};
pub use segments::Segments;

use std::cell::RefCell;

#[derive(Default)]
struct Loaded {
    bytes: Vec<u8>,
    work: Workspace,
    // Both stores are addressed by this index's offsets, so all of it replaces together.
    postings: Segments,
    body: Segments,
}

thread_local! {
    static BUILDER: RefCell<Builder> = RefCell::new(Builder::default());
    static LOADED: RefCell<Loaded> = RefCell::new(Loaded::default());
    /// Returned pointers remain valid until `build_finish` or `search_query` replaces this buffer.
    static RETURNED: RefCell<Vec<u8>> = const { RefCell::new(Vec::new()) };
}

/// Reserves `len` bytes for the caller to write into.
///
/// # Safety
/// The result must be released with `dealloc` and the same length.
#[no_mangle]
pub extern "C" fn alloc(len: u32) -> *mut u8 {
    let mut buffer = Vec::<u8>::with_capacity(len as usize);
    let pointer = buffer.as_mut_ptr();
    std::mem::forget(buffer);
    pointer
}

/// # Safety
/// `pointer` and `len` must be a pair returned by `alloc`.
#[no_mangle]
pub unsafe extern "C" fn dealloc(pointer: *mut u8, len: u32) {
    drop(Vec::from_raw_parts(pointer, 0, len as usize));
}

/// # Safety
/// The caller must have written `len` valid UTF-8 bytes at `pointer`.
unsafe fn borrow<'a>(pointer: *const u8, len: u32) -> &'a str {
    let bytes = std::slice::from_raw_parts(pointer, len as usize);
    std::str::from_utf8(bytes).unwrap_or("")
}

fn hand_back(bytes: Vec<u8>) -> *const u8 {
    RETURNED.with(|slot| {
        let mut held = slot.borrow_mut();
        *held = bytes;
        held.as_ptr()
    })
}

/// Compatibility version for the index layout, tokenizer, and ordinal semantics.
#[no_mangle]
pub extern "C" fn format_version() -> u32 {
    VERSION
}

#[no_mangle]
pub extern "C" fn build_reset() {
    BUILDER.with(|slot| *slot.borrow_mut() = Builder::default());
}

/// Adds one published entry. Add entries newest first to resolve equal scores by date.
///
/// # Safety
/// Every pointer and length pair must describe UTF-8 the caller still owns.
#[allow(clippy::too_many_arguments)]
#[no_mangle]
pub unsafe extern "C" fn build_add(
    slug: *const u8,
    slug_len: u32,
    title: *const u8,
    title_len: u32,
    date: *const u8,
    date_len: u32,
    label: *const u8,
    label_len: u32,
    body: *const u8,
    body_len: u32,
) {
    let slug = borrow(slug, slug_len);
    let title = borrow(title, title_len);
    let date = borrow(date, date_len);
    let label = borrow(label, label_len);
    let body = borrow(body, body_len);

    BUILDER.with(|slot| slot.borrow_mut().add(slug, title, date, label, body));
}

/// Writes all three artifacts and returns a pointer to them, each length first
/// as a `u32`: the index, the postings, then the reading text.
#[no_mangle]
pub extern "C" fn build_finish() -> *const u8 {
    let (index, postings, body) =
        BUILDER.with(|slot| std::mem::take(&mut *slot.borrow_mut()).finish());

    let mut out = Vec::with_capacity(index.len() + postings.len() + body.len() + 12);

    for artifact in [&index, &postings, &body] {
        out.extend_from_slice(&(artifact.len() as u32).to_le_bytes());
        out.extend_from_slice(artifact);
    }

    hand_back(out)
}

/// Copies an index and discards the ranges held for the previous one.
/// Returns 0 for an invalid header and retains the previous index.
///
/// # Safety
/// `pointer` and `len` must describe bytes the caller still owns.
#[no_mangle]
pub unsafe extern "C" fn index_load(pointer: *const u8, len: u32) -> u32 {
    let bytes = std::slice::from_raw_parts(pointer, len as usize).to_vec();

    if Index::open(&bytes).is_none() {
        return 0;
    }

    LOADED.with(|slot| {
        *slot.borrow_mut() = Loaded {
            bytes,
            ..Default::default()
        }
    });
    1
}

/// Takes one fetched range of a range-read artifact, at its offset in that
/// file. `section` is 0 for the postings and 1 for the reading text, matching
/// the code a request carries.
///
/// # Safety
/// `pointer` and `len` must describe bytes the caller still owns.
#[no_mangle]
pub unsafe extern "C" fn section_supply(section: u32, start: u32, pointer: *const u8, len: u32) {
    let bytes = std::slice::from_raw_parts(pointer, len as usize);

    LOADED.with(|slot| {
        let mut loaded = slot.borrow_mut();
        let store = if section == 0 {
            &mut loaded.postings
        } else {
            &mut loaded.body
        };
        store.supply(start, bytes);
    });
}

/// Bytes of one range-read artifact this engine is holding.
#[no_mangle]
pub extern "C" fn section_held(section: u32) -> u32 {
    LOADED.with(|slot| {
        let loaded = slot.borrow();
        let store = if section == 0 {
            &loaded.postings
        } else {
            &loaded.body
        };
        store.held() as u32
    })
}

/// Runs one query and returns either the answer or the bytes it still needs.
///
/// The first `u32` is the tag. Tag 1 is a request: a `u32` naming the artifact,
/// 0 for the postings and 1 for the reading text, then a `u32` count and that
/// many `u32` start and length pairs. Tag 0 is the answer: `u32 total`,
/// `u32 count`, then five length-prefixed UTF-8 strings per result, being slug,
/// title, date, printed date, and snippet.
///
/// A caller supplies whatever tag 1 asked for and runs the same query again.
/// The postings come first, because nothing can be ranked without them; the
/// reading text comes second, because the windows to quote are not known until
/// the ranking is done. `may_quote_blind` is 0 on a caller's last attempt: it
/// stops the reading text being asked for again and prints the rows with the
/// quoted lines it could cut. It does not apply to the postings, which are
/// asked for until they arrive, because an answer without them would be a
/// wrong answer rather than a thinner one.
///
/// # Safety
/// `pointer` and `len` must describe UTF-8 the caller still owns.
#[no_mangle]
pub unsafe extern "C" fn search_query(
    pointer: *const u8,
    len: u32,
    limit: u32,
    may_quote_blind: u32,
) -> *const u8 {
    let query = borrow(pointer, len).to_string();

    let packed = LOADED.with(|slot| {
        let mut loaded = slot.borrow_mut();
        let Loaded {
            bytes,
            work,
            postings,
            body,
        } = &mut *loaded;
        let Some(index) = Index::open(bytes) else {
            return vec![0u8; 12];
        };

        let answer = query::search_with(
            &index,
            postings,
            body,
            &query,
            limit as usize,
            may_quote_blind == 1,
            work,
        );

        let mut out = Vec::new();

        if let Some(request) = answer.request {
            out.extend_from_slice(&1u32.to_le_bytes());
            out.extend_from_slice(&u32::from(request.section == Need::Body).to_le_bytes());
            out.extend_from_slice(&(request.ranges.len() as u32).to_le_bytes());

            for (start, len) in request.ranges {
                out.extend_from_slice(&start.to_le_bytes());
                out.extend_from_slice(&len.to_le_bytes());
            }

            return out;
        }

        out.extend_from_slice(&0u32.to_le_bytes());
        out.extend_from_slice(&(answer.total as u32).to_le_bytes());
        out.extend_from_slice(&(answer.hits.len() as u32).to_le_bytes());

        for hit in answer.hits {
            let Some(entry) = index.doc(hit.doc) else {
                continue;
            };

            for field in [
                index.pool_str(entry.slug),
                index.pool_str(entry.title),
                index.pool_str(entry.date),
                index.pool_str(entry.label),
                &hit.snippet,
            ] {
                out.extend_from_slice(&(field.len() as u32).to_le_bytes());
                out.extend_from_slice(field.as_bytes());
            }
        }

        /* Words the dictionary did not hold, with what answered for them. A
           reader who typed a name deliberately has to be told it was not the
           name that was searched for. */
        out.extend_from_slice(&(answer.repairs.len() as u32).to_le_bytes());

        for repair in answer.repairs {
            for field in [&repair.typed, &repair.chosen] {
                out.extend_from_slice(&(field.len() as u32).to_le_bytes());
                out.extend_from_slice(field.as_bytes());
            }
        }

        out
    });

    hand_back(packed)
}

#[cfg(test)]
mod tests {
    use super::*;

    const POSTINGS: u32 = 0;
    const BODY: u32 = 1;

    fn artifacts(body: &str) -> (Vec<u8>, Vec<u8>, Vec<u8>) {
        let mut builder = Builder::default();
        builder.add("entry", "Entry", "", "", body);
        builder.finish()
    }

    fn load(bytes: &[u8]) -> u32 {
        unsafe { index_load(bytes.as_ptr(), bytes.len() as u32) }
    }

    fn supply(section: u32, start: u32, bytes: &[u8]) {
        unsafe { section_supply(section, start, bytes.as_ptr(), bytes.len() as u32) }
    }

    #[test]
    fn replacing_an_index_discards_the_ranges_held_for_the_previous_one() {
        let (first, first_postings, first_body) =
            artifacts("Some preceding words before the needle.");
        assert_eq!(load(&first), 1);
        supply(POSTINGS, 0, &first_postings);
        supply(BODY, 0, &first_body);
        assert_eq!(section_held(POSTINGS), first_postings.len() as u32);
        assert_eq!(section_held(BODY), first_body.len() as u32);

        /* A rejected index keeps the one in place, and with it the ranges that
           still describe it. */
        assert_eq!(load(b"invalid"), 0);
        LOADED.with(|slot| assert_eq!(slot.borrow().bytes, first));
        assert_eq!(section_held(BODY), first_body.len() as u32);

        let (second, second_postings, _) = artifacts("needle");
        assert_eq!(load(&second), 1);
        assert_eq!(section_held(POSTINGS), 0);
        assert_eq!(section_held(BODY), 0);
        supply(POSTINGS, 0, &second_postings);
        assert_eq!(section_held(POSTINGS), second_postings.len() as u32);
    }

    #[test]
    fn a_query_asks_for_each_artifact_in_turn_and_answers_once_it_has_both() {
        let (index, postings, body) = artifacts("The vtable stands before the camera.");
        assert_eq!(load(&index), 1);

        /* Sixteen bytes covers the longer of the two shapes: a request naming
           one range, against the three counts an answer opens with. */
        let query = || unsafe {
            let at = search_query(b"vtable ".as_ptr(), 7, 12, 1);
            std::slice::from_raw_parts(at, 20).to_vec()
        };
        let field = |packed: &[u8], at: usize| {
            u32::from_le_bytes(packed[at..at + 4].try_into().unwrap())
        };

        // Nothing in hand: the postings come first, because nothing ranks without them.
        let wants_postings = query();
        assert_eq!(field(&wants_postings, 0), 1);
        assert_eq!(field(&wants_postings, 4), POSTINGS);
        assert_eq!(field(&wants_postings, 8), 1);
        let (start, len) = (field(&wants_postings, 12), field(&wants_postings, 16));
        supply(POSTINGS, start, &postings[start as usize..(start + len) as usize]);

        // Ranked, and now it knows which window it has to quote from.
        let wants_body = query();
        assert_eq!(field(&wants_body, 0), 1);
        assert_eq!(field(&wants_body, 4), BODY);
        let (start, len) = (field(&wants_body, 12), field(&wants_body, 16));
        supply(BODY, start, &body[start as usize..(start + len) as usize]);

        let answered = query();
        assert_eq!(field(&answered, 0), 0);
        assert_eq!(field(&answered, 4), 1);
        assert_eq!(field(&answered, 8), 1);
    }
}

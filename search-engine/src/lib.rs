//! Shared index writer and query engine with an integer ABI over WebAssembly memory.

mod build;
mod fold;
mod format;
mod query;
pub mod tokenize;

pub use build::Builder;
pub use format::{Index, VERSION};
use query::Workspace;
pub use query::{search, Answer, Hit, MARK_CLOSE, MARK_OPEN};

use std::cell::RefCell;

#[derive(Default)]
struct Loaded {
    bytes: Vec<u8>,
    // The workspace caches word offsets into these bytes, so both replace together.
    work: Workspace,
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

/// Writes the index and returns a pointer to it, length first as a `u32`.
#[no_mangle]
pub extern "C" fn build_finish() -> *const u8 {
    let bytes = BUILDER.with(|slot| std::mem::take(&mut *slot.borrow_mut()).finish());

    let mut out = Vec::with_capacity(bytes.len() + 4);
    out.extend_from_slice(&(bytes.len() as u32).to_le_bytes());
    out.extend_from_slice(&bytes);

    hand_back(out)
}

/// Copies an index and resets its offset cache. Returns 0 for an invalid header and retains the previous index.
///
/// # Safety
/// `pointer` and `len` must describe bytes the caller still owns.
#[no_mangle]
pub unsafe extern "C" fn index_load(pointer: *const u8, len: u32) -> u32 {
    let bytes = std::slice::from_raw_parts(pointer, len as usize).to_vec();

    let Some(index) = Index::open(&bytes) else {
        return 0;
    };

    let mut work = Workspace::default();
    work.reset(index.doc_count as usize);
    LOADED.with(|slot| *slot.borrow_mut() = Loaded { bytes, work });
    1
}

/// Returns `u32 total`, `u32 count`, then five length-prefixed UTF-8 strings per result: slug, title, date, printed date, snippet.
///
/// # Safety
/// `pointer` and `len` must describe UTF-8 the caller still owns.
#[no_mangle]
pub unsafe extern "C" fn search_query(pointer: *const u8, len: u32, limit: u32) -> *const u8 {
    let query = borrow(pointer, len).to_string();

    let packed = LOADED.with(|slot| {
        let mut loaded = slot.borrow_mut();
        let Loaded { bytes, work } = &mut *loaded;
        let Some(index) = Index::open(bytes) else {
            return vec![0u8; 8];
        };

        let answer = query::search_with(&index, &query, limit as usize, work);

        let mut out = Vec::new();
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

        out
    });

    hand_back(packed)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn replacing_an_index_discards_offsets_from_the_previous_body() {
        let index_bytes = |body: &str| {
            let mut builder = Builder::default();
            builder.add("entry", "Entry", "", "", body);
            builder.finish()
        };
        let load = |bytes: &[u8]| unsafe { index_load(bytes.as_ptr(), bytes.len() as u32) };
        let query = || unsafe { search_query(b"needle ".as_ptr(), 7, 1) };

        let first = index_bytes("Some preceding words before the needle.");
        assert_eq!(load(&first), 1);
        query();
        LOADED.with(|slot| assert!(slot.borrow().work.starts[0].as_ref().unwrap().len() > 1));

        assert_eq!(load(b"invalid"), 0);
        LOADED.with(|slot| assert_eq!(slot.borrow().bytes, first));

        let second = index_bytes("needle");
        assert_eq!(load(&second), 1);
        LOADED.with(|slot| assert!(slot.borrow().work.starts[0].is_none()));
        query();
        LOADED.with(|slot| assert_eq!(slot.borrow().work.starts[0].as_deref(), Some(&[0][..])));
    }
}

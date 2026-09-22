# ljoss-search

The engine behind the blog's search. One Rust crate compiled to WebAssembly,
writing the index under Node at build time and answering queries in the browser.

## Two modules from one crate

The writer runs once per build and never in a browser, so it sits behind the
`builder` Cargo feature.

| Module  | Built with              | Committed at                              | Loaded by                             |
| ------- | ----------------------- | ----------------------------------------- | ------------------------------------- |
| Reader  | `--no-default-features` | `public/search/ljoss-search.wasm`         | The search worker, in the browser     |
| Builder | default features        | `search-engine/ljoss-search-builder.wasm` | `pnpm build:search-index`, under Node |

The feature is on by default so `cargo test`, `cargo check` and the editor all
see the whole crate. Only the build that produces the reader turns it off, which
is what keeps about 15 KB of writer out of every visitor's download. The builder
cannot live beside the reader under `public`, because nothing there escapes
being served.

Both are committed because a deploy has no Rust toolchain. Rebuild them together
after any change here:

```bash
pnpm build:search-engine
```

That compiles both, then writes both. Neither committed module is replaced until
both builds have succeeded, so a failed run cannot leave a reader and a writer
built from different sources.

## What a build writes

`pnpm build:search-index` loads the builder module and writes three artifacts to
`public/search/`, all three addressed by one digest of all three.

| Artifact     | Suffix  | Fetched                                 |
| ------------ | ------- | --------------------------------------- |
| Index        | `.bin`  | Whole, gzipped at build time            |
| Postings     | `.pst`  | By range, the query's own terms only    |
| Reading text | `.pool` | By range, one window per printed result |

The index is the only artifact fetched before the reader types, alongside the
module itself, so it alone sets what search costs someone who never uses it. The
other two are served exactly as written, because a byte range into a compressed
stream names nothing.

## Format version

`VERSION` in `src/format.rs` and `FORMAT_VERSION` in the page-side
`../src/lib/ledger-search/engine.ts` have to agree. Bump both when the binary
layout, the tokenizer, or ordinal semantics change. A module handed an index it
cannot read refuses it rather than answering out of it.

## How a query is answered

The order is fixed by what depends on what: nothing can be ranked without the
posting lists, and which windows of reading text to quote is not known until the
ranking is. A pass that cannot reach what it needs reports the ranges rather
than answering, and because ranking is deterministic the repeated pass reaches
the same point and finds them waiting.

```text
page                                 worker                  CDN
  |                                     |                     |
  |----- initialize(module, index) ---->|                     |
  |<-------------- ready ---------------|                     |
  |--------------- query -------------->|                     |
  |<---- request(postings, ranges) -----|                     |
  |------------- Range: bytes=..., one per range ------------>|
  |<------------ 206, or 200 with the whole file -------------|
  |---- supply(postings, more: true) -->|                     |
  |<------ request(body, ranges) -------|                     |
  |------------- Range: bytes=..., one per range ------------>|
  |<------------ 206, or 200 with the whole file -------------|
  |----- supply(body, more: false) ---->|                     |
  |<-------------- answer --------------|                     |
```

`more: false` on the last supply is what ends it. The worker prints the rows it
holds rather than asking for reading text a second time, so a cold query costs
two round trips and never more.

Words are cut by the tokenizer that wrote the index and folded the same way, so
an accented title answers to the plain letters a reader can type. Every word of
a query has to land. Within one word the alternatives are its compound pieces
and, while it is still being typed, every dictionary term it prefixes. A word
the reader has finished that reaches nothing is retried under a bounded edit
distance, counting a transposition as one edit. That repair runs only after the
ordinary path has already returned nothing, so an ordinary query never pays for
it, and a repaired word can never displace an exact one.

Snippets come from the reading text, which is stored once per entry rather than
per match. Walking it from the start to reach the matched word would make a
snippet cost the length of the entry, so the writer records the byte offset of
every 64th word. Rendering then starts at the nearest checkpoint and walks at
most that many words.

## Tests

```bash
pnpm test:search-engine   # the crate, in Rust
pnpm test:ledger-search   # the committed modules, through the browser interface
```

The second writes its fixtures with the builder module and reads every one of
them back through the reader, so it fails if the two committed binaries have
drifted apart.

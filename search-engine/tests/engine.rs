use ljoss_search::tokenize::{token_len_at, tokenize};
use ljoss_search::{search, Builder, Index, MARK_CLOSE, MARK_OPEN};

fn terms(text: &str) -> Vec<String> {
    tokenize(text)
        .terms
        .iter()
        .map(|term| term.text.clone())
        .collect()
}

fn ordinals(text: &str) -> Vec<u32> {
    tokenize(text)
        .terms
        .iter()
        .map(|term| term.ordinal)
        .collect()
}

/// Three entries, newest first, as the build step adds them.
fn corpus() -> Vec<u8> {
    let mut builder = Builder::default();

    builder.add(
        "pdf",
        "Every Letter in This PDF Is a Drawing",
        "2026-03-01T00:00:00.000Z",
        "01/03/2026",
        "The resume looked perfect until I opened it in a text extractor. \
         Every letter was a drawing. Following the font files led from \
         Next.js down to Chromium and Skia, where the fallback happens.",
    );

    builder.add(
        "foundation",
        "The Foundation of Ljóss",
        "2025-11-02T00:00:00.000Z",
        "02/11/2025",
        "Ljóss is the journal this site prints. The type is Fraunces over \
         Montserrat, and the whole thing is a static build. I use server \
         rendering for the article body and nothing else.",
    );

    builder.add(
        "rtti",
        "The Object Already Knows Its Own Name",
        "2025-04-05T00:00:00.000Z",
        "05/04/2025",
        "Walking the vtable to reach the RTTI descriptor is the short way in. \
         The object already knows its own name, and C++ writes that name down \
         where a debugger can read it. Deleting sw.js does not help here.",
    );

    builder.finish()
}

fn slugs(bytes: &[u8], query: &str) -> Vec<String> {
    let index = Index::open(bytes).expect("index opens");

    search(&index, query, 10)
        .hits
        .into_iter()
        .map(|hit| {
            let doc = index.doc(hit.doc).expect("hit names a real entry");
            index.pool_str(doc.slug).to_string()
        })
        .collect()
}

fn snippet_for(bytes: &[u8], query: &str) -> String {
    let index = Index::open(bytes).expect("index opens");
    search(&index, query, 1)
        .hits
        .into_iter()
        .next()
        .map(|hit| hit.snippet)
        .unwrap_or_default()
}

#[test]
fn case_and_accents_fold_away() {
    assert_eq!(terms("Ljóss"), vec!["ljoss"]);
    assert_eq!(terms("CHROMIUM"), vec!["chromium"]);
    // Accent normalization accepts both composed and decomposed text.
    assert_eq!(terms("Ljo\u{301}ss"), terms("Lj\u{f3}ss"));
}

#[test]
fn a_name_keeps_the_punctuation_that_is_part_of_it() {
    assert_eq!(terms("C++"), vec!["c++"]);
    assert_eq!(terms("F#"), vec!["f#"]);
    assert_eq!(terms("0xC0000005"), vec!["0xc0000005"]);
}

#[test]
fn a_full_stop_belongs_to_the_sentence_and_not_the_word() {
    assert_eq!(terms("the end."), vec!["the", "end"]);
    assert_eq!(terms("Skia, where"), vec!["skia", "where"]);
}

#[test]
fn a_compound_is_filed_under_itself_and_its_pieces() {
    assert_eq!(terms("sw.js"), vec!["sw", "js", "sw.js"]);
    assert_eq!(terms("z-index"), vec!["index", "z-index"]);
    assert_eq!(ordinals("sw.js"), vec![0, 0, 0]);
}

#[test]
fn a_plain_word_is_filed_once() {
    assert_eq!(terms("camera"), vec!["camera"]);
    assert_eq!(ordinals("one two"), vec![0, 1]);
}

#[test]
fn a_word_reports_the_bytes_a_highlight_should_cover() {
    let text = "the c++ compiler";
    assert_eq!(token_len_at(text, 4), 3);

    let dotted = "in sw.js today";
    assert_eq!(token_len_at(dotted, 3), 5);

    let stopped = "at the end. Then";
    assert_eq!(token_len_at(stopped, 7), 3);
}

#[test]
fn an_index_round_trips_through_its_own_reader() {
    let bytes = corpus();
    let index = Index::open(&bytes).expect("index opens");

    assert_eq!(index.doc_count, 3);
    assert!(index.term_count > 50);

    let first = index.doc(0).expect("first entry");
    assert_eq!(index.pool_str(first.slug), "pdf");
    assert_eq!(
        index.pool_str(first.title),
        "Every Letter in This PDF Is a Drawing"
    );
    assert_eq!(index.pool_str(first.label), "01/03/2026");
    assert!(index.pool_str(first.body).starts_with("The resume looked"));
    assert!(index.doc(3).is_none());
}

#[test]
fn a_file_the_reader_was_not_compiled_for_is_refused() {
    let bytes = corpus();

    let mut wrong_magic = bytes.clone();
    wrong_magic[0] = b'X';
    assert!(Index::open(&wrong_magic).is_none());

    let mut wrong_version = bytes.clone();
    wrong_version[4] = 0xFF;
    assert!(Index::open(&wrong_version).is_none());

    assert!(Index::open(&bytes[..20]).is_none());
    assert!(Index::open(&[]).is_none());
}

#[test]
fn a_term_only_the_prose_contains_is_reachable() {
    let bytes = corpus();

    assert_eq!(slugs(&bytes, "vtable "), vec!["rtti"]);
    assert_eq!(slugs(&bytes, "skia "), vec!["pdf"]);
}

#[test]
fn every_word_of_a_query_has_to_land() {
    let bytes = corpus();

    assert_eq!(slugs(&bytes, "font chromium "), vec!["pdf"]);
    assert!(slugs(&bytes, "vtable chromium ").is_empty());
}

#[test]
fn line_breaks_in_a_query_separate_words_without_requiring_empty_slots() {
    let bytes = corpus();

    for separator in ["\n", "\r\n", "\n\n", "\t"] {
        assert_eq!(
            slugs(&bytes, &format!("font{separator}chromium ")),
            vec!["pdf"]
        );
        assert_eq!(
            slugs(&bytes, &format!("font{separator}chromi")),
            vec!["pdf"]
        );
        assert!(slugs(&bytes, &format!("font{separator}chromi ")).is_empty());
    }
}

#[test]
fn compound_alternatives_survive_line_breaks_in_a_query() {
    let bytes = corpus();

    assert_eq!(slugs(&bytes, "vtable\nsw.js "), vec!["rtti"]);
    assert_eq!(slugs(&bytes, "vtable\nmissing.js "), vec!["rtti"]);
}

#[test]
fn a_word_still_being_typed_grows_into_its_endings() {
    let bytes = corpus();

    assert_eq!(slugs(&bytes, "chromi"), vec!["pdf"]);
    assert!(slugs(&bytes, "chromi ").is_empty());
}

#[test]
fn a_phrase_outranks_the_same_words_apart() {
    let bytes = corpus();
    let found = slugs(&bytes, "use server ");

    assert_eq!(found.first().map(String::as_str), Some("foundation"));
}

#[test]
fn an_accented_title_answers_to_the_letters_a_reader_can_type() {
    let bytes = corpus();
    assert_eq!(slugs(&bytes, "ljoss "), vec!["foundation"]);
}

#[test]
fn a_punctuated_name_survives_the_round_trip() {
    let bytes = corpus();
    assert_eq!(slugs(&bytes, "c++ "), vec!["rtti"]);
    assert_eq!(slugs(&bytes, "sw.js "), vec!["rtti"]);
    assert_eq!(slugs(&bytes, "sw "), vec!["rtti"]);
}

#[test]
fn nothing_matches_a_word_the_corpus_does_not_have() {
    let bytes = corpus();
    assert!(slugs(&bytes, "webgpu ").is_empty());
    assert!(slugs(&bytes, "").is_empty());
    assert!(slugs(&bytes, "   ").is_empty());
}

#[test]
fn a_snippet_shows_the_sentence_and_marks_the_match() {
    let bytes = corpus();
    let snippet = snippet_for(&bytes, "vtable ");

    assert!(snippet.contains(&format!("{MARK_OPEN}vtable{MARK_CLOSE}")));
    assert!(snippet.contains("RTTI descriptor"));
    assert_eq!(
        snippet.matches(MARK_OPEN).count(),
        snippet.matches(MARK_CLOSE).count()
    );
}

#[test]
fn a_snippet_is_a_real_piece_of_the_entry() {
    let bytes = corpus();
    let index = Index::open(&bytes).expect("index opens");
    let hit = search(&index, "skia ", 1).hits.remove(0);
    let body = index.pool_str(index.doc(hit.doc).unwrap().body);

    let plain: String = hit
        .snippet
        .chars()
        .filter(|c| *c != MARK_OPEN && *c != MARK_CLOSE && *c != '\u{2026}')
        .collect();
    let one_line = |text: &str| text.split_whitespace().collect::<Vec<_>>().join(" ");

    assert!(
        one_line(body).contains(&one_line(&plain)),
        "snippet is not text from the entry"
    );
    assert!(plain.len() <= 300);
}

#[test]
fn a_snippet_says_where_it_was_cut() {
    let filler = "some ordinary prose about nothing at all. ".repeat(30);
    let mut builder = Builder::default();
    builder.add(
        "long",
        "Long",
        "2026-01-01T00:00:00.000Z",
        "01/01/2026",
        &format!("{filler}the vtable is here. {filler}"),
    );
    let middle = snippet_for(&builder.finish(), "vtable ");

    assert!(middle.starts_with('\u{2026}'), "{middle}");
    assert!(middle.ends_with('\u{2026}'), "{middle}");

    let mut builder = Builder::default();
    builder.add(
        "short",
        "Short",
        "2026-01-01T00:00:00.000Z",
        "01/01/2026",
        "One camera.",
    );
    let small = snippet_for(&builder.finish(), "camera ");

    assert!(!small.starts_with('\u{2026}'), "{small}");
    assert!(!small.ends_with('\u{2026}'), "{small}");
}

#[test]
fn a_snippet_marks_every_word_of_the_query_it_can_reach() {
    let bytes = corpus();
    let snippet = snippet_for(&bytes, "font files ");

    assert!(snippet.contains(&format!("{MARK_OPEN}font{MARK_CLOSE}")));
    assert!(snippet.contains(&format!("{MARK_OPEN}files{MARK_CLOSE}")));
}

#[test]
fn an_entry_whose_body_is_empty_does_not_break_the_index() {
    let mut builder = Builder::default();
    builder.add(
        "empty",
        "Nothing Here",
        "2026-01-01T00:00:00.000Z",
        "01/01/2026",
        "",
    );
    builder.add(
        "one",
        "One Word",
        "2025-01-01T00:00:00.000Z",
        "01/01/2025",
        "camera",
    );
    let bytes = builder.finish();

    assert_eq!(slugs(&bytes, "camera "), vec!["one"]);
    assert!(slugs(&bytes, "nothing ").is_empty());
}

#[test]
fn an_empty_corpus_answers_nothing_rather_than_failing() {
    let bytes = Builder::default().finish();
    let index = Index::open(&bytes).expect("an empty index is still a valid file");

    assert_eq!(index.doc_count, 0);
    assert!(search(&index, "anything", 10).hits.is_empty());
}

#[test]
fn a_capped_answer_still_reports_how_many_entries_matched() {
    let bytes = corpus();
    let index = Index::open(&bytes).expect("index opens");

    let capped = search(&index, "the ", 1);
    assert_eq!(capped.total, 3);
    assert_eq!(capped.hits.len(), 1);

    let whole = search(&index, "the ", 10);
    assert_eq!(whole.total, 3);
    assert_eq!(whole.hits.len(), 3);
}

#[test]
fn a_word_still_being_typed_reaches_every_ending_not_the_first_few() {
    let mut builder = Builder::default();
    let filler: String = (0..200)
        .map(|n| format!("consequence{n:03} "))
        .collect::<String>();

    builder.add(
        "filler",
        "Filler",
        "2026-02-01T00:00:00.000Z",
        "01/02/2026",
        &filler,
    );
    builder.add(
        "wanted",
        "Wanted",
        "2026-01-01T00:00:00.000Z",
        "01/01/2026",
        "ljoss and the contents of the volume",
    );

    let bytes = builder.finish();

    // The required term sorts after every distractor in the prefix range.
    assert_eq!(slugs(&bytes, "ljoss con"), vec!["wanted"]);
    assert_eq!(slugs(&bytes, "ljoss cont"), vec!["wanted"]);
}

#[test]
fn a_line_break_parts_two_words_the_reader_never_sees_together() {
    let filler = "ordinary prose about nothing much at all ".repeat(3);
    let mut builder = Builder::default();

    builder.add(
        "across",
        "Across",
        "2026-02-01T00:00:00.000Z",
        "01/02/2026",
        &format!("{filler}use\nserver {filler}"),
    );
    builder.add(
        "phrase",
        "Phrase",
        "2026-01-01T00:00:00.000Z",
        "01/01/2026",
        &format!("{filler}use server {filler}"),
    );

    let bytes = builder.finish();
    let index = Index::open(&bytes).expect("index opens");
    let hits = search(&index, "use server ", 10).hits;

    assert_eq!(hits.len(), 2);
    assert_eq!(
        index.pool_str(index.doc(hits[0].doc).unwrap().slug),
        "phrase",
        "the entry that holds the phrase has to lead"
    );
    assert!(
        hits[0].score > hits[1].score,
        "a break is not a space: {} vs {}",
        hits[0].score,
        hits[1].score
    );
}

#[test]
fn every_match_the_snippet_shows_is_marked() {
    let mut builder = Builder::default();
    builder.add(
        "dense",
        "Dense",
        "2026-01-01T00:00:00.000Z",
        "01/01/2026",
        &"The vtable is here. ".repeat(30),
    );

    let snippet = snippet_for(&builder.finish(), "vtable ");
    let shown = snippet.matches("vtable").count();
    let marked = snippet
        .matches(&format!("{MARK_OPEN}vtable{MARK_CLOSE}"))
        .count();

    assert!(shown > 0);
    assert_eq!(
        marked, shown,
        "unmarked matches in the quoted line: {snippet}"
    );
}

#[test]
fn a_run_without_spaces_cannot_stretch_the_window() {
    let link = "https://github.com/tkhquang/example/blob/0123456789abcdef0123456789abcdef01234567/src/some/deeply/nested/path/file.rs#L1-L40";
    let body = format!("Opening prose.\n{link}\n{link}\nThe vtable walk is described here.");

    let mut builder = Builder::default();
    builder.add(
        "links",
        "Links",
        "2026-01-01T00:00:00.000Z",
        "01/01/2026",
        &body,
    );
    let snippet = snippet_for(&builder.finish(), "vtable ");

    assert!(
        snippet.contains(&format!("{MARK_OPEN}vtable{MARK_CLOSE}")),
        "the match that chose the window is missing from it: {snippet}"
    );
    assert!(
        snippet.chars().count() < 400,
        "the window swallowed the space-free run: {} chars",
        snippet.chars().count()
    );
}

#[test]
fn a_multibyte_entry_is_cut_on_character_boundaries() {
    let mut builder = Builder::default();
    let filler = "café ☕ 日本語のテキスト naïve résumé 🍵 ".repeat(12);
    builder.add(
        "wide",
        "Wide",
        "2026-01-01T00:00:00.000Z",
        "01/01/2026",
        &format!("{filler}the vtable sits here {filler}"),
    );

    let snippet = snippet_for(&builder.finish(), "vtable ");

    assert!(snippet.contains(&format!("{MARK_OPEN}vtable{MARK_CLOSE}")));
    assert_eq!(
        snippet.matches(MARK_OPEN).count(),
        snippet.matches(MARK_CLOSE).count()
    );
}

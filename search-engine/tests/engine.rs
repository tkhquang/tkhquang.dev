use ljoss_search::tokenize::{token_len_at, tokenize};
use ljoss_search::{search, Builder, Index, Need, Segments, MARK_CLOSE, MARK_OPEN};

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

/// All three artifacts of one build, with both range-read ones already
/// supplied whole.
///
/// A build writes the index, the postings and the reading text apart, and the
/// engine reaches the last two by byte range. Handing it the whole of each is
/// the shape a test wants almost everywhere: it leaves nothing for a request to
/// ask for, so these tests read as though it were all still one file. The ones
/// that care about the split say so.
struct Corpus {
    index: Vec<u8>,
    lists: Vec<u8>,
    postings: Segments,
    text: Vec<u8>,
    body: Segments,
}

impl Corpus {
    /// One entry's reading text, by the range its doc table row names.
    fn entry(&self, range: (u32, u32)) -> &str {
        let start = range.0 as usize;
        std::str::from_utf8(&self.text[start..start + range.1 as usize]).expect("entry is text")
    }
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

/// Three entries, newest first, as the build step adds them.
fn corpus() -> Corpus {
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

    written(builder)
}

fn slugs(archive: &Corpus, query: &str) -> Vec<String> {
    let index = Index::open(&archive.index).expect("index opens");

    search(&index, &archive.postings, &archive.body, query, 10)
        .hits
        .into_iter()
        .map(|hit| {
            let doc = index.doc(hit.doc).expect("hit names a real entry");
            index.pool_str(doc.slug).to_string()
        })
        .collect()
}

fn snippet_for(archive: &Corpus, query: &str) -> String {
    let index = Index::open(&archive.index).expect("index opens");
    search(&index, &archive.postings, &archive.body, query, 1)
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
    let archive = corpus();
    let index = Index::open(&archive.index).expect("index opens");

    assert_eq!(index.doc_count, 3);
    assert!(index.term_count > 50);

    let first = index.doc(0).expect("first entry");
    assert_eq!(index.pool_str(first.slug), "pdf");
    assert_eq!(
        index.pool_str(first.title),
        "Every Letter in This PDF Is a Drawing"
    );
    assert_eq!(index.pool_str(first.label), "01/03/2026");
    assert!(archive.entry(first.body).starts_with("The resume looked"));
    assert!(index.doc(3).is_none());
}

#[test]
fn a_file_the_reader_was_not_compiled_for_is_refused() {
    let archive = corpus();

    let mut wrong_magic = archive.index.clone();
    wrong_magic[0] = b'X';
    assert!(Index::open(&wrong_magic).is_none());

    let mut wrong_version = archive.index.clone();
    wrong_version[4] = 0xFF;
    assert!(Index::open(&wrong_version).is_none());

    assert!(Index::open(&archive.index[..20]).is_none());
    assert!(Index::open(&[]).is_none());
}

#[test]
fn a_term_only_the_prose_contains_is_reachable() {
    let archive = corpus();

    assert_eq!(slugs(&archive, "vtable "), vec!["rtti"]);
    assert_eq!(slugs(&archive, "skia "), vec!["pdf"]);
}

#[test]
fn every_word_of_a_query_has_to_land() {
    let archive = corpus();

    assert_eq!(slugs(&archive, "font chromium "), vec!["pdf"]);
    assert!(slugs(&archive, "vtable chromium ").is_empty());
}

#[test]
fn line_breaks_in_a_query_separate_words_without_requiring_empty_slots() {
    let archive = corpus();

    for separator in ["\n", "\r\n", "\n\n", "\t"] {
        assert_eq!(
            slugs(&archive, &format!("font{separator}chromium ")),
            vec!["pdf"]
        );
        assert_eq!(
            slugs(&archive, &format!("font{separator}chromi")),
            vec!["pdf"]
        );
        assert!(slugs(&archive, &format!("font{separator}chromi ")).is_empty());
    }
}

#[test]
fn compound_alternatives_survive_line_breaks_in_a_query() {
    let archive = corpus();

    assert_eq!(slugs(&archive, "vtable\nsw.js "), vec!["rtti"]);
    assert_eq!(slugs(&archive, "vtable\nmissing.js "), vec!["rtti"]);
}

#[test]
fn a_word_still_being_typed_grows_into_its_endings() {
    let archive = corpus();

    assert_eq!(slugs(&archive, "chromi"), vec!["pdf"]);
    assert!(slugs(&archive, "chromi ").is_empty());
}

#[test]
fn a_phrase_outranks_the_same_words_apart() {
    let archive = corpus();
    let found = slugs(&archive, "use server ");

    assert_eq!(found.first().map(String::as_str), Some("foundation"));
}

#[test]
fn an_accented_title_answers_to_the_letters_a_reader_can_type() {
    let archive = corpus();
    assert_eq!(slugs(&archive, "ljoss "), vec!["foundation"]);
}

#[test]
fn a_punctuated_name_survives_the_round_trip() {
    let archive = corpus();
    assert_eq!(slugs(&archive, "c++ "), vec!["rtti"]);
    assert_eq!(slugs(&archive, "sw.js "), vec!["rtti"]);
    assert_eq!(slugs(&archive, "sw "), vec!["rtti"]);
}

#[test]
fn nothing_matches_a_word_the_corpus_does_not_have() {
    let archive = corpus();
    assert!(slugs(&archive, "webgpu ").is_empty());
    assert!(slugs(&archive, "").is_empty());
    assert!(slugs(&archive, "   ").is_empty());
}

#[test]
fn a_snippet_shows_the_sentence_and_marks_the_match() {
    let archive = corpus();
    let snippet = snippet_for(&archive, "vtable ");

    assert!(snippet.contains(&format!("{MARK_OPEN}vtable{MARK_CLOSE}")));
    assert!(snippet.contains("RTTI descriptor"));
    assert_eq!(
        snippet.matches(MARK_OPEN).count(),
        snippet.matches(MARK_CLOSE).count()
    );
}

#[test]
fn a_snippet_is_a_real_piece_of_the_entry() {
    let archive = corpus();
    let index = Index::open(&archive.index).expect("index opens");
    let hit = search(&index, &archive.postings, &archive.body, "skia ", 1).hits.remove(0);
    let body = archive.entry(index.doc(hit.doc).unwrap().body);

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
    let middle = snippet_for(&written(builder), "vtable ");

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
    let small = snippet_for(&written(builder), "camera ");

    assert!(!small.starts_with('\u{2026}'), "{small}");
    assert!(!small.ends_with('\u{2026}'), "{small}");
}

#[test]
fn a_snippet_marks_every_word_of_the_query_it_can_reach() {
    let archive = corpus();
    let snippet = snippet_for(&archive, "font files ");

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
    let archive = written(builder);

    assert_eq!(slugs(&archive, "camera "), vec!["one"]);
    assert!(slugs(&archive, "nothing ").is_empty());
}

#[test]
fn an_empty_corpus_answers_nothing_rather_than_failing() {
    let archive = written(Builder::default());
    let index = Index::open(&archive.index).expect("an empty index is still a valid file");

    assert_eq!(index.doc_count, 0);
    assert!(search(&index, &archive.postings, &archive.body, "anything", 10).hits.is_empty());
}

#[test]
fn a_capped_answer_still_reports_how_many_entries_matched() {
    let archive = corpus();
    let index = Index::open(&archive.index).expect("index opens");

    let capped = search(&index, &archive.postings, &archive.body, "the ", 1);
    assert_eq!(capped.total, 3);
    assert_eq!(capped.hits.len(), 1);

    let whole = search(&index, &archive.postings, &archive.body, "the ", 10);
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

    let archive = written(builder);

    // The required term sorts after every distractor in the prefix range.
    assert_eq!(slugs(&archive, "ljoss con"), vec!["wanted"]);
    assert_eq!(slugs(&archive, "ljoss cont"), vec!["wanted"]);
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

    let archive = written(builder);
    let index = Index::open(&archive.index).expect("index opens");
    let hits = search(&index, &archive.postings, &archive.body, "use server ", 10).hits;

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

    let snippet = snippet_for(&written(builder), "vtable ");
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
    let snippet = snippet_for(&written(builder), "vtable ");

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

    let snippet = snippet_for(&written(builder), "vtable ");

    assert!(snippet.contains(&format!("{MARK_OPEN}vtable{MARK_CLOSE}")));
    assert_eq!(
        snippet.matches(MARK_OPEN).count(),
        snippet.matches(MARK_CLOSE).count()
    );
}

#[test]
fn neither_large_artifact_is_carried_by_the_index() {
    let archive = corpus();
    let holds = |haystack: &[u8], needle: &[u8]| {
        haystack.windows(needle.len()).any(|window| window == needle)
    };

    /* The prose is the largest part of a build and the least of it a query
       reads, which is the whole reason the files part. */
    assert!(holds(&archive.text, b"RTTI descriptor"));
    assert!(!holds(&archive.index, b"RTTI descriptor"));

    // The dictionary and the row fields stay where a query can reach them.
    assert!(holds(&archive.index, b"descriptor"));
    assert!(holds(&archive.index, b"Every Letter in This PDF Is a Drawing"));

    /* Of the posting lists the index keeps only the addresses. The lists a
       query walks are bytes of the artifact it fetches ranges of. */
    let index = Index::open(&archive.index).expect("index opens");
    let term = index.exact("descriptor").expect("the term is in the dictionary");
    let (start, len) = index.postings_span(term);

    assert!(len > 0);
    assert!((start + len) as usize <= archive.lists.len());
}

#[test]
fn a_cold_query_asks_for_the_postings_first_and_the_windows_after() {
    let archive = corpus();
    let index = Index::open(&archive.index).expect("index opens");
    let mut postings = Segments::default();
    let mut body = Segments::default();

    /* Nothing in hand. Ranking is impossible without the posting lists, so
       they are what the first pass asks for. */
    let wants_postings = search(&index, &postings, &body, "the ", 10);
    let request = wants_postings
        .request
        .expect("the postings were asked for");
    assert_eq!(request.section, Need::Postings);
    assert!(wants_postings.hits.is_empty());

    for (start, len) in &request.ranges {
        let from = *start as usize;
        postings.supply(*start, &archive.lists[from..from + *len as usize]);
    }

    // Ranked. Now it knows which windows of which entries it has to quote.
    let wants_body = search(&index, &postings, &body, "the ", 10);
    let request = wants_body.request.expect("the windows were asked for");
    assert_eq!(request.section, Need::Body);
    assert_eq!(request.ranges.len(), 3);

    for (start, len) in &request.ranges {
        let inside = (0..index.doc_count)
            .filter_map(|doc| index.doc(doc))
            .any(|entry| *start >= entry.body.0 && start + len <= entry.body.0 + entry.body.1);
        assert!(inside, "a window at {start} for {len} bytes crosses an entry");

        let from = *start as usize;
        body.supply(*start, &archive.text[from..from + *len as usize]);
    }

    let served = search(&index, &postings, &body, "the ", 10);
    assert!(served.request.is_none());
    assert_eq!(served.hits.len(), 3);
    for hit in &served.hits {
        assert!(!hit.snippet.is_empty());
    }
}

#[test]
fn a_cold_query_asks_for_a_bounded_window_rather_than_the_whole_entry() {
    let filler = "ordinary prose about nothing much at all. ".repeat(120);
    let mut builder = Builder::default();
    builder.add(
        "long",
        "Long",
        "2026-01-01T00:00:00.000Z",
        "01/01/2026",
        &format!("{filler}the vtable is here. {filler}"),
    );
    let archive = written(builder);
    let index = Index::open(&archive.index).expect("index opens");
    let mut store = Segments::default();

    /* No reading text: the row prints without its quoted line, and names the
       range that would carry one. */
    let asked = search(&index, &archive.postings, &store, "vtable ", 10);
    let request = asked.request.expect("a window was asked for");
    assert_eq!(request.section, Need::Body);
    assert_eq!(asked.hits[0].snippet, "");

    let (start, len) = request.ranges[0];
    assert!(
        len < 2048,
        "one window cost {len} of {} bytes",
        archive.text.len()
    );

    store.supply(start, &archive.text[start as usize..(start + len) as usize]);
    let served = search(&index, &archive.postings, &store, "vtable ", 10);

    assert!(served.request.is_none());
    assert_eq!(served.hits[0].snippet, snippet_for(&archive, "vtable "));
}

#[test]
fn a_word_the_dictionary_does_not_hold_is_repaired() {
    let archive = corpus();
    let index = Index::open(&archive.index).expect("index opens");
    let answer = search(&index, &archive.postings, &archive.body, "chromiun ", 10);

    assert_eq!(
        answer
            .hits
            .iter()
            .map(|hit| index.pool_str(index.doc(hit.doc).unwrap().slug))
            .collect::<Vec<_>>(),
        vec!["pdf"]
    );

    /* A reader who typed a name deliberately is told it was not the name that
       answered. */
    assert_eq!(answer.repairs.len(), 1);
    assert_eq!(answer.repairs[0].typed, "chromiun");
    assert_eq!(answer.repairs[0].chosen, "chromium");
}

#[test]
fn an_exact_match_is_never_displaced_by_a_repaired_one() {
    let filler = "ordinary prose about nothing much at all. ".repeat(4);
    let mut builder = Builder::default();

    /* Two entries holding two words a slip can reach, at different distances
       from it: `descriptr` is one edit from `descriptor` and two from
       `descriptors`. The newer entry holds the further word, so document order
       would put it first if the distance did not. */
    builder.add(
        "further",
        "Further",
        "2026-02-01T00:00:00.000Z",
        "01/02/2026",
        &format!("{filler}the descriptors are here{filler}"),
    );
    builder.add(
        "nearer",
        "Nearer",
        "2026-01-01T00:00:00.000Z",
        "01/01/2026",
        &format!("{filler}the descriptor is here{filler}"),
    );
    let archive = written(builder);
    let index = Index::open(&archive.index).expect("index opens");
    let slug = |doc| index.pool_str(index.doc(doc).unwrap().slug);

    /* Typed exactly, nothing is repaired and only the entry holding the word
       answers: the other holds `descriptors`, which is a different term. */
    let exact = search(&index, &archive.postings, &archive.body, "descriptor ", 10);
    assert!(exact.repairs.is_empty());
    assert_eq!(exact.hits.len(), 1);
    assert_eq!(slug(exact.hits[0].doc), "nearer");

    /* Typed with a slip, the repair reaches both, and the nearer word leads
       against the document order that would otherwise decide it. */
    let slipped = search(&index, &archive.postings, &archive.body, "descriptr ", 10);
    assert_eq!(slipped.repairs.len(), 1);
    assert_eq!(slipped.repairs[0].chosen, "descriptor");
    assert_eq!(slipped.hits.len(), 2);
    assert_eq!(
        slug(slipped.hits[0].doc),
        "nearer",
        "the nearer word has to lead"
    );
    assert!(slipped.hits[0].score > slipped.hits[1].score);
}

#[test]
fn a_growing_word_is_repaired_only_when_its_prefix_reaches_nothing() {
    let archive = corpus();
    let index = Index::open(&archive.index).expect("index opens");
    let ask = |query| search(&index, &archive.postings, &archive.body, query, 10);

    /* Still growing and still a prefix of something: it reaches every ending
       of itself, so the expansion answers and no edits are spent. Repairing
       here is what would answer `cam` with `can` and `cat`. */
    let growing = ask("chromiu");
    assert_eq!(growing.hits.len(), 1);
    assert!(growing.repairs.is_empty());

    /* Still growing and a prefix of nothing: there is no expansion to fight
       and nothing else to show, so the slip is repaired without waiting for
       the reader to finish the word. */
    let slipped = ask("chromiun");
    assert_eq!(slipped.hits.len(), 1);
    assert_eq!(slipped.repairs[0].chosen, "chromium");

    // Finishing the word changes nothing about what it finds.
    assert_eq!(ask("chromiun ").hits.len(), slipped.hits.len());
}

#[test]
fn two_characters_the_wrong_way_round_are_one_edit() {
    let archive = corpus();
    let index = Index::open(&archive.index).expect("index opens");

    /* A swap is the typo a hand makes when two keys arrive out of order, and
       at six characters the budget is one, so it is only reachable because a
       swap costs one rather than two. */
    for (typed, meant) in [("vtabel", "vtable"), ("vatble", "vtable")] {
        let answer = search(&index, &archive.postings, &archive.body, typed, 10);

        assert_eq!(answer.repairs.len(), 1, "{typed}");
        assert_eq!(answer.repairs[0].chosen, meant, "{typed}");
        assert_eq!(
            index.pool_str(index.doc(answer.hits[0].doc).unwrap().slug),
            "rtti"
        );
    }
}

#[test]
fn a_word_too_short_to_repair_is_left_alone() {
    let archive = corpus();
    let index = Index::open(&archive.index).expect("index opens");

    for query in ["ski ", "zzz ", "ljo "] {
        let answer = search(&index, &archive.postings, &archive.body, query, 10);
        assert!(answer.repairs.is_empty(), "{query} was repaired");
    }
}

#[test]
fn a_query_with_one_repaired_word_ranks_below_one_with_both_exact() {
    let archive = corpus();
    let index = Index::open(&archive.index).expect("index opens");

    let exact = search(&index, &archive.postings, &archive.body, "font chromium ", 10);
    let repaired = search(&index, &archive.postings, &archive.body, "font chromiun ", 10);

    assert_eq!(exact.hits.len(), 1);
    assert_eq!(repaired.hits.len(), 1);
    assert_eq!(exact.hits[0].doc, repaired.hits[0].doc);
    assert!(
        exact.hits[0].score > repaired.hits[0].score,
        "{} against {}",
        exact.hits[0].score,
        repaired.hits[0].score
    );
}

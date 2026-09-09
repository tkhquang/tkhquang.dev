"use client";

import {
  MAX_QUERY_LENGTH,
  SearchIndexReplaced,
  searchLedger,
  warmLedger,
} from "@/lib/ledger-search/client";
import type { LedgerAnswer } from "@/lib/ledger-search/engine";
import { MARK_CLOSE, MARK_OPEN } from "@/lib/ledger-search/protocol";
import classNames from "classnames";
import Link from "next/link";
import React, { useCallback, useEffect, useId, useRef, useState } from "react";

/**
 * `searching` carries the answer already on show, because the answer to the
 * previous keystroke is the best content available until the next one lands.
 * Dropping it unmounts the whole result list once per character, which strobes
 * the results and lets the browser clamp the scroll offset each time the
 * document shortens. `replaced` says whether editing the query can help.
 */
type Lookup =
  | { status: "idle" | "loading" }
  | { status: "unavailable"; replaced: boolean }
  | { status: "searching"; answer: LedgerAnswer | null }
  | { status: "ready"; answer: LedgerAnswer };

const marked = (snippet: string) =>
  snippet.split(MARK_OPEN).flatMap((piece, index) => {
    if (index === 0) {
      return [piece];
    }

    const [hit, rest = ""] = piece.split(MARK_CLOSE);
    return [<mark key={index}>{hit}</mark>, rest];
  });

/** Optional browse content stays mounted so its state survives a search. */
const LedgerSearch = ({ children }: { children?: React.ReactNode }) => {
  const fieldId = useId();
  const fieldRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [lookup, setLookup] = useState<Lookup>({ status: "idle" });
  const request = useRef<AbortController | null>(null);

  const updateQuery = useCallback((value: string) => {
    const typed = value.slice(0, MAX_QUERY_LENGTH);
    /* Restored or programmatic values can exceed the native maxlength. */
    if (fieldRef.current && value !== typed) fieldRef.current.value = typed;
    request.current?.abort();
    setQuery(typed);
    if (!typed.trim()) {
      setLookup({ status: "idle" });
      return;
    }

    const controller = new AbortController();
    request.current = controller;
    setLookup((previous) =>
      previous.status === "ready" || previous.status === "searching"
        ? { status: "searching", answer: previous.answer }
        : { status: "loading" }
    );

    searchLedger(typed, controller.signal)
      .then((answer) => {
        if (answer && !controller.signal.aborted) {
          setLookup({ status: "ready", answer });
        }
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setLookup({
          status: "unavailable",
          replaced: error instanceof SearchIndexReplaced,
        });
      });
  }, []);

  useEffect(() => {
    /* An uncontrolled field preserves text entered before hydration.
       Read it once so the query state and loader catch up. */
    const typed = fieldRef.current?.value ?? "";

    if (typed) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Preserve text entered before hydration.
      updateQuery(typed);
    }

    return () => request.current?.abort();
  }, [updateQuery]);

  const clear = () => {
    if (fieldRef.current) {
      fieldRef.current.value = "";
      fieldRef.current.focus();
    }

    updateQuery("");
  };

  const hasText = query.length > 0;
  const searching = query.trim().length > 0;

  const answer =
    lookup.status === "ready" || lookup.status === "searching"
      ? lookup.answer
      : null;
  const unavailable = lookup.status === "unavailable" ? lookup : null;
  const hideBrowse =
    searching && (answer !== null || lookup.status === "searching");

  /* The count reports the state of the query in hand, not of the results still
     on show, so a stale total is never printed as though it answered. */
  const count = (() => {
    if (!searching) return "";
    if (unavailable) return "The lookup is unavailable";
    if (lookup.status === "loading") return "Opening the index";
    if (lookup.status === "searching") return "Searching the ledger";
    return answer && answer.results.length > 0
      ? `${answer.results.length} of ${answer.total} entries`
      : "No entries match";
  })();

  /* An answer is on its way and the one on show belongs to the keystroke
     before it. */
  const pending = lookup.status === "searching";

  /* A word the ledger does not hold is answered by the nearest one it does.
     Naming both is the point: a reader who typed a name deliberately has to be
     told it was not the name that was searched for. */
  const repairs =
    lookup.status === "ready" && lookup.answer.results.length > 0
      ? lookup.answer.repairs
      : [];

  return (
    <>
      <search className="ledger-search">
        <label className="kicker ledger-search__label" htmlFor={fieldId}>
          Search the ledger
        </label>
        <div className="ledger-search__line">
          <input
            ref={fieldRef}
            id={fieldId}
            className="ledger-search__field"
            type="search"
            maxLength={MAX_QUERY_LENGTH}
            placeholder="A word from anywhere in an entry"
            autoComplete="off"
            spellCheck={false}
            onFocus={warmLedger}
            onChange={(event) => {
              updateQuery(event.target.value);
            }}
            onPaste={(event) => {
              const pasted = event.clipboardData.getData("text/plain");
              if (!/[\r\n]/.test(pasted)) return;

              /* Text inputs drop newlines. Preserve word boundaries in pasted phrases. */
              event.preventDefault();
              const field = event.currentTarget;
              const start = field.selectionStart ?? field.value.length;
              const end = field.selectionEnd ?? start;
              const room = Math.max(
                0,
                MAX_QUERY_LENGTH - field.value.length + end - start
              );
              const insert = pasted.replace(/\r\n?|\n/g, " ").slice(0, room);

              /* Assigned through the value property, not setRangeText: React
                 shadows that property on the node to track the last value it
                 saw, and a write past the accessor leaves the tracker holding
                 the text from before the paste. React then reads the next real
                 edit as a repeat and drops it, so a paste followed by select all
                 and delete would empty the field without telling the component. */
              const caret = start + insert.length;
              field.value =
                field.value.slice(0, start) + insert + field.value.slice(end);
              field.setSelectionRange(caret, caret);
              updateQuery(field.value);
            }}
            onKeyDown={(event) => {
              if (
                event.key === "Escape" &&
                !event.nativeEvent.isComposing &&
                fieldRef.current?.value
              ) {
                event.preventDefault();
                clear();
              }
            }}
          />
          {hasText && (
            <button
              type="button"
              className="ledger-search__clear"
              onClick={clear}
              aria-label="Clear the search"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden
              >
                <line x1="5" y1="5" x2="19" y2="19" />
                <line x1="19" y1="5" x2="5" y2="19" />
              </svg>
            </button>
          )}
        </div>
        <p className="kicker ledger-search__count" role="status">
          {count}
        </p>
        <p className="ledger-search__repair">
          {repairs.map((repair, index) => (
            <React.Fragment key={repair.typed}>
              {index > 0 && " "}
              Nothing holds <q>{repair.typed}</q>. These answer to{" "}
              <q>{repair.chosen}</q>.
            </React.Fragment>
          ))}
        </p>
      </search>

      {/* Read from the answer on show rather than from the status, the way
          the results below are. Gating this on a settled lookup unmounts it
          for the frame each keystroke spends in flight, and a line leaving and
          returning at twenty times a second moves the page under the reader. */}
      {searching && answer !== null && answer.results.length === 0 && (
        <p className="ledger-search__empty">
          Try one word, or a phrase you remember reading.
        </p>
      )}

      {searching && unavailable && (
        <p className="ledger-search__empty">
          {unavailable.replaced
            ? "The ledger has been reprinted since this page opened. Reload it to search the current entries."
            : "The search index did not load. Edit the search to try again."}
        </p>
      )}

      {answer && answer.results.length > 0 && (
        <ul
          className={classNames("ledger-search__results", {
            "ledger-search__results--pending": pending,
          })}
        >
          {answer.results.map((result) => (
            <li className="ledger-search__result" key={result.slug}>
              <Link
                className="ledger-search__hit"
                href={`/blog/posts/${result.slug}`}
                prefetch={false}
              >
                <time className="font-mono" dateTime={result.date}>
                  {result.dateLabel}
                </time>
                <span className="ledger-search__title">{result.title}</span>
              </Link>
              <p className="ledger-search__snippet">{marked(result.snippet)}</p>
            </li>
          ))}
        </ul>
      )}

      {children && <div hidden={hideBrowse}>{children}</div>}
    </>
  );
};

export default LedgerSearch;

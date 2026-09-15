"use client";

import "./GlobalSearch.css";
import LedgerSearch from "@/components/blog/LedgerSearch";
import { Blog } from "@/constants/meta";
import { getAllTabbableIn } from "@ariakit/core/utils/focus";
import {
  Dialog,
  DialogDescription,
  DialogDisclosure,
  DialogDismiss,
  DialogHeading,
  useDialogStore,
} from "@ariakit/react/dialog";
import { FocusTrap } from "@ariakit/react/focus-trap";
import { ArrowUpRight, Search, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type RefObject, useEffect, useRef } from "react";

const BROWSE_DESCRIPTIONS: Record<string, string> = {
  "/blog": "The latest writing",
  "/blog/categories": "Browse the shelves",
  "/blog/tags": "Follow a subject",
  "/blog/posts": "Every entry, by date",
};

const SEARCH_SUGGESTIONS = [
  { query: "camera", description: "Game worlds, seen differently" },
  { query: "vtable", description: "A look inside native code" },
  { query: "React", description: "Notes from the web platform" },
];

function BrowseIndex({ onNavigate }: { onNavigate: () => void }) {
  return (
    <nav className="global-search__browse" aria-label="Browse the blog">
      <p className="kicker">Browse the index</p>
      <ul>
        {Blog.NAV_LINKS.map((link) => (
          <li key={link.href}>
            <Link href={link.href} onNavigate={onNavigate}>
              <span>
                <span className="global-search__browse-label">
                  {link.label}
                </span>
                <span className="global-search__browse-description">
                  {BROWSE_DESCRIPTIONS[link.href]}
                </span>
              </span>
              <ArrowUpRight size={16} strokeWidth={1.5} aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/* A small lookup plate in the blog's dot-and-ring chart vocabulary. */
function LookupPlate() {
  return (
    <svg
      className="global-search__plate"
      viewBox="0 0 220 120"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.75"
      aria-hidden
    >
      <path d="M16 60H204M110 8V112" opacity="0.2" />
      <circle cx="100" cy="53" r="36" opacity="0.35" />
      <circle cx="100" cy="53" r="43" strokeDasharray="1 5" opacity="0.3" />
      <path d="m126 79 27 27m-23-31 27 27" opacity="0.65" />
      <path d="m31 82 45-46 37 27 57-40 26 19" opacity="0.45" />
      <g className="global-search__plate-stars">
        <circle cx="76" cy="36" r="4" />
        <circle cx="76" cy="36" r="1.5" fill="currentColor" />
        <circle cx="113" cy="63" r="5" />
        <circle cx="113" cy="63" r="2" fill="currentColor" />
        <circle cx="170" cy="23" r="3" />
        <circle cx="170" cy="23" r="1" fill="currentColor" />
      </g>
      <g fill="currentColor" stroke="none" opacity="0.6">
        <circle cx="31" cy="82" r="1.5" />
        <circle cx="196" cy="42" r="1.5" />
        <circle cx="44" cy="22" r="1" />
        <circle cx="176" cy="91" r="1" />
        <circle cx="55" cy="103" r="1" />
      </g>
    </svg>
  );
}

function SearchSheet() {
  const dialog = useDialogStore();
  const fieldRef = useRef<HTMLInputElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  const focusBoundary = (last: boolean) => {
    const sheet = sheetRef.current;
    if (!sheet) return;
    const stops = getAllTabbableIn(sheet).filter(
      (element) => !element.hasAttribute("data-focus-trap")
    );
    (last ? stops.at(-1) : stops[0])?.focus();
  };

  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.isComposing ||
        event.repeat ||
        event.altKey ||
        event.shiftKey ||
        !(event.metaKey || event.ctrlKey) ||
        event.key.toLowerCase() !== "k"
      ) {
        return;
      }

      const target = event.target;
      if (target instanceof HTMLElement) {
        const insideSearch = sheetRef.current?.contains(target);
        // Keep shortcuts in editors and other dialogs with their owner.
        if (
          !insideSearch &&
          (target.isContentEditable ||
            target.closest("input, textarea, select, [role='dialog'], dialog"))
        ) {
          return;
        }
      }

      event.preventDefault();
      if (dialog.getState().open) fieldRef.current?.focus();
      else dialog.show();
    };

    document.addEventListener("keydown", shortcut);
    return () => document.removeEventListener("keydown", shortcut);
  }, [dialog]);

  return (
    <>
      <DialogDisclosure
        store={dialog}
        className="global-search__trigger header-icon-button"
        aria-label="Search the blog"
        aria-keyshortcuts="Control+k Meta+k"
        title="Search the blog (Ctrl / ⌘ K)"
      >
        <Search size={18} strokeWidth={1.5} aria-hidden />
        <span className="site-header__search-label">Search</span>
      </DialogDisclosure>
      <Dialog
        ref={sheetRef}
        store={dialog}
        className="global-search"
        aria-modal="true"
        backdrop={<div className="global-search__backdrop" />}
        // Ariakit's installed types predate React 19's nullable RefObject type.
        initialFocus={fieldRef as RefObject<HTMLInputElement>}
        unmountOnHide
        // Composition Escape belongs to the input method, not the sheet.
        hideOnEscape={(event) =>
          !("nativeEvent" in event ? event.nativeEvent : event).isComposing
        }
      >
        {/* This Ariakit version makes the background inert but lets Tab leave
            for browser chrome. Its focus traps keep both ends in the sheet. */}
        <FocusTrap onFocus={() => focusBoundary(true)} />
        <div className="global-search__masthead">
          <div className="global-search__identity">
            <span className="global-search__wordmark">Ljóss</span>
            <DialogHeading className="kicker global-search__title">
              Search the ledger
            </DialogHeading>
          </div>
          <DialogDismiss
            className="global-search__close"
            aria-label="Close search"
          >
            <kbd className="global-search__escape" aria-hidden>
              Esc
            </kbd>
            <X size={20} strokeWidth={1.75} aria-hidden />
          </DialogDismiss>
        </div>
        <DialogDescription className="sr-only">
          Search titles, code, and passages from the blog.
        </DialogDescription>
        <div className="global-search__spread">
          <aside className="global-search__index">
            <p className="global-search__lede">
              Things taken apart.
              <br />
              Notes kept along the way.
            </p>
            <BrowseIndex onNavigate={dialog.hide} />
            <div className="global-search__imprint">
              <LookupPlate />
              <span className="kicker">A journal by Aleks</span>
            </div>
          </aside>
          <div className="global-search__content">
            <LedgerSearch
              inputRef={fieldRef}
              onNavigate={dialog.hide}
              suggestions={SEARCH_SUGGESTIONS}
              inDialog
            >
              <div className="global-search__mobile-index">
                <BrowseIndex onNavigate={dialog.hide} />
              </div>
            </LedgerSearch>
          </div>
        </div>
        <div className="global-search__foot">
          <span>A word can open a whole entry.</span>
          <span className="global-search__keyboard-hint">
            <span>
              <kbd>Tab</kbd> explore
            </span>
            <span>
              <kbd>↵</kbd> follow
            </span>
            <span>
              <kbd>Esc</kbd> close
            </span>
          </span>
        </div>
        <FocusTrap onFocus={() => focusBoundary(false)} />
      </Dialog>
    </>
  );
}

export default function GlobalSearch() {
  const pathname = usePathname();
  // Header layouts persist. Navigation (including Back) closes the old sheet.
  return <SearchSheet key={pathname} />;
}

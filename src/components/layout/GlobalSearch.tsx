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
import { Search, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type RefObject, useEffect, useRef } from "react";

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
        <Search size={24} strokeWidth={2} aria-hidden />
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
          <span className="kicker">Ljóss · The lookup</span>
          <DialogDismiss
            className="global-search__close"
            aria-label="Close search"
          >
            <span className="global-search__escape" aria-hidden>
              Esc
            </span>
            <X size={20} strokeWidth={1.75} aria-hidden />
          </DialogDismiss>
        </div>
        <div className="global-search__content">
          <div className="global-search__heading">
            <DialogHeading className="global-search__title">
              Search the ledger
            </DialogHeading>
            <DialogDescription className="global-search__description">
              Find a word, a phrase, or a passage from the blog.
            </DialogDescription>
          </div>
          <LedgerSearch inputRef={fieldRef} onNavigate={dialog.hide} inDialog>
            <div className="global-search__browse">
              <p className="kicker">Or browse the index</p>
              <nav aria-label="Browse the blog">
                {Blog.NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onNavigate={dialog.hide}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          </LedgerSearch>
        </div>
        <div className="global-search__foot">
          <span>Across every entry in Ljóss.</span>
          <span className="global-search__keyboard-hint">
            Tab to explore · Esc to close
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

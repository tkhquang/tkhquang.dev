"use client";

import "./SlipSheet.css";
import Drawer from "@/components/common/Drawer";

/* The slide must be at least as tall as the sheet, which the stylesheet
   caps at 704px. A shorter slide leaves the sheet's head on screen. */
const SHEET_TRAVEL = 720;

/* The two-line X, as the index drawer uses. The table of contents keeps
   the circled one. */
const DismissGlyph = () => (
  <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden>
    <path
      d="M3 3l10 10M13 3L3 13"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

interface SlipSheetProps {
  title: string;
  /* Composed at the call site, so the drawer's store stays internal. */
  trigger: React.ReactNode;
  children: React.ReactNode;
}

/**
 * The slip on a phone: the house bottom drawer, holding the card the
 * hovercard carries on a mouse. A card anchored to a word has no room on
 * a small screen, and a bottom sheet is the pattern a phone reader knows.
 */
export function SlipSheet({ children, title, trigger }: SlipSheetProps) {
  return (
    <Drawer
      position="bottom"
      size={SHEET_TRAVEL}
      title={title}
      className="slip-drawer"
      dismissIcon={<DismissGlyph />}
      dismissLabel="Close the slip"
      trigger={trigger}
    >
      <div className="slip slip--sheet typography code-container">
        {children}
      </div>
    </Drawer>
  );
}

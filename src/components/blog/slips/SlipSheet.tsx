"use client";

import "./SlipSheet.css";
import Drawer, { DrawerTrigger } from "@/components/common/Drawer";
import clsx from "clsx";

/* The slide the drawer plays, at least as tall as the sheet ever is
   (the stylesheet caps it at 704px), or the closed pose would leave the
   sheet's head standing on screen */
const SHEET_TRAVEL = 720;

/* The plain two-line X the Index drawer closes with */
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
  /* The opener, composed by the caller as this module's SlipSheetMark */
  trigger: React.ReactNode;
  /* The card's own modifiers and tokens, the same it wears as a hovercard */
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

/**
 * The slip on a finger: the house bottom drawer, with the same card the
 * hovercard carries on a mouse. A card anchored to a word has no room on
 * a phone, and a sheet that rises from the bottom, dims the page and
 * drags shut is the phone's own way of showing something beside the
 * thing being read.
 */
export function SlipSheet({
  children,
  className,
  style,
  title,
  trigger,
}: SlipSheetProps) {
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
      <div
        className={clsx(
          "slip slip--sheet typography code-container",
          className
        )}
        style={style}
      >
        {children}
      </div>
    </Drawer>
  );
}

/* The sheet's opener: the mark the hovercard's disclosure wears, or a
   note's numeral, as the drawer's own trigger so the drawer opens it */
export function SlipSheetMark({
  children,
  className = "slip-mark",
  ...props
}: React.ComponentProps<"button">) {
  return (
    <DrawerTrigger className={className} {...props}>
      {children}
    </DrawerTrigger>
  );
}

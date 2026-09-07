"use client";

import "./SlipSheet.css";
import Drawer, {
  DrawerTrigger,
  useDrawerContext,
} from "@/components/common/Drawer";
import clsx from "clsx";
import { useEffect, useRef } from "react";

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

interface SlipSheetFetchMarkProps extends React.ComponentProps<"button"> {
  /* The reader has asked for the sheet */
  wanted: boolean;
  /* The card is there to be shown, or has been found missing */
  arrived: boolean;
  onWant: () => void;
  onOpened: () => void;
}

/**
 * The opener for a card that has to be fetched: the sheet rises only
 * once the card has arrived, as the hovercard opens only then, so it
 * never rises empty and refills under a thumb. A tap before then is the
 * reader asking: the mark keeps the drawer's toggle back, breathes with
 * the link until the card is there, and then raises the sheet itself.
 * The drawer's store is reached through its context, since the mark is
 * rendered inside the drawer's provider.
 */
export function SlipSheetFetchMark({
  arrived,
  children,
  className = "slip-mark",
  onClick,
  onOpened,
  onWant,
  wanted,
  ...props
}: SlipSheetFetchMarkProps) {
  const drawer = useDrawerContext();
  const mark = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!wanted || !arrived || !drawer) return;
    /* Named as the opener, so closing hands focus back to the mark */
    drawer.setDisclosureElement(mark.current);
    drawer.show();
    onOpened();
  }, [wanted, arrived, drawer, onOpened]);

  return (
    <DrawerTrigger
      ref={mark}
      className={className}
      data-waiting={(wanted && !arrived) || undefined}
      onClick={(event) => {
        onClick?.(event);
        if (arrived) return;
        /* Ariakit leaves a prevented click alone, so the toggle waits */
        event.preventDefault();
        onWant();
      }}
      {...props}
    >
      {children}
    </DrawerTrigger>
  );
}

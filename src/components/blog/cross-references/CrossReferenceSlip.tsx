"use client";

import { usePreviewsEnabled } from "@/components/blog/slips/previews";
import {
  FetchedSlip,
  SlipStar,
  slipWidthFor,
} from "@/components/blog/slips/SlipCardView";
import { SlipSheet, SlipSheetMark } from "@/components/blog/slips/SlipSheet";
import { usePointerCoarse } from "@/components/blog/slips/usePointerCoarse";
import {
  prefetchSlipCard,
  useSlipCard,
} from "@/components/blog/slips/useSlipCard";
import { DialogDisclosure } from "@ariakit/react/dialog";
import {
  Hovercard,
  HovercardAnchor,
  HovercardProvider,
  useHovercardStore,
} from "@ariakit/react/hovercard";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";

interface CrossReferenceSlipProps {
  /* The key the card is served under */
  slip: string;
  /* The link's own words, the mark's name until its card is known */
  name?: string;
  /* The anchor exactly as the post authored it */
  anchor: React.ComponentProps<"a">;
  children: React.ReactNode;
}

/**
 * The cross-reference slip: the link a post wrote, unchanged, followed
 * by the mark that says a card exists, and the card itself fetched when
 * first wanted. On a mouse, hovering the link with intent asks for the
 * card and the pointer leaving lets it go; the mark is the reader's own
 * hand: a click opens the card and pins it so the pointer can leave, a
 * click on a card already open from hovering pins that one, a click on
 * a pinned card closes it, and from the keyboard Enter opens it with
 * focus inside. The link itself still navigates on every click. The
 * card opens only once its content has arrived, so it lands at its
 * final size where there is room for it and never has to be moved; the
 * mark pulses while the content is on its way. On a finger the mark
 * opens the card as a sheet and the link stays a link. A reader who has
 * turned hover previews off keeps the mark: hovering does nothing, and
 * the click still opens the card.
 */
export default function CrossReferenceSlip({
  anchor,
  children,
  name,
  slip,
}: CrossReferenceSlipProps) {
  const hoverEnabled = usePreviewsEnabled();
  const coarse = usePointerCoarse();
  const state = useSlipCard(slip);
  /* Ariakit asks to open on hover intent or on the mark; the card
     opens when it is also there to be opened */
  const [wanted, setWanted] = useState(false);
  const [pinned, setPinned] = useState(false);
  const arrived = state.status !== "idle" && state.status !== "loading";
  const store = useHovercardStore({
    placement: "bottom-start",
    showTimeout: 250,
    hideTimeout: 250,
    open: wanted && arrived,
    /* A pin lives only while the card is open: Escape and clicks away
       close through the store, and the next hover must start unpinned */
    setOpen: (open) => {
      setWanted(open);
      if (!open) setPinned(false);
    },
  });
  /* Ariakit types the final-focus ref as never null; the mark is always
     mounted by the time the card can close */
  const mark = useRef<HTMLButtonElement>(null as unknown as HTMLButtonElement);

  useEffect(() => {
    if (wanted) prefetchSlipCard(slip);
  }, [wanted, slip]);

  const href = anchor.href ?? "";
  const card = state.status === "ready" ? state.card : null;
  const label = name ?? "this link";
  const waiting = wanted && !arrived;
  /* A post card takes its shelf's hue for the head rule; a destination
     off the site takes the page's own primary */
  const shelf =
    card?.kind === "post"
      ? `var(--shelf-${card.preview.categorySlug}, var(--primary))`
      : "var(--primary)";
  const body = <FetchedSlip anchor={anchor} href={href} slip={slip} />;

  if (coarse) {
    return (
      <>
        <a {...anchor}>{children}</a>
        <SlipSheet
          title="Cross-reference"
          className="slip--cross"
          style={{ "--shelf": shelf } as React.CSSProperties}
          trigger={
            <SlipSheetMark aria-label={`Preview ${label}`}>
              <SlipStar />
            </SlipSheetMark>
          }
        >
          {body}
        </SlipSheet>
      </>
    );
  }

  /* Every placement measures the card at its natural size: the clamp the
     previous placement left on the wrapper comes off first, so a card
     that grows after it opened, a picture arriving late, is placed for
     the size it has */
  const updatePosition = ({
    updatePosition: update,
  }: {
    updatePosition: () => Promise<void>;
  }) => {
    const wrapper = store.getState().popoverElement?.parentElement;
    if (wrapper) {
      wrapper.style.maxHeight = "";
      wrapper.style.maxWidth = "";
    }
    return update();
  };

  const onMarkClick = () => {
    const { open, contentElement } = store.getState();
    if (pinned) {
      store.hide();
      return;
    }
    setPinned(true);
    if (open) {
      contentElement?.focus();
      return;
    }
    /* Opened from the mark, the card takes focus, so the keyboard lands
       inside it; opened from hover it stays where it is */
    store.setAutoFocusOnShow(true);
    setWanted(true);
  };

  return (
    <HovercardProvider store={store}>
      <HovercardAnchor
        className="cross-reference"
        showOnHover={hoverEnabled}
        onMouseEnter={() => {
          if (hoverEnabled) prefetchSlipCard(slip);
        }}
        /* A hover that leaves before the card arrives is withdrawn, or the
           card would open unbidden over a reader who has moved on; a pin
           is the reader's own request and stays */
        onMouseLeave={() => {
          if (!arrived && !pinned) setWanted(false);
        }}
        /* Ariakit clones this element with the anchor's children, so the
           served link carries the post's own words */
        // eslint-disable-next-line jsx-a11y/anchor-has-content
        render={<a {...anchor} />}
      >
        {children}
      </HovercardAnchor>
      {/* The mark opens and pins by its own rules above, never by the
          disclosure's toggle; it still registers as the card's disclosure
          so Ariakit names it and returns focus to it */}
      <DialogDisclosure
        ref={mark}
        store={store}
        className="slip-mark"
        aria-haspopup="dialog"
        data-waiting={waiting || undefined}
        data-pinned={pinned || undefined}
        toggleOnClick={false}
        onMouseEnter={() => prefetchSlipCard(slip)}
        onFocus={() => prefetchSlipCard(slip)}
        onClick={onMarkClick}
      >
        <SlipStar />
        <span className="sr-only">Preview {label}</span>
      </DialogDisclosure>
      {/* The card is a piece of the article rendered through a Portal, so
          it carries the article's scope classes and keeps the article's
          link, chip and emphasis dress without restating a rule.
          fixed: placed against the viewport, so a card near the foot of
          the page never lengthens the document and the page never jumps
          when it closes. fitViewport: sized to the room on the side it
          lands on, and scrolling inside itself past that. finalFocus:
          Escape puts focus back on the mark that opened the card. */}
      <Hovercard
        store={store}
        portal
        fixed
        unmountOnHide
        fitViewport
        updatePosition={updatePosition}
        finalFocus={mark}
        gutter={8}
        overflowPadding={12}
        hideOnHoverOutside={!pinned}
        className={clsx(
          "slip slip--cross typography code-container",
          slipWidthFor(card)
        )}
        aria-label={`Cross-reference: ${label}`}
        style={{ "--shelf": shelf } as React.CSSProperties}
      >
        {body}
      </Hovercard>
    </HovercardProvider>
  );
}

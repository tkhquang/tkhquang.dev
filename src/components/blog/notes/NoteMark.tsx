"use client";

import { SlipControls } from "@/components/blog/slips/SlipControls";
import { SlipSheet } from "@/components/blog/slips/SlipSheet";
import { usePointerCoarse } from "@/components/blog/slips/usePointerCoarse";
import { useSlipDrag } from "@/components/blog/slips/useSlipDrag";
import { DrawerTrigger } from "@/components/common/Drawer";
import {
  Hovercard,
  HovercardAnchor,
  HovercardProvider,
  useHovercardStore,
} from "@ariakit/react/hovercard";
import { useStoreState } from "@ariakit/react/store";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

interface NoteMarkProps {
  /* The numeral remark assigned in order of first reference */
  number: string;
  /* The mark's own id, which the plate's back-reference arrow jumps to */
  id: string;
  /* The id of the note's row in the plate at the foot of the article */
  note: string;
  /* The note itself, a copy of the row's content */
  children: React.ReactNode;
}

/**
 * The numeral in the running text that opens its note in a slip.
 *
 * The slip has three states, because a reader arrives with three
 * different intents:
 *
 * - hovered: the slip closes when the pointer leaves.
 * - held: a click keeps the slip while the pointer goes elsewhere. A
 *   click on the page still closes it.
 * - pinned: only the pin control or a drag sets this. A click on the
 *   page leaves the slip standing. Escape unpins before it closes.
 *
 * The server sends a link to the plate. The first client render must
 * match the server, and a page without script still needs a target.
 * After hydration the mark becomes the button it behaves as.
 *
 * A coarse pointer gets a sheet instead, because a card anchored to a
 * word has no room on a phone.
 */
export default function NoteMark({
  children,
  id,
  note,
  number,
}: NoteMarkProps) {
  const coarse = usePointerCoarse();
  const [pinned, setPinned] = useState(false);
  /* A held slip ignores the pointer leaving. Unlike a pinned one, it
     still closes on a click elsewhere. */
  const [held, setHeld] = useState(false);
  /* After a click closes the slip the pointer still rests on the mark.
     Block hover until it leaves, or the next movement reopens the slip. */
  const holdHover = useRef(false);
  /* Whether the open slip has had its one placement */
  const placed = useRef(false);
  const store = useHovercardStore({
    placement: "bottom-start",
    showTimeout: 150,
    hideTimeout: 250,
    /* Escape and the close control go through the store, not through
       this component. Reset here, or the next hover starts pinned. */
    setOpen: (open) => {
      if (!open) {
        setPinned(false);
        setHeld(false);
        placed.current = false;
      }
    },
  });
  const open = useStoreState(store, "open");
  const slip = useStoreState(store, "contentElement");
  const interactive = useSyncExternalStore(
    subscribe,
    clientSnapshot,
    serverSnapshot
  );

  const label = (
    <>
      <span aria-hidden>{number}</span>
      <span className="sr-only">Note {number}</span>
    </>
  );
  /* A drag means the reader wants to keep the note. */
  const drag = useSlipDrag(store, () => setPinned(true));

  /* The store outlives the branch. Close it, or a pinned slip reopens by
     itself when the pointer turns fine again. */
  const floating = interactive && !coarse;
  useEffect(() => {
    if (!floating) store.hide();
  }, [floating, store]);

  if (!interactive) {
    return (
      <a href={`#${note}`} id={id} className="note-mark">
        {label}
      </a>
    );
  }

  if (coarse) {
    return (
      <SlipSheet
        title={`Note ${number}`}
        trigger={
          <DrawerTrigger id={id} className="note-mark">
            {label}
          </DrawerTrigger>
        }
      >
        <div className="slip__body">{children}</div>
      </SlipSheet>
    );
  }

  /* Place the slip once. Ariakit re-anchors on every scroll, which drags
     a pinned note off the screen with the page.

     The open test is not redundant. A closing slip stays mounted while it
     fades, and the position watcher keeps running. A scroll in that
     window spends the one placement on a dying card, and the next open
     then lands in the corner of the viewport. */
  const updatePosition = async ({
    updatePosition: update,
  }: {
    updatePosition: () => Promise<void>;
  }) => {
    if (placed.current || !store.getState().open) return;
    await update();
    placed.current = true;
  };

  /* The numeral never pins. A click on a hovered slip holds it, because
     the reader clicked to keep reading, not to dismiss. */
  const toggle = () => {
    if (store.getState().open && (held || pinned)) {
      holdHover.current = true;
      store.hide();
      return;
    }
    setHeld(true);
    store.show();
  };

  return (
    <HovercardProvider store={store}>
      <HovercardAnchor
        id={id}
        className="note-mark"
        showOnHover={() => !holdHover.current}
        onMouseLeave={() => {
          holdHover.current = false;
        }}
        render={
          <button
            type="button"
            aria-expanded={open}
            aria-haspopup="dialog"
            /* The slip exists only while open. */
            aria-controls={open ? slip?.id : undefined}
            onClick={toggle}
          />
        }
      >
        {label}
      </HovercardAnchor>
      {/* The Portal takes the note out of the article, so repeat the
          scope classes or the text loses its dress. fixed keeps the card
          out of the document flow: in flow, a card near the foot of the
          page lengthens the document and the page jumps on close. */}
      <Hovercard
        store={store}
        portal
        fixed
        unmountOnHide
        fitViewport
        updatePosition={updatePosition}
        gutter={8}
        overflowPadding={12}
        /* Only an untouched slip follows the pointer. */
        hideOnHoverOutside={!pinned && !held}
        /* A pinned note answers to the reader alone. */
        hideOnInteractOutside={!pinned}
        hideOnEscape={() => {
          if (!pinned) return true;
          setPinned(false);
          return false;
        }}
        className="slip typography code-container"
        aria-label={`Note ${number}`}
      >
        {/* One element, so the whole strip drags. A reader aims at the
            bar, not at the words printed on it. */}
        <div className="slip__bar" {...drag()}>
          <span className="kicker slip__kicker">Note {number}</span>
          <SlipControls
            pinned={pinned}
            onTogglePin={() => setPinned(!pinned)}
            onClose={() => store.hide()}
          />
        </div>
        <div className="slip__body">{children}</div>
      </Hovercard>
    </HovercardProvider>
  );
}

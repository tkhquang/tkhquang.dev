"use client";

import { SlipControls } from "@/components/blog/slips/SlipControls";
import { SlipSheet, SlipSheetMark } from "@/components/blog/slips/SlipSheet";
import { usePointerCoarse } from "@/components/blog/slips/usePointerCoarse";
import { useSlipDrag } from "@/components/blog/slips/useSlipDrag";
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
 * A note mark: the gilt numeral in the running text that opens its note
 * in a slip. Hovering with intent opens the slip and the pointer leaving
 * lets it go; a click holds it, so the pointer can leave, until a click
 * elsewhere, a second click on the numeral, or Escape takes it down. The
 * pin in the slip's corner, or a drag by its head, is what pins it, and
 * a pinned slip keeps through clicks elsewhere until its close, the
 * numeral, or Escape twice, once to unpin and once to close. The mark is a
 * plain jump link to the plate in the document as served, because the
 * first client render has to match the server's and a document without
 * scripts still needs somewhere to go; once hydrated it re-renders as
 * the button it behaves as. On a finger the numeral opens the note as
 * a sheet. The note is the author's own text, already on the page, so
 * the reader's switch over link previews has no say here.
 */
export default function NoteMark({
  children,
  id,
  note,
  number,
}: NoteMarkProps) {
  const coarse = usePointerCoarse();
  const [pinned, setPinned] = useState(false);
  /* Whether the numeral has taken the slip in hand: a held slip stops
     following the pointer, as a pinned one does, but a click elsewhere
     still takes it down */
  const [held, setHeld] = useState(false);
  /* A second click closes the slip while the pointer still rests on the
     mark, and the next pixel of movement would open it again; hover
     stays off until the pointer has left */
  const holdHover = useRef(false);
  /* Whether the open slip has had its one placement */
  const placed = useRef(false);
  const store = useHovercardStore({
    placement: "bottom-start",
    showTimeout: 150,
    hideTimeout: 250,
    /* A pin and a placement live only while the slip is open: Escape and
       the close control close through the store, and the next hover must
       start unpinned and be placed afresh */
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
  /* A note the reader drags is a note they mean to keep */
  const drag = useSlipDrag(store, () => setPinned(true));

  /* Leaving the hovercard branch (the pointer turning coarse) unmounts
     the slip but not its store, and an open, pinned store would reopen
     the slip unbidden when the branch returns */
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
          <SlipSheetMark id={id} className="note-mark">
            {label}
          </SlipSheetMark>
        }
      >
        <div className="slip__body">{children}</div>
      </SlipSheet>
    );
  }

  /* Placed once and then left where the reader saw it, as gwern's popups
     are: Ariakit would re-anchor the slip to its numeral on every scroll,
     which drags a pinned note off the screen with the page */
  const updatePosition = async ({
    updatePosition: update,
  }: {
    updatePosition: () => Promise<void>;
  }) => {
    if (placed.current) return;
    await update();
    placed.current = true;
  };

  /* The numeral opens the slip and takes it down again; pinning is left
     to the slip's own controls. A slip open from hovering is caught on
     the first click rather than closed, since the reader clicked to keep
     reading it */
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
            /* The slip only exists while open, so there is nothing to
               point at before then */
            aria-controls={open ? slip?.id : undefined}
            onClick={toggle}
          />
        }
      >
        {label}
      </HovercardAnchor>
      {/* The note is a piece of the article rendered through a Portal, so
          the slip carries the article's scope classes and its text keeps
          the article's link, chip and emphasis dress. fixed: placed
          against the viewport, so a note opened near the foot of the
          page never lengthens the document and the page never jumps
          when the slip closes. */}
      <Hovercard
        store={store}
        portal
        fixed
        unmountOnHide
        fitViewport
        updatePosition={updatePosition}
        gutter={8}
        overflowPadding={12}
        /* Hovering away closes a note the reader has not taken in hand */
        hideOnHoverOutside={!pinned && !held}
        /* A pinned note is the reader's: a click elsewhere leaves it, and
           Escape releases the pin before it closes the note */
        hideOnInteractOutside={!pinned}
        hideOnEscape={() => {
          if (!pinned) return true;
          setPinned(false);
          return false;
        }}
        className="slip slip--note typography code-container"
        aria-label={`Note ${number}`}
        /* The drag reads the kicker line as its handle */
        {...drag()}
      >
        <SlipControls
          pinned={pinned}
          onTogglePin={() => setPinned(!pinned)}
          onClose={() => store.hide()}
        />
        <span className="kicker slip__kicker">Note {number}</span>
        <div className="slip__body">{children}</div>
      </Hovercard>
    </HovercardProvider>
  );
}

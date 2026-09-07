"use client";

import { SlipSheet, SlipSheetMark } from "@/components/blog/slips/SlipSheet";
import { usePointerCoarse } from "@/components/blog/slips/usePointerCoarse";
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
 * in a slip. Hovering with intent opens the slip, a click pins it so the
 * pointer can leave, Escape or a click away closes it. The mark is a
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
  /* A second click closes the slip while the pointer still rests on the
     mark, and the next pixel of movement would open it again; hover
     stays off until the pointer has left */
  const holdHover = useRef(false);
  const store = useHovercardStore({
    placement: "bottom-start",
    showTimeout: 150,
    hideTimeout: 250,
    /* A pin lives only while the slip is open: Escape and clicks away
       close through the store, and the next hover must start unpinned */
    setOpen: (open) => {
      if (!open) setPinned(false);
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

  const toggle = () => {
    if (pinned) {
      setPinned(false);
      holdHover.current = true;
      store.hide();
    } else {
      setPinned(true);
      store.show();
    }
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
        gutter={8}
        overflowPadding={12}
        hideOnHoverOutside={!pinned}
        className="slip slip--note typography code-container"
        aria-label={`Note ${number}`}
      >
        <span className="kicker slip__kicker">Note {number}</span>
        <div className="slip__body">{children}</div>
      </Hovercard>
    </HovercardProvider>
  );
}

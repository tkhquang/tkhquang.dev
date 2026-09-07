"use client";

import type { HovercardStore } from "@ariakit/react/hovercard";
import { useDrag } from "@use-gesture/react";

/* The card keeps at least this much of itself on screen, so a card
   dragged to an edge can always be dragged back */
const EDGE = 24;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/**
 * Dragging a card by its grip, as gwern's popups drag by their title
 * bar: the card goes where the pointer takes it, within the viewport,
 * and pins as it goes, since a card the reader has placed by hand is
 * one they mean to keep. Ariakit places the wrapper with a translate
 * against the viewport, so the drag rewrites that translate from the
 * wrapper's own rect at the first move; the one placement the card
 * had is over by then and nothing puts it back.
 */
export function useSlipDrag(store: HovercardStore, onDragStart: () => void) {
  return useDrag(
    ({ first, movement: [mx, my], memo }) => {
      /* Ariakit's popoverElement is the positioned wrapper itself; the
         card is its contentElement */
      const wrapper = store.getState().popoverElement;
      if (!wrapper) return memo;
      if (first) {
        onDragStart();
        const rect = wrapper.getBoundingClientRect();
        memo = { x: rect.left, y: rect.top, w: rect.width, h: rect.height };
      }
      const x = clamp(memo.x + mx, EDGE - memo.w, window.innerWidth - EDGE);
      const y = clamp(memo.y + my, 0, window.innerHeight - EDGE);
      wrapper.style.transform = `translate3d(${x}px,${y}px,0)`;
      return memo;
    },
    /* A press without movement is a click on the grip, not a drag */
    { filterTaps: true, threshold: 3 }
  );
}

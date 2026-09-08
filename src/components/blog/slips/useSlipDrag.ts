"use client";

import type { HovercardStore } from "@ariakit/react/hovercard";
import { useDrag } from "@use-gesture/react";

/* How much of the card stays on screen, so the reader can always drag
   it back from an edge. */
const EDGE = 24;

/* A press that starts on a button is a click of that button, however
   far the hand then travels. */
const NOT_A_HANDLE = "button, a";

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/**
 * Drags the card by its title bar, inside the viewport, and pins it. A
 * card the reader places by hand is one they mean to keep.
 *
 * Bind this on the bar, not on the card. On the card, the gesture would
 * refuse the browser's own panning, which the card body needs to scroll.
 *
 * Ariakit positions the wrapper with a translate. Read the wrapper's rect
 * and rewrite that translate: the card had its one placement already, and
 * nothing restores it.
 */
export function useSlipDrag(store: HovercardStore, onDragStart: () => void) {
  return useDrag(
    ({ first, cancel, event, movement: [mx, my], memo }) => {
      if (first && (event.target as Element | null)?.closest(NOT_A_HANDLE)) {
        cancel();
        return memo;
      }
      /* popoverElement is the positioned wrapper. The card itself is
         contentElement, and moving that would fight the wrapper. */
      const wrapper = store.getState().popoverElement;
      if (!wrapper) return memo;
      if (first) {
        onDragStart();
        const rect = wrapper.getBoundingClientRect();
        memo = { x: rect.left, y: rect.top, w: rect.width, h: rect.height };
      }
      if (!memo) return memo;
      const x = clamp(memo.x + mx, EDGE - memo.w, window.innerWidth - EDGE);
      const y = clamp(memo.y + my, 0, window.innerHeight - EDGE);
      wrapper.style.transform = `translate3d(${x}px,${y}px,0)`;
      return memo;
    },
    /* A press without movement is a click, not a drag. */
    { filterTaps: true, threshold: 3 }
  );
}

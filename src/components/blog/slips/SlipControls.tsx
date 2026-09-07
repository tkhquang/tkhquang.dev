"use client";

import type { useSlipDrag } from "./useSlipDrag";

interface SlipControlsProps {
  pinned: boolean;
  onTogglePin: () => void;
  onClose: () => void;
  /* The grip's pointer handlers, as useSlipDrag binds them */
  dragHandle: ReturnType<ReturnType<typeof useSlipDrag>>;
}

/**
 * The card's corner controls, gwern's popup title bar brought down to
 * three glyphs. The grip: drags the card anywhere on screen, and pins
 * it as it goes. The pin: pressed, the card stays open when the pointer
 * leaves and when the page is clicked elsewhere; pressed again, the
 * card goes back to following the pointer. The close: takes the card
 * down whatever its state, which a pinned card otherwise never does on
 * its own. The star and the note numeral pin too, but a control inside
 * the card is the one a reader can see.
 */
export function SlipControls({
  dragHandle,
  onClose,
  onTogglePin,
  pinned,
}: SlipControlsProps) {
  return (
    <span className="slip__controls">
      {/* A pointer affordance only: the keyboard has nowhere to drag to,
          so the grip stays out of the tab order */}
      <span className="slip__grip" title="Drag" aria-hidden {...dragHandle}>
        <svg viewBox="0 0 16 16" width="12" height="12">
          <g fill="currentColor">
            <circle cx="5.5" cy="4" r="1.3" />
            <circle cx="10.5" cy="4" r="1.3" />
            <circle cx="5.5" cy="8" r="1.3" />
            <circle cx="10.5" cy="8" r="1.3" />
            <circle cx="5.5" cy="12" r="1.3" />
            <circle cx="10.5" cy="12" r="1.3" />
          </g>
        </svg>
      </span>
      <button
        type="button"
        className="slip__pin"
        aria-pressed={pinned}
        aria-label={pinned ? "Unpin the card" : "Pin the card"}
        title={pinned ? "Unpin" : "Pin"}
        onClick={onTogglePin}
      >
        <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden>
          {/* A drawing pin: head, shoulder and point, upright when
              pressed and leaning when free, drawn that way rather than
              turned on the way */}
          <g
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            transform={pinned ? undefined : "rotate(35 8 8)"}
          >
            <path d="M5.5 2.5h5M6.5 2.5v4.2L4.5 9.2h7L9.5 6.7V2.5" />
            <path d="M8 9.2v4.3" />
          </g>
        </svg>
      </button>
      {pinned && (
        <button
          type="button"
          className="slip__close"
          aria-label="Close the card"
          title="Close"
          onClick={onClose}
        >
          <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden>
            <path
              d="M4 4l8 8M12 4l-8 8"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </span>
  );
}

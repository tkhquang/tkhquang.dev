"use client";

interface SlipControlsProps {
  pinned: boolean;
  onTogglePin: () => void;
  onClose: () => void;
}

/**
 * The card's corner controls, in three glyphs:
 *
 * - grip: shows that the head row drags the card. Not a button.
 * - pin: keeps the card open when the pointer leaves and when the reader
 *   clicks the page.
 * - close: shown only while pinned, because a pinned card has no other
 *   way to go.
 *
 * Only the pin and a drag pin the card. A click on the numeral opens it
 * and nothing more.
 */
export function SlipControls({
  onClose,
  onTogglePin,
  pinned,
}: SlipControlsProps) {
  return (
    <span className="slip__controls">
      {/* The drag is bound on the head row, and a keyboard cannot drag.
          Keep the grip out of the tab order. */}
      <span className="slip__grip" title="Drag" aria-hidden>
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
      {/* aria-pressed carries the state. A name that flips to "Unpin" is
          read out beside "pressed", and the two contradict each other. */}
      <button
        type="button"
        className="slip__pin"
        aria-pressed={pinned}
        aria-label="Pin the card"
        title={pinned ? "Unpin" : "Pin"}
        onClick={onTogglePin}
      >
        <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden>
          {/* Two drawn poses, not a rotation: nothing on this site moves
              under the pointer. */}
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

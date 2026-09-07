import "./Drawer.css";
import useForkRef from "@/hooks/useForkRef";
import { prefersReducedMotion } from "@/utils/dom";
import {
  Dialog,
  DialogProvider,
  DialogDisclosure,
  DialogDescription,
  useDialogStore,
  DialogHeading,
  DialogDismiss,
  useDialogContext,
} from "@ariakit/react/dialog";
import { Portal } from "@ariakit/react/portal";
import { useStoreState } from "@ariakit/react/store";
import { useDrag } from "@use-gesture/react";
import clsx from "clsx";
import {
  createContext,
  useContext,
  useRef,
  useEffect,
  useCallback,
  useState,
  forwardRef,
} from "react";
import { IoIosCloseCircleOutline } from "react-icons/io";

/**
 * Custom backdrop component that implements Ariakit's "open for extension" pattern.
 * This component properly forwards refs, chains event handlers, and merges props
 * to work seamlessly with Ariakit's dialog system while adding custom functionality.
 */
const DrawerBackdrop = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    onBackdropClick?: (e: React.MouseEvent | React.KeyboardEvent) => void;
  }
>(function DrawerBackdrop(
  { onBackdropClick, onClick, onKeyDown, className, style, ...props },
  forwardedRef
) {
  const internalRef = useRef<HTMLDivElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Chain Ariakit's onClick handler with our custom handler
    onClick?.(e);
    onBackdropClick?.(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Support Escape key for accessibility (standard dialog UX pattern)
    if (e.key === "Escape") {
      onBackdropClick?.(e);
    }
    // Chain any existing keyDown handler from Ariakit
    onKeyDown?.(e);
  };

  return (
    <div
      role="button"
      tabIndex={-1}
      aria-label="Close drawer"
      {...props} // Spread all Ariakit props first
      ref={useForkRef(internalRef, forwardedRef)} // Merge refs properly
      className={clsx("drawer__backdrop", className)} // Merge class names
      style={{ ...style }} // Merge styles
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    />
  );
});

export type DrawerPosition = "top" | "right" | "bottom" | "left";

/**
 * Whether the drawer has finished sliding in: false while it moves and
 * from the moment it starts out, undefined outside a drawer. Content
 * that is heavy to move, a live page in a frame, waits for it: sliding
 * a box with a loading iframe inside stutters, and on Firefox for
 * Android badly enough to look blocked.
 */
const DrawerSettledContext = createContext<boolean | undefined>(undefined);
export const useDrawerSettled = () => useContext(DrawerSettledContext);

/* The two power2 curves the drawer used to tween with, as the
   cubic-beziers the platform takes */
const EASE_OUT = "cubic-bezier(0.33, 1, 0.68, 1)";
const EASE_IN = "cubic-bezier(0.32, 0, 0.67, 0)";

/**
 * One leg of the slide, as a Web Animation. Gecko samples transform and
 * opacity off the main thread only when the animation is declarative,
 * so a tween that writes an inline style every frame runs at the mercy
 * of whatever else the page is doing, and on Firefox for Android that
 * reads as a stutter or a stall rather than a slide. The single
 * keyframe is the destination alone, so the animation starts from
 * wherever the element already is: that is what lets a close asked for
 * mid-slide carry on from the position on screen.
 */
const play = (
  element: HTMLElement,
  keyframes: Keyframe[],
  duration: number,
  easing: string,
  delay = 0
) => element.animate(keyframes, { duration, easing, delay, fill: "both" });

/**
 * Ends the animations in flight where they stand: each one's current
 * value becomes the element's own, so the next animation starts from it
 * and the drag can write the transform itself. Cancelling without
 * committing would snap the drawer back to where the slide began.
 */
const settle = (animations: Animation[]) => {
  for (const animation of animations) {
    try {
      animation.commitStyles();
    } catch {
      /* An element already out of the document has nothing to commit */
    }
    animation.cancel();
  }
};

/**
 * The disclosure button for a Drawer, passed through its `trigger` prop so
 * composition happens at the call site while ariakit stays inside this
 * module. `portal` floats the button through a Portal so a fixed-position
 * opener is placed against the viewport, not against an ancestor whose
 * transform or filter would become its containing block: the WHOLE button
 * ports, never just its icon, so the visible control is always the
 * focusable one.
 */
export const DrawerTrigger = ({
  portal = false,
  children,
  ...props
}: React.ComponentProps<"button"> & { portal?: boolean }) => {
  const button = <DialogDisclosure {...props}>{children}</DialogDisclosure>;
  return portal ? <Portal>{button}</Portal> : button;
};

interface DrawerProps extends React.ComponentProps<"div"> {
  /** Position of the drawer relative to the viewport */
  position?: DrawerPosition;
  /** Size of the drawer in pixels (width for left/right, height for top/bottom) */
  size?: number;
  /** Content to render inside the drawer body */
  children?: React.ReactNode;
  /** Title displayed in the drawer header */
  title?: string;
  /** Optional description displayed below the title */
  description?: string;
  /** The glyph inside the dismiss button. The circled X unless a drawer
      brings its own; the button and its behaviour stay here. */
  dismissIcon?: React.ReactNode;
  /** The dismiss button's accessible name. Ariakit names only its own
      default glyph, so any custom child would leave the button nameless. */
  dismissLabel?: string;
  /** The opener, composed at the call site as the DrawerTrigger exported
      from this module, carrying its own classes, label, and portal flag;
      rendered inside this drawer's provider so no trigger styling ever
      drills through the Drawer's own props. Required: the store is
      internal, so a Drawer without a trigger can never be opened. */
  trigger: React.ReactNode;
}

/**
 * Drawer component with smooth GSAP animations and gesture support.
 *
 * Features:
 * - Supports all 4 directions (top, right, bottom, left)
 * - Smooth GSAP enter/exit animations
 * - Drag-to-close gesture support with velocity detection
 * - Fully accessible with keyboard support
 * - Proper Ariakit integration with alwaysVisible for animations
 * - Mobile-optimized with viewport height awareness
 */
export default function Drawer({
  position = "right",
  size = 320,
  children,
  title = "Drawer",
  description,
  dismissIcon = <IoIosCloseCircleOutline className="size-8" />,
  dismissLabel = "Close drawer",
  trigger,
  style,
  className,
  ...rest
}: DrawerProps) {
  const dialog = useDialogStore();
  const mounted = useStoreState(dialog, "mounted");
  const open = useStoreState(dialog, "open");

  const drawerRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const isAnimatingRef = useRef(false);
  /* The slide in flight, so the next one takes over from wherever it is
     instead of waiting for it or being dropped */
  const runningRef = useRef<Animation[]>([]);
  const [settled, setSettled] = useState(false);

  /**
   * Local state to control DOM presence during animations.
   * This prevents premature unmounting during exit animations,
   * similar to how Framer Motion's AnimatePresence works.
   */
  const [shouldRender, setShouldRender] = useState(false);

  /**
   * Calculate transform values for open/closed states based on drawer position.
   * The drawer slides in from the edge it's positioned on.
   */
  const getTransformValues = useCallback(
    (position: DrawerPosition, size: number) => {
      switch (position) {
        case "top":
          return { closed: `translateY(-${size}px)`, open: "translateY(0px)" };
        case "bottom":
          return { closed: `translateY(${size}px)`, open: "translateY(0px)" };
        case "left":
          return { closed: `translateX(-${size}px)`, open: "translateX(0px)" };
        case "right":
        default:
          return { closed: `translateX(${size}px)`, open: "translateX(0px)" };
      }
    },
    []
  );

  /**
   * Get drag configuration based on drawer position.
   * Determines which axis to track, threshold for closing, and movement direction.
   */
  const getDragConfig = useCallback((position: DrawerPosition) => {
    switch (position) {
      case "top":
        return { axis: "y", threshold: -50, direction: -1 };
      case "bottom":
        return { axis: "y", threshold: 50, direction: 1 };
      case "left":
        return { axis: "x", threshold: -50, direction: -1 };
      case "right":
      default:
        return { axis: "x", threshold: 50, direction: 1 };
    }
  }, []);

  /**
   * Handle backdrop clicks and Escape key presses.
   * Since we're using a custom backdrop component, we need to manually
   * trigger the dialog state change when the backdrop is interacted with.
   */
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent | React.KeyboardEvent) => {
      if (e.target === e.currentTarget) {
        dialog.hide();
      }
    },
    [dialog]
  );

  /**
   * Animate drawer entrance with staggered backdrop and content animations.
   * Sets initial closed state, then animates to open state with smooth easing.
   */
  const animateIn = useCallback(() => {
    const content = drawerRef.current;
    if (!content) return;

    settle(runningRef.current);
    runningRef.current = [];
    isAnimatingRef.current = true;
    setSettled(false);
    const transforms = getTransformValues(position, size);
    const backdrop = backdropRef.current;
    content.style.visibility = "visible";

    /* Reduced motion: appear in place, no slide */
    if (prefersReducedMotion()) {
      content.style.transform = transforms.open;
      if (backdrop) backdrop.style.opacity = "1";
      isAnimatingRef.current = false;
      setSettled(true);
      return;
    }

    // Set initial closed state
    content.style.transform = transforms.closed;
    if (backdrop) backdrop.style.opacity = "0";

    // Fade in the backdrop first, the content sliding in over its tail
    const animations = [
      ...(backdrop ? [play(backdrop, [{ opacity: 1 }], 200, EASE_OUT)] : []),
      play(
        content,
        [{ transform: transforms.open }],
        300,
        EASE_OUT,
        backdrop ? 100 : 0
      ),
    ];
    runningRef.current = animations;
    Promise.all(animations.map((animation) => animation.finished))
      .then(() => {
        settle(animations);
        runningRef.current = [];
        isAnimatingRef.current = false;
        setSettled(true);
      })
      /* A slide cut short by the next one rejects here and leaves the
         state to whichever animation took over */
      .catch(() => {});
  }, [position, size, getTransformValues]);

  /**
   * Animate drawer exit with content sliding out and backdrop fading.
   * On completion, triggers component unmounting via setShouldRender(false).
   */
  const animateOut = useCallback(() => {
    const content = drawerRef.current;
    if (!content) return;

    /* A close asked for mid-slide takes over from wherever the slide
       is. Waiting for the slide to finish first is what left the sheet
       standing open with nothing left to close it: the open state had
       already flipped, so no later tap on the backdrop, the dismiss or
       Escape had anything to change. */
    settle(runningRef.current);
    runningRef.current = [];
    isAnimatingRef.current = true;
    setSettled(false);
    const transforms = getTransformValues(position, size);
    const backdrop = backdropRef.current;

    /* Reduced motion: leave in place, no slide */
    if (prefersReducedMotion()) {
      content.style.transform = transforms.closed;
      if (backdrop) backdrop.style.opacity = "0";
      isAnimatingRef.current = false;
      setShouldRender(false);
      return;
    }

    // Slide the content out, the backdrop fading over its tail
    const animations = [
      play(content, [{ transform: transforms.closed }], 250, EASE_IN),
      ...(backdrop
        ? [play(backdrop, [{ opacity: 0 }], 150, EASE_IN, 150)]
        : []),
    ];
    runningRef.current = animations;
    Promise.all(animations.map((animation) => animation.finished))
      .then(() => {
        runningRef.current = [];
        isAnimatingRef.current = false;
        setShouldRender(false); // Unmount after animation completes
      })
      /* A close cut short by a reopen rejects here and leaves the
         drawer mounted, which is what the reopen needs */
      .catch(() => {});
  }, [position, size, getTransformValues]);

  /**
   * Animation lifecycle management based on Ariakit dialog states.
   *
   * Flow:
   * 1. Dialog opens (mounted=true, open=true) → Show component and animate in
   * 2. Dialog closes (open=false) → Animate out while keeping rendered
   * 3. Animation completes → Hide component (shouldRender=false)
   */
  useEffect(() => {
    if (mounted && open && !shouldRender) {
      // Show component and trigger entrance animation
      // The extra render pass is deliberate: the Dialog subtree exists only
      // while shouldRender is true, so it has to be committed before the double
      // RAF below can hand animateIn a mounted node, and it has to stay
      // committed after open flips back to false so animateOut can play against
      // a live node and unmount it from its own onComplete. Deriving this
      // during render cannot express that second half.
      setShouldRender(true);

      // Use RAF to ensure DOM is ready before animating
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          /* A close asked for inside these two frames has already played
             out below; a slide in now would stand the drawer back up */
          if (dialog.getState().open) animateIn();
        });
      });
    } else if (!open && shouldRender) {
      // Trigger exit animation (component stays rendered until animation completes)
      animateOut();
    }
  }, [mounted, open, shouldRender, animateIn, animateOut, dialog]);

  // Configure gesture handling based on drawer position
  const dragConfig = getDragConfig(position);

  /**
   * Gesture handler for drag-to-close functionality.
   *
   * Features:
   * - Only allows dragging in the closing direction
   * - Real-time backdrop opacity feedback based on drag progress
   * - Velocity-based close detection for natural feel
   * - Smooth snap-back animation if drag is canceled
   */
  const bind = useDrag(
    ({ active, movement, velocity, direction, canceled }) => {
      if (canceled || isAnimatingRef.current || !drawerRef.current) return;

      const [mx, my] = movement;
      const currentMovement = dragConfig.axis === "x" ? mx : my;
      const currentVelocity =
        dragConfig.axis === "x" ? velocity[0] : velocity[1];
      const currentDirection =
        dragConfig.axis === "x" ? direction[0] : direction[1];

      if (active) {
        // Only allow movement in the closing direction (prevents opening further)
        if (currentMovement * dragConfig.direction > 0) {
          const progress = Math.min(
            Math.abs(currentMovement) / (size * 0.5),
            1
          );

          /* Written straight to the element, in the same units the
             slides use: a tweening library keeps its own idea of the
             transform, which the committed end of a slide would leave
             stale, and the drag would start with a jump */
          drawerRef.current.style.transform =
            dragConfig.axis === "x"
              ? `translateX(${currentMovement}px)`
              : `translateY(${currentMovement}px)`;

          // Fade backdrop based on drag progress for visual feedback
          if (backdropRef.current) {
            backdropRef.current.style.opacity = String(1 - progress * 0.5);
          }
        }
      } else {
        // Drag released - decide whether to close or snap back
        const shouldClose =
          Math.abs(currentMovement) > Math.abs(dragConfig.threshold) ||
          (Math.abs(currentVelocity) > 0.5 &&
            currentDirection === dragConfig.direction);

        if (shouldClose) {
          dialog.hide(); // Trigger close via Ariakit state
        } else {
          // Snap back to open position with smooth animation
          const transforms = getTransformValues(position, size);
          const animations = [
            play(
              drawerRef.current,
              [{ transform: transforms.open }],
              200,
              EASE_OUT
            ),
            ...(backdropRef.current
              ? [play(backdropRef.current, [{ opacity: 1 }], 200, EASE_OUT)]
              : []),
          ];
          runningRef.current = animations;
          Promise.all(animations.map((animation) => animation.finished))
            .then(() => {
              settle(animations);
              runningRef.current = [];
            })
            .catch(() => {});
        }
      }
    },
    {
      axis: dragConfig.axis as "x" | "y",
      filterTaps: true, // Prevent accidental drags from taps
      threshold: 10, // Minimum movement to start drag
    }
  );

  return (
    <DialogProvider store={dialog}>
      {trigger}

      {shouldRender && (
        <DrawerSettledContext.Provider value={settled}>
          <Dialog
            store={dialog}
            alwaysVisible // Keep in DOM during animations
            className={clsx(`drawer drawer--${position}`, className)}
            backdrop={
              <DrawerBackdrop
                ref={backdropRef}
                onBackdropClick={handleBackdropClick}
              />
            }
            style={{
              ["--drawer-size" as string]: `${size}px`,
              ...style,
            }}
            {...rest}
          >
            <div
              ref={drawerRef}
              className="drawer__content"
              {...bind()} // Attach gesture handlers
              style={{
                [position === "top" || position === "bottom"
                  ? "height"
                  : "width"]: size,
              }}
            >
              <div className="drawer__header">
                <DialogHeading className="drawer__title">{title}</DialogHeading>
                <DialogDismiss
                  aria-label={dismissLabel}
                  className="size-8 cursor-pointer transition-all duration-300 hover:opacity-75 focus:outline-hidden"
                >
                  {dismissIcon}
                </DialogDismiss>
              </div>

              {description && (
                <DialogDescription className="drawer__description">
                  {description}
                </DialogDescription>
              )}

              <div className="drawer__body">{children}</div>
            </div>
          </Dialog>
        </DrawerSettledContext.Provider>
      )}
    </DialogProvider>
  );
}

export { useDialogContext as useDrawerContext };

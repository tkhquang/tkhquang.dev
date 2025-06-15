import "./Drawer.scss";
import useForkRef from "@/hooks/useForkRef";
import {
  Dialog,
  DialogProvider,
  DialogDisclosure,
  DialogDescription,
  useDialogStore,
  useStoreState,
  DialogHeading,
  DialogDismiss,
  useDialogContext,
} from "@ariakit/react";
import { useDrag } from "@use-gesture/react";
import clsx from "clsx";
import { gsap } from "gsap";
import { useRef, useEffect, useCallback, useState, forwardRef } from "react";
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
  /** Trigger element - can be a string for default button or custom JSX */
  trigger?: React.ReactNode;
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
  trigger = "Show Drawer",
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
      if (e.target === e.currentTarget && !isAnimatingRef.current) {
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
    if (isAnimatingRef.current || !drawerRef.current) return;

    isAnimatingRef.current = true;
    const transforms = getTransformValues(position, size);

    // Set initial closed state
    gsap.set(drawerRef.current, {
      transform: transforms.closed,
      visibility: "visible",
    });

    if (backdropRef.current) {
      gsap.set(backdropRef.current, { opacity: 0 });
    }

    // Create staggered entrance animation
    const timeline = gsap.timeline({
      onComplete: () => {
        isAnimatingRef.current = false;
      },
    });

    // Fade in backdrop first
    if (backdropRef.current) {
      timeline.to(backdropRef.current, {
        opacity: 1,
        duration: 0.2,
        ease: "power2.out",
      });
    }

    // Slide in drawer content with slight overlap
    timeline.to(
      drawerRef.current,
      {
        transform: transforms.open,
        duration: 0.3,
        ease: "power2.out",
      },
      backdropRef.current ? "-=0.1" : 0
    );
  }, [position, size, getTransformValues]);

  /**
   * Animate drawer exit with content sliding out and backdrop fading.
   * On completion, triggers component unmounting via setShouldRender(false).
   */
  const animateOut = useCallback(() => {
    if (isAnimatingRef.current || !drawerRef.current) return;

    isAnimatingRef.current = true;
    const transforms = getTransformValues(position, size);

    const timeline = gsap.timeline({
      onComplete: () => {
        isAnimatingRef.current = false;
        setShouldRender(false); // Unmount after animation completes
      },
    });

    // Slide out drawer content
    timeline.to(drawerRef.current, {
      transform: transforms.closed,
      duration: 0.25,
      ease: "power2.in",
    });

    // Fade out backdrop with slight overlap
    if (backdropRef.current) {
      timeline.to(
        backdropRef.current,
        {
          opacity: 0,
          duration: 0.15,
          ease: "power2.in",
        },
        "-=0.1"
      );
    }
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
      setShouldRender(true);

      // Use RAF to ensure DOM is ready before animating
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          animateIn();
        });
      });
    } else if (!open && shouldRender) {
      // Trigger exit animation (component stays rendered until animation completes)
      animateOut();
    }
  }, [mounted, open, shouldRender, animateIn, animateOut]);

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

          // Update drawer position in real-time
          if (dragConfig.axis === "x") {
            gsap.set(drawerRef.current, { x: currentMovement });
          } else {
            gsap.set(drawerRef.current, { y: currentMovement });
          }

          // Fade backdrop based on drag progress for visual feedback
          if (backdropRef.current) {
            gsap.set(backdropRef.current, {
              opacity: 1 - progress * 0.5,
            });
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
          gsap.to(drawerRef.current, {
            transform: transforms.open,
            duration: 0.2,
            ease: "power2.out",
          });
          if (backdropRef.current) {
            gsap.to(backdropRef.current, {
              opacity: 1,
              duration: 0.2,
              ease: "power2.out",
            });
          }
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
      <DialogDisclosure>{trigger}</DialogDisclosure>

      {shouldRender && (
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
              <DialogDismiss className="size-8 cursor-pointer transition-all duration-300 hover:opacity-75 focus:outline-none">
                <IoIosCloseCircleOutline className="size-8" />
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
      )}
    </DialogProvider>
  );
}

export { useDialogContext as useDrawerContext };

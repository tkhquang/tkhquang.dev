"use client";

import { cn } from "@/utils/css";
import {
  Dialog as AriaDialog,
  DialogDismiss,
  useDialogStore,
} from "@ariakit/react/dialog";
import { useGesture } from "@use-gesture/react";
import { Scan, X, ZoomIn, ZoomOut } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";

/*
 * Full View: the shared overlay behind the chart plates' expand button
 * and the article figures' click-to-zoom. Children render at natural
 * size inside a transformed stage; the viewer starts at fit-to-screen
 * and pans/zooms from there (drag, wheel, pinch, double-tap). The
 * dialog goes through Ariakit, so it lands in the stacked portal layer
 * and brings focus trapping and scroll locking with it.
 */

interface FullViewOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  label: string;
  caption?: string;
  children: React.ReactNode;
}

/* The floor is the fit scale computed at open, so the subject can never
   be lost off-screen; the ceiling leaves room to read fine print. */
const MAX_SCALE = 8;
const WHEEL_FACTOR = 0.0015;
/* Clearance the fit keeps for the toolbar row and the caption strip */
const FIT_MARGIN_X = 32;
const FIT_MARGIN_Y = 112;

const TOOL_BUTTON_CLASS = cn(
  "rounded-md border border-border bg-background p-2",
  "cursor-pointer opacity-80 transition-opacity hover:opacity-100",
  "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none"
);

const clampValue = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

interface StageProps {
  open: boolean;
  caption?: string;
  children: React.ReactNode;
}

function Stage({ open, caption, children }: StageProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  /* The view lives in refs and writes straight to style.transform:
     gestures fire per-frame and must not re-render the dialog */
  const viewRef = useRef({ scale: 1, x: 0, y: 0 });
  const fitRef = useRef(1);
  const naturalRef = useRef({ width: 1, height: 1 });

  const applyView = useCallback(() => {
    const content = contentRef.current;
    if (!content) return;
    const { scale, x, y } = viewRef.current;
    content.style.transform = `translate(-50%, -50%) translate3d(${x}px, ${y}px, 0) scale(${scale})`;
  }, []);

  const clampPan = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const view = viewRef.current;
    /* Overhang is symmetric around the centered stage: edges may meet
       the viewport edge but never pull past it, and an axis that fits
       stays centered */
    const maxX = Math.max(
      0,
      (naturalRef.current.width * view.scale - viewport.clientWidth) / 2
    );
    const maxY = Math.max(
      0,
      (naturalRef.current.height * view.scale - viewport.clientHeight) / 2
    );
    view.x = clampValue(view.x, -maxX, maxX);
    view.y = clampValue(view.y, -maxY, maxY);
  }, []);

  /* Zoom keeping the viewport point (px, py), measured from the
     viewport center, stationary on screen */
  const zoomAt = useCallback(
    (px: number, py: number, nextScale: number) => {
      const view = viewRef.current;
      const scale = clampValue(nextScale, fitRef.current, MAX_SCALE);
      const ratio = scale / view.scale;
      view.x = px - ratio * (px - view.x);
      view.y = py - ratio * (py - view.y);
      view.scale = scale;
      clampPan();
      applyView();
    },
    [applyView, clampPan]
  );

  const resetView = useCallback(() => {
    viewRef.current = { scale: fitRef.current, x: 0, y: 0 };
    applyView();
  }, [applyView]);

  useEffect(() => {
    if (!open) return;
    /* Measured a frame after mount so the portaled content has layout */
    const frame = requestAnimationFrame(() => {
      const viewport = viewportRef.current;
      const content = contentRef.current;
      if (!viewport || !content) return;
      content.style.transform = "translate(-50%, -50%)";
      const rect = content.getBoundingClientRect();
      naturalRef.current = {
        width: Math.max(rect.width, 1),
        height: Math.max(rect.height, 1),
      };
      const availableWidth = Math.max(viewport.clientWidth - FIT_MARGIN_X, 40);
      const availableHeight = Math.max(
        viewport.clientHeight - FIT_MARGIN_Y,
        40
      );
      fitRef.current = Math.min(
        availableWidth / naturalRef.current.width,
        availableHeight / naturalRef.current.height,
        1
      );
      viewRef.current = { scale: fitRef.current, x: 0, y: 0 };
      applyView();
    });
    return () => cancelAnimationFrame(frame);
  }, [open, applyView]);

  const pointFromClient = (clientX: number, clientY: number) => {
    const viewport = viewportRef.current;
    if (!viewport) return [0, 0] as const;
    const rect = viewport.getBoundingClientRect();
    return [
      clientX - rect.left - rect.width / 2,
      clientY - rect.top - rect.height / 2,
    ] as const;
  };

  useGesture(
    {
      onDrag: ({ pinching, cancel, delta: [dx, dy] }) => {
        if (pinching) return cancel();
        const view = viewRef.current;
        view.x += dx;
        view.y += dy;
        clampPan();
        applyView();
      },
      onPinch: ({ event, origin: [ox, oy], offset: [scale] }) => {
        if (event.cancelable) event.preventDefault();
        const [px, py] = pointFromClient(ox, oy);
        zoomAt(px, py, scale);
      },
      onWheel: ({ event, delta: [, dy] }) => {
        if (event.cancelable) event.preventDefault();
        const [px, py] = pointFromClient(event.clientX, event.clientY);
        zoomAt(px, py, viewRef.current.scale * Math.exp(-dy * WHEEL_FACTOR));
      },
    },
    {
      target: viewportRef,
      eventOptions: { passive: false },
      drag: { filterTaps: true, pointer: { capture: true } },
      pinch: {
        from: () => [viewRef.current.scale, 0],
        scaleBounds: () => ({ min: fitRef.current, max: MAX_SCALE }),
      },
    }
  );

  const handleDoubleClick = (event: React.MouseEvent) => {
    const [px, py] = pointFromClient(event.clientX, event.clientY);
    const zoomedIn = viewRef.current.scale > fitRef.current * 1.05;
    zoomAt(px, py, zoomedIn ? fitRef.current : Math.max(1, fitRef.current * 2));
  };

  return (
    <>
      <div
        ref={viewportRef}
        className="absolute inset-0 cursor-grab touch-none overflow-hidden select-none active:cursor-grabbing"
        onDoubleClick={handleDoubleClick}
      >
        <div
          ref={contentRef}
          className="absolute top-1/2 left-1/2 w-max will-change-transform"
          style={{ transform: "translate(-50%, -50%)" }}
        >
          {children}
        </div>
      </div>
      <div className="absolute top-3 right-3 z-1 flex gap-1.5">
        <button
          type="button"
          aria-label="Zoom out"
          className={TOOL_BUTTON_CLASS}
          onClick={() => zoomAt(0, 0, viewRef.current.scale / 1.5)}
        >
          <ZoomOut className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          aria-label="Zoom in"
          className={TOOL_BUTTON_CLASS}
          onClick={() => zoomAt(0, 0, viewRef.current.scale * 1.5)}
        >
          <ZoomIn className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          aria-label="Fit to screen"
          className={TOOL_BUTTON_CLASS}
          onClick={resetView}
        >
          <Scan className="size-4" aria-hidden />
        </button>
        <DialogDismiss aria-label="Close full view" className={TOOL_BUTTON_CLASS}>
          <X className="size-4" aria-hidden />
        </DialogDismiss>
      </div>
      {caption && (
        <div className="text-muted-foreground bg-background/85 pointer-events-none absolute inset-x-0 bottom-0 z-1 px-4 py-2.5 text-center text-sm">
          {caption}
        </div>
      )}
    </>
  );
}

export default function FullViewOverlay({
  open,
  onOpenChange,
  label,
  caption,
  children,
}: FullViewOverlayProps) {
  const dialog = useDialogStore({
    open,
    setOpen: onOpenChange,
  });

  return (
    <AriaDialog
      store={dialog}
      aria-label={label}
      className={cn(
        "bg-background fixed inset-0 z-50",
        "opacity-0 transition-opacity duration-200 ease-out data-enter:opacity-100"
      )}
    >
      <Stage open={open} caption={caption}>
        {children}
      </Stage>
    </AriaDialog>
  );
}

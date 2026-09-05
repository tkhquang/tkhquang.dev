"use client";

import { clsx } from "clsx";
import { Maximize2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";

/* Loaded on the first tap only: the article pays nothing for a plate
   nobody expands */
const FullViewOverlay = dynamic(
  () => import("@/components/common/FullViewOverlay"),
  { ssr: false }
);

export type MermaidPlateProps = React.ComponentProps<"pre">;

/*
 * The chart plate as shipped, plus its expand control. The svg is baked
 * at press time and arrives as children; rendering the same children a
 * second time inside the overlay reprints the plate at natural size,
 * where the fit lives in the overlay's transform instead of the 560px
 * floor and scroll window that serve the column. The control sits in a
 * zero-height sticky row so it stays pinned while the plate scrolls
 * horizontally, and it stays visible at rest: on the phones where the
 * plate overflows there is no hover to reveal it.
 */
export default function MermaidPlate({
  className,
  children,
  ...rest
}: MermaidPlateProps) {
  const [open, setOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);

  return (
    <>
      <pre {...rest} className={className}>
        {/* left-0 with no top offset: the row pins against the plate's
            own horizontal scroll and nothing else */}
        <span className="sticky left-0 z-1 block h-0">
          <button
            type="button"
            aria-label="Open diagram in full view"
            onClick={() => {
              setHasOpened(true);
              setOpen(true);
            }}
            className={clsx(
              "border-border bg-background absolute top-0 right-0 rounded-md border p-1.5",
              "cursor-pointer opacity-70 transition-opacity hover:opacity-100",
              "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none"
            )}
          >
            <Maximize2 className="size-4" aria-hidden />
          </button>
        </span>
        {children}
      </pre>
      {hasOpened && (
        <FullViewOverlay
          open={open}
          onOpenChange={setOpen}
          label="Diagram full view"
        >
          <pre {...rest} className={clsx(className, "chart-plate-full")}>
            {children}
          </pre>
        </FullViewOverlay>
      )}
    </>
  );
}

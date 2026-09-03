"use client";

import Image, { ImageProps } from "@/components/common/NextImage";
import dynamic from "next/dynamic";
import { useState } from "react";

/* Loaded on the first tap only: the article pays nothing for an image
   nobody expands */
const FullViewOverlay = dynamic(
  () => import("@/components/common/FullViewOverlay"),
  { ssr: false }
);

export interface ZoomableImageProps extends ImageProps {
  "data-ratio"?: number | string;
}

/*
 * Article images, click-to-zoom. The column squeezes every figure to
 * the viewport, so the overlay reprints the image at its natural pixel
 * size and asks for a srcset candidate to match: the inline sizes cap
 * at 768px, and zooming that file would only magnify its pixels.
 */
export default function ZoomableImage(props: ZoomableImageProps) {
  const { alt, height, width } = props;
  const [open, setOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);

  const naturalWidth = typeof width === "string" ? Number(width) : width;
  const naturalHeight = typeof height === "string" ? Number(height) : height;

  /* Without trusted dimensions the stage cannot size itself; ship the
     plain figure */
  if (!naturalWidth || !naturalHeight) {
    return <Image {...props} alt={alt} />;
  }

  return (
    <>
      <button
        type="button"
        aria-label={alt ? `View full size: ${alt}` : "View image at full size"}
        onClick={() => {
          setHasOpened(true);
          setOpen(true);
        }}
        className="focus-visible:ring-ring block w-full cursor-zoom-in focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset"
      >
        <Image {...props} alt={alt} />
      </button>
      {hasOpened && (
        <FullViewOverlay
          open={open}
          onOpenChange={setOpen}
          label={alt ? `Full size image: ${alt}` : "Full size image"}
          caption={alt || undefined}
        >
          <div style={{ height: naturalHeight, width: naturalWidth }}>
            <Image
              {...props}
              alt={alt}
              loading="eager"
              shouldShowBackground={false}
              sizes={`${naturalWidth}px`}
              style={{ objectFit: "contain" }}
            />
          </div>
        </FullViewOverlay>
      )}
    </>
  );
}

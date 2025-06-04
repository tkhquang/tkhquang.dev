"use client";

import { clsx } from "clsx";
import type { ImageProps as NextImageProps } from "next/image";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";

let loadedImages: string[] = [];

// Detecting if the image is already loaded to avoid the blur effect
// happens every time the component is rendered based on the route pathname
function useImageLoadedState(src: string) {
  const pathname = usePathname();
  const uniqueImagePath = pathname + "__" + src;
  const [loaded, setLoaded] = useState(() =>
    loadedImages.includes(uniqueImagePath)
  );

  return [
    loaded,
    () => {
      if (loaded) return;
      loadedImages.push(uniqueImagePath);
      setLoaded(true);
      console.log("Loaded: ", uniqueImagePath);
    },
  ] as const;
}

export interface ImageProps extends Omit<NextImageProps, "src" | "priority"> {
  src: string;
  containerClassName?: string;
}

export default function NextImage(props: ImageProps) {
  const {
    alt,
    className,
    containerClassName,
    loading = "lazy",
    src,
    style,
    ...rest
  } = props;
  const [loaded, onLoad] = useImageLoadedState(src);

  return (
    <div
      className={clsx(
        "image-container size-full overflow-hidden",
        !loaded && "animate-pulse [animation-duration:4s]",
        containerClassName
      )}
    >
      <Image
        className={clsx(
          "[transition:filter_500ms_cubic-bezier(.4,0,.2,1)]",
          "size-full max-h-full object-center",
          loaded ? "blur-0" : "blur-xl",
          className
        )}
        src={src}
        alt={alt}
        style={{ objectFit: "cover", ...style }}
        loading={loading}
        priority={loading === "eager"}
        quality={100}
        onLoad={onLoad}
        {...rest}
      />
    </div>
  );
}

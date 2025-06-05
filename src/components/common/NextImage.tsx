"use client";

import { clsx } from "clsx";
import type { ImageProps as NextImageProps } from "next/image";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

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
  const [isLoaded, setIsLoaded] = useState(false);
  const imgElementRef = useRef<HTMLImageElement | null>(null);
  const handleLoad: React.ReactEventHandler<HTMLImageElement> = (event) => {
    const imgElement = event.currentTarget;

    imgElement.dataset.fetched = String(true);
    setIsLoaded(true);
  };

  useEffect(() => {
    const imgElement = imgElementRef.current;
    if (imgElement) {
      imgElement.dataset.fetched = String(imgElement.complete);
      setIsLoaded(imgElement.complete);
    }
  }, []);

  return (
    <div
      className={clsx(
        "image-container size-full translate-x-0 overflow-hidden [animation-duration:4s]",
        isLoaded ? "animate-none" : "animate-pulse",
        !props.fill && "relative",
        containerClassName
      )}
    >
      <Image
        ref={imgElementRef}
        className={clsx(
          "[transition:filter_500ms_cubic-bezier(.4,0,.2,1)]",
          "size-full max-h-full object-center blur-xl data-[fetched='true']:blur-0",
          className
        )}
        src={src}
        alt={alt}
        style={{
          backgroundRepeat: "no-repeat",
          objectFit: "cover",
          ...style,
        }}
        loading={loading}
        priority={loading === "eager"}
        quality={100}
        onLoad={handleLoad}
        sizes="(max-width: 768px) 100vw, 1440px"
        data-fetched={String(false)}
        {...rest}
      />
    </div>
  );
}

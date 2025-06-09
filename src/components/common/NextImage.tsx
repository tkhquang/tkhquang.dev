"use client";

import { clsx } from "clsx";
import type { ImageProps as NextImageProps } from "next/image";
import Image from "next/image";
import { useEffect, useRef } from "react";

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
  const imgElementRef = useRef<HTMLImageElement | null>(null);
  const containerElementRef = useRef<HTMLDivElement | null>(null);

  const handleLoad: React.ReactEventHandler<HTMLImageElement> = (event) => {
    const imgElement = event.currentTarget;

    imgElement.dataset.fetched = String(true);
    containerElementRef.current!.dataset.fetched = String(true);
  };

  useEffect(() => {
    const imgElement = imgElementRef.current;
    if (imgElement?.complete) {
      imgElement.dataset.fetched = String(true);
      containerElementRef.current!.dataset.fetched = String(true);
    }
  }, []);

  return (
    <div
      className={clsx(
        "image-container size-full animate-pulse overflow-hidden [animation-duration:4s] data-[fetched='true']:animate-none",
        props.fill ? "absolute" : "relative",
        containerClassName
      )}
      ref={containerElementRef}
    >
      <Image
        ref={imgElementRef}
        className={clsx("size-full max-h-full object-center", className)}
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
        {...rest}
      />
    </div>
  );
}

"use client";

import { GritBackground } from "@/components/ui/grit-background";
import { clsx } from "clsx";
import type { ImageProps as NextImageProps } from "next/image";
import Image from "next/image";
import { useEffect, useRef } from "react";

export interface ImageProps extends Omit<NextImageProps, "src"> {
  src: string;
  containerClassName?: string;
  backgroundClassName?: string;
  shouldShowBackground?: boolean;
}

export default function NextImage(props: ImageProps) {
  const {
    alt,
    className,
    containerClassName,
    loading = "lazy",
    src,
    style,
    blurDataURL,
    placeholder,
    shouldShowBackground = true,
    backgroundClassName,
    ...rest
  } = props;
  const imgElementRef = useRef<HTMLImageElement | null>(null);
  const containerElementRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let isUnmounted = false;

    (async () => {
      const imgElement = imgElementRef.current;

      if (imgElement) {
        if (imgElement.complete) {
          if (!isUnmounted) {
            imgElement.dataset.fetched = String(true);
            containerElementRef.current!.dataset.fetched = String(true);
          }
          return;
        }

        // Wait until the image is loaded & decoded
        if ("decode" in imgElement) {
          try {
            await imgElement.decode();
          } catch (e) {
            await new Promise((resolve, reject) => {
              imgElement.onload = resolve;
              imgElement.onerror = reject;
            });
          }
        } else {
          await new Promise((resolve, reject) => {
            (imgElement as HTMLImageElement).onload = resolve;
            (imgElement as HTMLImageElement).onerror = reject;
          });
        }

        if (!isUnmounted) {
          imgElement.dataset.fetched = String(true);
          containerElementRef.current!.dataset.fetched = String(true);
        }
      }
    })();

    return () => {
      isUnmounted = true;
    };
  }, []);

  return (
    <div
      className={clsx(
        "image-container size-full overflow-hidden",
        "animate-pulse [animation-duration:4s] data-[fetched='true']:animate-none",
        props.fill ? "absolute" : "relative",
        containerClassName
      )}
      ref={containerElementRef}
    >
      {shouldShowBackground && (
        <GritBackground className={clsx("", className, backgroundClassName)} />
      )}
      <Image
        ref={imgElementRef}
        className={clsx(
          "size-full max-h-full object-center",
          "blur-xl [transition:filter_500ms_cubic-bezier(.4,0,.2,1)] data-[fetched='true']:blur-0",
          className
        )}
        src={src}
        alt={alt}
        loading={loading}
        quality={100}
        sizes="(max-width: 768px) 100vw, 1440px"
        style={{
          backgroundRepeat: "no-repeat",
          objectFit: "cover",
          ...style,
        }}
        {...rest}
        {...(blurDataURL &&
          placeholder === "blur" && {
            placeholder,
            blurDataURL,
          })}
      />
    </div>
  );
}

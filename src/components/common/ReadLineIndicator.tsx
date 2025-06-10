"use client";

import { ScrollManager } from "@/utils/dom";
import { useGSAP } from "@gsap/react";
import clsx from "clsx";
import { usePathname } from "next/navigation";
import React, { useRef } from "react";

// Register the hook to avoid React version discrepancies
gsap.registerPlugin(useGSAP);

const ID = "ReadLineIndicator";

const ReadLineIndicator = ({
  className,
  ...props
}: React.ComponentProps<"div">) => {
  const ref = useRef<HTMLDivElement | null>(null);

  const pathName = usePathname();
  const isInBlogPost = pathName.startsWith("/blog/posts/");

  useGSAP(
    () => {
      if (!isInBlogPost) return;

      const div = ref.current;

      const scrollManager = new ScrollManager();
      scrollManager.subscribe({
        id: ID,
        callback({ scrollY, scrollProgress }) {
          gsap.set(div, { width: `${scrollProgress * 100}%` });
        },
      });

      // Cleanup
      return () => {
        scrollManager.destroy();
      };
    },
    { dependencies: [isInBlogPost] }
  );

  if (!isInBlogPost) {
    return null;
  }

  return (
    <div
      {...props}
      className={clsx(
        "left-0 top-0 h-4px w-0 self-start bg-theme-tone opacity-30",
        className
      )}
      style={{
        width: 0,
      }}
      ref={ref}
    />
  );
};

export default ReadLineIndicator;

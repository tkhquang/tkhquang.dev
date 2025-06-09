"use client";

import { scrolledStore } from "@/store/theme";
import { animated, useSpring } from "@react-spring/web";
import clsx from "clsx";
import { useAtomValue } from "jotai";
import { usePathname } from "next/navigation";
import React from "react";

const ReadLineIndicator = ({
  className,
  ...props
}: React.ComponentProps<"div">) => {
  const { yOffset } = useAtomValue(scrolledStore);
  const pathName = usePathname();
  const isInBlogPost = pathName.startsWith("/blog/posts/");

  // Animate the width from react-spring
  const springStyle = useSpring({
    config: { friction: 24, tension: 220 },
    width: `${yOffset}%`,
  });

  if (!isInBlogPost) {
    return null;
  }

  return (
    <animated.div
      {...props}
      className={clsx(
        "left-0 top-0 h-4px w-0 self-start bg-theme-tone opacity-30",
        className
      )}
      style={springStyle}
    />
  );
};

export default ReadLineIndicator;

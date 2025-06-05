"use client";

import classNames from "classnames";
import { useAtomValue } from "jotai";
import { usePathname } from "next/navigation";
import { scrolledStore } from "@/store/theme";
import { useSpring, animated as baseAnimated } from "@react-spring/web";
import React from "react";

/**
 * TODO: Update this after `react-spring` has been upgraded to React 19
 * @see https://github.com/pmndrs/react-spring/issues/2341
 */
const animated = baseAnimated as any;

const ReadLineIndicator = ({
  className,
  ...props
}: React.ComponentProps<"div">) => {
  const { yOffset } = useAtomValue(scrolledStore);
  const pathName = usePathname();
  const isInBlogPost = pathName.startsWith("/blog/posts/");

  // Animate the width from react-spring
  const springStyle = useSpring({
    width: `${yOffset}%`,
    config: { tension: 220, friction: 24 },
  });

  if (!isInBlogPost) {
    return null;
  }

  return (
    <animated.div
      {...props}
      className={classNames(
        "left-0 top-0 h-[4px] w-0 self-start bg-theme-tone opacity-50",
        className
      )}
      style={springStyle}
    />
  );
};

export default ReadLineIndicator;

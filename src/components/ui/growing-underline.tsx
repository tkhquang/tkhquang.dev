/**
 * Adapted from https://github.com/hta218/leohuynh.dev
 * Original author: Leo Huynh (hta218)
 * License: MIT
 */

import { clsx } from "clsx";
import type { CSSProperties } from "react";

export function GrowingUnderline({
  active,
  as: Component = "span",
  children,
  className,
  duration,
  ...rest
}: {
  children: React.ReactNode;
  as?: React.ElementType;
  active?: boolean;
  className?: string;
  duration?: number;
} & React.ComponentProps<"span">) {
  return (
    <Component
      className={clsx([
        "bg-gradient-to-r bg-left-bottom bg-no-repeat",
        "transition-[background-size] duration-[var(--duration,300ms)]",
        "from-green-200 to-green-100",
        "dark:from-emerald-800 dark:to-emerald-900",
        active
          ? "bg-[length:100%_50%] hover:bg-[length:100%_100%]"
          : "bg-[length:0px_50%] hover:bg-[length:100%_50%]",
        className,
      ])}
      style={{ "--duration": `${duration || 300}ms` } as CSSProperties}
      {...rest}
    >
      {children}
    </Component>
  );
}

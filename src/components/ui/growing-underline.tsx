/**
 * Adapted from https://github.com/hta218/leohuynh.dev
 * Original author: Leo Huynh (hta218)
 * License: MIT
 */

import { clsx } from "clsx";
import type { CSSProperties } from "react";

const TONES = {
  /* Sitewide default: the palette's own primary at a quiet mix */
  primary:
    "from-[color-mix(in_srgb,var(--primary)_30%,transparent)] to-[color-mix(in_srgb,var(--primary)_18%,transparent)]",
  /* Spotify branding, used only by the now-playing widget */
  spotify:
    "from-green-200 to-green-100 dark:from-emerald-800 dark:to-emerald-900",
} as const;

export function GrowingUnderline({
  active,
  as: Component = "span",
  children,
  className,
  duration,
  tone = "primary",
  ...rest
}: {
  children: React.ReactNode;
  as?: React.ElementType;
  active?: boolean;
  className?: string;
  duration?: number;
  tone?: keyof typeof TONES;
} & React.ComponentProps<"span">) {
  return (
    <Component
      className={clsx([
        "bg-linear-to-r bg-bottom-left bg-no-repeat",
        "transition-[background-size] duration-(--duration,300ms)",
        TONES[tone],
        active
          ? "bg-size-[100%_50%] hover:bg-size-[100%_100%]"
          : "bg-size-[0px_50%] hover:bg-size-[100%_50%]",
        className,
      ])}
      style={{ "--duration": `${duration || 300}ms` } as CSSProperties}
      {...rest}
    >
      {children}
    </Component>
  );
}

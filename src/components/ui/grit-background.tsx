/**
 * Adapted from https://github.com/hta218/leohuynh.dev
 * Original author: Leo Huynh (hta218)
 * License: MIT
 */

import { clsx } from "clsx";

export function GritBackground({ className }: React.ComponentProps<"div">) {
  return (
    <div
      className={clsx([
        "absolute inset-0 size-full",
        "bg-cover bg-center",
        'bg-[url("/assets/resources/images/background/black-grit.png")]',
        'dark:bg-[url("/assets/resources/images/background/white-grit.png")]',
        className,
      ])}
    />
  );
}

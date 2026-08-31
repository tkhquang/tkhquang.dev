"use client";

import Link from "next/link";

/**
 * In-page section link that smooth scrolls WITHOUT writing the #hash into
 * the address bar, so a copied URL always shows the whole page from the
 * top. When the target section is not on the current page (e.g. the header
 * on /chat), it falls back to normal navigation.
 */
const AnchorLink = ({
  href,
  onClick,
  ...props
}: React.ComponentProps<typeof Link>) => {
  return (
    <Link
      href={href}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) {
          return;
        }
        /* Modified clicks keep their native open-in-new-tab behavior */
        if (
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return;
        }

        const hashIndex = String(href).indexOf("#");
        if (hashIndex === -1) {
          return;
        }
        const target = document.getElementById(
          String(href).slice(hashIndex + 1)
        );
        if (!target) {
          return;
        }

        event.preventDefault();
        const prefersReducedMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches;
        target.scrollIntoView({
          behavior: prefersReducedMotion ? "auto" : "smooth",
        });
      }}
      {...props}
    />
  );
};

export default AnchorLink;

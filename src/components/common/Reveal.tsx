"use client";

import classNames from "classnames";
import { useEffect, useRef, useState } from "react";

type RevealState = "initial" | "hidden" | "shown";

interface RevealProps extends React.ComponentProps<"div"> {
  /** Stagger offset in milliseconds */
  delay?: number;
}

/**
 * One restrained scroll-reveal pattern for the whole site: content rises
 * 14px and fades in, once. Content that is already on screen at hydration
 * (or a reduced-motion preference) is never hidden.
 */
const Reveal = ({ children, className, delay = 0, ...props }: RevealProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<RevealState>("initial");

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const rect = element.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      return;
    }

    setState("hidden");
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setState("shown");
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -30px 0px", threshold: 0.08 }
    );
    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      className={classNames(
        className,
        state !== "initial" && "transition-all duration-500 ease-out",
        {
          "translate-y-3.5 opacity-0": state === "hidden",
          "translate-y-0 opacity-100": state === "shown",
        }
      )}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      {...props}
    >
      {children}
    </div>
  );
};

export default Reveal;

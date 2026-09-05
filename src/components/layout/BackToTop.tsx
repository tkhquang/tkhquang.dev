"use client";

import { prefersReducedMotion, ScrollManager } from "@/utils/dom";
import { useGSAP } from "@gsap/react";
import clsx from "clsx";
import gsap from "gsap";
import { useRef } from "react";
import { FaArrowAltCircleUp } from "react-icons/fa";

// Register the hook to avoid React version discrepancies
gsap.registerPlugin(useGSAP);

const ID = "BackToTop";

const BackToTop = ({ className, ...props }: React.ComponentProps<"button">) => {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useGSAP(
    () => {
      const scrollManager = new ScrollManager();
      scrollManager.subscribe({
        id: ID,
        callback({ scrollY, scrollProgress }) {
          /* visibility rides along so the invisible button is neither a
             tab stop nor a 40px tap-stealer parked over the corner */
          if (scrollY > 600 - 96) {
            gsap.set(buttonRef.current, {
              opacity: 0.2,
              visibility: "visible",
            });
          } else {
            gsap.set(buttonRef.current, { opacity: 0, visibility: "hidden" });
          }
        },
      });

      // Cleanup
      return () => {
        scrollManager.destroy();
      };
    },
    { dependencies: [] }
  );

  const scrollToTop = () => {
    window.scrollTo({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      top: 0,
    });
  };

  return (
    <button
      ref={buttonRef}
      type="button"
      className={clsx(
        "text-theme-primary fixed right-0 bottom-0 z-10 size-10 cursor-pointer transition-all duration-300 hover:opacity-75 focus:outline-hidden",
        className
      )}
      title="Scroll To Top"
      onClick={scrollToTop}
      style={{ opacity: 0, visibility: "hidden" }}
      {...props}
    >
      <FaArrowAltCircleUp className="size-10" />
    </button>
  );
};

export default BackToTop;

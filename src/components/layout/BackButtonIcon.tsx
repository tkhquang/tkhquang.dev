"use client";

import { ScrollManager } from "@/utils/dom";
import { useGSAP } from "@gsap/react";
import clsx from "clsx";
import gsap from "gsap";
import { usePathname } from "next/navigation";
import { useRef } from "react";

// Register the hook to avoid React version discrepancies
gsap.registerPlugin(useGSAP);

const radius = 10;
const circumference = 2 * Math.PI * radius;

const ID = "BackButtonIcon";

const BackButtonIcon = (props: React.SVGAttributes<SVGSVGElement>) => {
  const circleRef = useRef<SVGCircleElement | null>(null);
  const pathName = usePathname();
  const isInBlogPost = pathName.startsWith("/blog/posts/");

  useGSAP(
    () => {
      if (!isInBlogPost || !circleRef.current) return;

      const circle = circleRef.current;
      const scrollManager = new ScrollManager();

      scrollManager.subscribe({
        id: ID,
        callback({ scrollProgress }) {
          const targetDashOffset = circumference * (1 - scrollProgress);
          gsap.to(circle, {
            strokeDashoffset: targetDashOffset,
            duration: 0.1,
            ease: "none",
          });
        },
      });

      // Cleanup
      return () => {
        scrollManager.destroy();
      };
    },
    { dependencies: [isInBlogPost] }
  );

  return (
    <svg
      stroke="currentColor"
      fill="none"
      strokeWidth="2"
      viewBox="0 0 24 24"
      strokeLinecap="round"
      strokeLinejoin="round"
      height="1em"
      width="1em"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        className={clsx(isInBlogPost ? "opacity-20" : "opacity-100")}
      />
      <circle
        className="back-button-icon__ring"
        cx="12"
        cy="12"
        r="10"
        transform="rotate(-90 12 12)"
        stroke="transparent"
        ref={circleRef}
        style={{
          stroke: "currentColor",
          strokeDasharray: circumference,
          strokeDashoffset: circumference,
        }}
      />
      <polyline points="12 8 8 12 12 16" />
      <line x1="16" y1="12" x2="8" y2="12" />
    </svg>
  );
};

export default BackButtonIcon;

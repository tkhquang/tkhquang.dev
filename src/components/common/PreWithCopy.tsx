"use client";

import React, { useRef, useState } from "react";

const FEEDBACK_DURATION = 2_000;

export type PreWithCopyProps = React.ComponentProps<"pre">;

export const PreWithCopy = ({
  style,
  children,
  ...props
}: PreWithCopyProps) => {
  const [copied, setCopied] = useState(false);
  const preRef = useRef<HTMLPreElement | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClick = () => {
    const pre = preRef.current;

    if (!pre) return;

    const code = pre.textContent || pre.innerText || "";

    if (!code) return;

    navigator.clipboard.writeText(code);
    setCopied(true);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setCopied(false);
    }, FEEDBACK_DURATION);
  };

  /* The button and feedback label are siblings of the pre so they pin to
     the figure instead of scrolling horizontally with wide code */
  return (
    <>
      <pre {...props} ref={preRef}>
        {children}
      </pre>
      <button
        data-rehype-pretty-copy-button
        type="button"
        aria-label="Copy code"
        className={copied ? "rehype-pretty-copied" : undefined}
        onClick={handleClick}
      >
        <span className="rehype-pretty-copy-button-icon" aria-hidden="true" />
      </button>
      <span
        className="rehype-pretty-copy-feedback"
        data-visible={copied ? "true" : "false"}
        aria-hidden="true"
      >
        Copied
      </span>
    </>
  );
};

export const CustomPreWithCopy = (props: PreWithCopyProps) => {
  return <PreWithCopy {...props} />;
};

export default PreWithCopy;

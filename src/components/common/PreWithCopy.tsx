"use client";

import React, { useRef } from "react";
import { useState } from "react";

const DEFAULT_COPY_ICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Cpath fill='%23adadad' d='M16.187 9.5H12.25a1.75 1.75 0 0 0-1.75 1.75v28.5c0 .967.784 1.75 1.75 1.75h23.5a1.75 1.75 0 0 0 1.75-1.75v-28.5a1.75 1.75 0 0 0-1.75-1.75h-3.937a4.25 4.25 0 0 1-4.063 3h-7.5a4.25 4.25 0 0 1-4.063-3M31.813 7h3.937A4.25 4.25 0 0 1 40 11.25v28.5A4.25 4.25 0 0 1 35.75 44h-23.5A4.25 4.25 0 0 1 8 39.75v-28.5A4.25 4.25 0 0 1 12.25 7h3.937a4.25 4.25 0 0 1 4.063-3h7.5a4.25 4.25 0 0 1 4.063 3M18.5 8.25c0 .966.784 1.75 1.75 1.75h7.5a1.75 1.75 0 1 0 0-3.5h-7.5a1.75 1.75 0 0 0-1.75 1.75'/%3E%3C/svg%3E";

const DEFAULT_SUCCESS_ICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%2366ff85' d='M9 16.17L5.53 12.7a.996.996 0 1 0-1.41 1.41l4.18 4.18c.39.39 1.02.39 1.41 0L20.29 7.71a.996.996 0 1 0-1.41-1.41z'/%3E%3C/svg%3E";

export type IconType = string | React.ReactNode;

export interface PreWithCopyProps extends React.ComponentProps<"pre"> {
  successIcon?: IconType;
  copyIcon?: IconType;
}

const renderIcon = (icon: IconType) => {
  if (typeof icon === "string") {
    return (
      <div
        className="rehype-pretty-copy-button-icon"
        style={{
          backgroundImage: `url("${icon}")`,
        }}
      />
    );
  }

  if (React.isValidElement(icon)) {
    return icon;
  }

  return icon;
};

export const PreWithCopy = ({
  successIcon = DEFAULT_SUCCESS_ICON,
  copyIcon = DEFAULT_COPY_ICON,
  style,
  children,
  ...props
}: PreWithCopyProps) => {
  const [copied, setCopied] = useState(false);
  const preRef = useRef<HTMLPreElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    const pre = preRef.current;

    if (pre) {
      const button = event.currentTarget;

      const code = pre.textContent || pre.innerText || "";

      if (code) {
        navigator.clipboard.writeText(code);
        button.classList.add("rehype-pretty-copied");
        setCopied(true);

        setTimeout(() => {
          button.classList.remove("rehype-pretty-copied");
          setCopied(false);
        }, 3000);
      }
    }
  };

  return (
    <pre {...props} ref={preRef}>
      {children}
      <button
        data-rehype-pretty-copy-button
        type="button"
        onClick={handleClick}
      >
        {copied ? renderIcon(successIcon) : renderIcon(copyIcon)}
      </button>
    </pre>
  );
};

export const CustomPreWithCopy = (props: PreWithCopyProps) => {
  return (
    <>
      <PreWithCopy
        {...props}
        copyIcon="/assets/resources/svg/clipboard-add.svg"
        successIcon="/assets/resources/svg/clipboard-success.svg"
      />
      <style jsx global>{`
        body {
          &::after {
            position: absolute;
            width: 0;
            height: 0;
            overflow: hidden;
            z-index: -1;
            content: url("/assets/resources/svg/clipboard-add.svg")
              url("/assets/resources/svg/clipboard-success.svg");
          }
        }
      `}</style>
    </>
  );
};

export default PreWithCopy;

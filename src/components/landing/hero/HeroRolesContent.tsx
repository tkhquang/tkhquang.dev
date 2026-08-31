"use client";

import classnames from "classnames";
import { useEffect, useRef, useState } from "react";

const ROLES = [
  "A Software Engineer 💻",
  "A Lifelong Learner 📚",
  "An Open Source Enthusiast 🌐",
  "A Game Modder 🎮",
  "A Team Player 🤝🏻",
];

const ROTATE_INTERVAL_MS = 5000;
const FADE_OUT_MS = 450;

const HeroRolesContent = ({
  align = "start",
}: {
  align?: "start" | "center";
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const swapTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const interval = setInterval(() => {
      setVisible(false);
      swapTimeoutRef.current = setTimeout(() => {
        setSelectedIndex((currentSelectedIndex) => {
          return (currentSelectedIndex + 1) % ROLES.length;
        });
        setVisible(true);
      }, FADE_OUT_MS);
    }, ROTATE_INTERVAL_MS);

    return () => {
      clearInterval(interval);
      clearTimeout(swapTimeoutRef.current);
    };
  }, []);

  return (
    <div className="relative h-10">
      {ROLES.map((role, index) => {
        const isShown = visible && selectedIndex === index;

        return (
          <div
            className={classnames(
              "absolute inset-0 flex items-center leading-none transition-all duration-400",
              align === "center" ? "justify-center" : "justify-start",
              isShown ? "opacity-100" : "translate-y-2 opacity-0"
            )}
            key={index}
          >
            {role}
          </div>
        );
      })}
    </div>
  );
};

export default HeroRolesContent;

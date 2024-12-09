"use client";

import classnames from "classnames";
import { useEffect, useState } from "react";

const ROLES = [
  // Force chomp
  "A Front-End Engineer 💻",
  "A Lifelong Learner 📚",
];

const HeroRolesContent = () => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSelectedIndex((currentSelectedIndex) => {
        return (currentSelectedIndex + 1) % ROLES.length;
      });
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <>
      {ROLES.map((role, index) => {
        return (
          <div
            className={classnames(
              "h-0 text-center leading-none opacity-0 transition-all duration-500",
              {
                "h-10 opacity-100": selectedIndex === index,
              }
            )}
            key={index}
          >
            {role}
          </div>
        );
      })}
    </>
  );
};

export default HeroRolesContent;

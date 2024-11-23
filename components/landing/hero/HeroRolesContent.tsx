"use client";

import { useEffect, useState } from "react";
import classnames from "classnames";

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
              "h-0 opacity-0 leading-none transition-all duration-500 text-center",
              {
                "h-10 opacity-100": selectedIndex === index,
              },
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

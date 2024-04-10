"use client";

import { useEffect, useState } from "react";
import classnames from "classnames";

const ROLES = [
  // Force chomp
  "A Front-End Engineer 💻",
  "A Lifelong Learner 📚",
];

const LandingRoles = ({ className, ...props }: React.ComponentProps<"div">) => {
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
    <div
      className="roles text-xl lg:text-4xl font-medium h-0 overflow-hidden opacity-0 animate-[fade-in_1s_1.5s_linear_forwards]"
      {...props}
    >
      {ROLES.map((role, index) => {
        return (
          <div
            className={classnames(
              "h-0 opacity-0 leading-none transition-all duration-500 text-center",
              {
                "h-10 opacity-100": selectedIndex === index,
              },
              className,
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

export default LandingRoles;

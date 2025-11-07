import SocialLinks from "@/components/common/SocialLinks";
import classNames from "classnames";
import React from "react";

const Footer = ({
  children,
  className,
  ...props
}: React.ComponentProps<"footer">) => {
  return (
    <footer
      {...props}
      className={classNames(
        "footer surface shadow-box mt-auto py-4 text-center",
        className
      )}
    >
      <div className="container flex items-center justify-between">
        <div className="font-semibold">
          Copyright © {new Date().getFullYear()}
        </div>
        <SocialLinks className="flex-center gap-1 text-2xl" />
      </div>
    </footer>
  );
};

export default Footer;

import React from "react";
import SocialLinks from "@/components/common/SocialLinks";
import classNames from "classnames";

const Footer = ({
  className,
  children,
  ...props
}: React.ComponentProps<"footer">) => {
  return (
    <footer
      {...props}
      className={classNames(
        "footer surface mt-auto py-4 text-center shadow-box",
        className
      )}
    >
      <div className="container flex items-center justify-between">
        <div className="font-semibold">
          Copyright © {new Date().getFullYear()}
        </div>
        <SocialLinks className="flex-center flex-gap-4 text-2xl" />
      </div>
    </footer>
  );
};

export default Footer;

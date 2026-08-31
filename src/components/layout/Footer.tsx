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
        "footer bg-theme-darken border-theme-hairline-soft mt-auto border-t py-6",
        className
      )}
    >
      <div className="container flex flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="kicker text-center sm:whitespace-nowrap">
          © {new Date().getFullYear()} · Built by day, tinkered by night{" "}
          <span aria-hidden="true">☕</span>
        </div>
        <SocialLinks className="flex-center gap-1 text-2xl" />
      </div>
    </footer>
  );
};

export default Footer;

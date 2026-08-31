import SocialLinks from "@/components/common/SocialLinks";
import classNames from "classnames";
import Link from "next/link";
import React from "react";

const FOOTER_NAV = [
  { href: "/#about", label: "About" },
  { href: "/#stacks", label: "Stacks" },
  { href: "/#projects", label: "Projects" },
  { href: "/#writing", label: "Writing" },
  { href: "/#contact", label: "Contact" },
  { href: "/blog", label: "Blog" },
];

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
        <div className="kicker whitespace-nowrap">
          © {new Date().getFullYear()} · Built by day, tinkered by night{" "}
          <span aria-hidden="true">☕</span>
        </div>
        <nav
          aria-label="Footer"
          className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1"
        >
          {FOOTER_NAV.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="hover:text-theme-primary text-xs font-semibold tracking-wider uppercase opacity-75 transition-colors hover:opacity-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <SocialLinks className="flex-center gap-1 text-2xl" />
      </div>
    </footer>
  );
};

export default Footer;

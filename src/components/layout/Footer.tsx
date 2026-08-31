import AnchorLink from "@/components/common/AnchorLink";
import SocialLinks from "@/components/common/SocialLinks";
import classNames from "classnames";
import React from "react";

const SECTION_NAV = [
  { href: "/#about", label: "About" },
  { href: "/#stacks", label: "Stacks" },
  { href: "/#projects", label: "Projects" },
  { href: "/#writing", label: "Writing" },
  { href: "/#contact", label: "Contact" },
];

const BLOG_NAV = { href: "/blog", label: "Blog" };

interface FooterProps extends React.ComponentProps<"footer"> {
  /** Section anchors only make sense where the sections exist (homepage) */
  showSectionNav?: boolean;
}

const NAV_LINK_CLASS =
  "hover:text-theme-primary text-xs font-semibold tracking-wider uppercase opacity-75 transition-colors hover:opacity-100";

const Footer = ({
  children,
  className,
  showSectionNav = false,
  ...props
}: FooterProps) => {
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
        {showSectionNav ? (
          <>
            <nav
              aria-label="Footer"
              className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1"
            >
              {[...SECTION_NAV, BLOG_NAV].map((item) => (
                <AnchorLink
                  key={item.label}
                  href={item.href}
                  className={NAV_LINK_CLASS}
                >
                  {item.label}
                </AnchorLink>
              ))}
            </nav>
            <SocialLinks className="flex-center gap-1 text-2xl" />
          </>
        ) : (
          /* A lone centered link looks stranded; group it with the socials */
          <div className="flex items-center gap-5">
            <AnchorLink href={BLOG_NAV.href} className={NAV_LINK_CLASS}>
              {BLOG_NAV.label}
            </AnchorLink>
            <SocialLinks className="flex-center gap-1 text-2xl" />
          </div>
        )}
      </div>
    </footer>
  );
};

export default Footer;

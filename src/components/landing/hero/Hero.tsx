import AnchorLink from "@/components/common/AnchorLink";
import SocialLinks from "@/components/common/SocialLinks";
import HeroLeading from "@/components/landing/hero/HeroLeading";
import HeroPortrait from "@/components/landing/hero/HeroPortrait";
import HeroRoles from "@/components/landing/hero/HeroRoles";
import HeroWaves from "@/components/landing/hero/HeroWaves";
import { Portfolio } from "@/constants/meta";
import classNames from "classnames";

/*
 * Deliberately no CTAs: the page is a narrative meant to be scrolled and
 * read in order, so nothing invites skipping ahead or leaving early. The
 * drifting chevron is the only "there is more below" nudge.
 */
const Hero = () => {
  /* Toggle in src/constants/meta.ts: "portrait" | "text" */
  const withPortrait = Portfolio.HERO_LAYOUT === "portrait";

  return (
    <section className="band flex min-h-[78svh] items-center overflow-hidden">
      <div className="pt-header-height relative z-2 container pb-28">
        <div
          className={classNames(
            "grid grid-cols-1 items-center gap-12",
            withPortrait && "lg:grid-cols-[1.15fr_auto]"
          )}
        >
          <div
            className={classNames(
              !withPortrait && "mx-auto max-w-2xl text-center"
            )}
          >
            <HeroLeading />
            <HeroRoles
              align={withPortrait ? "start" : "center"}
              className="text-theme-on-band-dim animate-rise-in mt-3 [animation-delay:1.2s]"
            />
            <p
              className={classNames(
                "animate-rise-in text-theme-on-band-dim mt-6 max-w-xl font-serif text-lg italic [animation-delay:1.35s]",
                !withPortrait && "mx-auto"
              )}
            >
              Front-end engineer by day, open source and game modding enthusiast
              by night.
            </p>
            <SocialLinks
              className={classNames(
                "animate-rise-in mt-8 flex items-center gap-4 text-3xl [animation-delay:1.5s]",
                !withPortrait && "justify-center"
              )}
            />
          </div>
          {withPortrait && (
            <HeroPortrait className="animate-rise-in hidden w-72 [animation-delay:1.2s] lg:block xl:w-80" />
          )}
        </div>
      </div>

      <AnchorLink
        href="/#about"
        aria-label="Continue to the content"
        className="animate-rise-in absolute bottom-28 left-1/2 z-2 -translate-x-1/2 [animation-delay:1.8s]"
      >
        <span className="animate-scroll-cue text-theme-on-band-dim block">
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </AnchorLink>

      <HeroWaves className="hero__waves absolute inset-x-0 bottom-0 z-1 h-24" />
    </section>
  );
};

export default Hero;

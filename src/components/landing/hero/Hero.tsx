import AnchorLink from "@/components/common/AnchorLink";
import SocialLinks from "@/components/common/SocialLinks";
import HeroLeading from "@/components/landing/hero/HeroLeading";
import HeroPortrait from "@/components/landing/hero/HeroPortrait";
import HeroRoles from "@/components/landing/hero/HeroRoles";
import HeroWaves from "@/components/landing/hero/HeroWaves";
import { Portfolio } from "@/constants/meta";
import classNames from "classnames";
import Link from "next/link";

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
            <div
              className={classNames(
                "animate-rise-in mt-8 flex flex-wrap items-center gap-3 [animation-delay:1.5s]",
                !withPortrait && "justify-center"
              )}
            >
              <Link
                href="/blog"
                className="bg-theme-on-band inline-flex items-center gap-1.5 rounded-lg px-5 py-2.5 font-semibold text-(--band-b) shadow-md transition-all duration-200 hover:bg-[color-mix(in_srgb,var(--on-band)_82%,var(--band-b))] hover:shadow-lg"
              >
                Read the blog <span aria-hidden="true">✍️</span>
              </Link>
              <AnchorLink
                href="/#projects"
                className="text-theme-on-band inline-flex items-center gap-1.5 rounded-lg border border-[color-mix(in_srgb,var(--on-band)_45%,transparent)] px-5 py-2.5 font-semibold transition-all duration-200 hover:border-(--on-band) hover:bg-[color-mix(in_srgb,var(--on-band)_12%,transparent)]"
              >
                See my work <span aria-hidden="true">💻</span>
              </AnchorLink>
            </div>
            <SocialLinks
              className={classNames(
                "animate-rise-in mt-8 flex items-center gap-4 text-3xl [animation-delay:1.65s]",
                !withPortrait && "justify-center"
              )}
            />
          </div>
          {withPortrait && (
            <HeroPortrait className="animate-rise-in hidden w-72 [animation-delay:1.2s] lg:block xl:w-80" />
          )}
        </div>
      </div>

      <HeroWaves className="hero__waves absolute inset-x-0 bottom-0 z-1 h-24" />
    </section>
  );
};

export default Hero;

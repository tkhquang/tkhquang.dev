import AnchorLink from "@/components/common/AnchorLink";
import SocialLinks from "@/components/common/SocialLinks";
import HeroLeading from "@/components/landing/hero/HeroLeading";
import HeroPortrait from "@/components/landing/hero/HeroPortrait";
import HeroRoles from "@/components/landing/hero/HeroRoles";
import HeroWaves from "@/components/landing/hero/HeroWaves";
import Link from "next/link";

const Hero = () => {
  return (
    <section className="band flex min-h-[78svh] items-center overflow-hidden">
      <div className="pt-header-height relative z-[2] container pb-28">
        <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_auto]">
          <div>
            <HeroLeading />
            <HeroRoles className="text-theme-on-band-dim animate-rise-in mt-3 [animation-delay:0.2s]" />
            <p className="animate-rise-in text-theme-on-band-dim mt-6 max-w-xl font-serif text-lg italic [animation-delay:0.35s]">
              Front-end engineer by day, open source and game modding enthusiast
              by night.
            </p>
            <div className="animate-rise-in mt-8 flex flex-wrap items-center gap-3 [animation-delay:0.5s]">
              <Link
                href="/blog"
                className="bg-theme-on-band inline-flex items-center gap-1.5 rounded-lg px-5 py-2.5 font-semibold text-(--band-b) shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
              >
                Read the blog <span aria-hidden="true">✍️</span>
              </Link>
              <AnchorLink
                href="/#projects"
                className="text-theme-on-band inline-flex items-center gap-1.5 rounded-lg border border-[color-mix(in_srgb,var(--on-band)_45%,transparent)] px-5 py-2.5 font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:border-(--on-band)"
              >
                See my work <span aria-hidden="true">💻</span>
              </AnchorLink>
            </div>
            <SocialLinks className="animate-rise-in mt-8 flex items-center gap-4 text-3xl [animation-delay:0.65s]" />
          </div>
          <HeroPortrait className="animate-rise-in hidden w-72 [animation-delay:0.3s] lg:block xl:w-80" />
        </div>
      </div>

      <HeroWaves className="hero__waves absolute inset-x-0 bottom-0 z-1 h-24" />
    </section>
  );
};

export default Hero;

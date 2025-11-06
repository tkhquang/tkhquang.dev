import SocialLinks from "@/components/common/SocialLinks";
import HeroLeading from "@/components/landing/hero/HeroLeading";
import HeroRoles from "@/components/landing/hero/HeroRoles";
import HeroWaves from "@/components/landing/hero/HeroWaves";
import clsx from "clsx";

const Hero = () => {
  return (
    <section
      className={clsx(
        "flex-center text-theme-on-primary-light relative min-h-[600px] overflow-hidden",
        "animate-hero-height transform-gpu will-change-[min-height]",
        "before:from-theme-tone before:to-theme-on-background-light before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:block before:h-full before:min-h-screen before:bg-linear-to-br before:content-['']"
      )}
    >
      <div className="flex-center h-full flex-col items-center justify-center pb-24 transition-all duration-500">
        <HeroLeading className="mx-auto" />
        <HeroRoles />
        <SocialLinks
          className="flex-center animate-fade-in-forwards h-0 gap-2 overflow-hidden text-3xl opacity-0 lg:mt-10 lg:text-5xl"
          style={{
            animationDelay: "1.5s",
          }}
        />
      </div>

      <HeroWaves className="hero__waves absolute inset-x-0 bottom-0 z-1 h-24" />
    </section>
  );
};

export default Hero;

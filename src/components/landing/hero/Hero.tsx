import HeroWaves from "@/components/landing/hero/HeroWaves";
import HeroRoles from "@/components/landing/hero/HeroRoles";
import HeroLeading from "@/components/landing/hero/HeroLeading";
import SocialLinks from "@/components/common/SocialLinks";

const Hero = () => {
  return (
    <section className="flex-center relative min-h-[600px] animate-hero-height overflow-hidden text-theme-on-primary-light before:pointer-events-none before:absolute before:left-0 before:right-0 before:top-0 before:block before:h-full before:min-h-screen before:bg-gradient-to-br before:from-theme-tone before:to-theme-on-background-light before:content-['']">
      <div className="flex-center h-full flex-col items-center justify-center pb-24 transition-all duration-500">
        <HeroLeading className="mx-auto" />
        <HeroRoles />
        <SocialLinks
          className="flex-center flex-gap-8 h-0 animate-fade-in-forwards overflow-hidden text-3xl opacity-0 lg:mt-10 lg:text-5xl"
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
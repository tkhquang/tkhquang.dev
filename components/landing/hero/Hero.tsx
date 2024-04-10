import HeroWaves from "@/components/landing/hero/HeroWaves";
import HeroSocialLinks from "@/components/landing/hero/HeroSocialLinks";
import HeroRoles from "@/components/landing/hero/HeroRoles";
import HeroLeading from "@/components/landing/hero/HeroLeading";

const Hero = () => {
  return (
    <section className="relative flex-center animate-hero-height min-h-[600px] overflow-hidden text-theme-on-primary-light before:absolute before:block before:content-[''] before:top-0 before:left-0 before:right-0 before:min-h-screen before:h-full before:bg-gradient-to-br before:from-theme-tone before:to-theme-on-background-light before:pointer-events-none">
      <div className="flex-center flex-col items-center justify-center h-full pb-24 transition-all duration-500">
        <HeroLeading className="mx-auto" />
        <HeroRoles className="mt-10" />
        <HeroSocialLinks className="flex-center text-3xl lg:text-5xl lg:mt-10 flex-gap-8 h-0 opacity-0 overflow-hidden animate-[fade-in_1s_1.5s_linear_forwards]" />
      </div>

      <HeroWaves className="hero__waves absolute bottom-0 inset-x-0 h-24 z-1" />
    </section>
  );
};

export default Hero;

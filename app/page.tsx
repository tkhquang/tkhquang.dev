import Image from "next/image";

export default function Home() {
  return (
    <section className="relative flex-center animate-hero-height min-h-[600px] overflow-hidden">
      <div className="flex-center flex-col items-center justify-center h-full pb-24 transition-all duration-500">
        <h1 className="mx-auto text-4xl lg:text-6xl font-bold leading-loose">
          Hello<span>, I&apos;m Aleks!</span>
        </h1>
        <div className="roles text-xl lg:text-4xl font-medium h-10">
          <div className="h-0 opacity-0 leading-none transition-all duration-500 text-center">
            x
          </div>
        </div>
      </div>
    </section>
  );
}

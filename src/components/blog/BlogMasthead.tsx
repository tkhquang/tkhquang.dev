import AuroraCanvas from "@/components/blog/AuroraCanvas";
import { DEFAULT_LOCALE } from "@/lib/i18n";
import { getIntl } from "@/lib/intl";
import { toRoman } from "@/utils/roman";
import Link from "next/link";
import { FiArrowUpRight } from "react-icons/fi";

interface BlogMastheadProps {
  totalPosts: number;
  shelfCount: number;
  /* Print-masthead years: volume increments each new calendar year */
  volume: number;
}

/* Ljóss is Old Norse for light: the masthead sky carries a live aurora */
const BlogMasthead = ({
  shelfCount,
  totalPosts,
  volume,
}: BlogMastheadProps) => {
  const intl = getIntl(DEFAULT_LOCALE);

  return (
    /* Pulled under the transparent header so the sky runs behind it.
       data-masthead is the handle BlogHeader watches: the header stays
       transparent for exactly as long as this section is behind it. */
    <section
      className="band band--day -mt-header-height pt-header-height relative overflow-hidden"
      data-masthead
    >
      {/* The sky wrapper must fill the section: the canvas inside positions
          against inset-0, and once this wrapper animates its transform it
          becomes the canvas's containing block, which is also the box the
          flare measures pointer moves against. The blend lives HERE, not
          only on the canvas: the scroll-driven transform makes this wrapper
          a stacking context that would isolate a canvas-level screen blend
          from the band gradient, so the wrapper screens the whole group
          onto the band instead, which composites identically at rest and
          mid-scrub.
          Scroll choreography in _zz_overrides.css. */}
      <div
        className="masthead-sky light:mix-blend-normal absolute inset-0 mix-blend-screen"
        aria-hidden
      >
        <AuroraCanvas />
      </div>
      {/* Dissolve into the page background instead of ending on a hard edge */}
      <div
        className="to-theme-background pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-linear-to-b from-transparent"
        aria-hidden
      />
      {/* A taller twin of the dissolve that thickens the horizon as the
          sky sinks away; invisible at rest */}
      <div
        className="masthead-veil pointer-events-none absolute inset-x-0 bottom-0"
        aria-hidden
      />
      {/* Selectable, so the copy stays copyable; the aurora's flare hears
          moves over it anyway because its listener sits on the section,
          which both this block and the sky underneath bubble up to */}
      <div className="masthead-set relative z-1 mx-auto max-w-xl px-4 py-14 sm:px-6 lg:max-w-(--breakpoint-xl) lg:px-8 lg:py-16">
        {/* The byline is the same door home as the header's, so it carries
            the same arrow. The opacity sits on the two halves rather than
            on the line, since a nested opacity can only dim a child, never
            let it brighten back to full on hover */}
        <span className="kicker text-theme-on-band mb-2 block opacity-100">
          {/* A real space, not a flex gap: the line is selectable, so what
              gets copied has to read as a sentence */}
          <span className="opacity-80">The blog ·</span>{" "}
          <Link
            href="/"
            className="inline-flex items-center gap-1 opacity-80 transition-opacity hover:opacity-100"
          >
            by Aleks
            <FiArrowUpRight aria-hidden className="size-3" />
          </Link>
        </span>
        <h1 className="blog-masthead__title text-theme-on-band text-5xl leading-tight lg:text-6xl">
          Ljóss
        </h1>
        <span
          className="bg-theme-on-band/45 mt-3 block h-0.5 w-16 rounded"
          aria-hidden
        />
        <p className="text-theme-on-band-dim mt-4 max-w-2xl font-serif text-lg italic">
          Devlogs, deep dives, and whatever I broke this month.
        </p>
        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-1">
          <span className="kicker text-theme-on-band tabular-nums">
            {intl.formatMessage({ id: "postCount" }, { count: totalPosts })}
          </span>
          <span className="kicker text-theme-on-band tabular-nums">
            {intl.formatMessage({ id: "shelfCount" }, { count: shelfCount })}
          </span>
          <span className="kicker text-theme-on-band">
            Vol. {toRoman(volume)}
          </span>
        </div>
      </div>
    </section>
  );
};

export default BlogMasthead;

import AuroraCanvas from "@/components/blog/AuroraCanvas";

interface BlogMastheadProps {
  totalPosts: number;
  sinceYear: number;
  shelfCount: number;
}

/* Ljóss is Old Norse for light: the masthead sky carries a live aurora */
const BlogMasthead = ({
  shelfCount,
  sinceYear,
  totalPosts,
}: BlogMastheadProps) => {
  return (
    /* Pulled under the transparent header so the sky runs behind it */
    <section className="band band--day -mt-header-height pt-header-height relative overflow-hidden">
      {/* The sky wrapper must fill the section: the canvas inside positions
          against inset-0, and once this wrapper animates its transform it
          becomes the canvas's containing block. It also inherits the
          canvas's pointer listeners as the new parent, so it stays
          pointer-events auto. The blend lives HERE, not only on the canvas:
          the scroll-driven transform makes this wrapper a stacking context
          that would isolate a canvas-level screen blend from the band
          gradient, so the wrapper screens the whole group onto the band
          instead, which composites identically at rest and mid-scrub.
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
      {/* No links live here, so pointer-events-none lets the aurora's
          flare keep hearing moves over the text now that its listener
          host is the sky wrapper underneath */}
      <div className="masthead-set pointer-events-none relative z-1 mx-auto max-w-xl px-4 py-14 sm:px-6 lg:max-w-(--breakpoint-xl) lg:px-8 lg:py-16">
        <span className="kicker text-theme-on-band mb-2 block opacity-80">
          The blog · by Aleks
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
            {totalPosts} posts
          </span>
          <span className="kicker text-theme-on-band tabular-nums">
            {shelfCount} shelves
          </span>
          <span className="kicker text-theme-on-band tabular-nums">
            writing since {sinceYear}
          </span>
        </div>
      </div>
    </section>
  );
};

export default BlogMasthead;

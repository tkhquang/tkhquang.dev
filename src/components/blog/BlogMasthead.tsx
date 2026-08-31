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
      <AuroraCanvas />
      {/* Dissolve into the page background instead of ending on a hard edge */}
      <div
        className="to-theme-background pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-linear-to-b from-transparent"
        aria-hidden
      />
      <div className="relative z-1 mx-auto max-w-xl px-4 py-14 sm:px-6 lg:max-w-(--breakpoint-xl) lg:px-8 lg:py-16">
        <span className="kicker text-theme-on-band mb-2 block opacity-80">
          The blog · by Aleks
        </span>
        <h1 className="blog-masthead__title text-theme-on-band text-5xl leading-tight font-extrabold tracking-tight lg:text-6xl">
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

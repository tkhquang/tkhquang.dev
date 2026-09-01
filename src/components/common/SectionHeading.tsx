import classNames from "classnames";

interface SectionHeadingProps
  extends Omit<React.ComponentProps<"div">, "title"> {
  title: React.ReactNode;
  kicker?: string;
  emoji?: string;
  intro?: string;
  /** "band" renders on-band ink for use inside gradient bands */
  tone?: "default" | "band";
  /** Heading level; the visual style is carried by `size`, not the tag */
  as?: "h1" | "h2";
  size?: "section" | "subsection";
  /**
   * "full" spans the container like the old heading--section hairline; use
   * it on flat pages where the rule is what separates sections. The
   * homepage's alternating backgrounds make the short rule enough there.
   */
  rule?: "short" | "full";
}

const SectionHeading = ({
  as: Heading = "h2",
  className,
  emoji,
  intro,
  kicker,
  rule = "short",
  size = "section",
  title,
  tone = "default",
  ...props
}: SectionHeadingProps) => {
  const onBand = tone === "band";

  return (
    <div className={classNames("mb-10", className)} {...props}>
      {kicker && (
        <span
          className={classNames(
            "kicker mb-2 block",
            onBand ? "text-theme-on-band" : "text-theme-primary"
          )}
        >
          {kicker}
        </span>
      )}
      <Heading
        className={classNames(
          "relative leading-tight font-bold tracking-tight",
          size === "section" ? "text-section" : "text-subsection",
          onBand ? "text-theme-on-band" : "text-theme-primary"
        )}
      >
        {title}
        {emoji && (
          <>
            {" "}
            <span aria-hidden="true">{emoji}</span>
          </>
        )}
      </Heading>
      <span
        className={classNames(
          "mt-3 block rounded",
          rule === "full" ? "h-px w-full" : "h-0.5 w-16",
          onBand
            ? rule === "full"
              ? "bg-theme-on-band/25"
              : "bg-theme-on-band/45"
            : rule === "full"
              ? "bg-theme-primary/25"
              : "bg-theme-primary/45"
        )}
        aria-hidden="true"
      />
      {intro && (
        <p className="mt-4 max-w-2xl font-serif italic opacity-85">{intro}</p>
      )}
    </div>
  );
};

export default SectionHeading;

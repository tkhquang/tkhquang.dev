import classNames from "classnames";

interface SectionHeadingProps extends React.ComponentProps<"div"> {
  title: string;
  kicker?: string;
  emoji?: string;
  intro?: string;
  /** "band" renders on-band ink for use inside gradient bands */
  tone?: "default" | "band";
  /** Heading level; the visual style is carried by `size`, not the tag */
  as?: "h1" | "h2";
  size?: "section" | "subsection";
}

const SectionHeading = ({
  as: Heading = "h2",
  className,
  emoji,
  intro,
  kicker,
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
          "mt-3 block h-0.5 w-16 rounded",
          onBand ? "bg-theme-on-band/45" : "bg-theme-primary/45"
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

import classNames from "classnames";

interface SectionHeadingProps extends React.ComponentProps<"div"> {
  kicker: string;
  title: string;
  emoji?: string;
  intro?: string;
  /** "band" renders on-band ink for use inside gradient bands */
  tone?: "default" | "band";
}

/**
 * Shared section header: kicker eyebrow, primary-colored heading with the
 * site's trailing-emoji voice, and a short rule instead of the old
 * full-container hairline.
 */
const SectionHeading = ({
  className,
  emoji,
  intro,
  kicker,
  title,
  tone = "default",
  ...props
}: SectionHeadingProps) => {
  const onBand = tone === "band";

  return (
    <div className={classNames("mb-10", className)} {...props}>
      <span
        className={classNames(
          "kicker mb-2 block",
          onBand ? "text-theme-on-band" : "text-theme-primary"
        )}
      >
        {kicker}
      </span>
      <h2
        className={classNames(
          "text-section relative leading-tight font-bold tracking-tight",
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
      </h2>
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

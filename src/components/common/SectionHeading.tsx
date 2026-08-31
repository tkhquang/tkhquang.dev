import classNames from "classnames";

interface SectionHeadingProps extends React.ComponentProps<"div"> {
  kicker: string;
  title: string;
  emoji?: string;
  intro?: string;
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
  ...props
}: SectionHeadingProps) => {
  return (
    <div className={classNames("mb-10", className)} {...props}>
      <span className="kicker text-theme-primary mb-2 block">{kicker}</span>
      <h2 className="heading text-section">
        {title}
        {emoji && (
          <>
            {" "}
            <span aria-hidden="true">{emoji}</span>
          </>
        )}
      </h2>
      <span
        className="bg-theme-primary/45 mt-3 block h-0.5 w-16 rounded"
        aria-hidden="true"
      />
      {intro && (
        <p className="mt-4 max-w-2xl font-serif italic opacity-85">{intro}</p>
      )}
    </div>
  );
};

export default SectionHeading;

import classNames from "classnames";

const TYPED = ", I'm Aleks!";
const TYPE_START_S = 0.6;
const TYPE_TOTAL_S = 0.5;

const HeroLeading = ({ className, ...props }: React.ComponentProps<"h1">) => {
  return (
    <h1
      className={classNames(
        "animate-hero-leading text-display my-0 font-extrabold tracking-tight whitespace-nowrap",
        className
      )}
      {...props}
    >
      Hello
      <span className="relative inline-block align-bottom whitespace-nowrap">
        <span
          className="animate-caret-wait absolute right-full bottom-[0.21em] h-[0.8em] w-[0.1em] rounded-sm bg-current"
          aria-hidden="true"
        />
        {/* Split for the per-letter pops; the sr-only copy keeps screen
            readers from spelling the name out letter by letter */}
        <span className="sr-only">{TYPED}</span>
        <span aria-hidden="true">
          {TYPED.split("").map((letter, index) => (
            <span
              key={index}
              className="animate-letter-pop"
              style={{
                animationDelay: `${(
                  TYPE_START_S +
                  ((index + 1) * TYPE_TOTAL_S) / TYPED.length
                ).toFixed(3)}s`,
              }}
            >
              {letter === " " ? " " : letter}
            </span>
          ))}
        </span>
      </span>
      <span
        className="animate-caret-done ml-1.5 inline-block h-[0.8em] w-[0.1em] rounded-sm bg-current align-baseline opacity-0"
        aria-hidden="true"
      />
    </h1>
  );
};

export default HeroLeading;

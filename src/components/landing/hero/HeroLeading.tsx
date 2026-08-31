import classNames from "classnames";

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
      <span className="animate-typing-window relative inline-block overflow-hidden align-bottom whitespace-nowrap">
        {/* The padding reserves the caret's slot: window and text keep
            identical widths, which the wipe pair needs to stay in sync */}
        <span className="animate-typing-text inline-block pr-[calc(0.375rem+0.1em)]">
          , I&apos;m Aleks!
        </span>
        {/* Absolute so it adds no width, at the edge so it rides the wipe */}
        <span
          className="animate-caret absolute right-0 bottom-[0.21em] h-[0.8em] w-[0.1em] rounded-sm bg-current"
          aria-hidden="true"
        />
      </span>
    </h1>
  );
};

export default HeroLeading;

import classNames from "classnames";

const HeroLeading = ({ className, ...props }: React.ComponentProps<"h1">) => {
  return (
    <h1
      className={classNames(
        "animate-rise-in text-display my-0 font-extrabold tracking-tight whitespace-nowrap",
        className
      )}
      {...props}
    >
      Hello
      <span className="animate-typing inline-block overflow-hidden align-bottom whitespace-nowrap">
        , I&apos;m Aleks!
      </span>
      <span
        className="animate-caret ml-1.5 inline-block h-[0.8em] w-[0.1em] rounded-sm bg-current align-baseline"
        aria-hidden="true"
      />
    </h1>
  );
};

export default HeroLeading;

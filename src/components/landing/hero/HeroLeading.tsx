import classNames from "classnames";

const HeroLeading = ({ className, ...props }: React.ComponentProps<"h1">) => {
  return (
    <h1
      className={classNames(
        "my-0 animate-fade-in-forwards overflow-hidden whitespace-nowrap text-center text-4xl font-bold leading-loose! lg:text-6xl",
        className
      )}
      {...props}
    >
      Hello
      <span className="inline-block w-0 animate-typing text-left">
        , I&apos;m Aleks!
      </span>
    </h1>
  );
};

export default HeroLeading;

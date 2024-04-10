import classNames from "classnames";

const HeroLeading = ({ className, ...props }: React.ComponentProps<"h1">) => {
  return (
    <h1
      className={classNames(
        "text-4xl lg:text-6xl font-bold leading-loose overflow-hidden whitespace-nowrap my-0 text-center animate-fade-in",
        className,
      )}
      {...props}
    >
      Hello
      <span className="text-left animate-[typing_0.5s_steps(20,end)_forwards_1s] inline-block w-0">
        , I&apos;m Aleks!
      </span>
    </h1>
  );
};

export default HeroLeading;

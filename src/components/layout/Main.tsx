import classNames from "classnames";

const Main = ({
  children,
  className,
  ...props
}: React.ComponentProps<"main">) => {
  return (
    <main
      {...props}
      className={classNames("relative flex flex-col", className)}
    >
      {children}
    </main>
  );
};

export default Main;

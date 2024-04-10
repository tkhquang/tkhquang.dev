import classNames from "classnames";

const Footer = ({
  className,
  children,
  ...props
}: React.ComponentProps<"footer">) => {
  return (
    <footer {...props} className={classNames(className, "min-h-screen")}>
      {children}
    </footer>
  );
};

export default Footer;

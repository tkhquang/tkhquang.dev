import classNames from "classnames";

interface HeroRolesProps extends React.ComponentProps<"div"> {
  align?: "start" | "center";
}

const HeroRoles = ({
  align = "start",
  className,
  ...props
}: HeroRolesProps) => {
  return (
    <div
      className={classNames(
        "roles flex min-h-10 items-center text-xl font-medium lg:text-3xl",
        align === "center" ? "justify-center" : "justify-start",
        className
      )}
      {...props}
    >
      <span>
        Software Engineer <span aria-hidden="true">💻</span>
      </span>
    </div>
  );
};

export default HeroRoles;

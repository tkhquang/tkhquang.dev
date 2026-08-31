import HeroRolesContent from "@/components/landing/hero/HeroRolesContent";
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
      className={classNames("roles text-xl font-medium lg:text-3xl", className)}
      {...props}
    >
      <HeroRolesContent align={align} />
    </div>
  );
};

export default HeroRoles;

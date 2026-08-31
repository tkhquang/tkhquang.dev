import HeroRolesContent from "@/components/landing/hero/HeroRolesContent";
import classNames from "classnames";

const HeroRoles = ({ className, ...props }: React.ComponentProps<"div">) => {
  return (
    <div
      className={classNames("roles text-xl font-medium lg:text-3xl", className)}
      {...props}
    >
      <HeroRolesContent />
    </div>
  );
};

export default HeroRoles;

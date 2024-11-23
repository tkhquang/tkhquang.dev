import HeroRolesContent from "@/components/landing/hero/HeroRolesContent";

const HeroRoles = ({ className, ...props }: React.ComponentProps<"div">) => {
  return (
    <div
      className="roles text-xl lg:text-4xl font-medium h-0 overflow-hidden opacity-0 animate-fade-in-forwards"
      style={{
        animationDelay: "1.5s",
      }}
      {...props}
    >
      <HeroRolesContent />
    </div>
  );
};

export default HeroRoles;

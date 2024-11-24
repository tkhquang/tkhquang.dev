import HeroRolesContent from "@/components/landing/hero/HeroRolesContent";

const HeroRoles = ({ className, ...props }: React.ComponentProps<"div">) => {
  return (
    <div
      className="roles h-0 animate-fade-in-forwards overflow-hidden text-xl font-medium opacity-0 lg:text-4xl"
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

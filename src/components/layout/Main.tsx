import { cn } from "@/utils/css";

const Main = ({
  children,
  className,
  ...props
}: React.ComponentProps<"main">) => {
  return (
    <main {...props} className={cn("relative flex flex-col", className)}>
      {children}
    </main>
  );
};

export default Main;

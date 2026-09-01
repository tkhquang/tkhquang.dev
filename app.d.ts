declare module "*.scss" {
  const content: Record<string, string>;
  export default content;
}

declare module "*.css" {
  const content: Record<string, string>;
  export default content;
}

/* React's ViewTransition component ships in the react channel Next bundles,
   but @types/react 19.2.x does not declare it yet. The empty import makes
   this file a module so the block below augments instead of replacing. */
import "react";

declare module "react" {
  interface ViewTransitionProps {
    children?: import("react").ReactNode;
    name?: string;
  }

  const ViewTransition: import("react").ComponentType<ViewTransitionProps>;
}

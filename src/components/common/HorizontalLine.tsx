import classNames from "classnames";
import React from "react";

const HorizontalLine = ({
  className,
  ...props
}: React.ComponentProps<"div">) => {
  return (
    <div
      className={classNames(
        "horizontal-line mx-0 h-px w-full border-0",
        className
      )}
      aria-hidden="true"
      {...props}
    />
  );
};

export default HorizontalLine;

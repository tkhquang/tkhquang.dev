import React from "react";
import "./LoaderLines.scss";

const LoaderLines = () => {
  return (
    <div
      className="loader flex-center absolute size-full overflow-hidden"
      aria-hidden="true"
    >
      <div className="loader__line"></div>
      <div className="loader__line"></div>
      <div className="loader__line"></div>
      <div className="loader__line"></div>
      <div className="loader__line"></div>
    </div>
  );
};

export default LoaderLines;

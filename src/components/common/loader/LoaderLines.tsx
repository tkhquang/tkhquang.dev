import "./LoaderLines.scss";
import React from "react";

const LoaderLines = () => {
  return (
    <div
      className="loader flex-center pointer-events-none absolute size-full overflow-hidden"
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

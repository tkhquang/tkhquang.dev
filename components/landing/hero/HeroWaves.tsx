import classnames from "classnames";

const LandingWaves = ({ className, ...props }: React.ComponentProps<"svg">) => {
  const classNames = classnames(
    "waves w-full transition-[opacity_0.5s_linear]",
    className,
  );

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      height="70"
      aria-hidden="true"
      className={classNames}
      preserveAspectRatio="none"
      viewBox="0 0 54 14"
      style={{
        transform: "matrix(1, 0, 0, -1, 0, 0)",
      }}
      {...props}
    >
      <defs>
        <linearGradient id="landing-hero-waves-gradient" x2="0%" y2="100%">
          <stop offset="0%" stopColor="var(--background)"></stop>
          <stop offset="100%" stopColor="var(--darken)"></stop>
        </linearGradient>
      </defs>
      <path fill="url(#landing-hero-waves-gradient)">
        <animate
          attributeName="d"
          values="M 27 10C 21 8 14 3 0 3L 0 0L 54 0L 54 14C 40 14 33 12 27 10Z;M 27 14C 12 14 5 7 0 7L 0 0L 54 0L 54 7C 49 7 42 14 27 14Z;M 27 10C 21 12 14 14 0 14L 0 0L 54 0L 54 3C 40 3 33 8 27 10Z;M 27 14C 12 14 5 7 0 7L 0 0L 54 0L 54 7C 49 7 42 14 27 14Z;M 27 10C 21 8 14 3 0 3L 0 0L 54 0L 54 14C 40 14 33 12 27 10Z"
          repeatCount="indefinite"
          dur="15s"
        ></animate>
      </path>
    </svg>
  );
};

export default LandingWaves;

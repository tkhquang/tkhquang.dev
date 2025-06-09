import { ThemeMode, themeStore } from "@/store/theme";
import { useAtomValue } from "jotai";
import { animated, useSpring } from "react-spring";

const properties = {
  dark: {
    cx: 12,
    cy: 4,
    opacity: 0,
    r: 9,
    transform: "rotate(40deg)",
  },
  light: {
    cx: 30,
    cy: 0,
    opacity: 1,
    r: 5,
    transform: "rotate(90deg)",
  },
  springConfig: { friction: 35, mass: 4, tension: 250 },
};

const AnimatedIcon = ({ mode }: { mode: ThemeMode }) => {
  const isDarkMode = mode === "dark";

  const { cx, cy, opacity, r, transform } =
    properties[isDarkMode ? "dark" : "light"];

  const svgContainerProps = useSpring({
    config: properties.springConfig,
    transform,
  });
  const centerCircleProps: any = useSpring({
    config: properties.springConfig,
    r,
  });
  const maskedCircleProps: any = useSpring({
    config: properties.springConfig,
    cx,
    cy,
  });
  const linesProps = useSpring({ config: properties.springConfig, opacity });

  return (
    <animated.svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      stroke="currentColor"
      style={{
        cursor: "pointer",
        ...svgContainerProps,
      }}
    >
      <mask id="animated-icon-mask-1">
        <rect x="0" y="0" width="100%" height="100%" fill="white" />
        <animated.circle style={maskedCircleProps} r="9" fill="black" />
      </mask>

      <animated.circle
        cx="12"
        cy="12"
        style={centerCircleProps}
        fill="white"
        mask="url(#animated-icon-mask-1)"
      />
      <animated.g stroke="currentColor" style={linesProps}>
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </animated.g>
    </animated.svg>
  );
};

const ThemeToggle = () => {
  const theme = useAtomValue(themeStore);

  const switchTheme = () => {
    window.__setPreferredTheme(theme.mode === "light" ? "dark" : "light");
  };

  return (
    <button
      type="button"
      aria-label="Toggle dark/light"
      className="toggle-theme cursor-pointer border-none bg-transparent hover:opacity-75 focus:outline-none"
      onClick={switchTheme}
    >
      <AnimatedIcon mode={theme.mode} />
    </button>
  );
};

export default ThemeToggle;

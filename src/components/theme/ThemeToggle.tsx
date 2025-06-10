import { ThemeMode, useThemeValue } from "@/store/theme";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef } from "react";

// Register the hook to avoid React version discrepancies
gsap.registerPlugin(useGSAP);

const properties = {
  dark: {
    cx: 12,
    cy: 4,
    opacity: 0,
    r: 9,
    rotation: 40,
  },
  light: {
    cx: 30,
    cy: 0,
    opacity: 1,
    r: 5,
    rotation: 90,
  },
};

const AnimatedIcon = ({ mode }: { mode: ThemeMode }) => {
  const initialProperties = properties[mode];

  // Create refs for animated elements
  const svgRef = useRef(null);
  const maskedCircleRef = useRef(null);
  const centerCircleRef = useRef(null);
  const linesRef = useRef(null);

  useGSAP(() => {
    const target = properties[mode];

    gsap.to(svgRef.current, {
      rotation: target.rotation,
      duration: 0.5,
      ease: "power2.out",
    });

    gsap.to(maskedCircleRef.current, {
      attr: { cx: target.cx, cy: target.cy },
      duration: 0.5,
      ease: "power2.out",
    });

    gsap.to(centerCircleRef.current, {
      attr: { r: target.r },
      duration: 0.5,
      ease: "power2.out",
    });

    gsap.to(linesRef.current, {
      opacity: target.opacity,
      duration: 0.5,
      ease: "power2.out",
    });
  }, [mode]);

  return (
    <svg
      ref={svgRef}
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
        transform: `rotate(${initialProperties.rotation}deg)`,
      }}
    >
      <mask id="animated-icon-mask-1">
        <rect x="0" y="0" width="100%" height="100%" fill="white" />
        <circle
          ref={maskedCircleRef}
          cx={initialProperties.cx}
          cy={initialProperties.cy}
          r="9"
          fill="black"
        />
      </mask>

      <circle
        ref={centerCircleRef}
        cx="12"
        cy="12"
        r={initialProperties.r}
        fill="white"
        mask="url(#animated-icon-mask-1)"
      />

      <g
        ref={linesRef}
        stroke="currentColor"
        style={{ opacity: initialProperties.opacity }}
      >
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </g>
    </svg>
  );
};

const ThemeToggle = () => {
  const theme = useThemeValue();

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

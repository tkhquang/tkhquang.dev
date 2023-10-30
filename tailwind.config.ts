import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Adds a new breakpoint in addition to the default breakpoints
      screens: {
        xs: "480px",
      },
      colors: {
        theme: {
          tone: "var(--tone)",
          "tone-1": "var(--tone-1)",
          "tone-2": "var(--tone-2)",
          "tone-3": "var(--tone-3)",
          primary: "var(--primary)",
          "on-primary": "var(--on-primary)",
          secondary: "var(--secondary)",
          "on-secondary": "var(--on-secondary)",
          surface: "var(--surface)",
          "on-surface": "var(--on-surface)",
          background: "var(--background)",
          "on-background": "var(--on-background)",
          darken: "var(--darken)",
          error: "var(--error)",
          success: "var(--success)",
          code: "var(--code)",
        },
      },
      spacing: {
        "2px": "2px",
        "4px": "4px",
        "5px": "5px",
        "header-height": "var(--header-height)",
        "1/2": "50%",
      },
      zIndex: {
        bg: "-1",
        "1": "1",
        "2": "2",
        "3": "3",
        fg: "999",
        header: "1000",
      },
      boxShadow: {
        box: "0 1px 10px 0 rgba(0, 0, 0, 0.20)",
        "box-md": "0 1px 10px 2px rgba(0, 0, 0, 0.30)",
      },
      keyframes: {
        "hero-height": {
          "0%, 50%": {
            "min-height": "calc(100vh + 6rem)",
          },
          "100%": {
            "min-height": "600px",
          },
        },
      },
      animation: {
        "hero-height": "hero-height 1.5s linear",
      },
    },
  },
  plugins: [],
};
export default config;

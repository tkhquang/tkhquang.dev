import type { Config } from "tailwindcss";

const config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: ["selector", '[data-theme="dark"]'],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        xs: "2rem",
      },
    },
    extend: {
      fontFamily: {
        sans: [
          "Montserrat", // Custom added
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          '"Noto Sans"',
          "sans-serif",
          '"Apple Color Emoji"',
          '"Segoe UI Emoji"',
          '"Segoe UI Symbol"',
          '"Noto Color Emoji"',
        ],
        serif: [
          "Merriweather", // Custom added
          "Georgia",
          "Cambria",
          '"Times New Roman"',
          "Times",
          "serif",
        ],
      },
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
          "primary-light": "var(--primary-light)",
          "on-primary-light": "var(--on-primary-light)",
          "secondary-light": "var(--secondary-light)",
          "on-secondary-light": "var(--on-secondary-light)",
          "surface-light": "var(--surface-light)",
          "on-surface-light": "var(--on-surface-light)",
          "background-light": "var(--background-light)",
          "on-background-light": "var(--on-background-light)",
          "darken-light": "var(--darken-light)",
          "error-light": "var(--error-light)",
          "success-light": "var(--success-light)",
          "code-light": "var(--code-light)",
          "primary-dark": "var(--primary-dark)",
          "on-primary-dark": "var(--on-primary-dark)",
          "secondary-dark": "var(--secondary-dark)",
          "on-secondary-dark": "var(--on-secondary-dark)",
          "surface-dark": "var(--surface-dark)",
          "on-surface-dark": "var(--on-surface-dark)",
          "background-dark": "var(--background-dark)",
          "on-background-dark": "var(--on-background-dark)",
          "darken-dark": "var(--darken-dark)",
          "error-dark": "var(--error-dark)",
          "success-dark": "var(--success-dark)",
          "code-dark": "var(--code-dark)",
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
        typing: {
          from: {
            width: "0",
          },
          to: {
            width: "100%",
          },
        },
        "fade-in": {
          from: {
            height: "0",
            opacity: "0",
          },
          to: {
            height: "auto",
            opacity: "1",
          },
        },
      },
      animation: {
        "hero-height": "hero-height 1.5s linear",
        typing: "typing 0.5s steps(20, end) forwards 1s",
        "fade-in": "fade-in 0.3s linear",
        "fade-in-forwards": "fade-in 1s forwards",
      },
    },
  },
  plugins: [],
} satisfies Config;
export default config;

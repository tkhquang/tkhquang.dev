/**
 * @type {import('tailwindcss').Config}
 */
const config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: ["selector", '[data-theme="dark"]'],
  rules: [
    {
      test: /\.scss$/,
      use: ["style-loader", "css-loader", "sass-loader"],
    },
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1.5rem",
        xs: "2rem",
      },
    },
    extend: {
      animation: {
        "fade-in": "fade-in 0.3s linear",
        "fade-in-forwards": "fade-in 1s forwards",
        "hero-height": "hero-height 1.5s linear",
        "music-bar-1": "music-bar-1 .8s linear infinite",
        "music-bar-2": "music-bar-2 .8s linear infinite",
        "music-bar-3": "music-bar-3 .8s linear infinite",
        "music-bar-4": "music-bar-4 .8s linear infinite",
        typing: "typing 0.5s steps(20, end) forwards 1s",
      },
      boxShadow: {
        box: "0 1px 10px 0 rgba(0, 0, 0, 0.20)",
        "box-md": "0 1px 10px 2px rgba(0, 0, 0, 0.30)",
      },
      colors: {
        theme: {
          background: "var(--background)",
          "background-dark": "var(--background-dark)",
          "background-light": "var(--background-light)",
          code: "var(--code)",
          "code-dark": "var(--code-dark)",
          "code-light": "var(--code-light)",
          darken: "var(--darken)",
          "darken-dark": "var(--darken-dark)",
          "darken-light": "var(--darken-light)",
          error: "var(--error)",
          "error-dark": "var(--error-dark)",
          "error-light": "var(--error-light)",
          "on-background": "var(--on-background)",
          "on-background-dark": "var(--on-background-dark)",
          "on-background-light": "var(--on-background-light)",
          "on-primary": "var(--on-primary)",
          "on-primary-dark": "var(--on-primary-dark)",
          "on-primary-light": "var(--on-primary-light)",
          "on-secondary": "var(--on-secondary)",
          "on-secondary-dark": "var(--on-secondary-dark)",
          "on-secondary-light": "var(--on-secondary-light)",
          "on-surface": "var(--on-surface)",
          "on-surface-dark": "var(--on-surface-dark)",
          "on-surface-light": "var(--on-surface-light)",
          primary: "var(--primary)",
          "primary-dark": "var(--primary-dark)",
          "primary-light": "var(--primary-light)",
          secondary: "var(--secondary)",
          "secondary-dark": "var(--secondary-dark)",
          "secondary-light": "var(--secondary-light)",
          success: "var(--success)",
          "success-dark": "var(--success-dark)",
          "success-light": "var(--success-light)",
          surface: "var(--surface)",
          "surface-dark": "var(--surface-dark)",
          "surface-light": "var(--surface-light)",
          tone: "var(--tone)",
          "tone-1": "var(--tone-1)",
          "tone-2": "var(--tone-2)",
          "tone-3": "var(--tone-3)",
        },
      },
      fontFamily: {
        sans: [
          "Montserrat",
          "Montserrat Fallback",
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
          "Merriweather",
          "Merriweather Fallback",
          "Georgia",
          "Cambria",
          '"Times New Roman"',
          "Times",
          "serif",
        ],
        // mono: [
        //   "ui-monospace",
        //   "SFMono-Regular",
        //   "Menlo",
        //   "Monaco",
        //   "Consolas",
        //   "Liberation Mono",
        //   "Courier New",
        //   "monospace",
        // ],
      },
      keyframes: {
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
        "hero-height": {
          "0%, 50%": {
            "min-height": "calc(100vh + 6rem)",
          },
          "100%": {
            "min-height": "600px",
          },
        },
        "music-bar-1": {
          "0%, 100%": { height: "0%" },
          "50%": { height: "70%" },
        },
        "music-bar-2": {
          "0%, 100%": { height: "50%" },
          "25%": { height: "0%" },
          "75%": { height: "100%" },
        },
        "music-bar-3": {
          "0%, 100%": { height: "70%" },
          "15%": { height: "100%" },
          "65%": { height: "0%" },
        },
        "music-bar-4": {
          "0%, 100%": { height: "50%" },
          "35.7%": { height: "0%" },
          "85.7%": { height: "70%" },
        },
        typing: {
          from: {
            width: "0",
          },
          to: {
            width: "100%",
          },
        },
      },
      // Adds a new breakpoint in addition to the default breakpoints
      screens: {
        xs: "480px",
      },
      spacing: {
        "1/2": "50%",
        "2px": "2px",
        "4px": "4px",
        "5px": "5px",
        "header-height": "var(--header-height)",
      },
      zIndex: {
        1: "1",
        2: "2",
        3: "3",
        bg: "-1",
        fg: "999",
        header: "1000",
      },
    },
  },
};

module.exports = config;

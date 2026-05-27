import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.5rem",
        lg: "2rem",
      },
      screens: {
        "2xl": "1280px",
      },
    },
    extend: {
      colors: {
        // Brand palette — derived scales from the Olive Garden Feast palette.
        // Source values: olive #606c38, forest #283618, cornsilk #fefae0,
        // caramel #dda15e, copper #bc6c25. See docs/design-system.md.
        olive: {
          50: "#f5f7ec",
          100: "#e7ecd3",
          200: "#d0d8a9",
          300: "#b3c079",
          400: "#94a553",
          500: "#7a8b43",
          600: "#606c38",
          700: "#4c562d",
          800: "#3d4525",
          900: "#333a20",
          950: "#1c2010",
        },
        forest: {
          50: "#f3f5f0",
          100: "#dfe5d4",
          200: "#bfcbac",
          300: "#9ab081",
          400: "#7a945e",
          500: "#5d7747",
          600: "#475c37",
          700: "#384a2c",
          800: "#2f3d26",
          900: "#283618",
          950: "#15200d",
        },
        cornsilk: {
          50: "#fffef5",
          100: "#fefae0",
          200: "#fcf3bd",
          300: "#f9e98c",
          400: "#f4d957",
          500: "#ecc432",
          600: "#cda517",
          700: "#a17e16",
          800: "#856518",
          900: "#705419",
          950: "#412e08",
        },
        caramel: {
          50: "#fdf8ef",
          100: "#faedd3",
          200: "#f4d8a4",
          300: "#ecbd72",
          400: "#dda15e",
          500: "#d18737",
          600: "#c3702c",
          700: "#a25827",
          800: "#834826",
          900: "#6c3c22",
          950: "#3a1d10",
        },
        copper: {
          50: "#fcf5ec",
          100: "#f7e6cf",
          200: "#eecb9b",
          300: "#e4a861",
          400: "#dc8b3a",
          500: "#cf7625",
          600: "#bc6c25",
          700: "#984e1f",
          800: "#7a3f1f",
          900: "#65351c",
          950: "#3a1a0c",
        },

        // Semantic tokens — read CSS vars set in globals.css.
        // Components MUST use these, not the brand scales directly.
        background: "rgb(var(--background) / <alpha-value>)",
        foreground: "rgb(var(--foreground) / <alpha-value>)",
        surface: {
          DEFAULT: "rgb(var(--surface) / <alpha-value>)",
          muted: "rgb(var(--surface-muted) / <alpha-value>)",
        },
        "foreground-muted": "rgb(var(--foreground-muted) / <alpha-value>)",
        "foreground-subtle": "rgb(var(--foreground-subtle) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
        "border-strong": "rgb(var(--border-strong) / <alpha-value>)",
        ring: "rgb(var(--ring) / <alpha-value>)",
        primary: {
          DEFAULT: "rgb(var(--primary) / <alpha-value>)",
          foreground: "rgb(var(--primary-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          foreground: "rgb(var(--accent-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "rgb(var(--secondary) / <alpha-value>)",
          foreground: "rgb(var(--secondary-foreground) / <alpha-value>)",
        },
        success: {
          DEFAULT: "rgb(var(--success) / <alpha-value>)",
          foreground: "rgb(var(--success-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "rgb(var(--destructive) / <alpha-value>)",
          foreground: "rgb(var(--destructive-foreground) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "ui-serif", "Georgia", "serif"],
      },
      fontSize: {
        // [size, { lineHeight, letterSpacing }] — see docs/design-system.md
        "display-2xl": ["4.5rem", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
        "display-xl": ["3.75rem", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
        "display-lg": ["3rem", { lineHeight: "1.1", letterSpacing: "-0.018em" }],
        "display-md": ["2.25rem", { lineHeight: "1.15", letterSpacing: "-0.015em" }],
        h1: ["1.875rem", { lineHeight: "1.2", letterSpacing: "-0.01em" }],
        h2: ["1.5rem", { lineHeight: "1.25", letterSpacing: "-0.01em" }],
        h3: ["1.25rem", { lineHeight: "1.3", letterSpacing: "-0.005em" }],
        h4: ["1.125rem", { lineHeight: "1.35" }],
        "body-lg": ["1.0625rem", { lineHeight: "1.55" }],
        body: ["1rem", { lineHeight: "1.55" }],
        "body-sm": ["0.875rem", { lineHeight: "1.5" }],
        caption: ["0.8125rem", { lineHeight: "1.45", letterSpacing: "0.005em" }],
        micro: ["0.75rem", { lineHeight: "1.4", letterSpacing: "0.04em" }],
      },
      borderRadius: {
        xs: "4px",
        sm: "6px",
        md: "10px",
        lg: "14px",
        xl: "20px",
      },
      boxShadow: {
        sm: "0 1px 2px 0 rgba(40, 54, 24, 0.05)",
        DEFAULT:
          "0 1px 3px 0 rgba(40, 54, 24, 0.08), 0 1px 2px -1px rgba(40, 54, 24, 0.05)",
        md: "0 4px 6px -1px rgba(40, 54, 24, 0.08), 0 2px 4px -2px rgba(40, 54, 24, 0.05)",
        lg: "0 10px 15px -3px rgba(40, 54, 24, 0.08), 0 4px 6px -4px rgba(40, 54, 24, 0.05)",
        xl: "0 20px 25px -5px rgba(40, 54, 24, 0.10), 0 8px 10px -6px rgba(40, 54, 24, 0.06)",
      },
      transitionTimingFunction: {
        DEFAULT: "cubic-bezier(0.2, 0.8, 0.2, 1)",
      },
      transitionDuration: {
        fast: "120ms",
        DEFAULT: "200ms",
        slow: "320ms",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 320ms cubic-bezier(0.2, 0.8, 0.2, 1)",
        "slide-up": "slide-up 320ms cubic-bezier(0.2, 0.8, 0.2, 1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;

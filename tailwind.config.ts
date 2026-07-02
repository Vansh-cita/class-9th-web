import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "#050505",
          secondary: "#0a0a0a",
        },
        accent: {
          DEFAULT: "#FF0F7B",
          hover: "#ff3a94",
          glow: "rgba(255,15,123,0.30)",
        },
        text: {
          primary: "#f0f0f0",
          secondary: "#a0a0a0",
          muted: "#606060",
          inverse: "#050505",
        },
        border: {
          DEFAULT: "rgba(255,255,255,0.06)",
          accent: "rgba(255,15,123,0.30)",
        },
      },
      fontFamily: {
        display: ["var(--font-outfit)", "Outfit", "sans-serif"],
        body: ["var(--font-inter)", "Inter", "sans-serif"],
      },
      borderRadius: {
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        full: "9999px",
      },
      maxWidth: {
        content: "1280px",
        wide: "1440px",
      },
      height: {
        navbar: "72px",
      },
      zIndex: {
        dropdown: "100",
        navbar: "500",
        modal: "800",
        toast: "900",
      },
      backdropBlur: {
        glass: "20px",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "25%": { transform: "translateY(-20px) rotate(3deg)" },
          "75%": { transform: "translateY(10px) rotate(-2deg)" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(200%)" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(24px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "toast-in": {
          from: { transform: "translateX(100%)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
        "toast-out": {
          from: { transform: "translateX(0)", opacity: "1" },
          to: { transform: "translateX(100%)", opacity: "0" },
        },
        "modal-in": {
          from: { opacity: "0", transform: "scale(0.95) translateY(10px)" },
          to: { opacity: "1", transform: "scale(1) translateY(0)" },
        },
      },
      animation: {
        float: "float 18s ease-in-out infinite",
        shimmer: "shimmer 1.8s ease-in-out infinite",
        "fade-in-up": "fade-in-up 0.65s cubic-bezier(0.4,0,0.2,1) forwards",
        "toast-in": "toast-in 0.35s ease forwards",
        "toast-out": "toast-out 0.30s ease forwards",
        "modal-in": "modal-in 0.30s ease forwards",
      },
    },
  },
  plugins: [],
};

export default config;

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        margify: {
          black: "#000000",
          cyan: "#64DFDF",
          bg: "#0a0a0a",
          card: "#111111",
          cardAlt: "#1a1a1a",
          border: "#222222",
          text: "#ffffff",
          muted: "#888888",
          negative: "#ff4444",
        },
      },
      borderRadius: {
        card: "12px",
        control: "8px",
      },
      transitionDuration: {
        margify: "150ms",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;

import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#FAF6F1",
        surface: "#FFFFFF",
        ink: "#171310",
        inksoft: "#6E655C",
        line: "#ECE3D8",
        accent: "#FF4D24",
        accent2: "#FF8A00",
        accentdark: "#E23A12",
        accentsoft: "#FFE9E1",
        greena: "#16A34A",
        greensoft: "#E7F6EC",
        gold: "#FFB300",
        dark: "#171310",
        dark2: "#221C17",
      },
      fontFamily: {
        display: ["var(--font-space)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;

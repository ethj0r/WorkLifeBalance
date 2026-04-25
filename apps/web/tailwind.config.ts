import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
      colors: {
        green: {
          50: "#F1FAF4", 100: "#E4F1E2", 200: "#C9E2C5", 300: "#9CC79A",
          400: "#6FAF6C", 500: "#4D8A5C", 600: "#2F6840", 700: "#234D2E",
          800: "#1E4527", 900: "#14361E"
        },
        ink: {
          50: "#F3F4F6", 100: "#E5E7EB", 200: "#D1D5DB", 300: "#BDBD88",
          400: "#9CA3AF", 500: "#6B7280", 600: "#4B5563", 700: "#374151",
          800: "#1F2937", 900: "#0F172A"
        },
        earth: {
          50: "#FAF5EA", 100: "#F2E8D4", 200: "#E7D9BD", 300: "#D9C49A",
          500: "#A88B5C", 700: "#6B5538", 900: "#3A2E20"
        },
        paper: "#FAFAF8"
      },
      boxShadow: {
        xs: "0 1px 2px rgba(15, 23, 42, 0.04)",
        sm: "0 1px 3px rgba(15,23,42,.06),0 1px 2px rgba(15,23,42,.04)",
        md: "0 4px 12px rgba(15,23,42,.06),0 2px 4px rgba(15,23,42,.04)",
        lg: "0 12px 28px rgba(15,23,42,.08),0 4px 8px rgba(15,23,42,.04)",
        float: "0 16px 40px rgba(15,23,42,.10),0 6px 12px rgba(15,23,42,.05)"
      }
    },
  },
  plugins: [],
};
export default config;

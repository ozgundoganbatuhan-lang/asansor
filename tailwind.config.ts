import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Plus Jakarta Sans", "-apple-system", "BlinkMacSystemFont", "system-ui", "sans-serif"],
      },
      colors: {
        ink: { DEFAULT: "#0a0a0f", 2: "#3f3f46", 3: "#71717a", 4: "#a1a1aa" },
        brand: { DEFAULT: "#2563eb", dark: "#1d4ed8", soft: "#eff6ff" },
      },
    },
  },
  plugins: [],
};

export default config;

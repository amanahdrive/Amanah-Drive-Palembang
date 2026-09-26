import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        amanah: {
          50: "#eef9ff",
          100: "#d9f2ff",
          500: "#3DD0F2",
          600: "#005B93",
          700: "#00267A",
          800: "#001d5e"
        }
      }
    }
  },
  plugins: []
};

export default config;
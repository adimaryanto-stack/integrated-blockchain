/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: "#F5F6F4",
        panel: "#FFFFFF",
        ink: "#1A1D23",
        muted: "#5B6270",
        line: "#E4E6E1",
        navy: {
          DEFAULT: "#1B2A4A",
          light: "#28406E",
          dark: "#101A30",
        },
        primary: {
          DEFAULT: "#1B2A4A",
          light: "#28406E",
          dark: "#101A30",
        },
        gold: {
          DEFAULT: "#C9973E",
          light: "#E3B968",
        },
        status: {
          ok: "#2F855A",
          warn: "#B7791F",
          danger: "#B42318",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Lora", "Georgia", "serif"],
      },
      borderRadius: {
        sm: "4px",
        md: "6px",
      },
    },
  },
  plugins: [],
};

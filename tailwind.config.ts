import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        navy: "#003481",
        blue: "#0B86D9",
        sky: "#5BC9F7",
        green: "#3F9537",
        "green-light": "#81A976",
        bg: "#FFFFFF",
        border: "#E5E9EF",
      },
    },
  },
  plugins: [],
} satisfies Config;

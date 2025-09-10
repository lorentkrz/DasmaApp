import type { Config } from "tailwindcss"

export default {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./pages/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
      },
      borderRadius: {
        lg: "var(--radius-lg)",
      },
      transitionTimingFunction: {
        DEFAULT: "var(--easing)",
      },
      transitionDuration: {
        160: "var(--duration-fast)",
        220: "var(--duration-medium)",
      },
    },
  },
} satisfies Config

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class", // dark mode now, light mode is a class-toggle away later
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Exact pure-charcoal canvas, independent of Tailwind's own zinc-950
        // shade (which can shift between versions) — this is the one color
        // the whole app is built on, so it's pinned explicitly.
        canvas: "#09090B",
        // Electric Teal — reserved strictly for: P1/critical, Active status,
        // and primary CTAs. Never used as a general decorative color.
        accent: {
          DEFAULT: "#3ba5f6",
          hover: "#2b8fe0",
          muted: "rgba(59, 165, 246, 0.12)", // for subtle badge/pill backgrounds
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      borderRadius: {
        DEFAULT: "8px",
      },
      boxShadow: {
        none: "none",
      },
      keyframes: {
        "toast-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "toast-in": "toast-in 150ms ease-out",
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          dark: "#0B0E14",
          card: "#121721",
          elevated: "#18202D",
          input: "#0F141E"
        },
        border: {
          subtle: "#1F2937",
          glow: "#374151"
        },
        cyan: {
          telemetry: "#00F0FF",
          accent: "#06B6D4"
        },
        purple: {
          accent: "#8B5CF6",
          dark: "#6D28D9"
        },
        emerald: {
          safe: "#10B981"
        },
        amber: {
          warn: "#F59E0B"
        },
        rose: {
          danger: "#EF4444"
        }
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "Courier New", "monospace"],
        sans: ["Inter", "system-ui", "sans-serif"]
      }
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        stealth: {
          canvas: "#0F131D",
          container: "#161F30",
          card: "#1A2438",
          popover: "#1E293B",
          border: "#233044",
          "border-hover": "#3E506B",
          text: "#DFE2F1",
          "text-variant": "#C7C4D7",
          muted: "#94A3B8",
          subtle: "#64748B",
          primary: "#6366F1",
          secondary: "#8B5CF6",
          teal: "#0D9488",
          emerald: "#10B981",
          amber: "#F59E0B",
          crimson: "#EF4444",
        },
        bg: {
          dark: "#0F131D",
          card: "#1A2438",
          container: "#161F30",
          elevated: "#1A2438",
          popover: "#1E293B",
          input: "#161F30"
        },
        border: {
          subtle: "#233044",
          glow: "#3E506B"
        },
        indigo: {
          accent: "#6366F1"
        },
        purple: {
          accent: "#8B5CF6",
          dark: "#571BC1"
        },
        cyan: {
          telemetry: "#6BD8CB",
          accent: "#0D9488"
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
        jakarta: ["Plus Jakarta Sans", "Inter", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["Inter", "Fira Code", "JetBrains Mono", "monospace"]
      }
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        krea: {
          bg: "#0d0d0d",
          surface: "#161616",
          border: "#2a2a2a",
          "border-hover": "#3a3a3a",
          text: "#e8e8e8",
          muted: "#888888",
          accent: "#a855f7",
          "accent-dim": "#7c3aed",
          "accent-glow": "rgba(168,85,247,0.4)",
          node: "#1a1a1a",
          "node-border": "#333333",
          handle: "#6d28d9",
          success: "#22c55e",
          error: "#ef4444",
          warning: "#f59e0b",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      animation: {
        "pulse-glow": "pulseGlow 1.5s ease-in-out infinite",
        "slide-in": "slideIn 0.2s ease-out",
        "fade-in": "fadeIn 0.15s ease-out",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 8px 2px rgba(168,85,247,0.4)" },
          "50%": { boxShadow: "0 0 20px 6px rgba(168,85,247,0.7)" },
        },
        slideIn: {
          from: { transform: "translateX(100%)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
        fadeIn: {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

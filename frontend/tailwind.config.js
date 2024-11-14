/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: {
          primary: "#0f172a", // Main background
          secondary: "#1e293b", // Card background
          hover: "#2d3a4f", // Hover states
        },
        content: {
          primary: "#e2e8f0", // Primary text
          secondary: "#94a3b8", // Secondary text
          accent: "#3b82f6", // Accent color (buttons, links)
        },
        status: {
          success: "#22c55e",
          error: "#ef4444",
          warning: "#f59e0b",
        },
        border: {
          primary: "#334155", // Border color
        },
      },
      boxShadow: {
        glow: "0 0 4px rgba(34, 197, 94, 0.6)", // Green glow for success status
      },
      backgroundColor: {
        "status-success-semi": "rgba(34, 197, 94, 0.15)", // Semi-transparent success background
        "content-secondary-semi": "rgba(148, 163, 184, 0.15)", // Semi-transparent secondary background
      },
      borderColor: {
        "status-success-semi": "rgba(34, 197, 94, 0.2)", // Semi-transparent success border
        "content-secondary-semi": "rgba(148, 163, 184, 0.2)", // Semi-transparent secondary border
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Noto Sans Malayalam"', 'Outfit', 'sans-serif'],
        malayalam: ['"Noto Sans Malayalam"', 'sans-serif'],
        display: ['Outfit', '"Noto Sans Malayalam"', 'sans-serif'],
      },
      colors: {
        gameverse: {
          bg: "#0B0E14",
          card: "#161B26",
          elevated: "#1F2636",
          border: "#2A344A",
          accent: "#6366F1",
          gold: "#F59E0B",
          emerald: "#10B981",
          rose: "#F43F5E",
          cyan: "#06B6D4",
        },
        uno: {
          red: "#EF4444",
          blue: "#3B82F6",
          green: "#10B981",
          yellow: "#FBBF24",
          wild: "#8B5CF6",
          dark: "#1E293B",
        },
        ludo: {
          red: "#E11D48",
          green: "#059669",
          yellow: "#D97706",
          blue: "#2563EB",
          orange: "#EA580C",
          purple: "#9333EA",
        },
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-short': 'bounce 0.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,jsx}",
    "./src/components/**/*.{js,jsx}",
    "./src/app/**/*.{js,jsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f5ff',
          100: '#cceaff',
          200: '#99d5ff',
          300: '#66c0ff',
          400: '#33abff',
          500: '#0096ff',
          600: '#0078cc',
          700: '#005a99',
          800: '#003c66',
          900: '#001e33',
        },
        secondary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        pastel: {
          blue: '#a8d8ff',
          green: '#a8ffd8',
          yellow: '#fff6a8',
          pink: '#ffa8d8',
          purple: '#d8a8ff',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        light: {
          primary: "#0096ff",
          secondary: "#22c55e",
          accent: "#d8a8ff",
          neutral: "#f5f5f5",
          "base-100": "#ffffff",
          info: "#3abff8",
          success: "#36d399",
          warning: "#fbbd23",
          error: "#f87272",
        },
        dark: {
          primary: "#0096ff",
          secondary: "#22c55e",
          accent: "#d8a8ff",
          neutral: "#1f2937",
          "base-100": "#111827",
          "base-200": "#1f2937",
          "base-300": "#374151",
          info: "#3abff8",
          success: "#36d399",
          warning: "#fbbd23",
          error: "#f87272",
        },
      },
      "light",
      "dark",
    ],
  },
}; 
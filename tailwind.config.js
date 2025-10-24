/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-primary': '#0054a6', // BMA Blue
        'brand-secondary': '#d41e24', // BMA Red
        'brand-light': '#e6f0fa',
        'brand-dark': '#003c7a',
        'text-primary': '#1e293b', // slate-800
        'text-secondary': '#475569', // slate-600
        'bg-primary': '#f1f5f9', // slate-100 (page background)
        'bg-secondary': '#ffffff', // white (card background)
        'bg-tertiary': '#e2e8f0', // slate-200 (borders, inputs)
      }
    },
  },
  plugins: [],
}

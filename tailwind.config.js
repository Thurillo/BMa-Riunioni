/** @type {import('tailwindcss').Config} */
import defaultTheme from 'tailwindcss/defaultTheme';

export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        background: '#ffffff',
        foreground: '#1e293b', // slate-800, for a softer black text
        muted: '#64748b', // slate-500
        card: '#ffffff',
        border: '#e2e8f0', // slate-200
        
        primary: '#0054a6', // BMA Blue
        'primary-foreground': '#ffffff',
        'primary-hover': '#003c7a',

        destructive: '#d41e24', // BMA Red
        'destructive-foreground': '#ffffff',
        'destructive-hover': '#a9181d',
        
        accent: '#e6f0fa', // Light blue accent
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.07)',
        'input': '0 0 0 2px #e2e8f0',
        'input-focus': '0 0 0 2px #0054a6',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      }
    },
  },
  plugins: [],
}
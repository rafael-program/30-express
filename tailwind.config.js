// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        nature: {
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
        forest: {
          deep: '#0f291e',
          DEFAULT: '#1b4332',
          light: '#2d6a4f',
          accent: '#40916c',
        },
        fresh: {
          light: '#d8f3dc',
          DEFAULT: '#74c69d',
          vibrant: '#52b788',
        },
        sun: {
          light: '#ffe8d6',
          DEFAULT: '#f4a261',
          dark: '#e76f51',
          accent: '#e85d04',
        },
        cream: {
          50: '#fdfbf7',
          100: '#f7f4ee',
          200: '#ede8df',
        }
      },
      boxShadow: {
        'natural': '0 4px 20px -2px rgba(45, 106, 79, 0.08)',
        'natural-lg': '0 10px 30px -4px rgba(45, 106, 79, 0.12)',
        'natural-xl': '0 20px 40px -6px rgba(45, 106, 79, 0.16)',
      }
    },
  },
  plugins: [],
};
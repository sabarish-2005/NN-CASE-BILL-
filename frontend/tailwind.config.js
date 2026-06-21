/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html','./src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0f9f4', 100: '#dcf1e6', 200: '#bbdecb', 300: '#8ec4a9',
          400: '#5da382', 500: '#3a8562', 600: '#2d6b4f', 700: '#265640',
          800: '#214635', 900: '#0a2e1a', 950: '#061a0e',
        },
        gold: {
          50: '#fdf8e8', 100: '#faefc5', 200: '#f5dc8a', 300: '#eec54b',
          400: '#e6ad29', 500: '#c9a227', 600: '#a67d1d', 700: '#7e5c18',
          800: '#664a18', 900: '#573e17',
        },
      },
      fontFamily: { sans: ['Inter','system-ui','sans-serif'], mono: ['JetBrains Mono','monospace'] },
      animation: {
        'fade-in':   'fadeIn .2s ease',
        'slide-up':  'slideUp .25s ease',
        'slide-in':  'slideIn .25s ease',
      },
      keyframes: {
        fadeIn:  { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { transform: 'translateY(8px)', opacity: 0 }, to: { transform: 'translateY(0)', opacity: 1 } },
        slideIn: { from: { transform: 'translateX(-8px)', opacity: 0 }, to: { transform: 'translateX(0)', opacity: 1 } },
      },
    },
  },
  plugins: [],
}

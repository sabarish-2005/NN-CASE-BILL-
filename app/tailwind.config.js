/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#0A2E1A',
          greenLight: '#155230',
          gold: '#C9A227',
          goldLight: '#E5C94B',
          cream: '#FFF9E5',
        }
      }
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        hewn: {
          cream: "#F7F2EA",
          paper: "#FBF8F2",
          sand: "#EBE1D2",
          oak: "#B0794A",
          "oak-deep": "#9A6638",
          walnut: "#6B4A30",
          "walnut-dark": "#3E2C1E",
          charcoal: "#241F1B",
          ink: "#33291F",
          muted: "#7C6A57",
          line: "#E0D4C1",
          "line-dark": "#5A4632",
        },
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        sans: ["'Hanken Grotesk'", "sans-serif"],
      },
    },
  },
  plugins: [],
};

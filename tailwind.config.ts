// import colors from './src/themes/colors';
import type { Config } from 'tailwindcss';

const config: Config = {
  important: true,
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: false,
  theme: {
    extend: {
      fontFamily: {
        inter: ['Oswald', 'sans-serif'],
      },
    //   colors,
    },
  },
} satisfies Config;

export default config;

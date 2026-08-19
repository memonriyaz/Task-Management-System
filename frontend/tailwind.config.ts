import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        mainPurple: '#635FC7',
        mainPurpleHover: '#A8A4FF',
        black: '#000112',
        veryDarkGrey: '#20212C',
        darkGrey: '#2B2C37',
        linesDark: '#3E3F4E',
        mediumGrey: '#828FA3',
        linesLight: '#E4EBFA',
        lightBg: '#F4F7FD',
        white: '#FFFFFF',
        redDestructive: '#EA5555',
        redHover: '#FF9898',
      },
      fontFamily: {
        sans: ['var(--font-jakarta)', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 6px -1px rgba(54, 78, 126, 0.1), 0 2px 4px -1px rgba(54, 78, 126, 0.06)',
        cardDark: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
        modal: '0 10px 25px -5px rgba(54, 78, 126, 0.25)',
      },
    },
  },
  plugins: [],
};

export default config;

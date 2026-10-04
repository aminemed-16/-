import type { Config } from 'tailwindcss';

const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: token('navy'),
        royal: token('royal'),
        magenta: token('magenta'),
        blush: token('blush'),
        ink: token('ink'),
        mist: token('mist'),
        line: token('line'),
      },
      fontFamily: { sans: ['var(--font-sans)', 'system-ui', 'sans-serif'] },
      borderRadius: { card: '14px', control: '10px' },
      boxShadow: { card: '0 1px 2px rgb(20 27 58 / 0.06), 0 4px 16px rgb(20 27 58 / 0.04)' },
    },
  },
  plugins: [],
};

export default config;

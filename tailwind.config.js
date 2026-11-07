import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}', './content/**/*.mdx'],
  theme: {
    extend: {
      colors: {
        accent: 'rgb(var(--accent) / <alpha-value>)',
        paper: 'rgb(var(--paper) / <alpha-value>)',
      },
      fontFamily: {
        serif: ['"Literata Variable"', 'Georgia', 'serif'],
        sans: ['"Inter Variable"', '"Segoe UI"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono Variable"', 'Consolas', 'monospace'],
      },
      maxWidth: { read: '68ch' },
    },
  },
  plugins: [typography],
};

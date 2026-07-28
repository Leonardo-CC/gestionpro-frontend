/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#f8f9fa',
        foreground: '#1a1a1a',
        primary: '#3b82f6',
        'primary-dark': '#1d4ed8',
        accent: '#10b981',
        destructive: '#ef4444',
        muted: '#6b7280',
      },
    },
  },
  plugins: [],
};

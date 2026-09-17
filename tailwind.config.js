/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Nunito', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 16px rgba(124, 58, 237, 0.07)',
        btn: '0 4px 14px rgba(124, 58, 237, 0.25)',
        nav: '0 -2px 16px rgba(124, 58, 237, 0.06)',
      },
    },
  },
  plugins: [],
}

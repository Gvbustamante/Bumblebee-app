/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Nunito', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          bg: '#F7F3FF',
          card: '#FFFFFF',
          purple: '#9B6DDF',
          dark: '#57358F',
          yellow: '#FFD84D',
          blue: '#72B7E8',
          green: '#8ED36B',
          pink: '#F58BB5',
        },
        mode: {
          spelling: '#F2E8FF',
          bumblebee: '#FFF1F5',
          abc: '#EEF7FF',
          colors: '#FFFBEA',
          shapes: '#F1F2FF',
        },
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(87,53,143,0.06)',
        'card-hover': '0 2px 8px rgba(0,0,0,0.08), 0 8px 24px rgba(87,53,143,0.08)',
        btn: '0 4px 14px rgba(155,109,223,0.25)',
        nav: '0 -2px 16px rgba(87,53,143,0.06)',
        soft: '0 2px 12px rgba(155,109,223,0.1)',
        glow: '0 4px 20px rgba(155,109,223,0.18)',
      },
    },
  },
  plugins: [],
}

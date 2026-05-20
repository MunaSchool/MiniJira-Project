/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: '#c7c4d8',
        background: '#f8f9ff',
        foreground: '#0b1c30',
        primary: {
          DEFAULT: '#4f46e5',
          dark: '#3525cd',
          foreground: '#ffffff'
        },
        secondary: {
          DEFAULT: '#dce9ff',
          foreground: '#464555',
          muted: '#eff4ff'
        },
        muted: {
          DEFAULT: '#eff4ff',
          foreground: '#464555'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        label: ['Inter', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        card: '0 4px 24px rgba(79, 70, 229, 0.08), 0 1px 3px rgba(11, 28, 48, 0.06)',
        'card-hover': '0 12px 40px rgba(79, 70, 229, 0.14), 0 4px 12px rgba(11, 28, 48, 0.08)',
        glow: '0 0 24px rgba(79, 70, 229, 0.35)'
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' }
        }
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out forwards'
      }
    }
  },
  plugins: [require('tailwindcss-animate')]
};

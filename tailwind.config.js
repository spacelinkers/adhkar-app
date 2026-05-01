/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#e6efe5',
        card: '#ffffff',
        'card-soft': '#f6faf5',
        ink: {
          DEFAULT: '#0f1f1a',
          soft: '#3d4a45',
          mute: '#7a8580',
        },
        line: {
          DEFAULT: '#dfe7dd',
          soft: '#ecf2eb',
        },
        primary: {
          DEFAULT: '#1d5d44',
          deep: '#0f3d2e',
          soft: '#e8f1ec',
        },
        gold: {
          DEFAULT: '#b8893a',
          deep: '#966d24',
          soft: '#f4ead4',
        },
        rose: '#b34d3e',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        arabic: ['Amiri', 'serif'],
      },
      borderRadius: {
        'sm': '10px',
        'md': '14px',
        'lg': '18px',
        'xl': '24px',
      },
      boxShadow: {
        'soft-sm': '0 1px 2px rgba(15,31,26,.04)',
        'soft-md': '0 1px 3px rgba(15,31,26,.06), 0 4px 12px rgba(15,31,26,.04)',
        'soft-lg': '0 8px 32px rgba(15,31,26,.12), 0 2px 6px rgba(15,31,26,.06)',
      },
      animation: {
        'page-in': 'pageIn .25s cubic-bezier(.2,.8,.2,1)',
        'page-in-back': 'pageInBack .25s cubic-bezier(.2,.8,.2,1)',
        'card-in': 'cardIn .35s cubic-bezier(.2,.7,.2,1)',
        'sub-in': 'subIn .3s cubic-bezier(.2,.7,.2,1)',
        'slide-up': 'slideUp .3s cubic-bezier(.2,.8,.2,1)',
        'fade-in': 'fadeIn .2s',
        'float': 'float 2s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 1.4s infinite',
        'pop': 'pop .2s cubic-bezier(.2,.8,.2,1)',
      },
      keyframes: {
        pageIn: { '0%': { opacity: '0', transform: 'translateX(6px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
        pageInBack: { '0%': { opacity: '0', transform: 'translateX(-6px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
        cardIn: { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        subIn: { '0%': { opacity: '0', transform: 'translateY(4px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideUp: { '0%': { transform: 'translateY(100%)' }, '100%': { transform: 'translateY(0)' } },
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } },
        pulseSoft: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '.35' } },
        pop: { '0%': { opacity: '0', transform: 'scale(.94)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
      },
    },
  },
  plugins: [],
};

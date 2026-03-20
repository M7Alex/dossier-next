/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        gold: { DEFAULT: '#C9A84C', light: '#E8C97A', dark: '#8B6914' },
        surface: { DEFAULT: '#090d12', 1: '#0f1520', 2: '#141B24' },
        cyan: { holo: '#50C8C8' }
      },
      fontFamily: {
        cinzel: ['Cinzel', 'serif'],
        raleway: ['Raleway', 'sans-serif'],
        mono: ['"Share Tech Mono"', 'monospace'],
      },
      animation: {
        'breathe': 'breathe 5s ease-in-out infinite',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
        'scan': 'scan 5s linear infinite',
        'spin-slow': 'spin 22s linear infinite',
        'float': 'float 4.2s ease-in-out infinite',
        'shimmer': 'shimmer 5s ease-in-out infinite',
        'glitch': 'glitch 14s 7s infinite',
      },
      keyframes: {
        breathe: { '0%,100%': { opacity: '.03' }, '50%': { opacity: '.07' } },
        glowPulse: {
          '0%,100%': { boxShadow: '0 0 0 6px rgba(201,168,76,.07), 0 0 40px rgba(201,168,76,.1)' },
          '50%': { boxShadow: '0 0 0 12px rgba(201,168,76,.13), 0 0 65px rgba(201,168,76,.2)' }
        },
        scan: { '0%': { top: '-4px' }, '100%': { top: '100%' } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        shimmer: { '0%': { backgroundPosition: '-200% center' }, '100%': { backgroundPosition: '200% center' } },
        glitch: {
          '0%,93%,100%': { clipPath: 'none', transform: 'none' },
          '94%': { clipPath: 'inset(22% 0 48% 0)', transform: 'translateX(-5px)' },
          '96%': { clipPath: 'inset(58% 0 12% 0)', transform: 'translateX(5px)' },
          '98%': { clipPath: 'inset(8% 0 62% 0)', transform: 'translateX(-3px)' }
        }
      }
    }
  },
  plugins: []
}

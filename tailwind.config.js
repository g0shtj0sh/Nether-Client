/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7c3aed',
          800: '#6d28d9',
          900: '#5b21b6',
          950: '#4c1d95',
        },
        dark: {
          50: '#0a0a0a',
          100: '#0f0f0f',
          200: '#141414',
          300: '#1a1a1a',
          400: '#1f1f1f',
          500: '#242424',
          600: '#2a2a2a',
          700: '#2f2f2f',
          800: '#343434',
          900: '#3a3a3a',
          950: '#000000',
        },
        nether: {
          glow: '#7b2bd6',
          portal: '#9d4edd',
          energy: '#c77dff',
          void: '#000000',
        },
      },
      boxShadow: {
        'nether-glow': '0 0 8px rgba(123, 43, 214, 0.2)',
        'nether-glow-lg': '0 0 12px rgba(123, 43, 214, 0.3)',
        'nether-glow-xl': '0 0 16px rgba(123, 43, 214, 0.4)',
        'portal-glow': '0 0 10px rgba(157, 78, 221, 0.3)',
      },
      backgroundImage: {
        'nether-gradient': 'linear-gradient(135deg, rgba(123, 43, 214, 0.1) 0%, rgba(157, 78, 221, 0.05) 50%, rgba(199, 125, 255, 0.1) 100%)',
        'portal-gradient': 'radial-gradient(circle at center, rgba(123, 43, 214, 0.2) 0%, rgba(157, 78, 221, 0.1) 50%, transparent 100%)',
        'void-gradient': 'linear-gradient(180deg, rgba(0, 0, 0, 0.8) 0%, rgba(10, 10, 10, 0.9) 100%)',
      },
      animation: {
        'nether-pulse': 'nether-pulse 3s ease-in-out infinite',
        'portal-glow': 'portal-glow 2s ease-in-out infinite alternate',
        'energy-flow': 'energy-flow 4s linear infinite',
        'void-shimmer': 'void-shimmer 6s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        'nether-pulse': {
          '0%, 100%': { 
            boxShadow: '0 0 4px rgba(123, 43, 214, 0.3)',
            transform: 'scale(1)'
          },
          '50%': { 
            boxShadow: '0 0 8px rgba(123, 43, 214, 0.5)',
            transform: 'scale(1.01)'
          },
        },
        'portal-glow': {
          '0%': { 
            boxShadow: '0 0 25px rgba(157, 78, 221, 0.8), 0 0 50px rgba(157, 78, 221, 0.6), 0 0 75px rgba(157, 78, 221, 0.4)',
            opacity: '0.8'
          },
          '100%': { 
            boxShadow: '0 0 35px rgba(157, 78, 221, 1), 0 0 70px rgba(157, 78, 221, 0.8), 0 0 105px rgba(157, 78, 221, 0.6)',
            opacity: '1'
          },
        },
        'energy-flow': {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '50%': { opacity: '1' },
          '100%': { transform: 'translateX(100%)', opacity: '0' },
        },
        'void-shimmer': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px #7b2bd6, 0 0 10px #7b2bd6, 0 0 15px #7b2bd6' },
          '100%': { boxShadow: '0 0 10px #7b2bd6, 0 0 20px #7b2bd6, 0 0 30px #7b2bd6' },
        }
      }
    },
  },
  plugins: [],
}

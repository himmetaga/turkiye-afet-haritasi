/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: '#06070a',
          900: '#090a0f',
          800: '#11131c',
          700: '#1a1d2c',
          600: '#262a3f',
        },
        emerald: {
          glow: '#10B981',
          dim: 'rgba(16, 185, 129, 0.2)',
        },
        seismic: {
          amber: '#F59E0B',
          red: '#EF4444',
          darkRed: '#991B1B',
        }
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif'
        ],
        mono: [
          'JetBrains Mono',
          'ui-monospace',
          'SFMono-Regular',
          'monospace'
        ]
      },
      boxShadow: {
        'glow-emerald': '0 0 20px -2px rgba(16, 185, 129, 0.4)',
        'glow-red': '0 0 24px -2px rgba(239, 68, 68, 0.5)',
      }
    },
  },
  plugins: [],
}

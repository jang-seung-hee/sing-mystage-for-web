/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      // Neon color palette for karaoke theme
      colors: {
        'neon-cyan': '#00ffff',
        'neon-pink': '#ff00ff',
        'neon-yellow': '#ffff00',
        'neon-blue': '#0066ff',
        'neon-green': '#00ff66',
        'neon-purple': '#9933ff',
        'dark-bg': '#0a0a0a',
        'dark-card': '#1a1a1a',
        'dark-border': '#333333',
        'dark-surface': '#0f0f0f',
      },
      // Glow effects using box shadows
      boxShadow: {
        'glow-sm': '0 0 5px currentColor',
        'glow-md': '0 0 15px currentColor',
        'glow-lg': '0 0 25px currentColor',
        'glow-xl': '0 0 35px currentColor',
        'neon-cyan': '0 0 20px #00ffff, 0 0 40px #00ffff, 0 0 60px #00ffff',
        'neon-pink': '0 0 20px #ff00ff, 0 0 40px #ff00ff, 0 0 60px #ff00ff',
        'neon-yellow': '0 0 20px #ffff00, 0 0 40px #ffff00, 0 0 60px #ffff00',
        'neon-blue': '0 0 20px #0066ff, 0 0 40px #0066ff, 0 0 60px #0066ff',
        'neon-green': '0 0 20px #00ff66, 0 0 40px #00ff66, 0 0 60px #00ff66',
        'neon-purple': '0 0 20px #9933ff, 0 0 40px #9933ff, 0 0 60px #9933ff',
      },
      // Custom animations
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite alternate',
        'slide-in-left': 'slide-in-left 0.3s ease-out',
        'slide-out-left': 'slide-out-left 0.3s ease-in',
        'fade-in': 'fade-in 0.3s ease-out',
        'bounce-glow': 'bounce-glow 1s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite',
        'spin-slow': 'spin 3s linear infinite',
        'spin-reverse': 'spin-reverse 4s linear infinite',
        'float': 'float 3s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
      },
      // Keyframes for custom animations
      keyframes: {
        'pulse-glow': {
          '0%': { 
            boxShadow: '0 0 5px currentColor',
            transform: 'scale(1)',
          },
          '100%': { 
            boxShadow: '0 0 25px currentColor, 0 0 35px currentColor',
            transform: 'scale(1.02)',
          },
        },
        'slide-in-left': {
          '0%': { 
            transform: 'translateX(-100%)',
            opacity: '0',
          },
          '100%': { 
            transform: 'translateX(0)',
            opacity: '1',
          },
        },
        'slide-out-left': {
          '0%': { 
            transform: 'translateX(0)',
            opacity: '1',
          },
          '100%': { 
            transform: 'translateX(-100%)',
            opacity: '0',
          },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'bounce-glow': {
          '0%, 100%': { 
            transform: 'translateY(0)',
            boxShadow: '0 0 10px currentColor',
          },
          '50%': { 
            transform: 'translateY(-10px)',
            boxShadow: '0 0 20px currentColor, 0 0 30px currentColor',
          },
        },
        'shimmer': {
          '0%': { 
            transform: 'translateX(-100%) skewX(-12deg)',
            opacity: '0',
          },
          '50%': { 
            opacity: '0.4',
          },
          '100%': { 
            transform: 'translateX(200%) skewX(-12deg)',
            opacity: '0',
          },
        },
        'spin-reverse': {
          '0%': { transform: 'rotate(360deg)' },
          '100%': { transform: 'rotate(0deg)' },
        },
        'float': {
          '0%, 100%': { 
            transform: 'translateY(0px)',
          },
          '50%': { 
            transform: 'translateY(-10px)',
          },
        },
        'glow-pulse': {
          '0%, 100%': { 
            boxShadow: '0 0 5px currentColor, 0 0 10px currentColor',
            transform: 'scale(1)',
          },
          '50%': { 
            boxShadow: '0 0 15px currentColor, 0 0 25px currentColor, 0 0 35px currentColor',
            transform: 'scale(1.05)',
          },
        },
      },
      // Gradient backgrounds
      backgroundImage: {
        'gradient-dark': 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)',
        'gradient-neon': 'linear-gradient(135deg, #00ffff20 0%, #ff00ff20 50%, #ffff0020 100%)',
        'gradient-karaoke': 'linear-gradient(45deg, #0a0a0a 0%, #1a1a1a 25%, #0f0f23 50%, #1a1a1a 75%, #0a0a0a 100%)',
        'gradient-cosmic': 'linear-gradient(45deg, #0a0a0a 0%, #1a0a2e 25%, #16213e 50%, #1a0a2e 75%, #0a0a0a 100%)',
      },
      // Backdrop blur effects
      backdropBlur: {
        'xs': '2px',
      },
    },
  },
  plugins: [],
};

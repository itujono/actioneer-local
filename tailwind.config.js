/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    colors: {
      // Essential generic colors
      transparent: 'transparent',
      current: 'currentColor',
      inherit: 'inherit',
      black: '#000000',
      white: '#ffffff',
      
      // Primary vibrant colors from the palette - single solid colors
      heliotrope: '#9767f9',
      gold: '#ffd400',
      lime: '#b4f201',
      jade: '#03c159',
      lavender: '#fe92ed',
      bittersweet: '#ff7765',
      daisy: '#5a2898', // Using same as heliotrope for consistency
      sandy: '#feeac8',
      concrete: '#f1f1f1',
      thunder: '#383639',
      
      // Additional utility colors for common use cases
      gray: '#6b7280',
      'gray-light': '#d1d5db',
      'gray-dark': '#374151',
    },
    extend: {
      backgroundImage: {
        'gradient-heliotrope': 'linear-gradient(135deg, #9d6bff 0%, #7c2df7 100%)',
        'gradient-gold': 'linear-gradient(135deg, #fdb91e 0%, #f79009 100%)',
        'gradient-lime': 'linear-gradient(135deg, #a3e635 0%, #84cc16 100%)',
        'gradient-jade': 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
        'gradient-lavender': 'linear-gradient(135deg, #f493ff 0%, #ec68ff 100%)',
        'gradient-bittersweet': 'linear-gradient(135deg, #fb823c 0%, #f97316 100%)',
        'gradient-rainbow': 'linear-gradient(135deg, #9d6bff 0%, #fdb91e 25%, #a3e635 50%, #34d399 75%, #f493ff 100%)',
        'gradient-playful': 'linear-gradient(45deg, #f493ff 0%, #9d6bff 25%, #34d399 50%, #fdb91e 75%, #fb823c 100%)',
      },
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'pulse-slow': 'pulse 3s infinite',
        'wiggle': 'wiggle 1s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      fontFamily: {
        'display': ['Outfit', 'system-ui', 'sans-serif'],
        'body': ['Outfit', 'system-ui', 'sans-serif'],
        'sans': ['Outfit', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

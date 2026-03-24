module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: '#1a237e',
        sidebar: '#23395d',
        accent: '#6c63ff',
        streak: '#ff7043',
        lightgrey: '#f0f2f8',
        card: '#ffffff',
        progress: '#ffb300',
        homework: '#7c4dff',
        attendance: '#00bfae',
        statbg: '#f0f4fa',
      },
      borderRadius: {
        '3xl': '2rem',
        '4xl': '2.5rem',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        pulse2: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.15s ease-out forwards',
        fadeInUp: 'fadeInUp 0.15s ease-out forwards',
        slideInLeft: 'slideInLeft 0.15s ease-out forwards',
        slideInRight: 'slideInRight 0.15s ease-out forwards',
        scaleIn: 'scaleIn 0.1s ease-out forwards',
        shimmer: 'shimmer 2s linear infinite',
        float: 'float 3s ease-in-out infinite',
        pulse2: 'pulse2 2s ease-in-out infinite',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'glow': '0 0 20px rgba(99, 102, 241, 0.15)',
        'card': '0 1px 3px rgba(0,0,0,0.04), 0 6px 16px rgba(0,0,0,0.06)',
        'sidebar': '4px 0 24px rgba(0, 0, 0, 0.12)',
      },
    },
  },
  plugins: [],
};

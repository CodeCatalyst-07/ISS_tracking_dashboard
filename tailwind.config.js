/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'space-bg': '#020817',
        'space-card': 'rgba(15, 23, 42, 0.8)',
        'cyan-accent': '#00D4FF',
        'violet-accent': '#7C3AED',
        'amber-accent': '#F59E0B',
        'emerald-accent': '#10B981',
      },
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
        'space-grotesk': ['Space Grotesk', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s infinite linear',
        'bounce-dot': 'bounceDot 1.4s infinite ease-in-out',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'toast-enter': 'toastEnter 0.3s ease-out',
        'toast-exit': 'toastExit 0.3s ease-in forwards',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        bounceDot: {
          '0%, 80%, 100%': { transform: 'scale(0)', opacity: '0.3' },
          '40%': { transform: 'scale(1)', opacity: '1' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 212, 255, 0.4), 0 0 40px rgba(0, 212, 255, 0.2)' },
          '50%': { boxShadow: '0 0 40px rgba(0, 212, 255, 0.8), 0 0 80px rgba(0, 212, 255, 0.4)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { transform: 'translateY(20px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        toastEnter: {
          from: { transform: 'translateX(100%)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
        toastExit: {
          from: { transform: 'translateX(0)', opacity: '1' },
          to: { transform: 'translateX(110%)', opacity: '0' },
        },
      },
      boxShadow: {
        'cyan-glow': '0 0 20px rgba(0, 212, 255, 0.1)',
        'cyan-glow-lg': '0 0 40px rgba(0, 212, 255, 0.3)',
        'violet-glow': '0 0 20px rgba(124, 58, 237, 0.3)',
      },
    },
  },
  plugins: [],
}

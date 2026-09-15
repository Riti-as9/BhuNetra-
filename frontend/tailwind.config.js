/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Base backgrounds
        base: {
          bg: '#0a0e14',
          panel: '#12161f',
          card: '#161b22',
          border: '#232b3a',
          hover: '#1e2633',
        },
        // Accent / system color
        cyber: {
          DEFAULT: '#00d4ff',
          dim: '#0099bb',
          glow: 'rgba(0, 212, 255, 0.15)',
        },
        // Risk severity
        safe: {
          DEFAULT: '#00ff9d',
          dim: '#00cc7a',
          glow: 'rgba(0, 255, 157, 0.15)',
          bg: 'rgba(0, 255, 157, 0.08)',
        },
        watch: {
          DEFAULT: '#ffb020',
          dim: '#cc8a00',
          glow: 'rgba(255, 176, 32, 0.15)',
          bg: 'rgba(255, 176, 32, 0.08)',
        },
        critical: {
          DEFAULT: '#ff4d4d',
          dim: '#cc2a2a',
          glow: 'rgba(255, 77, 77, 0.15)',
          bg: 'rgba(255, 77, 77, 0.08)',
        },
        // Text hierarchy
        text: {
          primary: '#e2e8f0',
          secondary: '#8892a4',
          muted: '#4a5568',
          accent: '#00d4ff',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', '"Space Mono"', 'monospace'],
        sans: ['Inter', 'Manrope', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'xxs': '0.65rem',
      },
      backgroundImage: {
        'grid-pattern': "linear-gradient(rgba(35, 43, 58, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(35, 43, 58, 0.3) 1px, transparent 1px)",
        'scanline': "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)",
        'cyber-gradient': "linear-gradient(135deg, rgba(0, 212, 255, 0.05) 0%, transparent 50%)",
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
      boxShadow: {
        'cyber': '0 0 20px rgba(0, 212, 255, 0.15), inset 0 1px 0 rgba(0, 212, 255, 0.1)',
        'safe': '0 0 20px rgba(0, 255, 157, 0.15)',
        'watch': '0 0 20px rgba(255, 176, 32, 0.15)',
        'critical': '0 0 20px rgba(255, 77, 77, 0.2)',
        'panel': '0 4px 24px rgba(0, 0, 0, 0.4)',
      },
      animation: {
        'pulse-cyber': 'pulse-cyber 2s ease-in-out infinite',
        'blink': 'blink 1s step-end infinite',
        'ticker': 'ticker 30s linear infinite',
        'scan': 'scan 8s linear infinite',
        'fade-in-up': 'fade-in-up 0.5s ease-out',
        'shimmer': 'shimmer 2s infinite',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
      },
      keyframes: {
        'pulse-cyber': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        'blink': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        'ticker': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        'scan': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 10px rgba(0, 212, 255, 0.1)' },
          '50%': { boxShadow: '0 0 25px rgba(0, 212, 255, 0.3)' },
        },
      },
    },
  },
  plugins: [],
}

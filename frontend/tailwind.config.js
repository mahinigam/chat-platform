/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Strict monochrome palette
                mono: {
                    bg: '#0b0b0b',      // --bg
                    'bg-100': '#111111', // --bg-100
                    surface: 'rgba(255,255,255,0.06)',    // --surface
                    'surface-2': 'rgba(255,255,255,0.04)', // --surface-2
                    'glass-border': 'rgba(255,255,255,0.10)',    // --glass-border
                    'glass-highlight': 'rgba(255,255,255,0.08)', // --glass-highlight
                    text: '#ffffff',
                    muted: '#bdbdbd',
                }
            },
            fontFamily: {
                sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
            },
            backdropBlur: {
                glass: '12px',
                'glass-light': '8px',
                'glass-strong': '16px',
            },
            boxShadow: {
                'glass-sm': '0 1px 3px rgba(0,0,0,0.12)',
                'glass': '0 4px 18px rgba(0,0,0,0.6)',     // --elevation-1
                'glass-lg': '0 8px 36px rgba(0,0,0,0.65)', // --elevation-2
                'glass-inner': 'inset 0 2px 4px rgba(255,255,255,0.05)',
            },
            animation: {
                'glass-blur': 'blur-motion 0.3s cubic-bezier(0.2, 0.9, 0.2, 1)',
                'fade-up': 'fade-up 0.22s cubic-bezier(0.2, 0.9, 0.2, 1)',
                'fade-in': 'fade-in 0.22s cubic-bezier(0.2, 0.9, 0.2, 1)',
                'slide-up': 'slide-up 0.22s cubic-bezier(0.2, 0.9, 0.2, 1)',
                'bloop': 'bloop 0.4s cubic-bezier(0.2, 0.9, 0.2, 1)',
                'pulse-subtle': 'pulse-subtle 2s cubic-bezier(0.2, 0.9, 0.2, 1) infinite',
            },
            keyframes: {
                'fade-up': {
                    '0%': { opacity: '0', transform: 'translateY(6px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                'fade-in': {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                'slide-up': {
                    '0%': { transform: 'translateY(8px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                'bloop': {
                    '0%, 100%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(1.02)' },
                },
                'pulse-subtle': {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.8' },
                },
                'blur-motion': {
                    '0%': { backdropFilter: 'blur(0px)' },
                    '100%': { backdropFilter: 'blur(12px)' },
                },
            },
            transitionDuration: {
                'fast': '120ms',
                'normal': '220ms',
            },
            transitionTimingFunction: {
                'glass': 'cubic-bezier(0.2, 0.9, 0.2, 1)',
            },
            borderRadius: {
                'glass': '14px',
            },
            spacing: {
                'touch': '44px', // Touch target minimum
            },
        },
    },
    plugins: [],
}

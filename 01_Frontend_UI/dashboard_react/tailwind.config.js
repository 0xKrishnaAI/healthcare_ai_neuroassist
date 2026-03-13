/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#00C6FF',
                    dark: '#0099cc',
                    bg: '#050d1a',
                    surface: '#0d1f3c',
                },
                card: '#0d1f3c',
                accent: {
                    purple: '#7B2FBE',
                    mint: '#00E5A0',
                    gold: '#FFD166',
                },
                success: '#00E5A0',
                warning: '#FFD166',
                danger: '#FF5E5E',
                text: {
                    primary: '#E8F4FD',
                    secondary: '#7EB8D8',
                    muted: '#3a5c80',
                },
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            backgroundColor: {
                card: '#0d1f3c',
                'card-hover': '#112347',
            },
            borderColor: {
                card: 'rgba(0, 198, 255, 0.15)',
            },
            animation: {
                'spin-slow': 'spin 3s linear infinite',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'blob': 'blob 7s infinite',
                'fadeIn': 'fadeIn 0.3s ease-out',
                'slideUp': 'slideUp 0.4s ease-out',
                'shimmer': 'shimmer 1.5s infinite',
            },
            keyframes: {
                blob: {
                    '0%': { transform: 'translate(0px, 0px) scale(1)' },
                    '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
                    '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
                    '100%': { transform: 'translate(0px, 0px) scale(1)' },
                },
                fadeIn: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-400% 0' },
                    '100%': { backgroundPosition: '400% 0' },
                },
            },
        },
    },
    plugins: [],
}

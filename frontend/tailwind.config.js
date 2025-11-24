/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                telegram: {
                    primary: '#3390ec', // Telegram Blue
                    secondary: '#2f2f2f', // Dark Text
                    sent: '#eeffde', // Light Green (Sent Bubble)
                    received: '#ffffff', // White (Received Bubble)
                    bg: '#99ba92', // Chat Background (Pattern placeholder)
                    sidebar: '#ffffff', // Sidebar Background
                    border: '#dfe1e5', // Light Border
                    gray: '#707579', // Gray Text
                    hover: '#f4f4f5', // Hover State
                }
            },
            fontFamily: {
                sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
            },
            backgroundImage: {
                'chat-pattern': "url('https://web.telegram.org/img/bg_0.png')", // Telegram Web Default Pattern
            }
        },
    },
    plugins: [],
}

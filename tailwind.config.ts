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
                primary: "#135bec",
                "accent-green": "#0bda5e",
                "background-light": "#f6f6f8",
                "background-dark": "#101622",
                "glass-border": "rgba(255, 255, 255, 0.08)",
                "glass-surface": "rgba(30, 41, 59, 0.4)",
            },
            fontFamily: {
                "display": ["Space Grotesk", "sans-serif"],
                "sans": ["Space Grotesk", "sans-serif"]
            },
            borderRadius: {
                "DEFAULT": "0.25rem",
                "lg": "0.5rem",
                "xl": "0.75rem",
                "2xl": "1rem",
                "full": "9999px"
            },
            backgroundImage: {
                'page-gradient': 'radial-gradient(circle at 50% 0%, #1e293b 0%, #0f172a 100%)',
                'accent-gradient': 'linear-gradient(135deg, #135bec 0%, #3b82f6 100%)',
            }
        },
    },
    plugins: [],
}

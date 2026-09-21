/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        crm: {
          bg: '#0f172a',
          card: '#1e293b',
          cardHover: '#334155',
          border: '#334155',
          primary: '#3b82f6',
          whatsapp: '#25D366',
          instagram: '#E4405F',
          tiktok: '#EE1D52',
          facebook: '#1877F2',
          gmail: '#EA4335',
        }
      }
    },
  },
  plugins: [],
}

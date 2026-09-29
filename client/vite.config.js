import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // В dev ходим к бэку через прокси: запросы same-origin, CORS не нужен.
    proxy: {
      '/api': {
        target: 'https://93-77-180-125.sslip.io',
        changeOrigin: true,
        secure: true,
      },
      // Загруженные обложки отдаёт бэк по /uploads/...
      '/uploads': {
        target: 'https://93-77-180-125.sslip.io',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})

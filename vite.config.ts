import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const DEFAULT_BASE = 'https://milestone-chama-backend.onrender.com'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy API calls through Vite to avoid browser CORS issues in dev.
      '/api': {
        target: (process.env.VITE_API_BASE_URL || DEFAULT_BASE).replace(/\/$/, ''),
        changeOrigin: true,
      },
    },
  },
})

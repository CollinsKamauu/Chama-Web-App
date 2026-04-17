import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const DEFAULT_BASE = 'https://milestone-chama-backend.onrender.com'
const API_BASE = (process.env.VITE_API_BASE_URL || process.env.VITE_API_URL || DEFAULT_BASE).replace(/\/$/, '')

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Listen on LAN so phones / other PCs can open http://<this-machine-ip>:5173/
    host: true,
    proxy: {
      // Proxy API calls through Vite to avoid browser CORS issues in dev.
      '/api': {
        target: API_BASE,
        changeOrigin: true,
      },
    },
  },
})

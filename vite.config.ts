import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const DEFAULT_BASE = 'https://milestone-chama-backend.onrender.com'
const API_BASE = (process.env.VITE_API_BASE_URL || process.env.VITE_API_URL || DEFAULT_BASE).replace(/\/$/, '')
const MPESA_API_TARGET = (process.env.VITE_MPESA_API_PROXY_TARGET || 'http://127.0.0.1:8787').replace(/\/$/, '')

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Listen on LAN so phones / other PCs can open http://<this-machine-ip>:5173/
    host: true,
    proxy: {
      // M-Pesa B2C + balance (local Node server — never send secrets from the browser).
      '/api/mpesa': {
        target: MPESA_API_TARGET,
        changeOrigin: true,
      },
      // Other API calls through Vite to avoid browser CORS issues in dev.
      '/api': {
        target: API_BASE,
        changeOrigin: true,
      },
    },
  },
})

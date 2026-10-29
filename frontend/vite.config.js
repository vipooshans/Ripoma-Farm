import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const backendEnv = loadEnv(mode, fileURLToPath(new URL('../backend', import.meta.url)), '')
  // 5050 avoids ASP.NET Kestrel's default localhost:5000
  const backendPort = backendEnv.PORT || 5050

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 3000,
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      },
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${backendPort}`,
          changeOrigin: true,
        }
      }
    }
  }
})

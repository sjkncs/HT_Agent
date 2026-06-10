import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api/longcat': {
        target: 'https://api.longcat.chat',
        changeOrigin: true,
        secure: true,
        rewrite: (p) => p.replace(/^\/api\/longcat/, ''),
      },
      '/api/nvidia': {
        target: 'https://integrate.api.nvidia.com',
        changeOrigin: true,
        secure: true,
        rewrite: (p) => p.replace(/^\/api\/nvidia/, ''),
      },
    },
  },
})

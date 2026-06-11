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
      '/api/vision': {
        target: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        changeOrigin: true,
        secure: true,
        rewrite: (p) => p.replace(/^\/api\/vision/, ''),
      },
      '/api/tavily': {
        target: 'https://api.tavily.com',
        changeOrigin: true,
        secure: true,
        rewrite: (p) => p.replace(/^\/api\/tavily/, ''),
      },
      '/api/web-fetch': {
        target: 'https://example.com',
        changeOrigin: true,
        secure: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            const url = new URL(req.url, 'http://localhost')
            const targetUrl = url.searchParams.get('url')
            if (targetUrl) {
              const parsed = new URL(targetUrl)
              proxyReq.setHeader('host', parsed.host)
              proxyReq.path = parsed.pathname + parsed.search
            }
          })
        },
      },
    },
  },
})

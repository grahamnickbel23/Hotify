import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const htmlBypass = (req: any, res: any, options: any) => {
  if (req.headers.accept && req.headers.accept.includes('text/html')) {
    return '/index.html';
  }
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  server: {
    host: '0.0.0.0',
    port: 5174,
    proxy: {
      '/auth': {
        target: 'http://100.123.126.113:8002',
        changeOrigin: true,
        bypass: htmlBypass
      },

      '/song': {
        target: 'http://100.123.126.113:8001',
        changeOrigin: true,
        bypass: htmlBypass
      },

      '/playlist': {
        target: 'http://100.123.126.113:8001',
        changeOrigin: true,
        bypass: htmlBypass
      },

      '/search': {
        target: 'http://100.123.126.113:8001',
        changeOrigin: true,
        bypass: htmlBypass
      },

      '/streaming': {
        target: 'http://100.123.126.113:8001',
        changeOrigin: true,
        bypass: htmlBypass
      },

      '/media': {
        target: 'http://100.123.126.113:8001',
        changeOrigin: true,
        bypass: htmlBypass
      },
      
      '/server': {
        target: 'http://100.123.126.113:8001',
        changeOrigin: true,
        bypass: htmlBypass
      },

      '/ws': {
        target: 'ws://100.123.126.113:8001',
        changeOrigin: true,
        ws: true
      }
    }
  }
})

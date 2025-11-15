import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import svgr from 'vite-plugin-svgr'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        icon: true,
        exportType: 'named',
        namedExport: 'ReactComponent',
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    strictPort: true,
    proxy: {
      // ExamsService - Must be first to match before generic /api
      '/api/Exams': {
        target: 'http://localhost:5002',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('ExamsService proxy error', err);
          });
        },
      },
      // AuthService routes
      '/api/Auth': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
      },
      '/api/Users': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
      },
      // Default - AuthService for other /api routes
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
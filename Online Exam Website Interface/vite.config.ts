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
    port: 4000,
    strictPort: true,
    proxy: {
      '/admin': {
        target: 'http://localhost:3008',
        changeOrigin: true,
        ws: true,
      },
      '/teacher': {
        target: 'http://localhost:5173',
        changeOrigin: true,
        ws: true,
      },
      '/api/Chat': {
        target: 'http://localhost:5004',
        changeOrigin: true,
        ws: true,
      },
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      '/Chat': {
        target: 'http://localhost:5004',
        changeOrigin: true,
        ws: true,
      },
      '/chatHub': {
        target: 'http://localhost:5004',
        changeOrigin: true,
        ws: true,
      },
      '/feedback': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        ws: true,
        rewrite: (path) => `/api${path}`,
      },
    },
  },
})

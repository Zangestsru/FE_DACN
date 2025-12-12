import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

// https://vite.dev/config/
export default defineConfig({
    base:"/teacher/",
    server: {
      port: 5173,
      strictPort: true,
      hmr: {
        clientPort: 4000,
      },
      proxy: {
        '/chatHub': {
          target: 'http://localhost:5004',
          changeOrigin: true,
          ws: true,
        },
        '/api/Chat': {
          target: 'http://localhost:5004',
          changeOrigin: true,
        },
        '/api/notifications': {
          target: 'http://localhost:5004',
          changeOrigin: true,
        },
      },
    },
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        icon: true,
        // This will transform your SVG to a React component
        exportType: "named",
        namedExport: "ReactComponent",
      },
    }),
  ],
});

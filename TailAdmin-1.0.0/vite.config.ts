import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

// https://vite.dev/config/
export default defineConfig({
    base: "/admin/",
    server: {
      port: 3008,
      strictPort: true,
      hmr: {
        clientPort: 3008,
      },
      proxy: {
        '/api/Chat': {
          target: 'http://localhost:5004',
          changeOrigin: true,
          ws: true,
        },
        '/chatHub': {
          target: 'http://localhost:5004',
          changeOrigin: true,
          ws: true,
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

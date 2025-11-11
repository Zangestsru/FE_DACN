import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

// https://vite.dev/config/
export default defineConfig({
    // Serve Teacher app under /teacher path when behind a reverse proxy
    base: "/teacher/",
    server: {
      port: 3003,
      strictPort: true,
      hmr: {
        clientPort: 4000,
      },
    },
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        icon: true,
    
        exportType: "named",
        namedExport: "ReactComponent",
      },
    }),
  ],
});

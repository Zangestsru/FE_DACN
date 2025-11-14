import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

// https://vite.dev/config/
export default defineConfig({
    // Serve TailAdmin under /admin path when behind a reverse proxy
    base: "/admin/",
    server: {
      port: 3007,
      strictPort: true,
      // When accessed through a proxy gateway (single port), HMR needs to connect to the gateway port
      hmr: {
        clientPort: 4002,
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

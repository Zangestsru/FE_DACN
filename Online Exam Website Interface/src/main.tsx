
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./styles/responsive-utils.css";
import "./styles/responsive-fixes.css";
import "./styles/no-icons.css";
// Third‑party library styles to match Teacher/Admin setup
import "swiper/swiper-bundle.css";
import "simplebar-react/dist/simplebar.min.css";
import "flatpickr/dist/flatpickr.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Initialize a single QueryClient for the entire app
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Avoid aggressive retries during development to reduce noise
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
  
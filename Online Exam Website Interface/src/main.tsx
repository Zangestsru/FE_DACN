
  import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./styles/responsive-utils.css";
import "./styles/responsive-fixes.css";

createRoot(document.getElementById("root")!).render(
  <App />
);
  
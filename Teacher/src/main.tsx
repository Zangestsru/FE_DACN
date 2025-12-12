import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "swiper/swiper-bundle.css";
import "simplebar-react/dist/simplebar.min.css";
import App from "./App.tsx";
import { AppWrapper } from "./components/common/PageMeta.tsx";
import { ThemeProvider } from "./context/ThemeContext.tsx";
import Footer from "./components/footer/Footer.tsx";
import authService from "./services/auth.service";

const params = new URLSearchParams(window.location.search);
const incomingToken = params.get("token");
if (incomingToken) {
  try {
    localStorage.removeItem("token");
    localStorage.removeItem("access_token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("refreshtoken");
    localStorage.removeItem("user");
    localStorage.removeItem("user_data");
    localStorage.setItem("access_token", incomingToken);
    authService.getCurrentUser().then(() => {
      const u = authService.getUser();
      if (!u || (u.role || '').toLowerCase() !== 'teacher') {
        const base = '/teacher';
        window.location.href = `${base}/signin`;
      }
    });
    const url = new URL(window.location.href);
    url.search = "";
    window.history.replaceState({}, "", url.toString());
  } catch {}
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <AppWrapper>
        <App />
        <Footer/>
      </AppWrapper>
    </ThemeProvider>
  </StrictMode>
);

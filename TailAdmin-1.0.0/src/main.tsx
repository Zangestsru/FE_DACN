import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "swiper/swiper-bundle.css";
import "simplebar-react/dist/simplebar.min.css";
import App from "./App.tsx";
import { AppWrapper } from "./components/common/PageMeta.tsx";
import { ThemeProvider } from "./context/ThemeContext.tsx";
import { AuthProvider } from "./context/AuthContext.tsx";
import Footer from "./components/footer/Footer.tsx";
const params = new URLSearchParams(window.location.search);
const incomingToken = params.get("token");
if (incomingToken) {
  try {
    localStorage.removeItem("token");
    localStorage.removeItem("access_token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("refreshtoken");
    localStorage.removeItem("user");
    localStorage.removeItem("authUser");
    localStorage.removeItem("user_data");
    localStorage.setItem("authToken", incomingToken);
    localStorage.setItem("access_token", incomingToken);
    const url = new URL(window.location.href);
    url.search = "";
    window.history.replaceState({}, "", url.toString());
  } catch {}
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <AppWrapper>
          <App />
          <Footer/>
        </AppWrapper>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>
);

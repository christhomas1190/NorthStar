import "./index.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { ToastProvider } from "@/components/ui/toast.jsx";

import { AuthProvider, useAuth } from "@/state/auth.jsx";
import { attachAuthBridge } from "@/lib/api.js";

/**
 * Bridges auth state into the API helper so every request
 * automatically includes Authorization and X-District-Id.
 */
function AuthBridge() {
  const { token, activeDistrictId } = useAuth();

  React.useEffect(() => {
    attachAuthBridge(() => token, () => activeDistrictId);
  }, [token, activeDistrictId]);

  return null;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AuthBridge />
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

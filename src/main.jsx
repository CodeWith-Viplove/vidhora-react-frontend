import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConfigProvider } from 'antd';
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./Context/AuthContext.jsx";
import { AppProvider } from "./Context/AppContext.jsx";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Get Client ID from environment variables
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ConfigProvider
      theme={{
        token: {
          fontFamily: "'Google Sans Flex', sans-serif",
        },
      }}
    >
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <AuthProvider>
          <AppProvider>
            <>
              <App />
              <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
              />
            </>
          </AppProvider>
        </AuthProvider>
      </GoogleOAuthProvider>
    </ConfigProvider>
  </StrictMode>
);

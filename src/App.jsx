import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./Pages/LandingPage/LandingPage";
import MainApp from "./Pages/MainApp/MainApp";
import LoginPage from "./Pages/LoginPage/LoginPage";
import ProtectedRoute from "./Components/ProtectedRoute";
import PublicRoute from "./Components/PublicRoute";

const App = () => {
  return (
    <BrowserRouter>
      <div className="lex-App">
        <Routes>
          {/* Public Routes - accessible to everyone */}
          <Route 
            path="/" 
            element={
              <PublicRoute>
                <LandingPage />
              </PublicRoute>
            } 
          />
          
          {/* Restricted Public Route - redirects to dashboard if authenticated */}
          <Route 
            path="/login" 
            element={
              <PublicRoute restricted={true}>
                <LoginPage />
              </PublicRoute>
            } 
          />
          
          {/* Protected Routes - requires authentication */}
          <Route 
            path="/app/*" 
            element={
              <ProtectedRoute>
                <MainApp />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default App;

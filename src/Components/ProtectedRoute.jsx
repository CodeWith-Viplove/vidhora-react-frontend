import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * ProtectedRoute - Protects routes that require authentication
 * Redirects to /login if user is not authenticated
 */
const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  
  // Check if user has valid authentication token
  const authToken = localStorage.getItem('authToken');
  const userInfo = localStorage.getItem('userInfo');
  
  // User is authenticated if both token and userInfo exist
  const isAuthenticated = authToken && userInfo;
  
  if (!isAuthenticated) {
    // Redirect to login page and save the attempted location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // User is authenticated, render the protected content
  return children;
};

export default ProtectedRoute;

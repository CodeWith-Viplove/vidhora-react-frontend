import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * PublicRoute - For public pages like login and landing
 * Redirects authenticated users to /app/dashboard
 */
const PublicRoute = ({ children, restricted = false }) => {
  const location = useLocation();
  
  // Check if user is authenticated
  const authToken = localStorage.getItem('authToken');
  const userInfo = localStorage.getItem('userInfo');
  const isAuthenticated = authToken && userInfo;
  
  // If user is authenticated, redirect them to the dashboard
  // even if they are trying to access a public page like the landing page.
  if (isAuthenticated) {
    // Get the location they were trying to access, or default to dashboard
    const from = location.state?.from?.pathname || '/app/dashboard';
    return <Navigate to={from} replace />;
  }
  
  // Otherwise, render the public page
  return children;
};

export default PublicRoute;

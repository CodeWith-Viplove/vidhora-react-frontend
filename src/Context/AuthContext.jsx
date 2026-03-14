import React, { createContext, useContext, useState, useEffect } from "react";
import { logoutUser } from "../api_services/auth";

// 1. Create context
const AuthContext = createContext();

// 2. Create provider
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState("light");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check for existing user on app start
  useEffect(() => {
    // Prefer localStorage userInfo (kept in sync with backend auth)
    const sessionUserInfo = localStorage.getItem('userInfo');
    if (sessionUserInfo) {
      try {
        const userData = JSON.parse(sessionUserInfo);
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing session userInfo:', error);
        localStorage.removeItem('userInfo');
      }
    } else {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Error parsing stored user data:', error);
          localStorage.removeItem('user');
        }
      }
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const loginWithGoogle = (userInfo) => {
    const userData = {
      name: userInfo.name,
      email: userInfo.email,
      picture: userInfo.picture,
      sub: userInfo.sub,
      isAuthenticated: true,
      loginTime: new Date().toISOString()
    };
    
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const loginWithCredentials = (email, password, name = 'User') => {
    // Your custom login logic here
    const userData = {
      name: name,
      email: email,
      isAuthenticated: true,
      loginTime: new Date().toISOString()
    };
    
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = async () => {
    const storedUserInfo = localStorage.getItem('userInfo');
    const storedUserId = storedUserInfo ? JSON.parse(storedUserInfo).id : null;

    if (storedUserId) {
      try {
        const message = await logoutUser(storedUserId);
        console.log(message);
      } catch (error) {
        console.error('Logout failed:', error.message);
        // Still proceed with local logout
      }
    }
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
    // Clear session storage used across the app
    localStorage.removeItem('authToken');
    localStorage.removeItem('user_id');
    localStorage.removeItem('userInfo');
    localStorage.removeItem('googleUser');
  };

  const toggleTheme = () => setTheme((prev) => (prev === "light" ? "dark" : "light"));

  const value = {
    user,
    login,
    loginWithGoogle,
    loginWithCredentials,
    logout,
    theme,
    toggleTheme,
    isAuthenticated,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// 3. Create and export the useAuth hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// 4. Export the context itself (optional, for advanced usage)
export default AuthContext;

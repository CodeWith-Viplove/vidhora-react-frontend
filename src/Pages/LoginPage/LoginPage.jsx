import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User, Scale } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { loginUser, registerUser, googleAuth } from '../../api_services/auth';
import { useAuth } from '../../Context/AuthContext.jsx';
import './LoginPage.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();

  // login / signup toggle
  const [isLogin, setIsLogin] = useState(true);

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    // Reset forms when switching
    setLoginData({ email: '', password: '', rememberMe: false });
    setSignupData({ name: '', email: '', password: '', confirmPassword: '', agreeToTerms: false });
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  // Password visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Loading states
  const [isLoading, setIsLoading] = useState(false);

  // -------- LOGIN STATE --------
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  // -------- SIGNUP STATE --------
  const [signupData, setSignupData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  });

  // ----------------- LOGIN SUBMIT ------------------
  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!loginData.email || !loginData.password) {
      message.warning("Please enter valid credentials");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(loginData.email)) {
      message.error("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        email: loginData.email,
        password: loginData.password
      };

      const { authToken, userInfo } = await loginUser(payload);

      // Store auth data
      localStorage.setItem("authToken", authToken);
      localStorage.setItem("user_id", userInfo.id);
      localStorage.setItem("userInfo", JSON.stringify(userInfo));

      // Update auth context so avatar can show correct initial
      login(userInfo);

      message.success("Login Successful!");

      // Navigate to app
      navigate("/app");

    } catch (error) {
      console.error("Login error:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Login failed. Please try again.";
      message.error(errorMessage);
      setIsLoading(false);
    }
  };

  // ----------------- SIGNUP SUBMIT ------------------
  const handleSignupSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!signupData.name || !signupData.email || !signupData.password || !signupData.confirmPassword) {
      message.warning("Please fill in all required fields");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signupData.email)) {
      message.error("Please enter a valid email address");
      return;
    }

    // Password validation
    if (signupData.password.length < 6) {
      message.error("Password must be at least 6 characters long");
      return;
    }

    if (signupData.password !== signupData.confirmPassword) {
      message.error("Passwords do not match");
      return;
    }

    if (!signupData.agreeToTerms) {
      message.warning("Please agree to the Terms & Conditions");
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        name: signupData.name,
        email: signupData.email,
        password: signupData.password
      };

      const { authToken, userInfo } = await registerUser(payload);

      // Store auth data
      localStorage.setItem("authToken", authToken);
      localStorage.setItem("user_id", userInfo.id);
      localStorage.setItem("userInfo", JSON.stringify(userInfo));

      // Update auth context
      login(userInfo);

      message.success("Account created successfully!");

      // Navigate to app
      navigate("/app");

    } catch (error) {
      console.error("Signup error:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Registration failed. Please try again.";
      message.error(errorMessage);
      setIsLoading(false);
    }
  };

  // ----------------- GOOGLE LOGIN ------------------
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setIsLoading(true);
      if (!credentialResponse || !credentialResponse.credential) {
        message.error("Google login failed");
        setIsLoading(false);
        return;
      }

      const googleProfile = jwtDecode(credentialResponse.credential);

      // Call backend Google auth to upsert user and get real Mongo user id
      const { authToken, userInfo } = await googleAuth({
        name: googleProfile.name,
        email: googleProfile.email,
      });

      // Save user info and token
      localStorage.setItem("googleUser", JSON.stringify(googleProfile));
      localStorage.setItem("authToken", authToken);
      localStorage.setItem("user_id", userInfo.id); // Mongo ObjectId ✅
      localStorage.setItem("userInfo", JSON.stringify(userInfo));

      // Update auth context (we care mainly about name/email/id for avatar & state)
      login({
        id: userInfo.id,
        name: userInfo.name || googleProfile.name,
        email: userInfo.email || googleProfile.email,
        picture: googleProfile.picture,
      });

      message.success(`Welcome ${userInfo.name || googleProfile.name}!`);
      navigate("/app");
    } catch (error) {
      console.error("Google login error:", error);
      const errorMessage = error?.message || "Google login failed. Please try again.";
      message.error(errorMessage);
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    setIsLoading(false);
    message.error("Google Login Failed");
  };

  return (
    <div className="auth-container">
      <div className="card">
        <div className="content1">

          <div className="logo-section">
            <div className="logo-container">
              <Scale size={55} className="scale-icon" />
              {/* <span className="logo-text">JUSTICE</span> */}
              {/* <span className="logo-text">BRIDGE</span> */}
            </div>
          </div>

          <h2>{isLogin ? 'Welcome Back!' : 'Create Account'}</h2>
          <h3>
            {isLogin
              ? 'Sign in to continue to your account'
              : 'Sign up to get started with your account'
            }
          </h3>

          {/* GOOGLE LOGIN */}
          <div className="google-auth-container">
            {isLoading ? (
              <button disabled className="google-btn" style={{ opacity: 0.7, cursor: 'not-allowed', margin: 0, height: '52px' }}>
                <LoadingOutlined style={{ marginRight: 8, fontSize: '18px' }} />
                {isLogin ? 'Signing in with Google...' : 'Signing up with Google...'}
              </button>
            ) : (
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme="outline"
                size="large"
                text={isLogin ? "signin_with" : "signup_with"}
                shape="rectangular"
                logo_alignment="left"
              />
            )}
          </div>

          <div className="divider">
            <span className='or' style={{ justifyContent: "center", fontSize: "18px" }}>or</span>
          </div>

          {/* ---------------- LOGIN FORM ---------------- */}
          {isLogin ? (
            <form onSubmit={handleLoginSubmit}>

              <div className="input-group">
                <Mail className="input-icon" size={20} />
                <input
                  type="email"
                  placeholder="Email"
                  value={loginData.email}
                  onChange={(e) =>
                    setLoginData({ ...loginData, email: e.target.value })
                  }
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="input-group">
                <Lock className="input-icon" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={loginData.password}
                  onChange={(e) =>
                    setLoginData({ ...loginData, password: e.target.value })
                  }
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <div className="row">
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={loginData.rememberMe}
                    onChange={(e) =>
                      setLoginData({ ...loginData, rememberMe: e.target.checked })
                    }
                    disabled={isLoading}
                  />
                  <span className="check"></span>
                  Remember me
                </label>

                <a href="#forgot" className="forgot-link">Forgot password?</a>
              </div>

              <button type="submit" className="submit-btn" disabled={isLoading}>
                {isLoading ? <><LoadingOutlined style={{ marginRight: 8 }} /> Signing In...</> : 'Sign In'}
              </button>
            </form>
          ) : (
            /* ---------------- SIGNUP FORM ---------------- */
            <form onSubmit={handleSignupSubmit}>

              <div className="input-group">
                <User className="input-icon" size={20} />
                <input
                  type="text"
                  placeholder="Full Name"
                  value={signupData.name}
                  onChange={(e) =>
                    setSignupData({ ...signupData, name: e.target.value })
                  }
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="input-group">
                <Mail className="input-icon" size={20} />
                <input
                  type="email"
                  placeholder="Email"
                  value={signupData.email}
                  onChange={(e) =>
                    setSignupData({ ...signupData, email: e.target.value })
                  }
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="input-group">
                <Lock className="input-icon" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password (min 6 characters)"
                  value={signupData.password}
                  onChange={(e) =>
                    setSignupData({ ...signupData, password: e.target.value })
                  }
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <div className="input-group">
                <Lock className="input-icon" size={20} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm Password"
                  value={signupData.confirmPassword}
                  onChange={(e) =>
                    setSignupData({ ...signupData, confirmPassword: e.target.value })
                  }
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <div className="row">
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={signupData.agreeToTerms}
                    onChange={(e) =>
                      setSignupData({ ...signupData, agreeToTerms: e.target.checked })
                    }
                    disabled={isLoading}
                    required
                  />
                  <span className="check"></span>
                  I agree to the <a href="#terms">Terms & Conditions</a>
                </label>
              </div>

              <button type="submit" className="submit-btn" disabled={isLoading}>
                {isLoading ? <><LoadingOutlined style={{ marginRight: 8 }} /> Creating Account...</> : 'Create Account'}
              </button>
            </form>
          )}

          <p>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              className="switch-btn"
              onClick={toggleAuthMode}
              disabled={isLoading}

            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>

        {/* RIGHT SIDE FEATURES */}
        <div className="features1-section">
          <div className="features1-content">
            <h4>Why Choose VIDHORA?</h4>
            <div className="features1-list">
              {[
                { title: "Simplify", description: "complex legal language with AI-powered summaries" },
                { title: "Summarize", description: "court judgments instantly for quick understanding" },
                { title: "Multi-language support", description: "Access legal resources in various languages" }
              ].map((feature, index) => (
                <div key={index} className="feature1-item">
                  <div className="bullet1-point"></div>
                  <div className="feature1-text">
                    <h5>{feature.title}</h5>
                    <p>{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;

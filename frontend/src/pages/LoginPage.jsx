import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import "../styles/auth.css";
import { toast } from "react-toastify";
import { Mail, Lock, Loader } from "lucide-react";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/AuthContext";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, googleLogin } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Please enter email and password", { 
        position: "top-right", 
        autoClose: 2000 
      });
      return;
    }

    setLoading(true);

    try {
      const result = await login(email, password);

      if (result.success) {
        toast.success("Login successful!", { 
          position: "top-right", 
          autoClose: 2000 
        });

        setTimeout(() => {
          if (result.user.role === "admin") {
            navigate("/admindashboard");
          } else {
            navigate("/userdashboard");
          }
        }, 1000);
      } else {
        toast.error(result.error || "Login failed", { 
          position: "top-right", 
          autoClose: 3000 
        });
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.", { 
        position: "top-right", 
        autoClose: 3000 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const base64Url = credentialResponse.credential.split('.')[1];
      const decodedPayload = JSON.parse(window.atob(base64Url));
      
      const googleData = {
        name: decodedPayload.name || decodedPayload.email.split('@')[0],
        email: decodedPayload.email,
        googleId: decodedPayload.sub,
        profilePicture: decodedPayload.picture || null
      };

      const result = await googleLogin(googleData);

      if (result.success) {
        toast.success("Google login successful!", { 
          position: "top-right", 
          autoClose: 2000 
        });

        setTimeout(() => {
          if (result.user.role === "admin") {
            navigate("/admindashboard");
          } else {
            navigate("/userdashboard");
          }
        }, 1000);
      } else {
        toast.error(result.error || "Google login failed", { 
          position: "top-right", 
          autoClose: 3000 
        });
      }
    } catch (error) {
      toast.error("Google login failed. Please try again.", { 
        position: "top-right", 
        autoClose: 3000 
      });
    }
  };

  const handleGoogleError = () => {
    toast.error("Google login failed", { 
      position: "top-right", 
      autoClose: 3000 
    });
  };

  return (
    <>
      <Navbar />
      <div className="auth-container login-bg">
        <form className="auth-form trendy-form" onSubmit={handleSubmit}>
          <h2>Welcome Back 👋</h2>

          <div className="input-group">
            <Mail size={18} />
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="input-group">
            <Lock size={18} />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <button type="submit" className="trendy-btn" disabled={loading}>
            {loading ? (
              <>
                <Loader size={18} className="spinner" /> Logging in...
              </>
            ) : (
              "Login"
            )}
          </button>

          <p className="register-text">
            Don't have an account? <Link to="/register">Register</Link>
          </p>

          {/* Forgot Password Link */}
          <p className="forgot-password-text">
            <Link to="/forgot-password">Forgot Password?</Link>
          </p>

          {/* Google OAuth Button */}
          <div style={{ marginTop: "20px", textAlign: "center" }}>
            <GoogleOAuthProvider clientId="140747983015-tmjmqdm6b2c9bpdq8tm8a692vdno6drl.apps.googleusercontent.com">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                width="100%"
                shape="rectangular"
                text="continue_with"
                theme="outline"
                size="large"
                className="trendy-btn google-btn"
              />
            </GoogleOAuthProvider>
          </div>
        </form>
      </div>
    </>
  );
};

export default LoginPage;
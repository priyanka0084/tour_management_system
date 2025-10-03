import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import "../styles/auth.css"; 
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import config from "../config";
import { Mail, Lock } from "lucide-react";

// Google OAuth imports
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";

const LoginPage = ({ setUser }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (email && password) {
      const role = email.includes('admin') ? 'admin' : 'user';
      const fullName = email.split('@')[0];

      setUser({ fullName, email, role });

      toast.success("Login successful", { position: "top-right", autoClose: 2000 });

      setTimeout(() => {
        if (role === "admin") navigate("/admindashboard");
        else navigate("/userdashboard");
      }, 1000);
    } else {
      setError("Please enter email and password");
      toast.error("Please enter email and password", { position: "top-right", autoClose: 2000 });
    }
  };

  const handleGoogleSuccess = (credentialResponse) => {
    const base64Url = credentialResponse.credential.split('.')[1];
    const decodedPayload = JSON.parse(window.atob(base64Url));
    const fullName = decodedPayload.name || decodedPayload.email.split('@')[0];
    const email = decodedPayload.email;

    setUser({ fullName, email, role: "user" });
    toast.success("Google login successful", { position: "top-right", autoClose: 2000 });
    navigate("/userdashboard");
  };

  const handleGoogleError = () => {
    toast.error("Google login failed", { position: "top-right", autoClose: 2000 });
  };

  return (
    <>
      <Navbar />
      <div className="auth-container login-bg">
        <form className="auth-form trendy-form" onSubmit={handleSubmit}>
          <h2>Welcome Back 👋</h2>
          {error && <p className="error">{error}</p>}

          <div className="input-group">
            <Mail size={18} />
            <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="input-group">
            <Lock size={18} />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          <button type="submit" className="trendy-btn">Login</button>

          <p className="register-text">Don’t have an account? <Link to="/register">Register</Link></p>

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
      <ToastContainer />
    </>
  );
};

export default LoginPage;

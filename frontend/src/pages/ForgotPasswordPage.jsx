import React, { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import "../styles/auth.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Mail, Loader, ArrowLeft } from "lucide-react";
import api from "../services/api";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("Please enter your email address", { 
        position: "top-right", 
        autoClose: 2000 
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address", { 
        position: "top-right", 
        autoClose: 2000 
      });
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/forgot-password', { email });

      if (response.data.success) {
        setEmailSent(true);
        toast.success("Password reset link sent! Check your email.", { 
          position: "top-right", 
          autoClose: 4000 
        });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Failed to send reset link. Please try again.";
      toast.error(errorMessage, { 
        position: "top-right", 
        autoClose: 3000 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="auth-container forgot-password-bg">
        <form className="auth-form trendy-form" onSubmit={handleSubmit}>
          {!emailSent ? (
            <>
              <h2>Forgot Password? 🔐</h2>
              <p className="auth-subtitle">
                No worries! Enter your email and we'll send you reset instructions.
              </p>

              <div className="input-group">
                <Mail size={18} />
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <button type="submit" className="trendy-btn" disabled={loading}>
                {loading ? (
                  <>
                    <Loader size={18} className="spinner" /> Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </button>

              <p className="register-text">
                <Link to="/login">
                  <ArrowLeft size={16} style={{ verticalAlign: "middle", marginRight: "5px" }} />
                  Back to Login
                </Link>
              </p>
            </>
          ) : (
            <>
              <div className="success-icon">✅</div>
              <h2>Check Your Email!</h2>
              <p className="auth-subtitle">
                We've sent a password reset link to <strong>{email}</strong>
              </p>
              <p className="auth-info">
                The link will expire in 1 hour. If you don't see the email, check your spam folder.
              </p>

              <button 
                type="button" 
                className="trendy-btn"
                onClick={() => setEmailSent(false)}
              >
                Resend Email
              </button>

              <p className="register-text">
                <Link to="/login">
                  <ArrowLeft size={16} style={{ verticalAlign: "middle", marginRight: "5px" }} />
                  Back to Login
                </Link>
              </p>
            </>
          )}
        </form>
      </div>
      <ToastContainer />
    </>
  );
};

export default ForgotPasswordPage;
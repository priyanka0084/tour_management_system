import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import "../styles/auth.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Lock, Loader, CheckCircle } from "lucide-react";
import api from "../services/api";

const ResetPasswordPage = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const navigate = useNavigate();
  const { token } = useParams(); // Get token from URL

  useEffect(() => {
    // Check if token exists
    if (!token) {
      toast.error("Invalid reset link", { 
        position: "top-right", 
        autoClose: 3000 
      });
      setTimeout(() => navigate("/login"), 3000);
    }
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!newPassword || !confirmPassword) {
      toast.error("Please fill in all fields", { 
        position: "top-right", 
        autoClose: 2000 
      });
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters", { 
        position: "top-right", 
        autoClose: 2000 
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match", { 
        position: "top-right", 
        autoClose: 2000 
      });
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/reset-password', {
        token,
        newPassword
      });

      if (response.data.success) {
        setResetSuccess(true);
        toast.success("Password reset successful!", { 
          position: "top-right", 
          autoClose: 3000 
        });

        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Failed to reset password. Please try again.";
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
      <div className="auth-container reset-password-bg">
        <form className="auth-form trendy-form" onSubmit={handleSubmit}>
          {!resetSuccess ? (
            <>
              <h2>Reset Password 🔑</h2>
              <p className="auth-subtitle">
                Enter your new password below.
              </p>

              <div className="input-group">
                <Lock size={18} />
                <input
                  type="password"
                  placeholder="New Password (min 6 characters)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={6}
                />
              </div>

              <div className="input-group">
                <Lock size={18} />
                <input
                  type="password"
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <button type="submit" className="trendy-btn" disabled={loading}>
                {loading ? (
                  <>
                    <Loader size={18} className="spinner" /> Resetting...
                  </>
                ) : (
                  "Reset Password"
                )}
              </button>

              <p className="register-text">
                Remember your password? <Link to="/login">Login</Link>
              </p>
            </>
          ) : (
            <>
              <div className="success-icon">
                <CheckCircle size={60} color="#10b981" />
              </div>
              <h2>Password Reset Successful! ✅</h2>
              <p className="auth-subtitle">
                Your password has been successfully reset.
              </p>
              <p className="auth-info">
                Redirecting to login page...
              </p>
              
              <Link to="/login" className="trendy-btn" style={{ textDecoration: "none", display: "inline-block" }}>
                Go to Login
              </Link>
            </>
          )}
        </form>
      </div>
      <ToastContainer />
    </>
  );
};

export default ResetPasswordPage;
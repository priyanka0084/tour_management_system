import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import "../styles/auth.css";
import { toast } from "react-toastify";
import { User, Mail, Lock, Loader } from "lucide-react";
import api from "../services/api";

const RegisterPage = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!fullName || !email || !password || !confirmPassword) {
      toast.error("All fields are required", {
        position: "top-right",
        autoClose: 3000
      });
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match!", {
        position: "top-right",
        autoClose: 3000
      });
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters", {
        position: "top-right",
        autoClose: 3000
      });
      return;
    }

    setLoading(true);

    try {
      // Call backend API to register user
      const response = await api.post('/auth/register', {
        fullName,
        email,
        password
      });

      if (response.data.success) {
        toast.success("Registration successful! Please login.", {
          position: "top-right",
          autoClose: 2000
        });

        // Clear form
        setFullName("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");

        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Registration failed. Please try again.";
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
      <div className="auth-container register-bg">
        <form className="auth-form trendy-form" onSubmit={handleSubmit}>
          <h2>Create Account</h2>

          <div className="input-group">
            <User size={18} />
            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              disabled={loading}
            />
          </div>

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
              placeholder="Password (min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              minLength={6}
            />
          </div>

          <div className="input-group">
            <Lock size={18} />
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <button type="submit" className="trendy-btn" disabled={loading}>
            {loading ? (
              <>
                <Loader size={18} className="spinner" /> Registering...
              </>
            ) : (
              "Register"
            )}
          </button>

          <p className="register-text">
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </form>
      </div>
      <ToastContainer />
    </>
  );
};

export default RegisterPage;
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import "../styles/auth.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import config from "../config";


const RegisterPage = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    // Mock registration
    toast.success("Registration successful! Please login.", { position: "top-right", autoClose: 2000 });
    setTimeout(() => navigate("/login"), 2000);
  };


  return (
    <>
      <Navbar />
      <div className="auth-container register-bg">
        <form className="auth-form" onSubmit={handleSubmit}>
          <h2>Register</h2>
          {error && <p className="error">{error}</p>}
          <input type="text" placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          <button type="submit">Register</button>
          <p>Already have an account? <Link to="/login">Login</Link></p>
        </form>
      </div>
      <ToastContainer />
    </>
  );
};


export default RegisterPage;

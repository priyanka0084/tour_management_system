import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Sparkles } from 'lucide-react';

const LoginOverlay = ({ onClose, message }) => {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate('/login');
  };

  const handleRegister = () => {
    navigate('/register');
  };

  const handleClose = (e) => {
    // Close if clicking on backdrop
    if (e.target.classList.contains('login-overlay')) {
      onClose();
    }
  };

  return (
    <div className="login-overlay" onClick={handleClose}>
      <div className="login-overlay-content">
        {/* Icon */}
        <div className="login-overlay-icon">
          <div className="icon-wrapper">
            <Lock size={48} />
            <Sparkles size={24} className="sparkle-icon" />
          </div>
        </div>

        {/* Heading */}
        <h2>Unlock Personalized Recommendations</h2>

        {/* Message */}
        <p>
          {message || 'Sign in to save your preferences and get travel recommendations tailored just for you!'}
        </p>

        {/* Benefits List */}
        <div className="overlay-benefits">
          <div className="benefit-item">
            <span className="benefit-icon">✨</span>
            <span>Personalized destination suggestions</span>
          </div>
          <div className="benefit-item">
            <span className="benefit-icon">❤️</span>
            <span>Save to wishlist & cart</span>
          </div>
          <div className="benefit-item">
            <span className="benefit-icon">🎯</span>
            <span>Track your travel preferences</span>
          </div>
          <div className="benefit-item">
            <span className="benefit-icon">🎁</span>
            <span>Exclusive offers & discounts</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="login-overlay-buttons">
          <button 
            className="overlay-btn primary"
            onClick={handleLogin}
          >
            Login
          </button>
          <button 
            className="overlay-btn secondary"
            onClick={handleRegister}
          >
            Create Account
          </button>
        </div>

        {/* Close Button */}
        <button 
          className="overlay-close-btn"
          onClick={onClose}
          aria-label="Close"
        >
          Continue as Guest
        </button>
      </div>
    </div>
  );
};

export default LoginOverlay;
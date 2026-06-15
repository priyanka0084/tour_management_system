import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import Destinations from './pages/Destinations';
import Packages from './pages/Packages';
import BookingPayment from './pages/BookingPayment';
import BookingConfirmation from './pages/BookingConfirmation';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext'; // ✨ NEW IMPORT
import FloatingChatbot from './components/home/FloatingChatbot';
import { WishlistProvider } from './context/WishlistContext';
import { ToastContainer } from 'react-toastify'; // ✨ NEW IMPORT
import ReviewsPage from './pages/ReviewsPage';
import 'react-toastify/dist/ReactToastify.css'; // ✨ NEW IMPORT
import './App.css';
import './styles/cart-wishlist-fix.css';

import { RecommendationProvider } from './context/RecommendationContext';
import RecommendationsPage from './pages/RecommendationsPage';
// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/userdashboard" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/destinations" element={<Destinations />} />
      <Route path="/packages/:placeId" element={<Packages />} />
      <Route path="/booking" element={<BookingPayment />} />
      <Route path="/booking-confirmation" element={<BookingConfirmation />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      {/* Password Reset Routes */}
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      
      {/* Protected User Route */}
      <Route
        path="/userdashboard"
        element={
          <ProtectedRoute>
            <UserDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="/recommendations" element={<RecommendationsPage />} />
      {/* Protected Admin Route */}
      <Route
        path="/admindashboard"
        element={
          <ProtectedRoute adminOnly={true}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="/reviews" element={<ReviewsPage />} />
      {/* 404 - Redirect to Home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider> {/* ✨ NEW: WishlistProvider wraps everything */}
            <RecommendationProvider>
            <div className="App">
              <AppRoutes />
              <FloatingChatbot />
              <ToastContainer
  position="top-right"
  autoClose={2000}
  hideProgressBar={false}
  newestOnTop={true}
  closeOnClick={true}
  pauseOnHover={true}
  draggable={true}
  theme="light"
/>
            </div>
            </RecommendationProvider>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
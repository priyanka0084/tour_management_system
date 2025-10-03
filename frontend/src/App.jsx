import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import Destinations from './pages/Destinations';
import Packages from './pages/Packages';
import BookingPayment from './pages/BookingPayment';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import './App.css';

const appStyle = {
  fontFamily: 'Arial, sans-serif',
  backgroundColor: '#ffffff',
  minHeight: '100vh',
  margin: 0,
};

function App() {
  const [user, setUser] = useState(null);

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/destinations" element={<Destinations />} />
          <Route path="/packages/:placeId" element={<Packages />} />
          <Route path="/booking" element={<BookingPayment />} />
          <Route path="/login" element={<LoginPage setUser={setUser} />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/userdashboard" element={user ? <UserDashboard user={user} /> : <Navigate to="/login" />} />
          <Route path="/admindashboard" element={user && user.role === 'admin' ? <AdminDashboard user={user} /> : <Navigate to="/login" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

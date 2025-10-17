// ========================================
// REVIEWS PAGE
// Main public reviews page
// ========================================

import React, { useState, useEffect } from 'react';
import { MessageSquare, Star, PenSquare, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Footer from '../components/home/Footer';
import ReviewsList from '../components/reviews/ReviewsList';
import WriteReviewModal from '../components/reviews/WriteReviewModal';
import api from '../services/api';
import '../styles/reviews.css';

const ReviewsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [completedBookings, setCompletedBookings] = useState([]);
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch user's completed bookings without reviews
  useEffect(() => {
    if (user) {
      fetchCompletedBookings();
    }
  }, [user]);

  const fetchCompletedBookings = async () => {
    try {
      const response = await api.get('/reviews/user/bookings-for-review');
      if (response.data.success) {
        setCompletedBookings(response.data.bookings || []);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const handleWriteReview = (booking) => {
    if (!user) {
      navigate('/login');
      return;
    }
    setSelectedBooking(booking);
    setShowWriteModal(true);
  };

  const handleReviewSuccess = () => {
    setRefreshKey(prev => prev + 1);
    fetchCompletedBookings();
  };

  return (
    <>
      <Navbar />
      <div className="reviews-page">
        {/* Hero Section */}
        <div className="reviews-hero">
          <div className="reviews-hero-content">
            <div className="reviews-hero-badge">
              <Star size={20} fill="#fbbf24" color="#fbbf24" />
              <span>Traveler Reviews</span>
            </div>
            <h1>What Travelers Say</h1>
            <p className="reviews-hero-subtitle">
              Read authentic experiences from fellow travelers and share your own journey
            </p>

            {/* Stats */}
            <div className="reviews-hero-stats">
              <div className="hero-stat-item">
                <MessageSquare size={24} />
                <div>
                  <div className="hero-stat-number">10,000+</div>
                  <div className="hero-stat-label">Reviews</div>
                </div>
              </div>
              <div className="hero-stat-item">
                <Star size={24} />
                <div>
                  <div className="hero-stat-number">4.8/5</div>
                  <div className="hero-stat-label">Average Rating</div>
                </div>
              </div>
              <div className="hero-stat-item">
                <TrendingUp size={24} />
                <div>
                  <div className="hero-stat-number">95%</div>
                  <div className="hero-stat-label">Satisfaction</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Write Review CTA */}
        {user && completedBookings.length > 0 && (
          <div className="write-review-cta">
            <div className="cta-content">
              <div className="cta-icon">
                <PenSquare size={32} />
              </div>
              <div className="cta-text">
                <h3>Share Your Experience</h3>
                <p>
                  You have {completedBookings.length} completed{' '}
                  {completedBookings.length === 1 ? 'trip' : 'trips'} to review
                </p>
              </div>
            </div>
            <button
              className="cta-button"
              onClick={() => {
                if (completedBookings.length === 1) {
                  handleWriteReview(completedBookings[0]);
                } else {
                  navigate('/userdashboard?tab=reviews');
                }
              }}
            >
              Write a Review
            </button>
          </div>
        )}

        {/* Main Content */}
        <div className="reviews-page-content">
          <div className="reviews-container">
            <ReviewsList
              key={refreshKey}
              showFilters={true}
              showRatingsSummary={true}
              limit={12}
            />
          </div>
        </div>

        {/* Write Review Modal */}
        {showWriteModal && selectedBooking && (
          <WriteReviewModal
            booking={selectedBooking}
            onClose={() => {
              setShowWriteModal(false);
              setSelectedBooking(null);
            }}
            onSuccess={handleReviewSuccess}
          />
        )}
      </div>
      <Footer />
    </>
  );
};

export default ReviewsPage;
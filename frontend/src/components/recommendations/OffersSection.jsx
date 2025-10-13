import React, { useState, useEffect } from 'react';
import axios from 'axios';
import OfferCard from './OfferCard';
import { Tag, TrendingUp, Sparkles } from 'lucide-react';
import { toast } from 'react-toastify';

const OffersSection = ({ limit = 6 }) => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOffers();
  }, [limit]);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(
        `http://localhost:5000/api/recommendations/offers?limit=${limit}`
      );

      if (response.data.success) {
        setOffers(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching offers:', error);
      setError('Failed to load offers');
      toast.error('Failed to load special offers', {
        position: 'bottom-right',
        autoClose: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="offers-section">
        <div className="section-header">
          <h2>
            <Tag className="section-icon" size={32} />
            Special Offers & Discounts
          </h2>
        </div>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading amazing offers...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="offers-section">
        <div className="section-header">
          <h2>
            <Tag className="section-icon" size={32} />
            Special Offers & Discounts
          </h2>
        </div>
        <div className="error-container">
          <p className="error-message">😕 {error}</p>
          <button className="retry-btn" onClick={fetchOffers}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Empty State
  if (offers.length === 0) {
    return (
      <div className="offers-section">
        <div className="section-header">
          <h2>
            <Tag className="section-icon" size={32} />
            Special Offers & Discounts
          </h2>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon">🎁</div>
          <h3>No Active Offers Right Now</h3>
          <p>Check back soon for amazing deals and discounts!</p>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const totalSavings = offers.reduce((sum, offer) => {
    return sum + (offer.old_price - offer.new_price);
  }, 0);

  const avgDiscount = Math.round(
    offers.reduce((sum, offer) => sum + offer.discount_percent, 0) / offers.length
  );

  const expiringSoonCount = offers.filter(offer => offer.days_remaining <= 3).length;

  return (
    <div className="offers-section">
      {/* Section Header */}
      <div className="section-header">
        <div className="header-left">
          <h2>
            <Tag className="section-icon" size={32} />
            Special Offers & Discounts
          </h2>
          <p className="section-subtitle">
            Limited time deals - Save up to {avgDiscount}% on select destinations!
          </p>
        </div>
        
        {/* Stats Badge */}
        <div className="offers-stats">
          <div className="stat-badge">
            <Sparkles size={18} />
            <span>{offers.length} Active Offers</span>
          </div>
          {expiringSoonCount > 0 && (
            <div className="stat-badge urgent">
              <TrendingUp size={18} />
              <span>{expiringSoonCount} Ending Soon</span>
            </div>
          )}
        </div>
      </div>

      {/* Offers Grid */}
      <div className="offers-grid">
        {offers.map((offer) => (
          <OfferCard key={offer.id} offer={offer} />
        ))}
      </div>

      {/* Bottom Summary */}
      {offers.length > 0 && (
        <div className="offers-summary">
          <div className="summary-card">
            <div className="summary-icon">💰</div>
            <div className="summary-content">
              <h4>Total Savings Available</h4>
              <p className="summary-value">₹{totalSavings.toLocaleString()}</p>
            </div>
          </div>
          
          <div className="summary-card">
            <div className="summary-icon">⚡</div>
            <div className="summary-content">
              <h4>Average Discount</h4>
              <p className="summary-value">{avgDiscount}% OFF</p>
            </div>
          </div>
          
          <div className="summary-card">
            <div className="summary-icon">🎯</div>
            <div className="summary-content">
              <h4>Best Deal</h4>
              <p className="summary-value">
                {Math.max(...offers.map(o => o.discount_percent))}% OFF
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Call to Action */}
      <div className="offers-cta">
        <p>🔥 Don't miss out on these limited-time offers!</p>
        <button 
          className="cta-btn"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          Explore More Destinations
        </button>
      </div>
    </div>
  );
};

export default OffersSection;
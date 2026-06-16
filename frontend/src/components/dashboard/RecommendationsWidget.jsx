import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Sparkles, ArrowRight, TrendingUp, MapPin, Star, Heart } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const RecommendationsWidget = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasPreferences, setHasPreferences] = useState(false);

  useEffect(() => {
    if (user) {
      fetchRecommendations();
    }
  }, [user]);

  const fetchRecommendations = async () => {
  try {
    setLoading(true);

    try {
      const prefsResponse = await api.get(`/recommendations/preferences/${user.id}`);

      if (prefsResponse.data.success && prefsResponse.data.data?.selected_tags?.length > 0) {
        setHasPreferences(true);
        const tags = prefsResponse.data.data.selected_tags.join(',');
        const recsResponse = await api.get(`/recommendations?tags=${tags}&limit=4&userId=${user.id}`);
        if (recsResponse.data.success) {
          setRecommendations(recsResponse.data.data);
        }
      } else {
        setHasPreferences(false);
        const trendingResponse = await api.get('/recommendations/trending?limit=4');
        if (trendingResponse.data.success) {
          setRecommendations(trendingResponse.data.data);
        }
      }
    } catch (error) {
      setHasPreferences(false);
      const trendingResponse = await api.get('/recommendations/trending?limit=4');
      if (trendingResponse.data.success) {
        setRecommendations(trendingResponse.data.data);
      }
    }
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    toast.error('Failed to load recommendations');
  } finally {
    setLoading(false);
  }
};

  const handleViewAll = () => {
    navigate('/recommendations');
  };

  const handleCardClick = (placeId) => {
    navigate(`/packages/${placeId}`);
  };

  const handleSetPreferences = () => {
    navigate('/recommendations');
  };

  if (loading) {
    return (
      <div className="recommendations-widget">
        <div className="widget-header">
          <div className="widget-title">
            <Sparkles size={20} />
            <h3>Recommendations For You</h3>
          </div>
        </div>
        <div className="widget-loading">
          <div className="mini-spinner"></div>
          <p>Loading recommendations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="recommendations-widget">
      {/* Widget Header */}
      <div className="widget-header">
        <div className="widget-title">
          <Sparkles size={20} />
          <h3>
            {hasPreferences ? 'Recommendations For You' : 'Trending Destinations'}
          </h3>
        </div>
        <button className="widget-view-all" onClick={handleViewAll}>
          View All
          <ArrowRight size={16} />
        </button>
      </div>

      {/* No Preferences Banner */}
      {!hasPreferences && (
        <div className="widget-banner">
          <div className="banner-content">
            <TrendingUp size={18} />
            <p>Set your preferences to get personalized recommendations!</p>
          </div>
          <button className="banner-btn" onClick={handleSetPreferences}>
            Set Preferences
          </button>
        </div>
      )}

      {/* Recommendations List */}
      {recommendations.length > 0 ? (
        <div className="recommendations-list">
          {recommendations.map((place) => (
            <div 
              key={place.id} 
              className="recommendation-item"
              onClick={() => handleCardClick(place.id)}
            >
              {/* Image */}
              <div className="rec-item-image">
                <img 
                  src={place.image_url || 'https://via.placeholder.com/120x120?text=No+Image'} 
                  alt={place.name}
                />
                {place.rating && (
                  <div className="rec-item-rating">
                    <Star size={12} fill="#ffc107" color="#ffc107" />
                    <span>{Number(place.rating).toFixed(1)}</span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="rec-item-content">
                <h4 className="rec-item-title">{place.name}</h4>
                <div className="rec-item-location">
                  <MapPin size={14} />
                  <span>{place.country_name}</span>
                </div>
                
                {/* Stats */}
                <div className="rec-item-stats">
                  {place.total_views > 0 && (
                    <span className="stat-badge">
                      👁️ {place.total_views.toLocaleString()}
                    </span>
                  )}
                  {place.total_likes > 0 && (
                    <span className="stat-badge">
                      ❤️ {place.total_likes}
                    </span>
                  )}
                </div>

                {/* Price */}
                <div className="rec-item-price">
                  <span className="price-label">From</span>
                  <span className="price-value">₹{Number(place.price_per_person).toLocaleString()}</span>
                </div>
              </div>

              {/* Arrow */}
              <div className="rec-item-arrow">
                <ArrowRight size={18} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="widget-empty">
          <div className="empty-icon">🌍</div>
          <p>No recommendations available</p>
          <button className="empty-btn" onClick={handleSetPreferences}>
            Set Your Preferences
          </button>
        </div>
      )}

      {/* Bottom CTA */}
      {recommendations.length > 0 && (
        <div className="widget-footer">
          <button className="widget-cta-btn" onClick={handleViewAll}>
            <Sparkles size={18} />
            <span>Explore All Recommendations</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default RecommendationsWidget;
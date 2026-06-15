import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import RecommendedPlaceCard from '../recommendations/RecommendedPlaceCard';
import { Sparkles, ArrowRight, TrendingUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const RecommendationsPreview = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [recommendedPlaces, setRecommendedPlaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecommendations();
  }, [user]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);

      let endpoint = 'http://localhost:5000/api/recommendations/trending?limit=3';
      
      // If user is logged in and has preferences, get personalized recommendations
      if (user) {
        try {
          const token = localStorage.getItem('accessToken');
          const prefsResponse = await axios.get(
            `http://localhost:5000/api/recommendations/preferences/${user.id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (prefsResponse.data.success && prefsResponse.data.data?.selected_tags?.length > 0) {
            const tags = prefsResponse.data.data.selected_tags.join(',');
            endpoint = `http://localhost:5000/api/recommendations?tags=${tags}&limit=3&userId=${user.id}`;
          }
        } catch (error) {
          console.log('No preferences found, showing trending places');
        }
      }

      const response = await axios.get(endpoint);

      if (response.data.success) {
        setRecommendedPlaces(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      // Fallback to trending if error occurs
      try {
        const fallbackResponse = await axios.get(
          'http://localhost:5000/api/recommendations/trending?limit=3'
        );
        if (fallbackResponse.data.success) {
          setRecommendedPlaces(fallbackResponse.data.data);
        }
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleViewAll = () => {
    navigate('/recommendations');
  };

  // Don't show section if no recommendations
  if (!loading && recommendedPlaces.length === 0) {
    return null;
  }

  return (
    <section className="recommendations-preview-section">
      <div className="recommendations-preview-container">
        {/* Section Header */}
        <div className="preview-header">
          <div className="preview-header-content">
            <div className="preview-badge">
              <Sparkles size={18} />
              <span>{user ? 'Personalized For You' : 'Trending Now'}</span>
            </div>
            <h2 className="preview-title">
              {user ? '✨ Recommendations For You' : '🔥 Trending Destinations'}
            </h2>
            <p className="preview-subtitle">
              {user 
                ? 'Based on your travel preferences and interests'
                : 'Discover the most popular destinations loved by travelers'
              }
            </p>
          </div>

          {/* View All Button */}
          <button className="view-recommendations-btn" onClick={handleViewAll}>
            <span>View All Recommendations</span>
            <ArrowRight size={20} />
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="preview-loading">
            <div className="preview-skeleton-grid">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton-card">
                  <div className="skeleton-image"></div>
                  <div className="skeleton-content">
                    <div className="skeleton-line"></div>
                    <div className="skeleton-line short"></div>
                    <div className="skeleton-line"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations Grid */}
        {!loading && (
          <div className="recommendations-preview-grid">
            {recommendedPlaces.map((place, index) => (
              <div 
                key={place.id} 
                className="preview-card-wrapper"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <RecommendedPlaceCard place={place} showBadges={true} />
              </div>
            ))}
          </div>
        )}

        {/* Bottom CTA */}
        {!loading && recommendedPlaces.length > 0 && (
          <div className="preview-bottom-cta">
            <div className="cta-content">
              <TrendingUp size={24} className="cta-icon" />
              <p>
                {user 
                  ? `Explore ${recommendedPlaces.length > 0 ? 'more personalized' : ''} recommendations tailored just for you!`
                  : 'Sign in to get personalized recommendations based on your travel style!'
                }
              </p>
            </div>
            <button className="cta-explore-btn" onClick={handleViewAll}>
              {user ? 'Explore More' : 'Get Personalized Recommendations'}
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default RecommendationsPreview;
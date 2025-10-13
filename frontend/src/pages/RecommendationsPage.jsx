import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import Navbar from '../components/common/Navbar';
import PersonalityTags from '../components/recommendations/PersonalityTags';
import RecommendedPlaceCard from '../components/recommendations/RecommendedPlaceCard';
import OffersSection from '../components/recommendations/OffersSection';
import LoginOverlay from '../components/recommendations/LoginOverlay';
import { useAuth } from '../context/AuthContext';
import { Sparkles, TrendingUp, Filter, Save, RefreshCw } from 'lucide-react';
import '../styles/recommendations.css';
import { useRecommendation } from '../context/RecommendationContext';
const RecommendationsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // State Management
  const [selectedTags, setSelectedTags] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [showLoginOverlay, setShowLoginOverlay] = useState(false);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  // Load user preferences on mount
  useEffect(() => {
    if (user) {
      loadUserPreferences();
    } else {
      // For non-logged users, load trending recommendations
      fetchRecommendations([]);
    }
  }, [user]);

  // Fetch recommendations when tags change
  useEffect(() => {
    if (preferencesLoaded || !user) {
      fetchRecommendations(selectedTags);
    }
  }, [selectedTags, preferencesLoaded]);

  // Load user's saved preferences
  const loadUserPreferences = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/recommendations/preferences/${user.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success && response.data.data?.selected_tags) {
        setSelectedTags(response.data.data.selected_tags);
      }
    } catch (error) {
      console.log('No saved preferences found, starting fresh');
    } finally {
      setPreferencesLoaded(true);
    }
  };

  // Fetch recommendations based on selected tags
  const fetchRecommendations = async (tags) => {
    try {
      setLoading(true);

      let endpoint = 'http://localhost:5000/api/recommendations/trending?limit=12';
      
      if (tags.length > 0) {
        const tagsParam = tags.join(',');
        endpoint = `http://localhost:5000/api/recommendations?tags=${tagsParam}&limit=12${user ? `&userId=${user.id}` : ''}`;
      }

      const response = await axios.get(endpoint);

      if (response.data.success) {
        setRecommendations(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      toast.error('Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  // Handle tag selection
  const handleTagsChange = (tags) => {
    setSelectedTags(tags);
  };

  // Save user preferences
  const handleSavePreferences = async () => {
    if (!user) {
      setShowLoginOverlay(true);
      return;
    }

    if (selectedTags.length === 0) {
      toast.warning('Please select at least one tag to save preferences');
      return;
    }

    try {
      setSavingPreferences(true);
      const token = localStorage.getItem('token');

      await axios.post(
        'http://localhost:5000/api/recommendations/preferences',
        {
          selectedTags: selectedTags,
          quizCompleted: false
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('✨ Preferences saved successfully!', {
        position: 'bottom-right',
        autoClose: 3000
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save preferences');
    } finally {
      setSavingPreferences(false);
    }
  };

  // Refresh recommendations
  const handleRefresh = () => {
    fetchRecommendations(selectedTags);
    toast.info('🔄 Refreshing recommendations...', {
      position: 'bottom-right',
      autoClose: 2000
    });
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSelectedTags([]);
    toast.info('Filters cleared', {
      position: 'bottom-right',
      autoClose: 2000
    });
  };

  return (
    <div className="recommendations-page">
      <Navbar />

      <div className="recommendations-container">
        {/* Page Header */}
        <div className="recommendations-header">
          <h1>
            {user 
              ? '✨ Your Personalized Recommendations' 
              : '🌍 Discover Amazing Destinations'
            }
          </h1>
          <p>
            {user
              ? 'Select your travel preferences to get destinations tailored just for you'
              : 'Explore trending destinations loved by travelers worldwide'
            }
          </p>
        </div>

        {/* Personality Selector Section */}
        <div className="personality-section">
          <div className="section-header-inline">
            <div>
              <h2>What's Your Travel Vibe?</h2>
              <p>Select tags that match your travel style for better recommendations</p>
            </div>
            
            {/* Action Buttons */}
            <div className="section-actions">
              {selectedTags.length > 0 && (
                <>
                  <button 
                    className="action-btn secondary"
                    onClick={handleClearFilters}
                  >
                    <Filter size={18} />
                    Clear Filters
                  </button>
                  
                  {user && (
                    <button 
                      className="action-btn primary"
                      onClick={handleSavePreferences}
                      disabled={savingPreferences}
                    >
                      {savingPreferences ? (
                        <>
                          <RefreshCw size={18} className="spinning" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save size={18} />
                          Save Preferences
                        </>
                      )}
                    </button>
                  )}
                </>
              )}
              
              {!user && selectedTags.length > 0 && (
                <button 
                  className="action-btn primary"
                  onClick={() => setShowLoginOverlay(true)}
                >
                  <Save size={18} />
                  Login to Save
                </button>
              )}
            </div>
          </div>

          {/* Personality Tags Component */}
          <PersonalityTags 
            onTagsChange={handleTagsChange}
            initialSelectedTags={selectedTags}
          />
        </div>

        {/* Recommendations Section */}
        <div className="recommendations-section">
          <div className="section-header">
            <h2>
              {selectedTags.length > 0 ? (
                <>
                  <Sparkles size={28} />
                  Recommended For You ({recommendations.length})
                </>
              ) : (
                <>
                  <TrendingUp size={28} />
                  Trending Destinations ({recommendations.length})
                </>
              )}
            </h2>
            
            {recommendations.length > 0 && (
              <button className="refresh-btn" onClick={handleRefresh}>
                <RefreshCw size={18} />
                Refresh
              </button>
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Finding perfect destinations for you...</p>
            </div>
          )}

          {/* Recommendations Grid */}
          {!loading && recommendations.length > 0 && (
            <div className="recommendations-grid">
              {recommendations.map((place) => (
                <RecommendedPlaceCard 
                  key={place.id} 
                  place={place}
                  showBadges={true}
                />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && recommendations.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">🗺️</div>
              <h3>No Recommendations Found</h3>
              <p>
                {selectedTags.length > 0 
                  ? 'Try selecting different tags to discover more destinations'
                  : 'Start by selecting your travel preferences above'
                }
              </p>
              {selectedTags.length > 0 && (
                <button 
                  className="empty-action-btn"
                  onClick={handleClearFilters}
                >
                  Clear Filters & Show All
                </button>
              )}
            </div>
          )}
        </div>

        {/* Offers Section */}
        <OffersSection limit={6} />

        {/* Bottom Info Card */}
        {!user && (
          <div className="info-card">
            <div className="info-content">
              <Sparkles size={32} className="info-icon" />
              <div>
                <h3>Want Personalized Recommendations?</h3>
                <p>Create an account to save your preferences and get travel suggestions tailored to your style!</p>
              </div>
            </div>
            <button 
              className="info-btn"
              onClick={() => navigate('/register')}
            >
              Create Account
            </button>
          </div>
        )}
      </div>

      {/* Login Overlay */}
      {showLoginOverlay && (
        <LoginOverlay 
          onClose={() => setShowLoginOverlay(false)}
          message="Sign in to save your travel preferences and get personalized recommendations!"
        />
      )}

      {/* Footer */}
      <footer className="recommendations-footer">
        <div className="footer-content">
          <p>© 2025 ExploreEase. All rights reserved.</p>
          <div className="footer-links">
            <a href="/about">About</a>
            <a href="/destinations">Destinations</a>
            <a href="#contact">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default RecommendationsPage;
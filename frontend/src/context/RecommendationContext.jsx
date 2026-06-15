import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';
import api from '../services/api';

// Create Context
const RecommendationContext = createContext();

// Custom Hook to use Recommendation Context
export const useRecommendation = () => {
  const context = useContext(RecommendationContext);
  if (!context) {
    throw new Error('useRecommendation must be used within RecommendationProvider');
  }
  return context;
};

// Provider Component
export const RecommendationProvider = ({ children }) => {
  const { user } = useAuth();

  // State Management
  const [selectedTags, setSelectedTags] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [trendingPlaces, setTrendingPlaces] = useState([]);
  const [offers, setOffers] = useState([]);
  const [userPreferences, setUserPreferences] = useState(null);
  const [loading, setLoading] = useState(false);
  const [preferencesLoading, setPreferencesLoading] = useState(false);

  // Cache for API responses (to avoid unnecessary calls)
  const [cache, setCache] = useState({
    recommendations: {},
    trending: null,
    offers: null,
    lastUpdated: null
  });

  // Load user preferences when user logs in
  useEffect(() => {
    if (user) {
      loadUserPreferences();
    } else {
      // Clear preferences when user logs out
      setUserPreferences(null);
      setSelectedTags([]);
    }
  }, [user]);

  // Load user's saved preferences
  const loadUserPreferences = async () => {
  try {
    setPreferencesLoading(true);

    const response = await api.get(
      `/recommendations/preferences/${user.id}`
    );

    if (response.data.success && response.data.data) {
      setUserPreferences(response.data.data);
      setSelectedTags(response.data.data.selected_tags || []);
    }
  } catch (error) {
    console.log('No saved preferences found');
  } finally {
    setPreferencesLoading(false);
  }
};

  // Fetch recommendations based on tags
  const fetchRecommendations = async (tags = selectedTags, limit = 12) => {
    try {
      setLoading(true);

      // Check cache first (cache for 5 minutes)
      const cacheKey = tags.join(',') || 'default';
      const now = Date.now();
      if (
        cache.recommendations[cacheKey] &&
        cache.lastUpdated &&
        now - cache.lastUpdated < 5 * 60 * 1000
      ) {
        setRecommendations(cache.recommendations[cacheKey]);
        setLoading(false);
        return cache.recommendations[cacheKey];
      }

      let endpoint = `http://localhost:5000/api/recommendations/trending?limit=${limit}`;
      
      if (tags.length > 0) {
        const tagsParam = tags.join(',');
        endpoint = `http://localhost:5000/api/recommendations?tags=${tagsParam}&limit=${limit}${user ? `&userId=${user.id}` : ''}`;
      }

      const response = await axios.get(endpoint);

      if (response.data.success) {
        const data = response.data.data;
        setRecommendations(data);

        // Update cache
        setCache(prev => ({
          ...prev,
          recommendations: {
            ...prev.recommendations,
            [cacheKey]: data
          },
          lastUpdated: now
        }));

        return data;
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      toast.error('Failed to load recommendations');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Fetch trending places
  const fetchTrendingPlaces = async (limit = 10) => {
    try {
      // Check cache
      const now = Date.now();
      if (
        cache.trending &&
        cache.lastUpdated &&
        now - cache.lastUpdated < 5 * 60 * 1000
      ) {
        setTrendingPlaces(cache.trending);
        return cache.trending;
      }

      const response = await axios.get(
        `http://localhost:5000/api/recommendations/trending?limit=${limit}`
      );

      if (response.data.success) {
        const data = response.data.data;
        setTrendingPlaces(data);

        // Update cache
        setCache(prev => ({
          ...prev,
          trending: data,
          lastUpdated: now
        }));

        return data;
      }
    } catch (error) {
      console.error('Error fetching trending places:', error);
      return [];
    }
  };

  // Fetch active offers
  const fetchOffers = async (limit = 6) => {
    try {
      // Check cache
      const now = Date.now();
      if (
        cache.offers &&
        cache.lastUpdated &&
        now - cache.lastUpdated < 5 * 60 * 1000
      ) {
        setOffers(cache.offers);
        return cache.offers;
      }

      const response = await axios.get(
        `http://localhost:5000/api/recommendations/offers?limit=${limit}${user ? `&userId=${user.id}` : ''}`
      );

      if (response.data.success) {
        const data = response.data.data;
        setOffers(data);

        // Update cache
        setCache(prev => ({
          ...prev,
          offers: data,
          lastUpdated: now
        }));

        return data;
      }
    } catch (error) {
      console.error('Error fetching offers:', error);
      return [];
    }
  };

  // Save user preferences
  const savePreferences = async (preferences) => {
  if (!user) {
    toast.warning('Please login to save preferences');
    return false;
  }
  try {
    await api.post('/recommendations/preferences', preferences);
    setUserPreferences(preferences);
    if (preferences.selectedTags) {
      setSelectedTags(preferences.selectedTags);
    }
    toast.success('✨ Preferences saved successfully!');
    return true;
  } catch (error) {
    console.error('Error saving preferences:', error);
    toast.error('Failed to save preferences');
    return false;
  }
};

  // Update selected tags
  const updateSelectedTags = (tags) => {
    setSelectedTags(tags);
    // Auto-fetch recommendations with new tags
    if (tags.length > 0) {
      fetchRecommendations(tags);
    }
  };

  // Clear cache and refresh all data
  const refreshAll = async () => {
    setCache({
      recommendations: {},
      trending: null,
      offers: null,
      lastUpdated: null
    });

    await Promise.all([
      fetchRecommendations(selectedTags),
      fetchTrendingPlaces(),
      fetchOffers()
    ]);

    toast.success('🔄 Data refreshed!');
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedTags([]);
    fetchRecommendations([]);
  };

  // Context Value
  const value = {
    // State
    selectedTags,
    recommendations,
    trendingPlaces,
    offers,
    userPreferences,
    loading,
    preferencesLoading,

    // Functions
    fetchRecommendations,
    fetchTrendingPlaces,
    fetchOffers,
    savePreferences,
    loadUserPreferences,
    updateSelectedTags,
    clearFilters,
    refreshAll,

    // Setters (if needed for direct manipulation)
    setSelectedTags,
    setRecommendations
  };

  return (
    <RecommendationContext.Provider value={value}>
      {children}
    </RecommendationContext.Provider>
  );
};

export default RecommendationContext;
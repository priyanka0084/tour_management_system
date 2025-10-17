// ========================================
// REVIEWS LIST COMPONENT
// Main container for displaying reviews with pagination
// ========================================

import React, { useState, useEffect } from 'react';
import { Loader, AlertCircle, MessageSquare } from 'lucide-react';
import ReviewCard from './ReviewCard';
import ReviewFilters from './ReviewFilters';
import PlaceRatingsSummary from './PlaceRatingsSummary';
import api from '../../services/api';

const ReviewsList = ({ 
  placeId = null,
  packageId = null,
  showFilters = true,
  showRatingsSummary = true,
  limit = 10
}) => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    rating: 'all',
    destination: 'all',
    sort_by: 'recent',
    search: ''
  });
  const [pagination, setPagination] = useState({
    offset: 0,
    limit: limit,
    hasMore: true
  });

  // Fetch reviews
  const fetchReviews = async (reset = false) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        limit: pagination.limit,
        offset: reset ? 0 : pagination.offset,
        sort_by: filters.sort_by
      });

      // Add filters
      if (placeId) params.append('place_id', placeId);
      if (packageId) params.append('package_id', packageId);
      if (filters.rating !== 'all') params.append('rating', filters.rating);
      if (filters.destination !== 'all') params.append('place_id', filters.destination);

      const endpoint = placeId 
        ? `/reviews/place/${placeId}`
        : '/reviews';

      const response = await api.get(`${endpoint}?${params}`);

      if (response.data.success) {
        const newReviews = response.data.reviews || [];
        
        setReviews(reset ? newReviews : [...reviews, ...newReviews]);
        
        if (response.data.stats) {
          setStats(response.data.stats);
        }

        setPagination(prev => ({
          ...prev,
          offset: reset ? newReviews.length : prev.offset + newReviews.length,
          hasMore: newReviews.length === pagination.limit
        }));
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError('Failed to load reviews. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch destinations for filter
  const fetchDestinations = async () => {
    try {
      const response = await api.get('/destinations');
      if (response.data.success) {
        setDestinations(response.data.destinations || []);
      }
    } catch (err) {
      console.error('Error fetching destinations:', err);
    }
  };

  // Initial load
  useEffect(() => {
    fetchReviews(true);
    if (showFilters && !placeId) {
      fetchDestinations();
    }
  }, [placeId, packageId]);

  // Reload when filters change
  useEffect(() => {
    if (!loading) {
      fetchReviews(true);
    }
  }, [filters.rating, filters.destination, filters.sort_by]);

  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({
      rating: 'all',
      destination: 'all',
      sort_by: 'recent',
      search: ''
    });
  };

  // Load more reviews
  const handleLoadMore = () => {
    fetchReviews(false);
  };

  // Refresh reviews list
  const handleRefresh = () => {
    fetchReviews(true);
  };

  // Filter reviews by search term (client-side)
  const filteredReviews = reviews.filter(review => {
    if (!filters.search) return true;
    
    const searchLower = filters.search.toLowerCase();
    return (
      review.title?.toLowerCase().includes(searchLower) ||
      review.review_text?.toLowerCase().includes(searchLower) ||
      review.user_name?.toLowerCase().includes(searchLower) ||
      review.place_name?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="reviews-list-container">
      {/* Ratings Summary */}
      {showRatingsSummary && stats && !loading && (
        <div className="reviews-summary-section">
          <PlaceRatingsSummary stats={stats} />
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <ReviewFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          destinations={destinations}
          showDestinationFilter={!placeId}
        />
      )}

      {/* Reviews Count */}
      <div className="reviews-count-header">
        <h3>
          <MessageSquare size={20} />
          {filteredReviews.length} {filteredReviews.length === 1 ? 'Review' : 'Reviews'}
          {filters.search && ` matching "${filters.search}"`}
        </h3>
      </div>

      {/* Loading State */}
      {loading && pagination.offset === 0 && (
        <div className="reviews-loading">
          <Loader className="spinner" size={40} />
          <p>Loading reviews...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="reviews-error">
          <AlertCircle size={40} />
          <p>{error}</p>
          <button onClick={handleRefresh} className="retry-btn">
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredReviews.length === 0 && !error && (
        <div className="reviews-empty">
          <MessageSquare size={60} strokeWidth={1.5} />
          <h3>No Reviews Yet</h3>
          <p>
            {filters.search 
              ? `No reviews found matching "${filters.search}"`
              : 'Be the first to share your experience!'}
          </p>
        </div>
      )}

      {/* Reviews List */}
      {!loading && filteredReviews.length > 0 && (
        <>
          <div className="reviews-grid">
            {filteredReviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                onRefresh={handleRefresh}
              />
            ))}
          </div>

          {/* Load More Button */}
          {pagination.hasMore && !filters.search && (
            <div className="reviews-load-more">
              <button 
                onClick={handleLoadMore}
                disabled={loading}
                className="load-more-btn"
              >
                {loading ? (
                  <>
                    <Loader className="spinner" size={18} />
                    Loading...
                  </>
                ) : (
                  'Load More Reviews'
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ReviewsList;
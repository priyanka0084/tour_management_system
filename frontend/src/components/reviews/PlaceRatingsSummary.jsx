// ========================================
// PLACE RATINGS SUMMARY COMPONENT
// Display rating statistics and distribution
// ========================================

import React from 'react';
import { Star, TrendingUp } from 'lucide-react';
import StarRating from './StarRating';

const PlaceRatingsSummary = ({ stats }) => {
  if (!stats) return null;

  const {
    average_rating:avgRating= 0,
    total_reviews = 0,
    stars_5 = 0,
    stars_4 = 0,
    stars_3 = 0,
    stars_2 = 0,
    stars_1 = 0
  } = stats;
  const average_rating = Number(avgRating) || 0;
  // Calculate percentages for rating distribution
  const getRatingPercentage = (count) => {
    if (total_reviews === 0) return 0;
    return Math.round((count / total_reviews) * 100);
  };

  const ratingData = [
    { stars: 5, count: stars_5, percentage: getRatingPercentage(stars_5) },
    { stars: 4, count: stars_4, percentage: getRatingPercentage(stars_4) },
    { stars: 3, count: stars_3, percentage: getRatingPercentage(stars_3) },
    { stars: 2, count: stars_2, percentage: getRatingPercentage(stars_2) },
    { stars: 1, count: stars_1, percentage: getRatingPercentage(stars_1) }
  ];

  return (
    <div className="ratings-summary-container">
      {/* Overall Rating */}
      <div className="overall-rating-section">
        <div className="average-rating-display">
          <div className="rating-number">{average_rating.toFixed(1)}</div>
          <StarRating rating={average_rating} size={24} color="#fbbf24" />
          <div className="total-reviews-text">
            Based on {total_reviews} {total_reviews === 1 ? 'review' : 'reviews'}
          </div>
        </div>

        {/* Quality Indicator */}
        {average_rating >= 4.0 && (
          <div className="rating-quality-badge excellent">
            <TrendingUp size={16} />
            <span>Excellent</span>
          </div>
        )}
        {average_rating >= 3.0 && average_rating < 4.0 && (
          <div className="rating-quality-badge good">
            <span>Good</span>
          </div>
        )}
        {average_rating < 3.0 && total_reviews > 0 && (
          <div className="rating-quality-badge average">
            <span>Average</span>
          </div>
        )}
      </div>

      {/* Rating Distribution */}
      <div className="rating-distribution-section">
        <h4 className="distribution-title">Rating Distribution</h4>
        
        <div className="rating-bars">
          {ratingData.map(({ stars, count, percentage }) => (
            <div key={stars} className="rating-bar-row">
              {/* Star Label */}
              <div className="rating-bar-label">
                <span className="star-count">{stars}</span>
                <Star size={14} fill="#fbbf24" color="#fbbf24" />
              </div>

              {/* Progress Bar */}
              <div className="rating-bar-container">
                <div 
                  className="rating-bar-fill"
                  style={{ 
                    width: `${percentage}%`,
                    backgroundColor: getBarColor(stars)
                  }}
                >
                  {percentage > 10 && (
                    <span className="rating-bar-percentage">{percentage}%</span>
                  )}
                </div>
              </div>

              {/* Count */}
              <div className="rating-bar-count">
                {count}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Insights */}
      {total_reviews > 10 && (
        <div className="rating-insights">
          <h4 className="insights-title">Insights</h4>
          <ul className="insights-list">
            {stars_5 + stars_4 > total_reviews * 0.7 && (
              <li className="insight-item positive">
                <span className="insight-icon">✨</span>
                <span>Highly recommended by travelers</span>
              </li>
            )}
            {stars_5 > total_reviews * 0.5 && (
              <li className="insight-item positive">
                <span className="insight-icon">🌟</span>
                <span>Over {Math.round((stars_5 / total_reviews) * 100)}% gave 5 stars</span>
              </li>
            )}
            {stars_1 + stars_2 > total_reviews * 0.2 && (
              <li className="insight-item warning">
                <span className="insight-icon">⚠️</span>
                <span>Some travelers had concerns</span>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

// Helper function to get color based on star rating
const getBarColor = (stars) => {
  const colors = {
    5: '#10b981', // Green
    4: '#84cc16', // Light green
    3: '#fbbf24', // Yellow
    2: '#f97316', // Orange
    1: '#ef4444'  // Red
  };
  return colors[stars] || '#9ca3af';
};

export default PlaceRatingsSummary;
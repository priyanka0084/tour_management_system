// ========================================
// STAR RATING COMPONENT
// Reusable star rating display and input
// ========================================

import React, { useState } from 'react';
import { Star } from 'lucide-react';

const StarRating = ({
  rating = 0,
  maxRating = 5,
  size = 20,
  interactive = false,
  showNumber = false,
  onRatingChange,
  color = '#fbbf24', // Yellow for filled stars
  emptyColor = '#d1d5db', // Gray for empty stars
  className = ''
}) => {
  const [hoveredRating, setHoveredRating] = useState(0);
  const [selectedRating, setSelectedRating] = useState(rating);

  // Handle star click (for interactive mode)
  const handleClick = (value) => {
    if (!interactive) return;
    
    setSelectedRating(value);
    if (onRatingChange) {
      onRatingChange(value);
    }
  };

  // Handle mouse enter (for interactive mode)
  const handleMouseEnter = (value) => {
    if (!interactive) return;
    setHoveredRating(value);
  };

  // Handle mouse leave (for interactive mode)
  const handleMouseLeave = () => {
    if (!interactive) return;
    setHoveredRating(0);
  };

  // Determine which rating to display
  const displayRating = interactive 
    ? (hoveredRating || selectedRating) 
    : rating;

  // Generate stars array
  const stars = Array.from({ length: maxRating }, (_, index) => index + 1);

  return (
    <div 
      className={`star-rating-container ${className}`}
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '4px' 
      }}
    >
      {/* Stars */}
      <div 
        style={{ 
          display: 'flex', 
          gap: '2px' 
        }}
        onMouseLeave={handleMouseLeave}
      >
        {stars.map((star) => {
          const isFilled = star <= displayRating;
          const isPartiallyFilled = 
            !Number.isInteger(displayRating) && 
            star === Math.ceil(displayRating);
          
          return (
            <div
              key={star}
              onClick={() => handleClick(star)}
              onMouseEnter={() => handleMouseEnter(star)}
              style={{
                cursor: interactive ? 'pointer' : 'default',
                position: 'relative',
                display: 'inline-block',
                transition: 'transform 0.2s ease',
                transform: interactive && hoveredRating === star ? 'scale(1.15)' : 'scale(1)'
              }}
            >
              {isPartiallyFilled ? (
                // Partially filled star
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <Star
                    size={size}
                    fill={emptyColor}
                    color={emptyColor}
                    style={{ display: 'block' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: `${(displayRating % 1) * 100}%`,
                      overflow: 'hidden'
                    }}
                  >
                    <Star
                      size={size}
                      fill={color}
                      color={color}
                      style={{ display: 'block' }}
                    />
                  </div>
                </div>
              ) : (
                // Fully filled or empty star
                <Star
                  size={size}
                  fill={isFilled ? color : 'none'}
                  color={isFilled ? color : emptyColor}
                  strokeWidth={1.5}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Rating Number */}
      {showNumber && (
        <span
          style={{
            fontSize: size * 0.8,
            fontWeight: 600,
            color: '#374151',
            marginLeft: '6px'
          }}
        >
          {displayRating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default StarRating;
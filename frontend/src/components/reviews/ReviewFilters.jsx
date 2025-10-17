// ========================================
// REVIEW FILTERS COMPONENT
// Filter and sort controls for reviews
// ========================================

import React from 'react';
import { Filter, SortDesc, Search, X } from 'lucide-react';

const ReviewFilters = ({
  filters,
  onFilterChange,
  onClearFilters,
  destinations = [],
  showDestinationFilter = true
}) => {
  const hasActiveFilters = 
    filters.rating !== 'all' || 
    filters.destination !== 'all' || 
    filters.search !== '';

  return (
    <div className="review-filters-container">
      {/* Header */}
      <div className="review-filters-header">
        <div className="filter-title">
          <Filter size={20} />
          <h3>Filter Reviews</h3>
        </div>
        
        {hasActiveFilters && (
          <button 
            className="clear-filters-btn"
            onClick={onClearFilters}
          >
            <X size={16} />
            Clear Filters
          </button>
        )}
      </div>

      {/* Filter Controls */}
      <div className="review-filters-grid">
        {/* Search */}
        <div className="filter-group">
          <label>
            <Search size={16} />
            Search Reviews
          </label>
          <input
            type="text"
            placeholder="Search by keywords..."
            value={filters.search || ''}
            onChange={(e) => onFilterChange('search', e.target.value)}
            className="filter-input"
          />
        </div>

        {/* Rating Filter */}
        <div className="filter-group">
          <label>
            <SortDesc size={16} />
            Minimum Rating
          </label>
          <select
            value={filters.rating || 'all'}
            onChange={(e) => onFilterChange('rating', e.target.value)}
            className="filter-select"
          >
            <option value="all">All Ratings</option>
            <option value="5">⭐⭐⭐⭐⭐ 5 Stars</option>
            <option value="4">⭐⭐⭐⭐ 4+ Stars</option>
            <option value="3">⭐⭐⭐ 3+ Stars</option>
            <option value="2">⭐⭐ 2+ Stars</option>
            <option value="1">⭐ 1+ Stars</option>
          </select>
        </div>

        {/* Destination Filter */}
        {showDestinationFilter && destinations.length > 0 && (
          <div className="filter-group">
            <label>Destination</label>
            <select
              value={filters.destination || 'all'}
              onChange={(e) => onFilterChange('destination', e.target.value)}
              className="filter-select"
            >
              <option value="all">All Destinations</option>
              {destinations.map((dest) => (
                <option key={dest.id} value={dest.id}>
                  {dest.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Sort By */}
        <div className="filter-group">
          <label>Sort By</label>
          <select
            value={filters.sort_by || 'recent'}
            onChange={(e) => onFilterChange('sort_by', e.target.value)}
            className="filter-select"
          >
            <option value="recent">Most Recent</option>
            <option value="helpful">Most Helpful</option>
            <option value="rating_high">Highest Rated</option>
            <option value="rating_low">Lowest Rated</option>
          </select>
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="active-filters-summary">
          <span className="active-filters-label">Active Filters:</span>
          <div className="active-filters-tags">
            {filters.rating !== 'all' && (
              <span className="filter-tag">
                {filters.rating}+ Stars
                <button onClick={() => onFilterChange('rating', 'all')}>
                  <X size={14} />
                </button>
              </span>
            )}
            {filters.destination !== 'all' && (
              <span className="filter-tag">
                {destinations.find(d => d.id === parseInt(filters.destination))?.name}
                <button onClick={() => onFilterChange('destination', 'all')}>
                  <X size={14} />
                </button>
              </span>
            )}
            {filters.search && (
              <span className="filter-tag">
                Search: "{filters.search}"
                <button onClick={() => onFilterChange('search', '')}>
                  <X size={14} />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewFilters;
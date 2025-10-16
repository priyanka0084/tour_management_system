import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import config from '../config';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import '../styles/destinations.css';
import { Heart, Search, X, SlidersHorizontal } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { toast } from 'react-toastify';

const Destinations = () => {
  const navigate = useNavigate();
  const { addToCart, isInCart } = useCart();
  const { addToWishlist, isInWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();

  const [countries, setCountries] = useState([]);
  const [places, setPlaces] = useState([]);
  const [filteredResults, setFilteredResults] = useState({ places: [], countries: [] });
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [showPriceDropdown, setShowPriceDropdown] = useState(false);
const [showRatingDropdown, setShowRatingDropdown] = useState(false);
  const [priceFilter, setPriceFilter] = useState('all');
  const [customPriceRange, setCustomPriceRange] = useState({ min: 0, max: 100000 });
  const [ratingFilter, setRatingFilter] = useState('all');
  const [isSearchActive, setIsSearchActive] = useState(false);

  useEffect(() => {
    fetchCountries();
  }, []);

  useEffect(() => {
    if (searchQuery || priceFilter !== 'all' || ratingFilter !== 'all') {
      handleSearch();
    } else {
      setIsSearchActive(false);
      setFilteredResults({ places: [], countries: [] });
    }
  }, [searchQuery, priceFilter, ratingFilter, customPriceRange]);

  const fetchCountries = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${config.API_BASE_URL}/destinations/countries`);
      const data = await response.json();

      if (data.success) {
        setCountries(data.countries);
      } else {
        setError(data.error || 'Failed to fetch countries');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Error fetching countries:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlacesByCountry = async (countryId) => {
    try {
      setLoading(true);
      const response = await fetch(`${config.API_BASE_URL}/destinations/countries/${countryId}/places`);
      const data = await response.json();

      if (data.success) {
        setPlaces(data.places);
        setSelectedCountry(countries.find(c => c.id === countryId));
        setIsSearchActive(false);
        setSearchQuery('');
      } else {
        setError(data.error || 'Failed to fetch places');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Error fetching places:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      
      let queryParams = new URLSearchParams();
      if (searchQuery) queryParams.append('query', searchQuery);
      
      // Price filters
      if (priceFilter === 'budget') {
        queryParams.append('maxPrice', 15000);
      } else if (priceFilter === 'mid') {
        queryParams.append('minPrice', 15000);
        queryParams.append('maxPrice', 30000);
      } else if (priceFilter === 'luxury') {
        queryParams.append('minPrice', 30000);
      } else if (priceFilter === 'custom') {
        queryParams.append('minPrice', customPriceRange.min);
        queryParams.append('maxPrice', customPriceRange.max);
      }

      // Rating filter
      if (ratingFilter !== 'all') {
        queryParams.append('rating', ratingFilter);
      }

      const response = await fetch(`${config.API_BASE_URL}/destinations/search?${queryParams}`);
      const data = await response.json();

      if (data.success) {
        setFilteredResults(data.results);
        setIsSearchActive(true);
        setSelectedCountry(null);
      }
    } catch (err) {
      console.error('Search error:', err);
      toast.error('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
  setSearchQuery('');
  setPriceFilter('all');
  setRatingFilter('all');
  setCustomPriceRange({ min: 0, max: 100000 });
  setIsSearchActive(false);
  setFilteredResults({ places: [], countries: [] });
  setShowPriceDropdown(false);  // ADD THIS
  setShowRatingDropdown(false); // ADD THIS
};

  const handleCountryClick = (countryId) => {
    fetchPlacesByCountry(countryId);
  };

  const handleAddToCart = (place) => {
    if (!isAuthenticated) {
      toast.info('Please login to add items to cart');
      navigate('/login');
      return;
    }
    addToCart(place);
    toast.success(`${place.name} added to cart!`);
  };

  const handleAddToWishlist = (place) => {
    if (!isAuthenticated) {
      toast.info('Please login to add to wishlist');
      navigate('/login');
      return;
    }
    addToWishlist(place);
    toast.success(`${place.name} added to wishlist!`);
  };

  const handleViewPackages = (placeId) => {
    navigate(`/packages/${placeId}`);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const processImageUrl = (url) => {
    if (!url || url.trim() === '') {
      return 'https://via.placeholder.com/400x300?text=No+Image';
    }
    return url;
  };

  return (
    <div className="destinations-page">
      <Navbar />

      {/* Modern Search & Filter Section */}
<div className="search-filter-section">
  <div className="search-container">
    <div className="search-bar">
      <Search className="search-icon" />
      <input
        type="text"
        placeholder="Search destinations, countries..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="search-input"
      />
      {searchQuery && (
        <X 
          className="clear-icon" 
          onClick={() => setSearchQuery('')}
        />
      )}
    </div>

    {/* Compact Filter Icons */}
<div className="filter-icons-group">
  {/* Price Filter Dropdown */}
  <div className="filter-dropdown">
    <button 
      className="icon-filter-btn" 
      onClick={() => {
        setShowPriceDropdown(!showPriceDropdown);
        setShowRatingDropdown(false); // Close rating dropdown
      }}
    >
      💰
      <span className="filter-label">Price</span>
      {priceFilter !== 'all' && <span className="active-dot"></span>}
    </button>
    
    {showPriceDropdown && (
      <div className="dropdown-menu price-dropdown">
        <div 
          className={`dropdown-item ${priceFilter === 'all' ? 'active' : ''}`}
          onClick={() => { setPriceFilter('all'); setShowPriceDropdown(false); }}
        >
          All Prices
        </div>
        <div 
          className={`dropdown-item ${priceFilter === 'budget' ? 'active' : ''}`}
          onClick={() => { setPriceFilter('budget'); setShowPriceDropdown(false); }}
        >
          💸 Budget (&lt; ₹15k)
        </div>
        <div 
          className={`dropdown-item ${priceFilter === 'mid' ? 'active' : ''}`}
          onClick={() => { setPriceFilter('mid'); setShowPriceDropdown(false); }}
        >
          💎 Mid (₹15k-30k)
        </div>
        <div 
          className={`dropdown-item ${priceFilter === 'luxury' ? 'active' : ''}`}
          onClick={() => { setPriceFilter('luxury'); setShowPriceDropdown(false); }}
        >
          👑 Luxury (&gt; ₹30k)
        </div>
        <div 
          className={`dropdown-item ${priceFilter === 'custom' ? 'active' : ''}`}
          onClick={() => setPriceFilter('custom')}
        >
          🎯 Custom Range
        </div>
        
        {priceFilter === 'custom' && (
          <div className="custom-range-input">
            <input
              type="number"
              placeholder="Min"
              value={customPriceRange.min}
              onChange={(e) => setCustomPriceRange({ ...customPriceRange, min: e.target.value })}
            />
            <span>-</span>
            <input
              type="number"
              placeholder="Max"
              value={customPriceRange.max}
              onChange={(e) => setCustomPriceRange({ ...customPriceRange, max: e.target.value })}
            />
          </div>
        )}
      </div>
    )}
  </div>

  {/* Rating Filter Dropdown */}
  <div className="filter-dropdown">
    <button 
      className="icon-filter-btn" 
      onClick={() => {
        setShowRatingDropdown(!showRatingDropdown);
        setShowPriceDropdown(false); // Close price dropdown
      }}
    >
      ⭐
      <span className="filter-label">Rating</span>
      {ratingFilter !== 'all' && <span className="active-dot"></span>}
    </button>
    
    {showRatingDropdown && (
      <div className="dropdown-menu rating-dropdown">
        <div 
          className={`dropdown-item ${ratingFilter === 'all' ? 'active' : ''}`}
          onClick={() => { setRatingFilter('all'); setShowRatingDropdown(false); }}
        >
          All Ratings
        </div>
        <div 
          className={`dropdown-item ${ratingFilter === '4.5' ? 'active' : ''}`}
          onClick={() => { setRatingFilter('4.5'); setShowRatingDropdown(false); }}
        >
          ⭐ 4.5 & above
        </div>
        <div 
          className={`dropdown-item ${ratingFilter === '4.0' ? 'active' : ''}`}
          onClick={() => { setRatingFilter('4.0'); setShowRatingDropdown(false); }}
        >
          ⭐ 4.0 & above
        </div>
        <div 
          className={`dropdown-item ${ratingFilter === '3.5' ? 'active' : ''}`}
          onClick={() => { setRatingFilter('3.5'); setShowRatingDropdown(false); }}
        >
          ⭐ 3.5 & above
        </div>
      </div>
    )}
  </div>

  {/* Clear Filters */}
  {(searchQuery || priceFilter !== 'all' || ratingFilter !== 'all') && (
    <button className="clear-all-btn" onClick={clearFilters}>
      <X size={16} />
    </button>
  )}
</div>
  </div>

  {/* Active Filters Tags */}
  {isSearchActive && (
    <div className="active-filters-tags">
      <span className="results-text">
        {filteredResults.places.length + filteredResults.countries.length} results
      </span>
      {priceFilter !== 'all' && (
        <span className="filter-tag">
          💰 {priceFilter === 'budget' ? '< ₹15k' : priceFilter === 'mid' ? '₹15k-30k' : priceFilter === 'luxury' ? '> ₹30k' : 'Custom'}
          <X size={14} onClick={() => setPriceFilter('all')} />
        </span>
      )}
      {ratingFilter !== 'all' && (
        <span className="filter-tag">
          ⭐ {ratingFilter}+
          <X size={14} onClick={() => setRatingFilter('all')} />
        </span>
      )}
    </div>
  )}
</div>

      <div className="destinations-content">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : isSearchActive ? (
          <>
            {/* Search Results - Countries */}
            {filteredResults.countries.length > 0 && (
              <div className="search-section">
                <h2 className="section-title">Matching Countries</h2>
                <div className="countries-grid">
                  {filteredResults.countries.map((country) => (
                    <div
                      key={country.id}
                      className="country-card"
                      onClick={() => handleCountryClick(country.id)}
                    >
                      <div className="country-image">
                        <img
                          src={processImageUrl(country.image_url)}
                          alt={country.name}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
                          }}
                        />
                        <div className="country-overlay">
                          <h3>{country.name}</h3>
                          <p>{country.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Search Results - Places */}
            {filteredResults.places.length > 0 && (
              <div className="search-section">
                <h2 className="section-title">Matching Destinations</h2>
                <div className="places-grid">
                  {filteredResults.places.map((place) => (
                    <div key={place.id} className="place-card">
                      <div className="place-image">
                        <img
                          src={processImageUrl(place.image_url)}
                          alt={place.name}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/350x250?text=No+Image';
                          }}
                        />
                        <div className="place-rating">
                          ⭐ {place.rating}/5
                        </div>
                      </div>

                      <div className="place-content">
                        <h3 className="place-title">{place.name}</h3>
                        <p className="place-location">{place.country_name}</p>
                        <p className="place-description">{place.description}</p>

                        <div className="place-details">
                          <div className="detail-item">
                            <span className="detail-label">Duration:</span>
                            <span className="detail-value">{place.duration_days} days</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">From:</span>
                            <span className="detail-value price">{formatPrice(place.price_per_person)}</span>
                          </div>
                        </div>

                        <div className="place-actions">
                          <button
                            className="wishlist-btn"
                            onClick={() => handleAddToWishlist(place)}
                            title={isInWishlist(place.id) ? 'In Wishlist' : 'Add to Wishlist'}
                          >
                            <Heart 
                              style={{
                                width: '20px',
                                height: '20px',
                                fill: isInWishlist(place.id) ? 'white' : 'none'
                              }}
                            />
                          </button>

                          <button
                            className="add-to-cart-btn"
                            onClick={() => handleAddToCart(place)}
                            disabled={isInCart(place.id)}
                          >
                            {isInCart(place.id) ? '✓ In Cart' : '🛒 Add to Cart'}
                          </button>

                          <button
                            className="view-btn"
                            onClick={() => handleViewPackages(place.id)}
                          >
                            👁️ View Packages
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {filteredResults.places.length === 0 && filteredResults.countries.length === 0 && (
              <div className="no-results">
                <h3>No results found</h3>
                <p>Try adjusting your filters or search query</p>
              </div>
            )}
          </>
        ) : selectedCountry ? (
          <div>
            <div className="country-header">
              <button className="back-btn" onClick={() => setSelectedCountry(null)}>
                ← Back to Countries
              </button>
              <h2>{selectedCountry.name}</h2>
            </div>

            <div className="places-grid">
              {places.map((place) => (
                <div key={place.id} className="place-card">
                  <div className="place-image">
                    <img
                      src={processImageUrl(place.image_url)}
                      alt={place.name}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/350x250?text=No+Image';
                      }}
                    />
                    <div className="place-rating">
                      ⭐ {place.rating}/5
                    </div>
                  </div>

                  <div className="place-content">
                    <h3 className="place-title">{place.name}</h3>
                    <p className="place-description">{place.description}</p>

                    <div className="place-details">
                      <div className="detail-item">
                        <span className="detail-label">Duration:</span>
                        <span className="detail-value">{place.duration_days} days</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">From:</span>
                        <span className="detail-value price">{formatPrice(place.price_per_person)}</span>
                      </div>
                    </div>

                    <div className="place-actions">
                      <button
                        className="wishlist-btn"
                        onClick={() => handleAddToWishlist(place)}
                        title={isInWishlist(place.id) ? 'In Wishlist' : 'Add to Wishlist'}
                      >
                        <Heart 
                          style={{
                            width: '20px',
                            height: '20px',
                            fill: isInWishlist(place.id) ? 'white' : 'none'
                          }}
                        />
                      </button>

                      <button
                        className="add-to-cart-btn"
                        onClick={() => handleAddToCart(place)}
                        disabled={isInCart(place.id)}
                      >
                        {isInCart(place.id) ? '✓ In Cart' : '🛒 Add to Cart'}
                      </button>

                      <button
                        className="view-btn"
                        onClick={() => handleViewPackages(place.id)}
                      >
                        👁️ View Packages
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="countries-grid">
            {countries.map((country) => (
              <div
                key={country.id}
                className="country-card"
                onClick={() => handleCountryClick(country.id)}
              >
                <div className="country-image">
                  <img
                    src={processImageUrl(country.image_url)}
                    alt={country.name}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
                    }}
                  />
                  <div className="country-overlay">
                    <h3>{country.name}</h3>
                    <p>{country.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Destinations;
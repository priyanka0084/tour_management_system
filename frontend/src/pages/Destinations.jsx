import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import config from '../config';
import '../styles/destinations.css';

const Destinations = () => {
  const navigate = useNavigate();
  const [countries, setCountries] = useState([]);
  const [places, setPlaces] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSearchCountry, setSelectedSearchCountry] = useState(null);
  const [searchPlaces, setSearchPlaces] = useState([]);

  useEffect(() => {
    fetchCountries();
  }, []);

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
        setSelectedSearchCountry(null);
        setSearchResults([]);
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

  const processImageUrl = (url) => {
    if (!url || url.trim() === '') return 'https://via.placeholder.com/300x300?text=No+Image';

    // Convert unsplash.com/photos/ to images.unsplash.com/photos/ with parameters
    if (url.includes('unsplash.com/photos/')) {
      const photoId = url.split('unsplash.com/photos/')[1].split('?')[0];
      return `https://images.unsplash.com/photos/${photoId}?w=400&h=300&fit=crop`;
    }

    // Fix for placeholder.com domain error: use https://via.placeholder.com instead of https://via.placeholder.com
    if (url.includes('via.placeholder.com')) {
      return url.replace('via.placeholder.com', 'via.placeholder.com');
    }

    return url;
  };

  const handleCountryClick = (countryId) => {
    fetchPlacesByCountry(countryId);
  };

  const handleBackToCountries = () => {
    setSelectedCountry(null);
    setPlaces([]);
    setSelectedSearchCountry(null);
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleViewPackages = (placeId) => {
    navigate(`/packages/${placeId}`);
  };

  const handleAddToCart = (place) => {
    alert(`${place.name} added to cart!`);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(price);
  };

  // GeoDB Cities API search for cities
  const searchCities = async (query) => {
    if (!query) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    try {
      const response = await fetch(`https://wft-geo-db.p.rapidapi.com/v1/geo/cities?namePrefix=${query}`, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': '7db5b72188msh07796a7bfc3d505p101ca4jsn923a6039741d',
          'X-RapidAPI-Host': 'wft-geo-db.p.rapidapi.com'
        }
      });
      const data = await response.json();
      if (data && data.data) {
        setSearchResults(data.data);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching cities:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    searchCities(query);
  };

  // When user selects a searched city, fetch places and packages for it
  const handleSearchCitySelect = async (city) => {
    setSelectedSearchCountry(city);
    setSelectedCountry(null);
    setPlaces([]);
    setSearchResults([]);
    setSearchQuery('');

    // For searched city, fetch places and packages dynamically or show placeholder
    // Here, as GeoDB API does not provide places/packages, we can show city info only or fetch from backend if exists

    // Example: fetch places by city name or country code from backend if available
    try {
      setLoading(true);
      // Assuming backend supports fetching places by city name or country code
      const response = await fetch(`${config.API_BASE_URL}/destinations/cities/name/${city.name}`);
      const data = await response.json();
      if (data.success) {
        setSearchPlaces(data.places);
      } else {
        setSearchPlaces([]);
      }
    } catch (err) {
      console.error('Error fetching places for searched city:', err);
      setSearchPlaces([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="destinations-container">
        <div className="search-container" style={{ marginBottom: '20px', textAlign: 'center' }}>
          <input
            type="text"
            placeholder="Search for cities..."
            value={searchQuery}
            onChange={handleSearchChange}
            style={{
              padding: '10px',
              width: '300px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '16px'
            }}
          />
          {isSearching && <span style={{ marginLeft: '10px' }}>Searching...</span>}
        </div>

        {(selectedCountry || selectedSearchCountry) && (
          <button
            className="back-to-countries-btn"
            onClick={handleBackToCountries}
            style={{
              marginBottom: '15px',
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            &larr; Back to All Destinations
          </button>
        )}

        {loading && <div className="loading">Loading...</div>}
        {error && (
          <div className="error">
            {error} <button onClick={handleBackToCountries}>Back to Countries</button>
          </div>
        )}

        {!selectedCountry && !selectedSearchCountry ? (
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
                      console.log('Image load error for country:', e.target.alt);
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/300x300?text=No+Image';
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
        ) : null}
        {searchResults.length > 0 && !selectedCountry && !selectedSearchCountry && (
          <div className="search-results-grid">
            {searchResults.map((city) => (
              <div
                key={city.id}
                className="country-card"
                onClick={() => handleSearchCitySelect(city)}
              >
                <div className="country-image">
                  <img
                    src={city.imageUrl || 'https://via.placeholder.com/300x300?text=No+Image'}
                    alt={city.name}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/300x300?text=No+Image';
                    }}
                  />
                  <div className="country-overlay">
                    <h3>{city.name}</h3>
                    <p>{city.region}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedCountry ? (
          <div className="places-grid-horizontal">
            {places.map((place) => (
              <div key={place.id} className="place-card">
                <div className="place-image">
                  <img
                    src={place.image_url && place.image_url.trim() !== '' ? place.image_url : 'https://via.placeholder.com/350x200?text=No+Image'}
                    alt={place.name}
                    onError={(e) => { 
                      console.log('Image load error for place:', e.target.alt);
                      e.target.onerror = null; 
                      e.target.src = 'https://via.placeholder.com/350x200?text=No+Image'; 
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
                      className="add-to-cart-btn"
                      onClick={() => handleAddToCart(place)}
                    >
                      🛒 Add to Cart
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
        ) : null}

        {selectedSearchCountry ? (
          <div>
            <h2>{selectedSearchCountry.name}</h2>
            <p>Country Code: {selectedSearchCountry.code}</p>
            <p>Region: {selectedSearchCountry.region}</p>
            <p>Population: {selectedSearchCountry.population}</p>

            {searchPlaces.length > 0 ? (
              <div className="places-grid-horizontal">
                {searchPlaces.map((place) => (
                  <div key={place.id} className="place-card">
                    <div className="place-image">
                      <img
                        src={place.image_url && place.image_url.trim() !== '' ? place.image_url : 'https://via.placeholder.com/350x200?text=No+Image'}
                        alt={place.name}
                        onError={(e) => { 
                          console.log('Image load error for place:', e.target.alt);
                          e.target.onerror = null; 
                          e.target.src = 'https://via.placeholder.com/350x200?text=No+Image'; 
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
                          className="add-to-cart-btn"
                          onClick={() => handleAddToCart(place)}
                        >
                          🛒 Add to Cart
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
            ) : (
              <p>No places found for this country.</p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Destinations;

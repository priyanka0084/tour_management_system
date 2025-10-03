import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import config from '../config';
import '../styles/packages.css';

const Packages = () => {
  const { placeId } = useParams();
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});

  useEffect(() => {
    fetchPackages();
  }, [placeId]);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${config.API_BASE_URL}/packages/${placeId}`);
      const data = await response.json();

      if (data.success) {
        // Ensure services, places_included, itinerary are arrays for rendering
        const processedPackages = data.packages.map(pkg => {
          return {
            ...pkg,
            services: Array.isArray(pkg.services) ? pkg.services : (typeof pkg.services === 'string' ? pkg.services.split(',').map(s => s.trim()) : []),
            places_included: Array.isArray(pkg.places_included) ? pkg.places_included : (typeof pkg.places_included === 'string' ? pkg.places_included.split(',').map(s => s.trim()) : []),
            itinerary: Array.isArray(pkg.itinerary) ? pkg.itinerary : (typeof pkg.itinerary === 'string' ? pkg.itinerary.split(';').map(s => s.trim()) : [])
          };
        });
        setPackages(processedPackages);
      } else {
        setError(data.error || 'Failed to fetch packages');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Error fetching packages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBookNow = (pkg) => {
    // Navigate to booking page with package details
    navigate('/booking', {
      state: {
        selectedDestination: `${pkg.place_name}, ${pkg.country_name}`,
        packageDetails: pkg
      }
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(price);
  };

  const handleBackToPlaces = () => {
    navigate('/destinations');
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="packages-container">
          <div className="loading">Loading packages...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Navbar />
        <div className="packages-container">
          <div className="error">{error}</div>
          <button onClick={fetchPackages} className="retry-btn">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="packages-container">
        <button className="back-button" onClick={handleBackToPlaces} style={{ marginBottom: '20px' }}>Back to Destinations</button>
        {/* Place Details Section */}
        {packages.length > 0 && (
          <div className="place-details-section">
            <div className="place-details-card">
              <div className="place-details-image">
                <img src={packages[0].place_image} alt={packages[0].place_name} />
                <div className="place-rating-badge">
                  ⭐ {packages[0].place_rating}/5
                </div>
              </div>
              <div className="place-details-content">
                <h2>{packages[0].place_name}</h2>
                <p className="place-country">{packages[0].country_name}</p>
                <p className="place-description">
                  Discover the beauty and culture of {packages[0].place_name}, located in {packages[0].country_name}.
                  Choose from our curated packages below to make your trip unforgettable.
                </p>
                <div className="place-stats">
                  <div className="stat-item">
                    <span className="stat-label">Location:</span>
                    <span className="stat-value">{packages[0].place_name}, {packages[0].country_name}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Rating:</span>
                    <span className="stat-value">⭐ {packages[0].place_rating}/5</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="packages-header">
          <h1>Packages for {packages[0]?.place_name || 'Destination'}</h1>
          <p>Choose the perfect package for your adventure</p>
        </div>

        {packages.length === 0 ? (
          <div className="no-packages">
            <h2>No packages available</h2>
            <p>Please check back later for new packages.</p>
          </div>
        ) : (
          <div className="packages-grid">
            {packages.map((pkg) => (
              <div key={pkg.id} className="package-card">
                <div className="package-image">
                  <img src={pkg.place_image} alt={pkg.place_name} />
                  <div className="package-badge">
                    {pkg.duration_days} Days
                  </div>
                </div>

                <div className="package-content">
                  <h3 className="package-title">{pkg.title}</h3>
                  <p className="package-description">{pkg.description}</p>

                  <div className="package-details">
                    <div className="detail-item">
                      <span className="detail-label">Duration:</span>
                      <span className="detail-value">{pkg.duration_days} Days</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Location:</span>
                      <span className="detail-value">{pkg.place_name}, {pkg.country_name}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Rating:</span>
                      <span className="detail-value">
                        ⭐ {pkg.place_rating}/5
                      </span>
                    </div>
                  </div>

                  <div className="package-price">
                    <span className="price">{formatPrice(pkg.price)}</span>
                    <span className="price-note">per person</span>
                  </div>

                  <div className="package-services">
                    <h4>Included Services:</h4>
                    <ul>
                      {Array.isArray(pkg.services) ? pkg.services.map((service, index) => (
                        <li key={index}>{service}</li>
                      )) : (
                        <li>{pkg.services}</li>
                      )}
                    </ul>
                  </div>

                  {pkg.places_included && (
                    <div className="package-places">
                      <h4>Places Included:</h4>
                      <ul>
                        {Array.isArray(pkg.places_included) ? pkg.places_included.map((place, index) => (
                          <li key={index}>{place}</li>
                        )) : (
                          <li>{pkg.places_included}</li>
                        )}
                      </ul>
                    </div>
                  )}

                  {pkg.itinerary && (
                    <div className="package-itinerary">
                      <h4>Itinerary:</h4>
                      <div className="itinerary-content">
                        {Array.isArray(pkg.itinerary) ? pkg.itinerary.map((day, index) => (
                          <div key={index} className="itinerary-day">
                            <strong>Day {index + 1}:</strong> {day}
                          </div>
                        )) : (
                          <div>{pkg.itinerary}</div>
                        )}
                      </div>
                    </div>
                  )}

                  <button
                    className="book-now-btn"
                    onClick={() => handleBookNow(pkg)}
                  >
                    Book Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Packages;

import React, { useState, useEffect } from 'react';
import config from '../config';

const DestinationSearch = ({ formData, setFormData, errors, setErrors }) => {
  const [destinations, setDestinations] = useState([]);
  const [filteredDestinations, setFilteredDestinations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    fetchDestinations();
  }, []);

  const fetchDestinations = async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/destinations`);
      const data = await response.json();
      if (data.success) {
        setDestinations(data.destinations);
      }
    } catch (error) {
      console.error('Error fetching destinations:', error);
    }
  };

  useEffect(() => {
    if (searchTerm.length > 0) {
      const filtered = destinations.filter(dest =>
        dest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dest.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredDestinations(filtered);
      setShowDropdown(true);
    } else {
      setFilteredDestinations([]);
      setShowDropdown(false);
    }
  }, [searchTerm, destinations]);

  const handleDestinationSelect = (destination) => {
    setFormData({
      ...formData,
      tour_destination: destination.name
    });
    setSearchTerm(destination.name);
    setShowDropdown(false);
    // Clear destination error if it exists
    if (errors.tour_destination) {
      setErrors({
        ...errors,
        tour_destination: ''
      });
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setFormData({
      ...formData,
      tour_destination: value
    });
  };

  return (
    <div className="form-group">
      <label htmlFor="tour_destination">Tour Destination *</label>
      <div className="destination-search-container">
        <input
          type="text"
          id="tour_destination"
          name="tour_destination"
          value={searchTerm || formData.tour_destination}
          onChange={handleInputChange}
          placeholder="Search for a destination..."
          autoComplete="off"
        />
        {showDropdown && filteredDestinations.length > 0 && (
          <div className="destination-dropdown">
            {filteredDestinations.map((dest) => (
              <div
                key={dest.id}
                className="destination-option"
                onClick={() => handleDestinationSelect(dest)}
              >
                <div className="destination-name">{dest.name}</div>
                <div className="destination-description">{dest.description}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      {errors.tour_destination && <span className="error-text">{errors.tour_destination}</span>}
    </div>
  );
};

export default DestinationSearch;

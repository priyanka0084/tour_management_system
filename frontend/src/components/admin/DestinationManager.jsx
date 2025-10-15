import React, { useState, useEffect } from 'react';
import { 
  FiEdit2, 
  FiTrash2, 
  FiSearch, 
  FiFilter, 
  FiChevronUp, 
  FiChevronDown,
  FiX
} from 'react-icons/fi';
import config from '../../config';

const DestinationManager = () => {
  const [countries, setCountries] = useState([]);
  const [places, setPlaces] = useState([]);
  const [showCountryForm, setShowCountryForm] = useState(false);
  const [showPlaceForm, setShowPlaceForm] = useState(false);
  const [editingCountry, setEditingCountry] = useState(null);
  const [editingPlace, setEditingPlace] = useState(null);
  const [activeView, setActiveView] = useState('places'); // 'countries' or 'places'
  const [showFilters, setShowFilters] = useState(true); // For mobile toggle
  const [filters, setFilters] = useState({
    id: '',
    name: '',
    country: '',
    rating: '',
    price: '',
    duration: ''
  });
  
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc'
  });
  const [countryFilters, setCountryFilters] = useState({
  id: '',
  name: '',
  code: '',
  description: ''
});

const [countrySortConfig, setCountrySortConfig] = useState({
  key: null,
  direction: 'asc'
});

const [showCountryFilters, setShowCountryFilters] = useState(true);
  const [countryForm, setCountryForm] = useState({
    name: '',
    code: '',
    image_url: '',
    description: ''
  });

  const [placeForm, setPlaceForm] = useState({
    name: '',
    country_id: '',
    image_url: '',
    description: '',
    rating: 0,
    price_per_person: 0,
    duration_days: 1
  });

  useEffect(() => {
    fetchCountries();
    fetchPlaces();
  }, []);

  const fetchCountries = async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/admin/destinations/countries`);
      const data = await response.json();
      if (data.success) {
        setCountries(data.countries);
      }
    } catch (error) {
      console.error('Error fetching countries:', error);
    }
  };

  const fetchPlaces = async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/admin/destinations/places`);
      const data = await response.json();
      if (data.success) {
        setPlaces(data.places);
      }
    } catch (error) {
      console.error('Error fetching places:', error);
    }
  };
  // NEW: Filter and Sort Logic
const handleFilterChange = (field, value) => {
  setFilters(prev => ({
    ...prev,
    [field]: value
  }));
};

const handleSort = (key) => {
  let direction = 'asc';
  if (sortConfig.key === key && sortConfig.direction === 'asc') {
    direction = 'desc';
  }
  setSortConfig({ key, direction });
};

const clearFilters = () => {
  setFilters({
    id: '',
    name: '',
    country: '',
    rating: '',
    price: '',
    duration: ''
  });
  setSortConfig({ key: null, direction: 'asc' });
};

// Filter and Sort Places
const getFilteredAndSortedPlaces = () => {
  let filtered = [...places];

  // Apply filters
  if (filters.id) {
    filtered = filtered.filter(place => 
      place.id.toString().includes(filters.id)
    );
  }
  if (filters.name) {
    filtered = filtered.filter(place =>
      place.name.toLowerCase().includes(filters.name.toLowerCase())
    );
  }
  if (filters.country) {
    filtered = filtered.filter(place =>
      place.country_name.toLowerCase().includes(filters.country.toLowerCase())
    );
  }
  if (filters.rating) {
    filtered = filtered.filter(place =>
      place.rating >= parseFloat(filters.rating)
    );
  }
  if (filters.price) {
    filtered = filtered.filter(place =>
      place.price_per_person <= parseFloat(filters.price)
    );
  }
  if (filters.duration) {
    filtered = filtered.filter(place =>
      place.duration_days <= parseInt(filters.duration)
    );
  }

  // Apply sorting
  if (sortConfig.key) {
    filtered.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      // Handle country name sorting
      if (sortConfig.key === 'country') {
        aVal = a.country_name;
        bVal = b.country_name;
      }

      // Handle price sorting
      if (sortConfig.key === 'price') {
        aVal = a.price_per_person;
        bVal = b.price_per_person;
      }

      // Handle duration sorting
      if (sortConfig.key === 'duration') {
        aVal = a.duration_days;
        bVal = b.duration_days;
      }

      if (aVal < bVal) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aVal > bVal) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  return filtered;
};
// ===================================
// STEP 2: ADD THESE FUNCTIONS FOR COUNTRY FILTERING & SORTING
// Add these functions after your existing Place filter functions
// ===================================

// Handle country filter changes
const handleCountryFilterChange = (field, value) => {
  setCountryFilters(prev => ({
    ...prev,
    [field]: value
  }));
};

// Handle country sorting
const handleCountrySort = (key) => {
  let direction = 'asc';
  if (countrySortConfig.key === key && countrySortConfig.direction === 'asc') {
    direction = 'desc';
  }
  setCountrySortConfig({ key, direction });
};

// Clear all country filters
const clearCountryFilters = () => {
  setCountryFilters({
    id: '',
    name: '',
    code: '',
    description: ''
  });
  setCountrySortConfig({ key: null, direction: 'asc' });
};

// Filter and Sort Countries - Main function
const getFilteredAndSortedCountries = () => {
  let filtered = [...countries];

  // Apply filters (Contains logic - partial match)
  if (countryFilters.id) {
    filtered = filtered.filter(country => 
      country.id.toString().includes(countryFilters.id)
    );
  }
  
  if (countryFilters.name) {
    filtered = filtered.filter(country =>
      country.name.toLowerCase().includes(countryFilters.name.toLowerCase())
    );
  }
  
  if (countryFilters.code) {
    filtered = filtered.filter(country =>
      country.code.toLowerCase().includes(countryFilters.code.toLowerCase())
    );
  }
  
  if (countryFilters.description) {
    filtered = filtered.filter(country =>
      (country.description || '').toLowerCase().includes(countryFilters.description.toLowerCase())
    );
  }

  // Apply sorting
  if (countrySortConfig.key) {
    filtered.sort((a, b) => {
      let aVal = a[countrySortConfig.key];
      let bVal = b[countrySortConfig.key];

      // Handle null/undefined values
      if (!aVal) aVal = '';
      if (!bVal) bVal = '';

      // Convert to lowercase for string comparison
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      if (aVal < bVal) {
        return countrySortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aVal > bVal) {
        return countrySortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  return filtered;
};

// Get unique countries for filter dropdown
const getUniqueCountries = () => {
  const uniqueCountries = [...new Set(places.map(place => place.country_name))];
  return uniqueCountries.filter(Boolean).sort();
};
  // Country CRUD Operations
  const handleCountrySubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingCountry 
        ? `${config.API_BASE_URL}/admin/destinations/countries/${editingCountry.id}`
        : `${config.API_BASE_URL}/admin/destinations/countries`;
      
      const method = editingCountry ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(countryForm)
      });

      const data = await response.json();
      
      if (data.success) {
        alert(data.message);
        fetchCountries();
        resetCountryForm();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Error saving country:', error);
      alert('Failed to save country');
    }
  };

  const handleEditCountry = (country) => {
    setEditingCountry(country);
    setCountryForm({
      name: country.name,
      code: country.code,
      image_url: country.image_url || '',
      description: country.description || ''
    });
    setShowCountryForm(true);
  };

  const handleDeleteCountry = async (id) => {
    if (!window.confirm('Are you sure you want to delete this country? All associated places will also be deleted.')) {
      return;
    }

    try {
      const response = await fetch(`${config.API_BASE_URL}/admin/destinations/countries/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.success) {
        alert(data.message);
        fetchCountries();
        fetchPlaces();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Error deleting country:', error);
      alert('Failed to delete country');
    }
  };

  const resetCountryForm = () => {
    setCountryForm({ name: '', code: '', image_url: '', description: '' });
    setEditingCountry(null);
    setShowCountryForm(false);
  };

  // Place CRUD Operations
  const handlePlaceSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingPlace 
        ? `${config.API_BASE_URL}/admin/destinations/places/${editingPlace.id}`
        : `${config.API_BASE_URL}/admin/destinations/places`;
      
      const method = editingPlace ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(placeForm)
      });

      const data = await response.json();
      
      if (data.success) {
        alert(data.message);
        fetchPlaces();
        resetPlaceForm();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Error saving place:', error);
      alert('Failed to save place');
    }
  };

  const handleEditPlace = (place) => {
    setEditingPlace(place);
    setPlaceForm({
      name: place.name,
      country_id: place.country_id,
      image_url: place.image_url || '',
      description: place.description || '',
      rating: place.rating || 0,
      price_per_person: place.price_per_person || 0,
      duration_days: place.duration_days || 1
    });
    setShowPlaceForm(true);
  };

  const handleDeletePlace = async (id) => {
    if (!window.confirm('Are you sure you want to delete this place?')) {
      return;
    }

    try {
      const response = await fetch(`${config.API_BASE_URL}/admin/destinations/places/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.success) {
        alert(data.message);
        fetchPlaces();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Error deleting place:', error);
      alert('Failed to delete place');
    }
  };

  const resetPlaceForm = () => {
    setPlaceForm({
      name: '',
      country_id: '',
      image_url: '',
      description: '',
      rating: 0,
      price_per_person: 0,
      duration_days: 1
    });
    setEditingPlace(null);
    setShowPlaceForm(false);
  };

  return (
    <div className="destination-manager">
      {/* Tab Switcher */}
      <div className="view-tabs">
        <button 
          className={activeView === 'places' ? 'active' : ''}
          onClick={() => setActiveView('places')}
        >
          Places ({places.length})
        </button>
        <button 
          className={activeView === 'countries' ? 'active' : ''}
          onClick={() => setActiveView('countries')}
        >
          Countries ({countries.length})
        </button>
      </div>

      {/* Places View */}
      {activeView === 'places' && (
        <div className="places-section">
          <div className="section-header">
            <h2>Manage Places</h2>
            <button className="add-btn" onClick={() => setShowPlaceForm(true)}>
              + Add New Place
            </button>
          </div>

          {/* Place Form Modal */}
          {showPlaceForm && (
            <div className="modal-overlay" onClick={resetPlaceForm}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h3>{editingPlace ? 'Edit Place' : 'Add New Place'}</h3>
                <form onSubmit={handlePlaceSubmit}>
                  <div className="form-group">
                    <label>Place Name *</label>
                    <input
                      type="text"
                      value={placeForm.name}
                      onChange={(e) => setPlaceForm({...placeForm, name: e.target.value})}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Country *</label>
                    <select
                      value={placeForm.country_id}
                      onChange={(e) => setPlaceForm({...placeForm, country_id: e.target.value})}
                      required
                    >
                      <option value="">Select Country</option>
                      {countries.map(country => (
                        <option key={country.id} value={country.id}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Image URL</label>
                    <input
                      type="text"
                      value={placeForm.image_url}
                      onChange={(e) => setPlaceForm({...placeForm, image_url: e.target.value})}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      value={placeForm.description}
                      onChange={(e) => setPlaceForm({...placeForm, description: e.target.value})}
                      rows="3"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Rating (0-5)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="5"
                        value={placeForm.rating}
                        onChange={(e) => setPlaceForm({...placeForm, rating: e.target.value})}
                      />
                    </div>

                    <div className="form-group">
                      <label>Price per Person (₹)</label>
                      <input
                        type="number"
                        value={placeForm.price_per_person}
                        onChange={(e) => setPlaceForm({...placeForm, price_per_person: e.target.value})}
                      />
                    </div>

                    <div className="form-group">
                      <label>Duration (Days)</label>
                      <input
                        type="number"
                        min="1"
                        value={placeForm.duration_days}
                        onChange={(e) => setPlaceForm({...placeForm, duration_days: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="form-actions">
                    <button type="button" onClick={resetPlaceForm} className="cancel-btn">
                      Cancel
                    </button>
                    <button type="submit" className="submit-btn">
                      {editingPlace ? 'Update Place' : 'Add Place'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Places Table */}
<div className="data-table">
  {/* Filter Toggle Button for Mobile */}
  <button 
    className="filter-toggle-btn"
    onClick={() => setShowFilters(!showFilters)}
  >
    <FiFilter size={18} />
    {showFilters ? 'Hide Filters' : 'Show Filters'}
  </button>

  {/* Clear Filters Button */}
  {(filters.id || filters.name || filters.country || filters.rating || filters.price || filters.duration || sortConfig.key) && (
    <button className="clear-filters-btn" onClick={clearFilters}>
      <FiX size={16} />
      Clear All Filters
    </button>
  )}

  <table>
    <thead>
      <tr>
        {/* ID Column */}
        <th>
          <div className="th-content">
            <span>ID</span>
            <button 
              className="sort-btn"
              onClick={() => handleSort('id')}
            >
              {sortConfig.key === 'id' ? (
                sortConfig.direction === 'asc' ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />
              ) : (
                <FiChevronDown size={16} className="sort-icon-default" />
              )}
            </button>
          </div>
          {showFilters && (
            <div className="filter-input-wrapper">
              <FiSearch size={14} className="search-icon" />
              <input
                type="text"
                placeholder="Search ID..."
                value={filters.id}
                onChange={(e) => handleFilterChange('id', e.target.value)}
                className="filter-input"
              />
            </div>
          )}
        </th>

        {/* Image Column */}
        <th>
          <div className="th-content">
            <span>Image</span>
          </div>
        </th>

        {/* Name Column */}
        <th>
          <div className="th-content">
            <span>Name</span>
            <button 
              className="sort-btn"
              onClick={() => handleSort('name')}
            >
              {sortConfig.key === 'name' ? (
                sortConfig.direction === 'asc' ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />
              ) : (
                <FiChevronDown size={16} className="sort-icon-default" />
              )}
            </button>
          </div>
          {showFilters && (
            <div className="filter-input-wrapper">
              <FiSearch size={14} className="search-icon" />
              <input
                type="text"
                placeholder="Search name..."
                value={filters.name}
                onChange={(e) => handleFilterChange('name', e.target.value)}
                className="filter-input"
              />
            </div>
          )}
        </th>

        {/* Country Column */}
        <th>
          <div className="th-content">
            <span>Country</span>
            <button 
              className="sort-btn"
              onClick={() => handleSort('country')}
            >
              {sortConfig.key === 'country' ? (
                sortConfig.direction === 'asc' ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />
              ) : (
                <FiChevronDown size={16} className="sort-icon-default" />
              )}
            </button>
          </div>
          {showFilters && (
            <div className="filter-input-wrapper">
              <select
                value={filters.country}
                onChange={(e) => handleFilterChange('country', e.target.value)}
                className="filter-select"
              >
                <option value="">All Countries</option>
                {getUniqueCountries().map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>
          )}
        </th>

        {/* Rating Column */}
        <th>
          <div className="th-content">
            <span>Rating</span>
            <button 
              className="sort-btn"
              onClick={() => handleSort('rating')}
            >
              {sortConfig.key === 'rating' ? (
                sortConfig.direction === 'asc' ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />
              ) : (
                <FiChevronDown size={16} className="sort-icon-default" />
              )}
            </button>
          </div>
          {showFilters && (
            <div className="filter-input-wrapper">
              <input
                type="number"
                placeholder="Min rating..."
                value={filters.rating}
                onChange={(e) => handleFilterChange('rating', e.target.value)}
                className="filter-input"
                min="0"
                max="5"
                step="0.1"
              />
            </div>
          )}
        </th>

        {/* Price Column */}
        <th>
          <div className="th-content">
            <span>Price</span>
            <button 
              className="sort-btn"
              onClick={() => handleSort('price')}
            >
              {sortConfig.key === 'price' ? (
                sortConfig.direction === 'asc' ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />
              ) : (
                <FiChevronDown size={16} className="sort-icon-default" />
              )}
            </button>
          </div>
          {showFilters && (
            <div className="filter-input-wrapper">
              <input
                type="number"
                placeholder="Max price..."
                value={filters.price}
                onChange={(e) => handleFilterChange('price', e.target.value)}
                className="filter-input"
                min="0"
              />
            </div>
          )}
        </th>

        {/* Duration Column */}
        <th>
          <div className="th-content">
            <span>Duration</span>
            <button 
              className="sort-btn"
              onClick={() => handleSort('duration')}
            >
              {sortConfig.key === 'duration' ? (
                sortConfig.direction === 'asc' ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />
              ) : (
                <FiChevronDown size={16} className="sort-icon-default" />
              )}
            </button>
          </div>
          {showFilters && (
            <div className="filter-input-wrapper">
              <input
                type="number"
                placeholder="Max days..."
                value={filters.duration}
                onChange={(e) => handleFilterChange('duration', e.target.value)}
                className="filter-input"
                min="0"
              />
            </div>
          )}
        </th>

        {/* Actions Column */}
        <th>
          <div className="th-content">
            <span>Actions</span>
          </div>
        </th>
      </tr>
    </thead>
    <tbody>
      {getFilteredAndSortedPlaces().map(place => (
        <tr key={place.id}>
          <td>{place.id}</td>
          <td>
            <img 
              src={place.image_url || 'https://via.placeholder.com/50'} 
              alt={place.name}
              className="table-img"
            />
          </td>
          <td>{place.name}</td>
          <td>{place.country_name}</td>
          <td>{place.rating}</td>
          <td>₹{place.price_per_person}</td>
          <td>{place.duration_days} days</td>
          <td className="action-buttons">
            <button 
              className="icon-btn edit-icon-btn"
              onClick={() => handleEditPlace(place)}
              title="Edit"
            >
              <FiEdit2 size={16} />
            </button>
            <button 
              className="icon-btn delete-icon-btn"
              onClick={() => handleDeletePlace(place.id)}
              title="Delete"
            >
              <FiTrash2 size={16} />
            </button>
          </td>
        </tr>
      ))}
      {getFilteredAndSortedPlaces().length === 0 && (
        <tr>
          <td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>
            No places found matching your filters
          </td>
        </tr>
      )}
    </tbody>
  </table>
</div>
        </div>
      )}

      {/* Countries View */}
      {/* ===================================
    STEP 3: REPLACE YOUR ENTIRE COUNTRIES VIEW SECTION
    Replace the section that starts with {activeView === 'countries' && (
    =================================== */}

{/* Countries View */}
{activeView === 'countries' && (
  <div className="countries-section">
    <div className="section-header">
      <h2>Manage Countries</h2>
      <button className="add-btn" onClick={() => setShowCountryForm(true)}>
        + Add New Country
      </button>
    </div>

    {/* Country Form Modal - Keep your existing modal */}
    {showCountryForm && (
      <div className="modal-overlay" onClick={resetCountryForm}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <h3>{editingCountry ? 'Edit Country' : 'Add New Country'}</h3>
          <form onSubmit={handleCountrySubmit}>
            <div className="form-group">
              <label>Country Name *</label>
              <input
                type="text"
                value={countryForm.name}
                onChange={(e) => setCountryForm({...countryForm, name: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label>Country Code *</label>
              <input
                type="text"
                value={countryForm.code}
                onChange={(e) => setCountryForm({...countryForm, code: e.target.value.toUpperCase()})}
                placeholder="IN, US, FR, etc."
                maxLength="10"
                required
              />
            </div>

            <div className="form-group">
              <label>Image URL</label>
              <input
                type="text"
                value={countryForm.image_url}
                onChange={(e) => setCountryForm({...countryForm, image_url: e.target.value})}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={countryForm.description}
                onChange={(e) => setCountryForm({...countryForm, description: e.target.value})}
                rows="3"
              />
            </div>

            <div className="form-actions">
              <button type="button" onClick={resetCountryForm} className="cancel-btn">
                Cancel
              </button>
              <button type="submit" className="submit-btn">
                {editingCountry ? 'Update Country' : 'Add Country'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

    {/* ✨ ENHANCED Countries Table with Filters & Sorting */}
    <div className="data-table">
      {/* Filter Toggle Button for Mobile */}
      <button 
        className="filter-toggle-btn"
        onClick={() => setShowCountryFilters(!showCountryFilters)}
      >
        <FiFilter size={18} />
        {showCountryFilters ? 'Hide Filters' : 'Show Filters'}
      </button>

      {/* Clear Filters Button */}
      {(countryFilters.id || countryFilters.name || countryFilters.code || 
        countryFilters.description || countrySortConfig.key) && (
        <button className="clear-filters-btn" onClick={clearCountryFilters}>
          <FiX size={16} />
          Clear All Filters
        </button>
      )}

      <table>
        <thead>
          <tr>
            {/* ID Column */}
            <th>
              <div className="th-content">
                <span>ID</span>
                <button 
                  className="sort-btn"
                  onClick={() => handleCountrySort('id')}
                >
                  {countrySortConfig.key === 'id' ? (
                    countrySortConfig.direction === 'asc' ? 
                      <FiChevronUp size={16} /> : <FiChevronDown size={16} />
                  ) : (
                    <FiChevronDown size={16} className="sort-icon-default" />
                  )}
                </button>
              </div>
              {showCountryFilters && (
                <div className="filter-input-wrapper">
                  <FiSearch size={14} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search ID..."
                    value={countryFilters.id}
                    onChange={(e) => handleCountryFilterChange('id', e.target.value)}
                    className="filter-input"
                  />
                </div>
              )}
            </th>

            {/* Image Column - NO FILTER */}
            <th>
              <div className="th-content">
                <span>Image</span>
              </div>
            </th>

            {/* Name Column */}
            <th>
              <div className="th-content">
                <span>Name</span>
                <button 
                  className="sort-btn"
                  onClick={() => handleCountrySort('name')}
                >
                  {countrySortConfig.key === 'name' ? (
                    countrySortConfig.direction === 'asc' ? 
                      <FiChevronUp size={16} /> : <FiChevronDown size={16} />
                  ) : (
                    <FiChevronDown size={16} className="sort-icon-default" />
                  )}
                </button>
              </div>
              {showCountryFilters && (
                <div className="filter-input-wrapper">
                  <FiSearch size={14} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search name..."
                    value={countryFilters.name}
                    onChange={(e) => handleCountryFilterChange('name', e.target.value)}
                    className="filter-input"
                  />
                </div>
              )}
            </th>

            {/* Code Column */}
            <th>
              <div className="th-content">
                <span>Code</span>
                <button 
                  className="sort-btn"
                  onClick={() => handleCountrySort('code')}
                >
                  {countrySortConfig.key === 'code' ? (
                    countrySortConfig.direction === 'asc' ? 
                      <FiChevronUp size={16} /> : <FiChevronDown size={16} />
                  ) : (
                    <FiChevronDown size={16} className="sort-icon-default" />
                  )}
                </button>
              </div>
              {showCountryFilters && (
                <div className="filter-input-wrapper">
                  <FiSearch size={14} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search code..."
                    value={countryFilters.code}
                    onChange={(e) => handleCountryFilterChange('code', e.target.value)}
                    className="filter-input"
                  />
                </div>
              )}
            </th>

            {/* Description Column */}
            <th>
              <div className="th-content">
                <span>Description</span>
              </div>
              {showCountryFilters && (
                <div className="filter-input-wrapper">
                  <FiSearch size={14} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search description..."
                    value={countryFilters.description}
                    onChange={(e) => handleCountryFilterChange('description', e.target.value)}
                    className="filter-input"
                  />
                </div>
              )}
            </th>

            {/* Actions Column */}
            <th>
              <div className="th-content">
                <span>Actions</span>
              </div>
            </th>
          </tr>
        </thead>
        
        <tbody>
          {getFilteredAndSortedCountries().map(country => (
            <tr key={country.id}>
              <td>{country.id}</td>
              <td>
                <img 
                  src={country.image_url || 'https://via.placeholder.com/50'} 
                  alt={country.name}
                  className="table-img"
                />
              </td>
              <td>{country.name}</td>
              <td>{country.code}</td>
              <td>
                {country.description 
                  ? (country.description.length > 50 
                      ? `${country.description.substring(0, 50)}...` 
                      : country.description)
                  : 'No description'}
              </td>
              <td className="action-buttons">
                {/* ✨ Icon Buttons instead of text buttons */}
                <button 
                  className="icon-btn edit-icon-btn"
                  onClick={() => handleEditCountry(country)}
                  title="Edit Country"
                >
                  <FiEdit2 size={16} />
                </button>
                <button 
                  className="icon-btn delete-icon-btn"
                  onClick={() => handleDeleteCountry(country.id)}
                  title="Delete Country"
                >
                  <FiTrash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
          
          {/* Empty State */}
          {getFilteredAndSortedCountries().length === 0 && (
            <tr>
              <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>
                No countries found matching your filters
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
)}
    </div>
  );
};

export default DestinationManager;
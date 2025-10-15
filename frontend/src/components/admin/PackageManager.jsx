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

const PackageManager = () => {
  const [packages, setPackages] = useState([]);
  const [places, setPlaces] = useState([]);
  const [showPackageForm, setShowPackageForm] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);

  const [packageForm, setPackageForm] = useState({
    place_id: '',
    title: '',
    description: '',
    price: 0,
    duration_days: 1,
    services: '',
    places_included: '',
    itinerary: ''
  });
  const [filters, setFilters] = useState({
    id: '',
    title: '',
    place: '',
    country: '',
    price: '',      // Max price filter
    duration: ''    // Max days filter
  });

  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc'
  });

  const [showFilters, setShowFilters] = useState(true);
  useEffect(() => {
    fetchPackages();
    fetchPlaces();
  }, []);

  const fetchPackages = async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/admin/packages`);
      const data = await response.json();
      if (data.success) {
        setPackages(data.packages);
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
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

  const handlePackageSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingPackage 
        ? `${config.API_BASE_URL}/admin/packages/${editingPackage.id}`
        : `${config.API_BASE_URL}/admin/packages`;
      
      const method = editingPackage ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(packageForm)
      });

      const data = await response.json();
      
      if (data.success) {
        alert(data.message);
        fetchPackages();
        resetPackageForm();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Error saving package:', error);
      alert('Failed to save package');
    }
  };

  const handleEditPackage = (pkg) => {
    setEditingPackage(pkg);
    setPackageForm({
      place_id: pkg.place_id,
      title: pkg.title,
      description: pkg.description || '',
      price: pkg.price,
      duration_days: pkg.duration_days || 1,
      services: pkg.services || '',
      places_included: pkg.places_included || '',
      itinerary: pkg.itinerary || ''
    });
    setShowPackageForm(true);
  };

  const handleDeletePackage = async (id) => {
    if (!window.confirm('Are you sure you want to delete this package?')) {
      return;
    }

    try {
      const response = await fetch(`${config.API_BASE_URL}/admin/packages/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.success) {
        alert(data.message);
        fetchPackages();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Error deleting package:', error);
      alert('Failed to delete package');
    }
  };

  const resetPackageForm = () => {
    setPackageForm({
      place_id: '',
      title: '',
      description: '',
      price: 0,
      duration_days: 1,
      services: '',
      places_included: '',
      itinerary: ''
    });
    setEditingPackage(null);
    setShowPackageForm(false);
  };
  // ===================================
// STEP 2: ADD THESE FUNCTIONS AFTER resetPackageForm()
// Add these before the return statement
// ===================================

// Handle filter changes
const handleFilterChange = (field, value) => {
  setFilters(prev => ({
    ...prev,
    [field]: value
  }));
};

// Handle sorting
const handleSort = (key) => {
  let direction = 'asc';
  if (sortConfig.key === key && sortConfig.direction === 'asc') {
    direction = 'desc';
  }
  setSortConfig({ key, direction });
};

// Clear all filters
const clearFilters = () => {
  setFilters({
    id: '',
    title: '',
    place: '',
    country: '',
    price: '',
    duration: ''
  });
  setSortConfig({ key: null, direction: 'asc' });
};

// Filter and Sort Packages - Main function
const getFilteredAndSortedPackages = () => {
  let filtered = [...packages];

  // Apply filters (Contains logic - partial match)
  if (filters.id) {
    filtered = filtered.filter(pkg => 
      pkg.id.toString().includes(filters.id)
    );
  }

  if (filters.title) {
    filtered = filtered.filter(pkg =>
      pkg.title.toLowerCase().includes(filters.title.toLowerCase())
    );
  }

  if (filters.place) {
    filtered = filtered.filter(pkg =>
      pkg.place_name.toLowerCase().includes(filters.place.toLowerCase())
    );
  }

  if (filters.country) {
    filtered = filtered.filter(pkg =>
      pkg.country_name.toLowerCase().includes(filters.country.toLowerCase())
    );
  }

  // Price filter - Max price (show packages up to ₹X)
  if (filters.price) {
    filtered = filtered.filter(pkg =>
      pkg.price <= parseFloat(filters.price)
    );
  }

  // Duration filter - Max days (show packages up to X days)
  if (filters.duration) {
    filtered = filtered.filter(pkg =>
      pkg.duration_days <= parseInt(filters.duration)
    );
  }

  // Apply sorting
  if (sortConfig.key) {
    filtered.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      // Handle place name sorting
      if (sortConfig.key === 'place') {
        aVal = a.place_name;
        bVal = b.place_name;
      }

      // Handle country name sorting
      if (sortConfig.key === 'country') {
        aVal = a.country_name;
        bVal = b.country_name;
      }

      // Handle duration sorting
      if (sortConfig.key === 'duration') {
        aVal = a.duration_days;
        bVal = b.duration_days;
      }

      // Handle null/undefined values
      if (!aVal) aVal = '';
      if (!bVal) bVal = '';

      // Convert to lowercase for string comparison
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

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
  return (
    <div className="package-manager">
      <div className="section-header">
        <h2>Manage Packages</h2>
        <button className="add-btn" onClick={() => setShowPackageForm(true)}>
          + Add New Package
        </button>
      </div>

      {/* Package Form Modal */}
      {showPackageForm && (
        <div className="modal-overlay" onClick={resetPackageForm}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <h3>{editingPackage ? 'Edit Package' : 'Add New Package'}</h3>
            <form onSubmit={handlePackageSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Place/Destination *</label>
                  <select
                    value={packageForm.place_id}
                    onChange={(e) => setPackageForm({...packageForm, place_id: e.target.value})}
                    required
                  >
                    <option value="">Select Place</option>
                    {places.map(place => (
                      <option key={place.id} value={place.id}>
                        {place.name} ({place.country_name})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Package Title *</label>
                  <input
                    type="text"
                    value={packageForm.title}
                    onChange={(e) => setPackageForm({...packageForm, title: e.target.value})}
                    placeholder="e.g., 5-Day Luxury Tour"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={packageForm.description}
                  onChange={(e) => setPackageForm({...packageForm, description: e.target.value})}
                  rows="3"
                  placeholder="Brief description of the package..."
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Price (₹) *</label>
                  <input
                    type="number"
                    value={packageForm.price}
                    onChange={(e) => setPackageForm({...packageForm, price: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Duration (Days) *</label>
                  <input
                    type="number"
                    min="1"
                    value={packageForm.duration_days}
                    onChange={(e) => setPackageForm({...packageForm, duration_days: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Services Included</label>
                <textarea
                  value={packageForm.services}
                  onChange={(e) => setPackageForm({...packageForm, services: e.target.value})}
                  rows="3"
                  placeholder="Hotel, Transport, Guide, etc. (separate by commas or newlines)"
                />
              </div>

              <div className="form-group">
                <label>Places Included</label>
                <textarea
                  value={packageForm.places_included}
                  onChange={(e) => setPackageForm({...packageForm, places_included: e.target.value})}
                  rows="3"
                  placeholder="List of places covered in this package..."
                />
              </div>

              <div className="form-group">
                <label>Itinerary</label>
                <textarea
                  value={packageForm.itinerary}
                  onChange={(e) => setPackageForm({...packageForm, itinerary: e.target.value})}
                  rows="4"
                  placeholder="Day-wise itinerary details..."
                />
              </div>

              <div className="form-actions">
                <button type="button" onClick={resetPackageForm} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  {editingPackage ? 'Update Package' : 'Add Package'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Packages Table */}
      {/* ===================================
    STEP 3: REPLACE THE ENTIRE SECTION AFTER showPackageForm MODAL
    Replace from "Packages Table" comment onwards
    =================================== */}

{/* ✨ ENHANCED Packages Table with Filters & Sorting */}
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
  {(filters.id || filters.title || filters.place || filters.country || 
    filters.price || filters.duration || sortConfig.key) && (
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
                sortConfig.direction === 'asc' ? 
                  <FiChevronUp size={16} /> : <FiChevronDown size={16} />
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

        {/* Title Column */}
        <th>
          <div className="th-content">
            <span>Title</span>
            <button 
              className="sort-btn"
              onClick={() => handleSort('title')}
            >
              {sortConfig.key === 'title' ? (
                sortConfig.direction === 'asc' ? 
                  <FiChevronUp size={16} /> : <FiChevronDown size={16} />
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
                placeholder="Search title..."
                value={filters.title}
                onChange={(e) => handleFilterChange('title', e.target.value)}
                className="filter-input"
              />
            </div>
          )}
        </th>

        {/* Place Column */}
        <th>
          <div className="th-content">
            <span>Place</span>
            <button 
              className="sort-btn"
              onClick={() => handleSort('place')}
            >
              {sortConfig.key === 'place' ? (
                sortConfig.direction === 'asc' ? 
                  <FiChevronUp size={16} /> : <FiChevronDown size={16} />
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
                placeholder="Search place..."
                value={filters.place}
                onChange={(e) => handleFilterChange('place', e.target.value)}
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
                sortConfig.direction === 'asc' ? 
                  <FiChevronUp size={16} /> : <FiChevronDown size={16} />
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
                placeholder="Search country..."
                value={filters.country}
                onChange={(e) => handleFilterChange('country', e.target.value)}
                className="filter-input"
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
                sortConfig.direction === 'asc' ? 
                  <FiChevronUp size={16} /> : <FiChevronDown size={16} />
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
                sortConfig.direction === 'asc' ? 
                  <FiChevronUp size={16} /> : <FiChevronDown size={16} />
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
      {getFilteredAndSortedPackages().map(pkg => (
        <tr key={pkg.id}>
          <td>{pkg.id}</td>
          <td>{pkg.title}</td>
          <td>{pkg.place_name}</td>
          <td>{pkg.country_name}</td>
          <td>₹{pkg.price.toLocaleString()}</td>
          <td>{pkg.duration_days} days</td>
          <td className="action-buttons">
            {/* ✨ Icon Buttons instead of text buttons */}
            <button 
              className="icon-btn edit-icon-btn"
              onClick={() => handleEditPackage(pkg)}
              title="Edit Package"
            >
              <FiEdit2 size={16} />
            </button>
            <button 
              className="icon-btn delete-icon-btn"
              onClick={() => handleDeletePackage(pkg.id)}
              title="Delete Package"
            >
              <FiTrash2 size={16} />
            </button>
          </td>
        </tr>
      ))}
      
      {/* Empty State */}
      {getFilteredAndSortedPackages().length === 0 && (
        <tr>
          <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
            No packages found matching your filters
          </td>
        </tr>
      )}
    </tbody>
  </table>
</div>
    </div>
  );
};

export default PackageManager;
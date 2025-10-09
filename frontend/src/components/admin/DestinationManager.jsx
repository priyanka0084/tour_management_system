import React, { useState, useEffect } from 'react';
import config from '../../config';

const DestinationManager = () => {
  const [countries, setCountries] = useState([]);
  const [places, setPlaces] = useState([]);
  const [showCountryForm, setShowCountryForm] = useState(false);
  const [showPlaceForm, setShowPlaceForm] = useState(false);
  const [editingCountry, setEditingCountry] = useState(null);
  const [editingPlace, setEditingPlace] = useState(null);
  const [activeView, setActiveView] = useState('places'); // 'countries' or 'places'

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
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Country</th>
                  <th>Rating</th>
                  <th>Price</th>
                  <th>Duration</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {places.map(place => (
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
                        className="edit-btn"
                        onClick={() => handleEditPlace(place)}
                      >
                        Edit
                      </button>
                      <button 
                        className="delete-btn"
                        onClick={() => handleDeletePlace(place.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Countries View */}
      {activeView === 'countries' && (
        <div className="countries-section">
          <div className="section-header">
            <h2>Manage Countries</h2>
            <button className="add-btn" onClick={() => setShowCountryForm(true)}>
              + Add New Country
            </button>
          </div>

          {/* Country Form Modal */}
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

          {/* Countries Table */}
          <div className="data-table">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Code</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {countries.map(country => (
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
                    <td>{country.description?.substring(0, 50)}...</td>
                    <td className="action-buttons">
                      <button 
                        className="edit-btn"
                        onClick={() => handleEditCountry(country)}
                      >
                        Edit
                      </button>
                      <button 
                        className="delete-btn"
                        onClick={() => handleDeleteCountry(country.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DestinationManager;
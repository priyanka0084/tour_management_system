import React, { useState, useEffect } from 'react';
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
      <div className="data-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Place</th>
              <th>Country</th>
              <th>Price</th>
              <th>Duration</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {packages.map(pkg => (
              <tr key={pkg.id}>
                <td>{pkg.id}</td>
                <td>{pkg.title}</td>
                <td>{pkg.place_name}</td>
                <td>{pkg.country_name}</td>
                <td>₹{pkg.price}</td>
                <td>{pkg.duration_days} days</td>
                <td className="action-buttons">
                  <button 
                    className="edit-btn"
                    onClick={() => handleEditPackage(pkg)}
                  >
                    Edit
                  </button>
                  <button 
                    className="delete-btn"
                    onClick={() => handleDeletePackage(pkg.id)}
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
  );
};

export default PackageManager;
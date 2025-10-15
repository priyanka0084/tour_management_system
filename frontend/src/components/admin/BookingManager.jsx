import React, { useState, useEffect } from 'react';
import { 
  FiCheckCircle,  // Accept booking icon
  FiTrash2,       // Delete icon
  FiSearch,       // Search icon
  FiFilter,       // Filter toggle icon
  FiChevronUp,    // Sort up icon
  FiChevronDown,  // Sort down icon
  FiX             // Clear filters icon
} from 'react-icons/fi';
import config from '../../config';

const BookingManager = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'confirmed', 'paid'
  const [filters, setFilters] = useState({
    id: '',
    customer_name: '',
    email: '',
    phone: '',
    destination: '',
    status_filter: 'all',       // Column dropdown filter
    tour_date_from: '',         // Tour date range start
    tour_date_to: '',           // Tour date range end
    booking_date_from: '',      // Booking date range start
    booking_date_to: ''         // Booking date range end
  });

  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc'
  });

  const [showFilters, setShowFilters] = useState(true);
  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${config.API_BASE_URL}/admin/bookings`);
      const data = await response.json();
      if (data.success) {
        setBookings(data.bookings);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      alert('Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptBooking = async (id) => {
    if (!window.confirm('Accept this booking?')) return;

    try {
      const response = await fetch(`${config.API_BASE_URL}/admin/bookings/${id}/accept`, {
        method: 'PUT'
      });

      const data = await response.json();
      
      if (data.success) {
        alert(data.message);
        fetchBookings();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Error accepting booking:', error);
      alert('Failed to accept booking');
    }
  };

  const handleDeleteBooking = async (id) => {
    if (!window.confirm('Are you sure you want to delete this booking?')) return;

    try {
      const response = await fetch(`${config.API_BASE_URL}/admin/bookings/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.success) {
        alert(data.message);
        fetchBookings();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Error deleting booking:', error);
      alert('Failed to delete booking');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const styles = {
      'Pending': { bg: '#fff3cd', color: '#856404' },
      'Confirmed': { bg: '#d4edda', color: '#155724' },
      'Paid': { bg: '#d1ecf1', color: '#0c5460' },
      'Cancelled': { bg: '#f8d7da', color: '#721c24' }
    };

    const style = styles[status] || styles['Pending'];

    return (
      <span style={{
        padding: '5px 12px',
        borderRadius: '15px',
        fontSize: '12px',
        fontWeight: '600',
        backgroundColor: style.bg,
        color: style.color
      }}>
        {status || 'Pending'}
      </span>
    );
  };
  // ===================================
// STEP 2: ADD THESE FUNCTIONS AFTER getStatusBadge()
// Add these before the existing filteredBookings logic
// ===================================
// ===================================
// STEP 2: ADD THESE FUNCTIONS AFTER getStatusBadge()
// Add these before the existing filteredBookings logic
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

// Clear all column filters
const clearFilters = () => {
  setFilters({
    id: '',
    customer_name: '',
    email: '',
    phone: '',
    destination: '',
    status_filter: 'all',
    tour_date_from: '',
    tour_date_to: '',
    booking_date_from: '',
    booking_date_to: ''
  });
  setSortConfig({ key: null, direction: 'asc' });
};

// Enhanced filter and sort function
const getFilteredAndSortedBookings = () => {
  let filtered = [...bookings];

  // Apply top filter buttons (All/Pending/Confirmed)
  if (filter === 'pending') {
    filtered = filtered.filter(b => !b.payment_status || b.payment_status.toLowerCase() === 'pending');
  } else if (filter === 'confirmed') {
    filtered = filtered.filter(b => b.payment_status && (b.payment_status.toLowerCase() === 'confirmed' || b.payment_status.toLowerCase() === 'success'));
  } else if (filter === 'paid') {
    filtered = filtered.filter(b => b.payment_status && b.payment_status.toLowerCase() === 'paid');
  }

  // Apply column filters
  if (filters.id) {
    filtered = filtered.filter(booking => 
      booking.id.toString().includes(filters.id)
    );
  }

  if (filters.customer_name) {
    filtered = filtered.filter(booking => {
      const fullName = `${booking.first_name} ${booking.last_name}`.toLowerCase();
      return fullName.includes(filters.customer_name.toLowerCase());
    });
  }

  if (filters.email) {
    filtered = filtered.filter(booking =>
      booking.email.toLowerCase().includes(filters.email.toLowerCase())
    );
  }

  if (filters.phone) {
    filtered = filtered.filter(booking =>
      booking.phone.includes(filters.phone)
    );
  }

  if (filters.destination) {
    filtered = filtered.filter(booking =>
      booking.tour_destination.toLowerCase().includes(filters.destination.toLowerCase())
    );
  }

  // Status column dropdown filter
  if (filters.status_filter !== 'all') {
    filtered = filtered.filter(booking => {
      const status = booking.payment_status || 'Pending';
      return status.toLowerCase() === filters.status_filter.toLowerCase();
    });
  }

  // Tour Date range filter
  if (filters.tour_date_from) {
    const fromDate = new Date(filters.tour_date_from);
    filtered = filtered.filter(booking => {
      const tourDate = new Date(booking.tour_date);
      return tourDate >= fromDate;
    });
  }

  if (filters.tour_date_to) {
    const toDate = new Date(filters.tour_date_to);
    toDate.setHours(23, 59, 59, 999);
    filtered = filtered.filter(booking => {
      const tourDate = new Date(booking.tour_date);
      return tourDate <= toDate;
    });
  }

  // Booking Date range filter
  if (filters.booking_date_from) {
    const fromDate = new Date(filters.booking_date_from);
    filtered = filtered.filter(booking => {
      const bookingDate = new Date(booking.booking_date);
      return bookingDate >= fromDate;
    });
  }

  if (filters.booking_date_to) {
    const toDate = new Date(filters.booking_date_to);
    toDate.setHours(23, 59, 59, 999);
    filtered = filtered.filter(booking => {
      const bookingDate = new Date(booking.booking_date);
      return bookingDate <= toDate;
    });
  }

  // Apply sorting
  if (sortConfig.key) {
    filtered.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      // Handle customer name sorting
      if (sortConfig.key === 'customer_name') {
        aVal = `${a.first_name} ${a.last_name}`;
        bVal = `${b.first_name} ${b.last_name}`;
      }

      // Handle date sorting
      if (sortConfig.key === 'tour_date' || sortConfig.key === 'booking_date') {
        aVal = new Date(a[sortConfig.key]);
        bVal = new Date(b[sortConfig.key]);
      }

      // Handle status sorting
      if (sortConfig.key === 'payment_status') {
        aVal = a.payment_status || 'Pending';
        bVal = b.payment_status || 'Pending';
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
  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true;
    if (filter === 'pending') return !booking.payment_status || booking.payment_status === 'Pending';
    if (filter === 'confirmed') return booking.payment_status === 'Confirmed';
    if (filter === 'paid') return booking.payment_status === 'Paid';
    return true;
  });
return (
  <div className="booking-manager">
    <div className="section-header">
      <h2>Bookings Management</h2>
      <button className="add-btn" onClick={fetchBookings}>
        🔄 Refresh
      </button>
    </div>

    {/* ✅ Keep existing filter buttons */}
    <div className="filter-buttons" style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
      <button 
        onClick={() => setFilter('all')}
        style={{
          padding: '10px 20px',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          background: filter === 'all' ? 'linear-gradient(135deg, #667eea, #764ba2)' : '#f0f0f0',
          color: filter === 'all' ? 'white' : '#333',
          fontWeight: '600',
          transition: 'all 0.3s ease'
        }}
      >
        All ({bookings.length})
      </button>
      <button 
        onClick={() => setFilter('pending')}
        style={{
          padding: '10px 20px',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          background: filter === 'pending' ? 'linear-gradient(135deg, #667eea, #764ba2)' : '#f0f0f0',
          color: filter === 'pending' ? 'white' : '#333',
          fontWeight: '600',
          transition: 'all 0.3s ease'
        }}
      >
        Pending ({bookings.filter(b => !b.payment_status || b.payment_status.toLowerCase() === 'pending').length})
      </button>
      <button 
        onClick={() => setFilter('confirmed')}
        style={{
          padding: '10px 20px',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          background: filter === 'confirmed' ? 'linear-gradient(135deg, #667eea, #764ba2)' : '#f0f0f0',
          color: filter === 'confirmed' ? 'white' : '#333',
          fontWeight: '600',
          transition: 'all 0.3s ease'
        }}
      >
        Confirmed ({bookings.filter(b => b.payment_status && (b.payment_status.toLowerCase() === 'confirmed' || b.payment_status.toLowerCase() === 'success')).length})
      </button>
    </div>

    {loading ? (
      <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
    ) : (
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
        {(filters.id || filters.customer_name || filters.email || 
          filters.phone || filters.destination || filters.status_filter !== 'all' || 
          filters.tour_date_from || filters.tour_date_to || 
          filters.booking_date_from || filters.booking_date_to || sortConfig.key) && (
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

              {/* Customer Name Column */}
              <th>
                <div className="th-content">
                  <span>Customer Name</span>
                  <button 
                    className="sort-btn"
                    onClick={() => handleSort('customer_name')}
                  >
                    {sortConfig.key === 'customer_name' ? (
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
                      placeholder="Search name..."
                      value={filters.customer_name}
                      onChange={(e) => handleFilterChange('customer_name', e.target.value)}
                      className="filter-input"
                    />
                  </div>
                )}
              </th>

              {/* Email Column */}
              <th>
                <div className="th-content">
                  <span>Email</span>
                  <button 
                    className="sort-btn"
                    onClick={() => handleSort('email')}
                  >
                    {sortConfig.key === 'email' ? (
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
                      placeholder="Search email..."
                      value={filters.email}
                      onChange={(e) => handleFilterChange('email', e.target.value)}
                      className="filter-input"
                    />
                  </div>
                )}
              </th>

              {/* Phone Column */}
              <th>
                <div className="th-content">
                  <span>Phone</span>
                  <button 
                    className="sort-btn"
                    onClick={() => handleSort('phone')}
                  >
                    {sortConfig.key === 'phone' ? (
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
                      placeholder="Search phone..."
                      value={filters.phone}
                      onChange={(e) => handleFilterChange('phone', e.target.value)}
                      className="filter-input"
                    />
                  </div>
                )}
              </th>

              {/* Destination Column */}
              <th>
                <div className="th-content">
                  <span>Destination</span>
                  <button 
                    className="sort-btn"
                    onClick={() => handleSort('tour_destination')}
                  >
                    {sortConfig.key === 'tour_destination' ? (
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
                      placeholder="Search destination..."
                      value={filters.destination}
                      onChange={(e) => handleFilterChange('destination', e.target.value)}
                      className="filter-input"
                    />
                  </div>
                )}
              </th>

              {/* Tour Date Column */}
              <th>
                <div className="th-content">
                  <span>Tour Date</span>
                  <button 
                    className="sort-btn"
                    onClick={() => handleSort('tour_date')}
                  >
                    {sortConfig.key === 'tour_date' ? (
                      sortConfig.direction === 'asc' ? 
                        <FiChevronUp size={16} /> : <FiChevronDown size={16} />
                    ) : (
                      <FiChevronDown size={16} className="sort-icon-default" />
                    )}
                  </button>
                </div>
                {showFilters && (
                  <div className="filter-input-wrapper" style={{ display: 'flex', gap: '5px', flexDirection: 'column' }}>
                    <input
                      type="date"
                      placeholder="From date"
                      value={filters.tour_date_from}
                      onChange={(e) => handleFilterChange('tour_date_from', e.target.value)}
                      className="filter-input"
                      style={{ fontSize: '12px', padding: '6px' }}
                    />
                    <input
                      type="date"
                      placeholder="To date"
                      value={filters.tour_date_to}
                      onChange={(e) => handleFilterChange('tour_date_to', e.target.value)}
                      className="filter-input"
                      style={{ fontSize: '12px', padding: '6px' }}
                    />
                  </div>
                )}
              </th>

              {/* Booking Date Column */}
              <th>
                <div className="th-content">
                  <span>Booking Date</span>
                  <button 
                    className="sort-btn"
                    onClick={() => handleSort('booking_date')}
                  >
                    {sortConfig.key === 'booking_date' ? (
                      sortConfig.direction === 'asc' ? 
                        <FiChevronUp size={16} /> : <FiChevronDown size={16} />
                    ) : (
                      <FiChevronDown size={16} className="sort-icon-default" />
                    )}
                  </button>
                </div>
                {showFilters && (
                  <div className="filter-input-wrapper" style={{ display: 'flex', gap: '5px', flexDirection: 'column' }}>
                    <input
                      type="date"
                      placeholder="From date"
                      value={filters.booking_date_from}
                      onChange={(e) => handleFilterChange('booking_date_from', e.target.value)}
                      className="filter-input"
                      style={{ fontSize: '12px', padding: '6px' }}
                    />
                    <input
                      type="date"
                      placeholder="To date"
                      value={filters.booking_date_to}
                      onChange={(e) => handleFilterChange('booking_date_to', e.target.value)}
                      className="filter-input"
                      style={{ fontSize: '12px', padding: '6px' }}
                    />
                  </div>
                )}
              </th>

              {/* Status Column */}
              <th>
                <div className="th-content">
                  <span>Status</span>
                  <button 
                    className="sort-btn"
                    onClick={() => handleSort('payment_status')}
                  >
                    {sortConfig.key === 'payment_status' ? (
                      sortConfig.direction === 'asc' ? 
                        <FiChevronUp size={16} /> : <FiChevronDown size={16} />
                    ) : (
                      <FiChevronDown size={16} className="sort-icon-default" />
                    )}
                  </button>
                </div>
                {showFilters && (
                  <div className="filter-input-wrapper">
                    <select
                      value={filters.status_filter}
                      onChange={(e) => handleFilterChange('status_filter', e.target.value)}
                      className="filter-select"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="paid">Paid</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
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
            {getFilteredAndSortedBookings().length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '40px' }}>
                  No bookings found matching your filters
                </td>
              </tr>
            ) : (
              getFilteredAndSortedBookings().map(booking => (
                <tr key={booking.id}>
                  <td>{booking.id}</td>
                  <td>{booking.first_name} {booking.last_name}</td>
                  <td>{booking.email}</td>
                  <td>{booking.phone}</td>
                  <td>{booking.tour_destination}</td>
                  <td>{new Date(booking.tour_date).toLocaleDateString('en-IN')}</td>
                  <td>{formatDate(booking.booking_date)}</td>
                  <td>{getStatusBadge(booking.payment_status)}</td>
                  <td className="action-buttons">
                    {/* ✨ Icon Buttons - Beautiful Actions */}
                    {(!booking.payment_status || booking.payment_status.toLowerCase() === 'pending') && (
                      <button 
                        className="icon-btn"
                        onClick={() => handleAcceptBooking(booking.id)}
                        title="Accept Booking"
                        style={{
                          background: 'rgba(40, 167, 69, 0.2)',
                          color: '#28a745',
                          boxShadow: '0 4px 15px rgba(40, 167, 69, 0.3)'
                        }}
                      >
                        <FiCheckCircle size={16} />
                      </button>
                    )}
                    
                    <button 
                      className="icon-btn delete-icon-btn"
                      onClick={() => handleDeleteBooking(booking.id)}
                      title="Delete Booking"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    )}
  </div>
);
};

export default BookingManager;
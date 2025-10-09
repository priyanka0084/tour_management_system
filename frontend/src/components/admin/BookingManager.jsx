import React, { useState, useEffect } from 'react';
import config from '../../config';

const BookingManager = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'confirmed', 'paid'

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

      {/* Filter Buttons */}
      <div className="filter-buttons" style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button 
          onClick={() => setFilter('all')}
          style={{
            padding: '8px 16px',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            background: filter === 'all' ? '#667eea' : '#f0f0f0',
            color: filter === 'all' ? 'white' : '#333',
            fontWeight: '500'
          }}
        >
          All ({bookings.length})
        </button>
        <button 
          onClick={() => setFilter('pending')}
          style={{
            padding: '8px 16px',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            background: filter === 'pending' ? '#667eea' : '#f0f0f0',
            color: filter === 'pending' ? 'white' : '#333',
            fontWeight: '500'
          }}
        >
          Pending ({bookings.filter(b => !b.payment_status || b.payment_status === 'Pending').length})
        </button>
        <button 
          onClick={() => setFilter('confirmed')}
          style={{
            padding: '8px 16px',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            background: filter === 'confirmed' ? '#667eea' : '#f0f0f0',
            color: filter === 'confirmed' ? 'white' : '#333',
            fontWeight: '500'
          }}
        >
          Confirmed ({bookings.filter(b => b.payment_status === 'Confirmed').length})
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
      ) : (
        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Customer Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Destination</th>
                <th>Tour Date</th>
                <th>Booking Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '40px' }}>
                    No bookings found
                  </td>
                </tr>
              ) : (
                filteredBookings.map(booking => (
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
                      {(!booking.payment_status || booking.payment_status === 'Pending') && (
                        <button 
                          className="edit-btn"
                          onClick={() => handleAcceptBooking(booking.id)}
                          style={{ background: '#28a745' }}
                        >
                          Accept
                        </button>
                      )}
                      <button 
                        className="delete-btn"
                        onClick={() => handleDeleteBooking(booking.id)}
                      >
                        Delete
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
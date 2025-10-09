import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import config from '../config';
import '../styles/BookingConfirmation.css';

const BookingConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const printRef = useRef();

  const [bookingData, setBookingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(10);
  const [autoRedirect, setAutoRedirect] = useState(true);
  const [emailSending, setEmailSending] = useState(false);
  const [emailStatus, setEmailStatus] = useState('');

  // Get booking ID from route state or URL
  const bookingId = location.state?.bookingId;
  const transactionId = location.state?.transactionId;

  useEffect(() => {
    if (!bookingId) {
      navigate('/', { 
        state: { error: 'No booking information found. Please make a booking first.' } 
      });
      return;
    }

    fetchBookingDetails();
  }, [bookingId]);

  // Auto-redirect countdown
  useEffect(() => {
    if (!autoRedirect || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          if (user) {
  navigate('/userdashboard');
} else {
  navigate('/login', { state: { from: '/booking-confirmation' } });
}
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRedirect, countdown, navigate]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${config.API_BASE_URL}/bookingpayment/${bookingId}/complete-details`);
      const data = await response.json();

      if (data.success) {
        setBookingData(data);
      } else {
        setError(data.error || 'Failed to load booking details');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Print functionality
  const handlePrint = () => {
  window.print();
};

  // PDF Download functionality
  // Simplified PDF Download Function - Replace in BookingConfirmation.jsx
// This version doesn't use autoTable - just simple text

const handleDownloadPDF = () => {
  if (!bookingData) {
    alert('No booking data available');
    return;
  }

  try {
    const { booking, billing, passengers } = bookingData;
    const doc = new jsPDF();

    // Add content line by line (no autoTable needed!)
    let y = 20; // Starting Y position

    // Title
    doc.setFontSize(24);
    doc.setTextColor(255, 107, 107);
    doc.text('🎉 Booking Confirmed!', 105, y, { align: 'center' });
    y += 15;

    // Success Message
    doc.setFontSize(12);
    doc.setTextColor(0, 150, 0);
    doc.text('✅ Payment Successful!', 105, y, { align: 'center' });
    y += 20;

    // Transaction Info
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`Booking ID: #${booking.id}`, 20, y);
    y += 8;
    doc.text(`Transaction ID: ${transactionId || booking.transaction_id}`, 20, y);
    y += 15;

    // Booking Details Header
    doc.setFontSize(14);
    doc.setTextColor(255, 107, 107);
    doc.text('Booking Details', 20, y);
    y += 10;

    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`Name: ${booking.name}`, 20, y);
    y += 8;
    doc.text(`Email: ${booking.email}`, 20, y);
    y += 8;
    doc.text(`Phone: ${booking.phone}`, 20, y);
    y += 8;
    doc.text(`Destination: ${booking.tour_destination}`, 20, y);
    y += 8;
    doc.text(`Travel Date: ${formatDate(booking.tour_date)}`, 20, y);
    y += 8;
    doc.text(`Departure: ${booking.departure || 'N/A'}`, 20, y);
    y += 8;
    
    const totalPass = (booking.adults || 0) + (booking.children || 0) + (booking.infants || 0);
    doc.text(`Total Passengers: ${totalPass}`, 20, y);
    y += 6;
    doc.text(`  - Adults: ${booking.adults || 0}`, 25, y);
    y += 6;
    doc.text(`  - Children: ${booking.children || 0}`, 25, y);
    y += 6;
    doc.text(`  - Infants: ${booking.infants || 0}`, 25, y);
    y += 15;

    // Passenger Details (if any)
    if (passengers && passengers.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(255, 107, 107);
      doc.text('Passenger Details', 20, y);
      y += 10;

      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      passengers.forEach((p, i) => {
        doc.text(`${i + 1}. ${p.first_name} ${p.last_name} - ${p.gender} - DOB: ${formatDate(p.dob)}`, 20, y);
        y += 8;
        if (y > 270) { // Add new page if needed
          doc.addPage();
          y = 20;
        }
      });
      y += 10;
    }

    // Billing Address (if any)
    if (billing) {
      if (y > 240) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(14);
      doc.setTextColor(255, 107, 107);
      doc.text('Billing Address', 20, y);
      y += 10;

      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text(`${billing.first_name} ${billing.last_name}`, 20, y);
      y += 8;
      if (billing.company_name) {
        doc.text(billing.company_name, 20, y);
        y += 8;
      }
      doc.text(billing.street_address, 20, y);
      y += 8;
      if (billing.apartment) {
        doc.text(billing.apartment, 20, y);
        y += 8;
      }
      doc.text(`${billing.city}, ${billing.state} - ${billing.pin_code}`, 20, y);
      y += 8;
      doc.text(billing.country, 20, y);
      y += 15;
    }

    // Payment Summary
    if (y > 220) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(14);
    doc.setTextColor(255, 107, 107);
    doc.text('Payment Summary', 20, y);
    y += 10;

    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`Payment Method: ${booking.payment_method}`, 20, y);
    y += 8;
    doc.text(`Amount Paid: ₹${parseFloat(booking.amount).toFixed(2)}`, 20, y);
    y += 8;
    doc.text(`Status: ✅ Success`, 20, y);
    y += 8;
    doc.text(`Date: ${formatDateTime(booking.booking_date)}`, 20, y);
    y += 20;

    // Footer
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.text('Thank you for choosing ExploreEase! 🌍✈️', 105, 280, { align: 'center' });
      doc.text('📧 support@exploreease.com | 📞 +91 98765 43210', 105, 287, { align: 'center' });
    }

    // Save PDF
    doc.save(`Booking_Confirmation_${bookingId}.pdf`);
    console.log('✅ PDF downloaded successfully');
    
  } catch (error) {
    console.error('❌ PDF generation error:', error);
    alert('Failed to generate PDF: ' + error.message);
  }
};

  // Resend confirmation email
  const handleResendEmail = async () => {
  setEmailSending(true);
  setEmailStatus('');

  try {
    const response = await fetch(`${config.API_BASE_URL}/bookingpayment/${bookingId}/resend-email`, {
      method: 'POST'
    });

    const data = await response.json();

    if (data.success) {
      setEmailStatus('✅ Email sent successfully!');
    } else {
      setEmailStatus('❌ Failed: ' + data.error);
    }
    setTimeout(() => setEmailStatus(''), 5000);
  } catch (error) {
    setEmailStatus('❌ Error: ' + error.message);
  } finally {
    setEmailSending(false);
  }
};

  if (loading) {
    return (
      <div className="confirmation-loading">
        <div className="loader"></div>
        <p>Loading booking details...</p>
      </div>
    );
  }

  if (error || !bookingData) {
    return (
      <div className="confirmation-error">
        <div className="error-icon">❌</div>
        <h2>Oops! Something went wrong</h2>
        <p>{error || 'Unable to load booking details'}</p>
        <button onClick={() => navigate('/')} className="btn-home">
          Go to Home
        </button>
      </div>
    );
  }

  const { booking, billing, passengers } = bookingData;
  const totalPassengers = (booking.adults || 0) + (booking.children || 0) + (booking.infants || 0);

  return (
    <div className="confirmation-page">
      {/* Chatbot Placeholder */}
      <div className="chatbot-placeholder">
        <button className="chatbot-btn" title="Chat with us">
          💬
        </button>
      </div>

      {/* Animated Success Header */}
      <div className="confirmation-header">
        <div className="success-animation">
          <div className="checkmark-circle">
            <div className="checkmark"></div>
          </div>
        </div>
        <h1 className="success-title">🎉 Booking Confirmed!</h1>
        <p className="success-subtitle">Your adventure awaits! We've sent confirmation details to {booking.email}</p>
        <div className="transaction-badge">
          <span>Transaction ID: {transactionId || booking.transaction_id}</span>
        </div>
      </div>

      {/* Auto-redirect notification */}
      {autoRedirect && countdown > 0 && (
        <div className="redirect-notice">
          <p>Redirecting to dashboard in {countdown} seconds...</p>
          <button onClick={() => setAutoRedirect(false)} className="btn-stay">
            Stay on this page
          </button>
        </div>
      )}

      {/* Printable Content */}
      <div className="confirmation-content" ref={printRef}>
        
        {/* Booking Summary Card */}
        <div className="summary-card">
          <h2>📋 Booking Summary</h2>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="label">Booking ID</span>
              <span className="value">#{booking.id}</span>
            </div>
            <div className="summary-item">
              <span className="label">Name</span>
              <span className="value">{booking.name}</span>
            </div>
            <div className="summary-item">
              <span className="label">Email</span>
              <span className="value">{booking.email}</span>
            </div>
            <div className="summary-item">
              <span className="label">Phone</span>
              <span className="value">{booking.phone}</span>
            </div>
            <div className="summary-item">
              <span className="label">Destination</span>
              <span className="value">🏝️ {booking.tour_destination}</span>
            </div>
            <div className="summary-item">
              <span className="label">Travel Date</span>
              <span className="value">📅 {formatDate(booking.tour_date)}</span>
            </div>
            <div className="summary-item">
              <span className="label">Departure</span>
              <span className="value">✈️ {booking.departure || 'N/A'}</span>
            </div>
            <div className="summary-item">
              <span className="label">Total Passengers</span>
              <span className="value">👥 {totalPassengers}</span>
            </div>
          </div>

          <div className="passenger-breakdown">
            <span>Adults: {booking.adults || 0}</span>
            <span>Children: {booking.children || 0}</span>
            <span>Infants: {booking.infants || 0}</span>
          </div>

          {booking.special_requests && (
            <div className="special-requests">
              <strong>Special Requests:</strong>
              <p>{booking.special_requests}</p>
            </div>
          )}
        </div>

        {/* Passenger Details Card */}
        {passengers && passengers.length > 0 && (
          <div className="passengers-card">
            <h2>👥 Passenger Details</h2>
            <div className="passengers-list">
              {passengers.map((passenger, index) => (
                <div key={index} className="passenger-item">
                  <div className="passenger-number">{index + 1}</div>
                  <div className="passenger-info">
                    <h4>{passenger.first_name} {passenger.last_name}</h4>
                    <p>Gender: {passenger.gender} | DOB: {formatDate(passenger.dob)}</p>
                    {passenger.email && <p>Email: {passenger.email}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Billing Details Card */}
        {billing && (
          <div className="billing-card">
            <h2>💳 Billing Information</h2>
            <div className="billing-grid">
              <div className="billing-section">
                <h3>Billing Address</h3>
                <p>{billing.first_name} {billing.last_name}</p>
                {billing.company_name && <p>{billing.company_name}</p>}
                <p>{billing.street_address}</p>
                {billing.apartment && <p>{billing.apartment}</p>}
                <p>{billing.city}, {billing.state} - {billing.pin_code}</p>
                <p>{billing.country}</p>
                <p>📞 {billing.phone}</p>
                <p>📧 {billing.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Payment Summary Card */}
        <div className="payment-card">
          <h2>💰 Payment Summary</h2>
          <div className="payment-details">
            <div className="payment-row">
              <span>Payment Method:</span>
              <span>{booking.payment_method}</span>
            </div>
            <div className="payment-row">
              <span>Transaction ID:</span>
              <span className="transaction-id">{transactionId || booking.transaction_id}</span>
            </div>
            <div className="payment-row">
              <span>Payment Status:</span>
              <span className="status-badge success">✅ Success</span>
            </div>
            <div className="payment-row total">
              <span>Amount Paid:</span>
              <span className="amount">₹{parseFloat(booking.amount).toFixed(2)}</span>
            </div>
            <div className="payment-row">
              <span>Payment Date:</span>
              <span>{formatDateTime(booking.booking_date)}</span>
            </div>
          </div>
        </div>

        {/* What's Next Section */}
        <div className="next-steps-card">
          <h2>📝 What's Next?</h2>
          <div className="steps-timeline">
            <div className="step">
              <div className="step-icon">📧</div>
              <div className="step-content">
                <h3>Check Your Email</h3>
                <p>We've sent a detailed confirmation to {booking.email}</p>
              </div>
            </div>
            <div className="step">
              <div className="step-icon">📄</div>
              <div className="step-content">
                <h3>Prepare Documents</h3>
                <p>Ensure your passport and visa are ready for travel</p>
              </div>
            </div>
            <div className="step">
              <div className="step-icon">🎒</div>
              <div className="step-content">
                <h3>Pack Your Bags</h3>
                <p>Start preparing for your amazing journey!</p>
              </div>
            </div>
            <div className="step">
              <div className="step-icon">📞</div>
              <div className="step-content">
                <h3>Contact Support</h3>
                <p>Reach us 24/7 for any queries or changes</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <button onClick={handleDownloadPDF} className="btn btn-download">
          📥 Download PDF
        </button>
        <button onClick={handlePrint} className="btn btn-print">
          🖨️ Print Confirmation
        </button>
        <button 
          onClick={handleResendEmail} 
          className="btn btn-email"
          disabled={emailSending}
        >
          {emailSending ? '📧 Sending...' : '📧 Resend Email'}
        </button>
        <button onClick={() => navigate('/')} className="btn btn-home">
          🏠 Back to Home
        </button>
        <button onClick={() => navigate('/userdashboard')} className="btn btn-dashboard">
          📊 View Dashboard
        </button>
      </div>

      {emailStatus && (
        <div className={`email-status ${emailStatus.includes('✅') ? 'success' : 'error'}`}>
          {emailStatus}
        </div>
      )}

      {/* Support Section */}
      <div className="support-card">
        <h3>Need Help?</h3>
        <p>Our support team is here 24/7</p>
        <div className="support-contacts">
          <span>📧 support@exploreease.com</span>
          <span>📞 +91 98765 43210</span>
        </div>
      </div>

      {/* Footer */}
      <div className="confirmation-footer">
        <p>Thank you for choosing ExploreEase! 🌍✈️</p>
        <p>© {new Date().getFullYear()} ExploreEase. All rights reserved.</p>
      </div>
    </div>
  );
};

export default BookingConfirmation;
// BookingPayment.jsx
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import "../styles/BookingPayment.css";
import DestinationSearch from "../components/DestinationSearch";
import config from '../config';
/*
const [insights, setInsights] = useState("");
const [itinerary, setItinerary] = useState("");
const [loadingInsights, setLoadingInsights] = useState(false);
const [loadingItinerary, setLoadingItinerary] = useState(false);
const PRICE_PER_PASSENGER = 100; // adjust if different
*/

const BookingPayment = () => {
  // ---------------- Booking Form State ----------------
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    tour_destination: "",
    tour_date: "",
    departure: "",
    adults: 1,
    children: 0,
    infants: 0,
    special_requests: "",
    billing_first_name: "",
    billing_last_name: "",
    billing_company: "",
    billing_country: "India",
    billing_address: "",
    billing_apartment: "",
    billing_city: "",
    billing_state: "Tamil Nadu",
    billing_pin: "",
    billing_phone: "",
    billing_email: "",
    billing_notes: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [bookingId, setBookingId] = useState(null);
  const [currentView, setCurrentView] = useState("booking"); // 'booking', 'payment', 'viewBookings'

  // ---------------- Payment / Billing State ----------------
  const [paymentData, setPaymentData] = useState({
    cardNumber: "",
    expiry: "",
    cvv: "",
    method: "Credit Card",
  });
  const [billing, setBilling] = useState({
    first_name: "",
    last_name: "",
    company_name: "",
    country: "India",
    street_address: "",
    apartment: "",
    city: "",
    state: "Tamil Nadu",
    pin_code: "",
    phone: "",
    email: "",
    order_notes: "",
  });
  const [paymentStatus, setPaymentStatus] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // ---------------- Passengers State ----------------
  const [passengers, setPassengers] = useState([]); // array of {first_name,last_name,email,dob,gender}

  // ---------------- Booking List State ----------------
  const [bookings, setBookings] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState("");

  // ---------------- Helpers ----------------
  const parseIntSafe = (v) => {
    const n = parseInt(v, 10);
    return Number.isNaN(n) ? 0 : n;
  };

  const totalPassengers =
    parseIntSafe(formData.adults) +
    parseIntSafe(formData.children) +
    parseIntSafe(formData.infants);

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  const formatDateTime = (dateString) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    
  // ---------------- Sync passengers when moving to payment or counts change ----------------
  useEffect(() => {
    // Only fetch if the modal is open and we have a destination
    if (isInsightsModalOpen && formData.tour_destination) {
        // Reset previous data
        setItinerary(""); 
        
        const fetchInsights = async () => {
            setLoadingInsights(true);
            try {
                const response = await fetch('/api/gemini/insights', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ destination: formData.tour_destination }),
                });
                const data = await response.json();
                setInsights(data.insights);
            } catch (err) {
                setInsights('Could not load insights. Please try again.');
            } finally {
                setLoadingInsights(false);
            }
        };

        fetchInsights();
    }
}, [isInsightsModalOpen, formData.tour_destination]);


// Add this function to handle itinerary generation
const handleGenerateItinerary = async () => {
    setLoadingItinerary(true);
    try {
        const response = await fetch('/api/gemini/itinerary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ destination: formData.tour_destination }), // You can pass more details like duration if needed
        });
        const data = await response.json();
        setItinerary(data.itinerary); // Expecting HTML content from the backend
    } catch (err) {
        setItinerary('<p>Sorry, the itinerary could not be generated.</p>');
    } finally {
        setLoadingItinerary(false);
    }
};
  useEffect(() => {
    setPassengers((prev) => {
      const total = totalPassengers;
      const next = [...prev];

      // if more needed, push empty passenger objects
      while (next.length < total) {
        next.push({
          first_name: "",
          last_name: "",
          email: "",
          dob: "",
          gender: "",
        });
      }
      // if less needed, slice
      if (next.length > total) {
        return next.slice(0, total);
      }
      return next;
    });
  }, [totalPassengers]);  // recalc when counts change or when view enters payment

  // ---------------- Input handlers ----------------
  const handleInputChange = (e) => {
  const { name, value } = e.target;

  if (name === "phone") {
    // Remove all non-digit characters except "+"
    let cleaned = value.replace(/[^\d+]/g, "");

    // Ensure only one "+" at the start
    if (cleaned.startsWith("+")) {
      cleaned = "+" + cleaned.slice(1).replace(/\+/g, "");
    }

    // Format as +CC XXX XXX XXXX
    const match = cleaned.match(/^(\+\d{1,3})(\d{0,3})(\d{0,3})(\d{0,4})$/);
    if (match) {
      const formatted = [match[1], match[2], match[3], match[4]]
        .filter(Boolean)
        .join(" ");
      setFormData({ ...formData, phone: formatted });
    } else {
      setFormData({ ...formData, phone: cleaned });
    }
  } else {
    setFormData({ ...formData, [name]: value });
  }
};


  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    setPaymentData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBillingChange = (e) => {
    const { name, value } = e.target;
    setBilling((prev) => ({ ...prev, [name]: value }));
  };

  const handlePassengerChange = (index, field, value) => {
    setPassengers((prev) => {
      const copy = [...prev];
      copy[index] = { ...(copy[index] || {}), [field]: value };
      return copy;
    });
  };

  // ---------------- Validation ----------------
  const validateBookingForm = () => {
  const newErrors = {};

  // Name validation
  if (!formData.name.trim()) newErrors.name = "Name is required";

  // Email validation
  if (!formData.email.trim()) {
    newErrors.email = "Email is required";
  } else {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
    if (!emailRegex.test(formData.email)) {
      newErrors.email = "Enter a valid email address";
    }
  }

  // Phone validation (with country code + 10 digits)
  // Phone validation (country code + 10-digit local number)
if (!formData.phone.trim()) {
  newErrors.phone = "Phone is required";
} else {
  // Remove all non-digit characters except "+"
  const digitsOnly = formData.phone.replace(/[^\d+]/g, "");

  // Match + followed by 1–3 country code digits, then 10 local digits
  const phoneRegex = /^\+(\d{1,3})(\d{10})$/;

  if (!phoneRegex.test(digitsOnly)) {
    newErrors.phone = "Enter a valid phone number with country code (1-3 digits) and 10-digit number";
  }
}


  // Tour destination validation
  if (!formData.tour_destination) newErrors.tour_destination = "Select destination";

  // Tour date validation
  if (!formData.tour_date) {
    newErrors.tour_date = "Tour date is required";
  } else {
    const selectedDate = new Date(formData.tour_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) newErrors.tour_date = "Tour date cannot be in the past";
  }

  // Adults validation
  if (parseIntSafe(formData.adults) < 1) newErrors.adults = "At least 1 adult required";

  // Total passengers validation
  if (totalPassengers > 50) newErrors.adults = "Maximum 50 passengers allowed in total";

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};


  const validatePaymentAndPassengers = () => {
    // billing basic checks
    const problems = [];
    if (!billing.first_name.trim()) problems.push("Billing first name required");
    if (!billing.last_name.trim()) problems.push("Billing last name required");
    if (!billing.street_address.trim()) problems.push("Billing street address required");
    if (!billing.city.trim()) problems.push("Billing city required");
    if (!billing.pin_code.trim()) problems.push("Billing PIN code required");
    if (!billing.phone.trim()) problems.push("Billing phone required");
    if (!billing.email.trim()) problems.push("Billing email required");
    // passenger checks
    passengers.forEach((p, idx) => {
      if (!p.first_name || !p.last_name) problems.push(`Passenger ${idx + 1}: first & last name required`);
      if (!p.dob) problems.push(`Passenger ${idx + 1}: date of birth required`);
      if (!p.gender) problems.push(`Passenger ${idx + 1}: gender required`);
    });
    return problems;
  };

  // ---------------- API Calls ----------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateBookingForm()) return;
    setIsLoading(true);
    setSuccessMessage("");
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        tour_destination: formData.tour_destination,
        tour_date: formData.tour_date,
        departure: formData.departure,
        adults: parseIntSafe(formData.adults),
        children: parseIntSafe(formData.children),
        infants: parseIntSafe(formData.infants),
        special_requests: formData.special_requests,
      };

      const res = await fetch(`${config.API_BASE_URL}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      const bookingId = data.bookingId;
      if (data.success && data.bookingId) {
        setSuccessMessage("Booking created. Proceed to payment.");
        setBookingId(data.bookingId);
        // go to payment view
        setCurrentView("payment");
      } else {
        setErrors({ submit: data.error || "Failed to create booking" });
      }
    } catch (err) {
      setErrors({ submit: "Network error. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async (e) => {
  e.preventDefault();

  const problems = validatePaymentAndPassengers();
  if (problems.length > 0) {
    setPaymentStatus("❌ " + problems.join("; "));
    return;
  }

  setIsProcessing(true);
  setPaymentStatus("");

  try {
    const amount = totalPassengers * PRICE_PER_PASSENGER;

    const payload = {
      bookingId,
      amount,
      cardNumber: paymentData.cardNumber,
      expiry: paymentData.expiry,
      cvv: paymentData.cvv,
      method: paymentData.method,
    };

      const res = await fetch(`${config.API_BASE_URL}/bookings/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

    const data = await res.json();

    if (data.success) {
      setPaymentStatus("✅ Payment successful! Transaction ID: " + (data.transaction_id || "N/A"));
      await fetchBookings();
      setTimeout(() => setCurrentView("viewBookings"), 1200);
    } else {
      setPaymentStatus("❌ Payment failed: " + (data.error || "Unknown error"));
    }
  } catch (err) {
    setPaymentStatus("❌ Network error. Try again.");
  } finally {
    setIsProcessing(false);
  }
};

  const fetchBookings = async () => {
    setListLoading(true);
    setListError("");
    try {
      const response = await fetch(`${config.API_BASE_URL}/bookings`);
      const data = await response.json();
      if (data.success) {
        setBookings(data.bookings);
      } else {
        setListError(data.error || "Failed to fetch bookings");
      }
    } catch (error) {
      setListError("Network error. Please try again.");
    } finally {
      setListLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      tour_destination: "",
      tour_date: "",
      departure: "",
      adults: 1,
      children: 0,
      infants: 0,
      special_requests: "",
    });
    setBilling({
      first_name: "",
      last_name: "",
      company_name: "",
      country: "India",
      street_address: "",
      apartment: "",
      city: "",
      state: "Tamil Nadu",
      pin_code: "",
      phone: "",
      email: "",
      order_notes: "",
    });
    setPaymentData({
      cardNumber: "",
      expiry: "",
      cvv: "",
      method: "Credit Card",
    });
    setPassengers([]);
    setErrors({});
    setSuccessMessage("");
    setPaymentStatus("");
    setBookingId(null);
  };

  const location = useLocation();

  useEffect(() => {
    // load bookings on mount
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle pre-filled destination from Packages page
  useEffect(() => {
    if (location.state && location.state.selectedDestination) {
      const { selectedDestination } = location.state;
      // selectedDestination can be string or object
      let destinationName = '';
      if (typeof selectedDestination === 'string') {
        destinationName = selectedDestination;
      } else if (typeof selectedDestination === 'object' && selectedDestination !== null) {
        destinationName = selectedDestination.name || selectedDestination.displayName || '';
      }
      setFormData(prev => ({
        ...prev,
        tour_destination: destinationName
      }));
    }
  }, [location.state]);

  // ---------------- Render ----------------
  return (
    <div className="booking-page">
      <header className="header">
        <div className="header-content">
          <h1 className="site-title">Dream Tours</h1>
          <p className="site-subtitle">Book your perfect adventure today</p>
          <nav>
            <button
              onClick={() => {
                resetForm();
                setCurrentView("booking");
              }}
              className="nav-link"
              style={{ marginRight: "10px" }}
            >
              Book New Tour
            </button>
            <button onClick={() => setCurrentView("viewBookings")} className="nav-link">
              All Bookings
            </button>
          </nav>
        </div>
      </header>

      <main className="main-content">
        {/* Booking Form */}
        {currentView === "booking" && (
          <div className="booking-container">
            <div className="booking-card">
              <h2>Book Your Dream Tour</h2>
              {successMessage && <div className="success-message">{successMessage}</div>}
              {errors.submit && <div className="error-message">{errors.submit}</div>}

              <form onSubmit={handleSubmit} className="booking-form">
                {/* Row 1 */}
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">Full Name </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                    />
                    {errors.name && <span className="error-text">{errors.name}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email Address </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email"
                    />
                    {errors.email && <span className="error-text">{errors.email}</span>}
                  </div>
                </div>

                {/* Row 2 */}
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="phone">Phone Number </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+1 (555) 123-4567"
                    />
                    {errors.phone && <span className="error-text">{errors.phone}</span>}
                  </div>

                  {/* DestinationSearch is expected to update formData.tour_destination */}
                  <div className="form-group">
        <label>Destination & Insights</label>
        <div className="destination-container">
            <DestinationSearch
                formData={formData}
                setFormData={setFormData}
                errors={errors}
                setErrors={setErrors}
            />
            <button
                type="button" // Use type="button" to prevent form submission
                onClick={() => setIsInsightsModalOpen(true)}
                disabled={!formData.tour_destination || isLoading}
                className="gemini-btn"
                title={!formData.tour_destination ? "Please select a destination first" : "Get AI-powered insights"}
            >
                ✨ AI Insights
            </button>
        </div>
        {errors.tour_destination && <span className="error-text">{errors.tour_destination}</span>}
    </div>
                </div>

                {/* Row 3 - Departure + counts (below phone) */}
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="departure">Departure </label>
                    <input
                      type="date"
                      id="departure"
                      name="departure"
                      value={formData.departure}
                      onChange={handleInputChange}
                      placeholder="Enter departure date"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="adults">Adults </label>
                    <input
                      type="number"
                      id="adults"
                      name="adults"
                      min="1"
                      max="50"
                      value={formData.adults}
                      onChange={handleInputChange}
                    />
                    {errors.adults && <span className="error-text">{errors.adults}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="children">Children</label>
                    <input
                      type="number"
                      id="children"
                      name="children"
                      min="0"
                      max="50"
                      value={formData.children}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="infants">Infants</label>
                    <input
                      type="number"
                      id="infants"
                      name="infants"
                      min="0"
                      max="50"
                      value={formData.infants}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {/* Row 4 - Tour date */}
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="tour_date">Tour Date </label>
                    <input
                      type="date"
                      id="tour_date"
                      name="tour_date"
                      value={formData.tour_date}
                      onChange={handleInputChange}
                      min={getTomorrowDate()}
                    />
                    {errors.tour_date && <span className="error-text">{errors.tour_date}</span>}
                  </div>
                </div>

                {/* Special Requests */}
                <div className="form-group full-width">
                  <label htmlFor="special_requests">Special Requests</label>
                  <textarea
                    id="special_requests"
                    name="special_requests"
                    value={formData.special_requests}
                    onChange={handleInputChange}
                    rows="4"
                    placeholder="Any special requirements or requests..."
                  ></textarea>
                </div>

                {/* Summary */}
                <div className="summary-box">
                  <strong>Total Passengers: {totalPassengers}</strong>
                </div>

                <div className="form-submit-container">
                  <button type="submit" className={`submit-btn ${isLoading ? "loading" : ""}`} disabled={isLoading}>
                    {isLoading ? "Booking..." : "Create Booking & Continue to Payment"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Payment Section (billing + attendees + card) */}
        {currentView === "payment" && bookingId && (
          <div className="payment-container">
            <h2>Billing & Attendees</h2>

            <form onSubmit={handlePayment} className="payment-form">
              <h3>Billing Details</h3>

              <div className="form-row">
                <div className="form-group">
                  <label>First name *</label>
                  <input type="text" name="first_name" value={billing.first_name} onChange={handleBillingChange} />
                </div>
                <div className="form-group">
                  <label>Last name *</label>
                  <input type="text" name="last_name" value={billing.last_name} onChange={handleBillingChange} />
                </div>
              </div>

              <div className="form-group">
                <label>Company name (optional)</label>
                <input type="text" name="company_name" value={billing.company_name} onChange={handleBillingChange} />
              </div>

              <div className="form-group">
                <label>Country / Region *</label>
                <select name="country" value={billing.country} onChange={handleBillingChange}>
                  <option>India</option>
                  <option>USA</option>
                  <option>UK</option>
                </select>
              </div>

              <div className="form-group">
                <label>Street address *</label>
                <input
                  type="text"
                  name="street_address"
                  value={billing.street_address}
                  onChange={handleBillingChange}
                  placeholder="House number and street name"
                />
                <input
                  type="text"
                  name="apartment"
                  value={billing.apartment}
                  onChange={handleBillingChange}
                  placeholder="Apartment, suite, unit (optional)"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Town / City *</label>
                  <input type="text" name="city" value={billing.city} onChange={handleBillingChange} />
                </div>
                <div className="form-group">
                  <label>State *</label>
                  <input type="text" name="state" value={billing.state} onChange={handleBillingChange} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>PIN Code *</label>
                  <input type="text" name="pin_code" value={billing.pin_code} onChange={handleBillingChange} />
                </div>
                <div className="form-group">
                  <label>Phone *</label>
                  <input type="tel" name="phone" value={billing.phone} onChange={handleBillingChange} />
                </div>
              </div>

              <div className="form-group">
                <label>Email address *</label>
                <input type="email" name="email" value={billing.email} onChange={handleBillingChange} />
              </div>

              <div className="form-group">
                <label>Additional information</label>
                <textarea name="order_notes" value={billing.order_notes} onChange={handleBillingChange} placeholder="Notes about your order, e.g. special notes for delivery."></textarea>
              </div>

              {/* Attendees info */}
              <h3>Attendees (Passengers) — {totalPassengers}</h3>
              <p style={{ marginBottom: "1rem" }}>
                Please fill attendee details for each passenger (adults, children, infants) in the order they will travel.
              </p>

              {passengers.length === 0 && <div className="info-text">No passengers — check counts on booking page.</div>}

              {passengers.map((p, i) => (
                <div key={i} className="passenger-card">
                  <h4>Passenger {i + 1}</h4>
                  <div className="form-row">
                    <div className="form-group">
                      <label>First Name *</label>
                      <input value={p.first_name} onChange={(e) => handlePassengerChange(i, "first_name", e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Last Name *</label>
                      <input value={p.last_name} onChange={(e) => handlePassengerChange(i, "last_name", e.target.value)} />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Email</label>
                    <input value={p.email} onChange={(e) => handlePassengerChange(i, "email", e.target.value)} />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Date of birth *</label>
                      <input type="date" value={p.dob} onChange={(e) => handlePassengerChange(i, "dob", e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Gender *</label>
                      <select value={p.gender} onChange={(e) => handlePassengerChange(i, "gender", e.target.value)}>
                        <option value="">Select</option>
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}

              {/* Payment Info */}
              <h3>Payment Information</h3>
              <div style={{ marginBottom: "0.8rem" }}>
                <strong>Amount to pay:</strong> ₹{(totalPassengers * PRICE_PER_PASSENGER).toFixed(2)}
              </div>

              <div className="form-group">
                <label>Card Number</label>
                <input type="text" name="cardNumber" value={paymentData.cardNumber} onChange={handlePaymentChange} placeholder="1234 5678 9012 3456" />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Expiry</label>
                  <input type="text" name="expiry" value={paymentData.expiry} onChange={handlePaymentChange} placeholder="MM/YY" />
                </div>
                <div className="form-group">
                  <label>CVV</label>
                  <input type="password" name="cvv" value={paymentData.cvv} onChange={handlePaymentChange} placeholder="123" />
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <button type="submit" disabled={isProcessing} className="submit-btn">
                  {isProcessing ? "Processing..." : `Pay ₹${(totalPassengers * PRICE_PER_PASSENGER).toFixed(2)}`}
                </button>
              </div>

              {paymentStatus && <div style={{ marginTop: 12 }} className="payment-status">{paymentStatus}</div>}
            </form>
          </div>
        )}

        {/* Booking List */}
        {currentView === "viewBookings" && (
          <div className="bookings-container">
            {listLoading ? (
              <div className="loading-message">Loading bookings...</div>
            ) : (
              <>
                <div className="bookings-header">
                  <h2>All Bookings</h2>
                  <p>Total bookings: {bookings.length}</p>
                </div>
                {listError && <div className="error-message">{listError}</div>}
                {bookings.length === 0 ? (
                  <div className="empty-state">
                    <h3>No bookings found</h3>
                    <p>Start by creating your first booking!</p>
                    <button
                      onClick={() => {
                        resetForm();
                        setCurrentView("booking");
                      }}
                      className="cta-button"
                    >
                      Book Your First Tour
                    </button>
                  </div>
                ) : (
                  <div className="bookings-grid">
                    {bookings.map((booking) => (
                      <div key={booking.id} className="booking-item">
                        <div className="booking-header">
                          <h3>{booking.name}</h3>
                          <span className="booking-id">#{booking.id}</span>
                        </div>
                        <div className="booking-details">
                          <div className="detail-row">
                            <span className="label">📧 Email:</span>
                            <span className="value">{booking.email}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">📞 Phone:</span>
                            <span className="value">{booking.phone}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">🏝️ Destination:</span>
                            <span className="value">{booking.tour_destination}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">🚩 Departure:</span>
                            <span className="value">{booking.departure}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">📅 Tour Date:</span>
                            <span className="value date">{formatDate(booking.tour_date)}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">👥 Adults:</span>
                            <span className="value">{booking.adults ?? "-"}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">👶 Children:</span>
                            <span className="value">{booking.children ?? "-"}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">🍼 Infants:</span>
                            <span className="value">{booking.infants ?? "-"}</span>
                          </div>
                          {booking.special_requests && (
                            <div className="detail-row">
                              <span className="label">💭 Special Requests:</span>
                              <span className="value">{booking.special_requests}</span>
                            </div>
                          )}
                          {booking.payment_status && (
                            <div className="detail-row">
                              <span className="label">💳 Payment:</span>
                              <span className="value payment-success">
                                {booking.payment_status} - ${booking.amount}
                              </span>
                            </div>
                          )}
                          <div className="detail-row booking-date">
                            <span className="label">🕐 Booked on:</span>
                            <span className="value">{formatDateTime(booking.booking_date)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default BookingPayment;

// BookingPayment.jsx - CLEANED VERSION (All Bookings Removed)
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/BookingPayment.css";
import DestinationSearch from "../components/DestinationSearch";
import config from '../config';
import Navbar from "../components/common/Navbar";
const PRICE_PER_PASSENGER = 100;

const BookingPayment = () => {
  const navigate = useNavigate();
  
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
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [bookingId, setBookingId] = useState(null);
  const [currentView, setCurrentView] = useState("booking"); // 'booking' or 'payment'

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
  const [passengers, setPassengers] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
const [packagePricing, setPackagePricing] = useState({
  price_adult: 0,
  price_child: 0,
  price_infant: 0
});
const [calculatedAmount, setCalculatedAmount] = useState(0);
const [priceBreakdown, setPriceBreakdown] = useState({
  adults: 0,
  children: 0,
  infants: 0,
  total: 0
});
  // ---------------- Helpers ----------------
  const parseIntSafe = (v) => {
    const n = parseInt(v, 10);
    return Number.isNaN(n) ? 0 : n;
  };
  // Add after parseIntSafe function (around line ~70)

// Calculate total price based on package pricing and passenger counts
// REPLACE the calculateTotalPrice function with this safer version:

const calculateTotalPrice = () => {
  const adults = parseIntSafe(formData.adults);
  const children = parseIntSafe(formData.children);
  const infants = parseIntSafe(formData.infants);

  // Ensure all pricing values are numbers
  const adultPrice = Number(packagePricing.price_adult) || 0;
  const childPrice = Number(packagePricing.price_child) || 0;
  const infantPrice = Number(packagePricing.price_infant) || 0;

  const adultsTotal = adults * adultPrice;
  const childrenTotal = children * childPrice;
  const infantsTotal = infants * infantPrice;
  const total = adultsTotal + childrenTotal + infantsTotal;

  setPriceBreakdown({
    adults: adultsTotal,
    children: childrenTotal,
    infants: infantsTotal,
    total: total
  });

  setCalculatedAmount(total);
  return total;
};
  const totalPassengers = parseIntSafe(formData.adults) + parseIntSafe(formData.children) + parseIntSafe(formData.infants);

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB");
  };

  // Update passengers array when total count changes
  useEffect(() => {
    const total = totalPassengers;
    setPassengers((prev) => {
      const next = [...prev];
      while (next.length < total) {
        next.push({
          first_name: "",
          last_name: "",
          email: "",
          dob: "",
          gender: "",
        });
      }
      if (next.length > total) {
        return next.slice(0, total);
      }
      return next;
    });
  }, [totalPassengers]);

  // ---------------- Input handlers ----------------
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "phone") {
      let cleaned = value.replace(/[^\d+]/g, "");
      if (cleaned.startsWith("+")) {
        cleaned = "+" + cleaned.slice(1).replace(/\+/g, "");
      }
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

    if (!formData.name.trim()) newErrors.name = "Name is required";

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = "Enter a valid email address";
      }
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone is required";
    } else {
      const digitsOnly = formData.phone.replace(/[^\d+]/g, "");
      const phoneRegex = /^\+(\d{1,3})(\d{10})$/;
      if (!phoneRegex.test(digitsOnly)) {
        newErrors.phone = "Enter a valid phone number with country code (1-3 digits) and 10-digit number";
      }
    }

    if (!formData.tour_destination) newErrors.tour_destination = "Select destination";

    if (!formData.tour_date) {
      newErrors.tour_date = "Tour date is required";
    } else {
      const selectedDate = new Date(formData.tour_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) newErrors.tour_date = "Tour date cannot be in the past";
    }

    if (parseIntSafe(formData.adults) < 1) newErrors.adults = "At least 1 adult required";
    if (totalPassengers > 50) newErrors.adults = "Maximum 50 passengers allowed in total";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePaymentAndPassengers = () => {
    const problems = [];
    if (!billing.first_name.trim()) problems.push("Billing first name required");
    if (!billing.last_name.trim()) problems.push("Billing last name required");
    if (!billing.street_address.trim()) problems.push("Billing street address required");
    if (!billing.city.trim()) problems.push("Billing city required");
    if (!billing.pin_code.trim()) problems.push("Billing PIN code required");
    if (!billing.phone.trim()) problems.push("Billing phone required");
    if (!billing.email.trim()) problems.push("Billing email required");
    
    passengers.forEach((p, idx) => {
      if (!p.first_name || !p.last_name) problems.push(`Passenger ${idx + 1}: first & last name required`);
      if (!p.dob) problems.push(`Passenger ${idx + 1}: date of birth required`);
      if (!p.gender) problems.push(`Passenger ${idx + 1}: gender required`);
    });
    return problems;
  };

  // ---------------- API Calls ----------------
  // REPLACE the existing handleSubmit function with this updated version:

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
      package_id: selectedPackage ? selectedPackage.id : null, // NEW: Include package ID
      tour_date: formData.tour_date,
      departure: formData.departure,
      adults: parseIntSafe(formData.adults),
      children: parseIntSafe(formData.children),
      infants: parseIntSafe(formData.infants),
      special_requests: formData.special_requests,
      amount: calculatedAmount || 0 // NEW: Use calculated amount
    };

    const res = await fetch(`${config.API_BASE_URL}/bookingpayment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    
    const data = await res.json();
    
    if (data.success && data.bookingId) {
      setSuccessMessage("Booking created. Proceed to payment.");
      setBookingId(data.bookingId);
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
     const amount = calculatedAmount || (totalPassengers * 100);

    const payload = {
      bookingId,
      amount,
      cardNumber: paymentData.cardNumber,
      expiry: paymentData.expiry,
      cvv: paymentData.cvv,
      method: paymentData.method,
      billing: billing,
      passengers: passengers
    };

    // ✅ FIXED: Changed from /bookingpayment to /bookingpayment/payments
    const res = await fetch(`${config.API_BASE_URL}/bookingpayment/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (data.success) {
      setPaymentStatus("✅ Payment successful! Transaction ID: " + (data.transaction_id || "N/A"));
      
      // Redirect to confirmation page after 2 seconds
      setTimeout(() => {
        navigate("/booking-confirmation", {
          state: { 
            bookingId: bookingId,
            transactionId: data.transaction_id,
            amount: amount
          } 
        });
      }, 2000);
    } else {
      setPaymentStatus("❌ Payment failed: " + (data.error || "Unknown error"));
    }
  } catch (err) {
    console.error("Payment error:", err);
    setPaymentStatus("❌ Network error. Try again.");
  } finally {
    setIsProcessing(false);
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

  // Handle pre-filled destination from Packages page
  // REPLACE the existing useEffect that handles location.state with this:

useEffect(() => {
  if (location.state && location.state.packageDetails) {
    const { selectedDestination, packageDetails } = location.state;
    
    // Set form destination
    let destinationName = '';
    if (typeof selectedDestination === 'string') {
      destinationName = selectedDestination;
    } else if (typeof selectedDestination === 'object' && selectedDestination !== null) {
      destinationName = selectedDestination.name || selectedDestination.displayName || '';
    }
    
    // Set package data
    setSelectedPackage(packageDetails);
    
    // Set pricing from package
    setPackagePricing({
      price_adult: packageDetails.price_adult || packageDetails.price || 100,
      price_child: packageDetails.price_child || (packageDetails.price * 0.4) || 40,
      price_infant: packageDetails.price_infant || (packageDetails.price * 0.2) || 20
    });
    
    // Update form data
    setFormData(prev => ({
      ...prev,
      tour_destination: destinationName
    }));
  }
}, [location.state]);
// Add this NEW useEffect to recalculate price when adults/children/infants change
useEffect(() => {
  if (selectedPackage) {
    calculateTotalPrice();
  }
}, [formData.adults, formData.children, formData.infants, packagePricing]);

  // ---------------- Render ----------------
  return (
    <div className="booking-page">
      <Navbar />
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
            >
              {currentView === "payment" ? "← Back to Booking" : "New Booking"}
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
                    <label htmlFor="name">Full Name</label>
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
                    <label htmlFor="email">Email Address</label>
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
                    <label htmlFor="phone">Phone Number</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+91 98765 43210"
                    />
                    {errors.phone && <span className="error-text">{errors.phone}</span>}
                  </div>

                  <div className="form-group">
                    <label>Destination</label>
                    <DestinationSearch
                      formData={formData}
                      setFormData={setFormData}
                      errors={errors}
                      setErrors={setErrors}
                    />
                  </div>
                </div>

                {/* Row 3 */}
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="departure">Departure From</label>
                    <input
                      type="text"
                      id="departure"
                      name="departure"
                      value={formData.departure}
                      onChange={handleInputChange}
                      placeholder="e.g., Mumbai, Delhi"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="tour_date">Tour Date</label>
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

                {/* Row 4 - Passengers */}
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="adults">Adults (18+)</label>
                    <input
                      type="number"
                      id="adults"
                      name="adults"
                      value={formData.adults}
                      onChange={handleInputChange}
                      min="1"
                      max="50"
                    />
                    {errors.adults && <span className="error-text">{errors.adults}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="children">Children (2-17)</label>
                    <input
                      type="number"
                      id="children"
                      name="children"
                      value={formData.children}
                      onChange={handleInputChange}
                      min="0"
                      max="20"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="infants">Infants (0-2)</label>
                    <input
                      type="number"
                      id="infants"
                      name="infants"
                      value={formData.infants}
                      onChange={handleInputChange}
                      min="0"
                      max="10"
                    />
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
                {/* Add this AFTER Special Requests textarea */}

{/* Price Breakdown Section */}
                {/* Price Breakdown Section - FIXED VERSION */}
{selectedPackage && (
  <div className="price-breakdown-box">
    <h3>💰 Price Breakdown</h3>
    <div className="breakdown-item">
      <span>Adults ({formData.adults} × ₹{Number(packagePricing.price_adult || 0).toFixed(2)})</span>
      <strong>₹{Number(priceBreakdown.adults || 0).toFixed(2)}</strong>
    </div>
    {formData.children > 0 && (
      <div className="breakdown-item">
        <span>Children ({formData.children} × ₹{Number(packagePricing.price_child || 0).toFixed(2)})</span>
        <strong>₹{Number(priceBreakdown.children || 0).toFixed(2)}</strong>
      </div>
    )}
    {formData.infants > 0 && (
      <div className="breakdown-item">
        <span>Infants ({formData.infants} × ₹{Number(packagePricing.price_infant || 0).toFixed(2)})</span>
        <strong>₹{Number(priceBreakdown.infants || 0).toFixed(2)}</strong>
      </div>
    )}
    <div className="breakdown-total">
      <span>Total Amount</span>
      <strong>₹{Number(priceBreakdown.total || 0).toFixed(2)}</strong>
    </div>
  </div>
)}
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

        {/* Payment Section */}
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
              {/* Payment Information - FIXED VERSION */}
<h3>Payment Information</h3>
<div style={{ marginBottom: "0.8rem" }}>
  <strong>Amount to pay: ₹{Number(calculatedAmount || 0).toFixed(2)}</strong>
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
      </main>
    </div>
  );
};

export default BookingPayment;
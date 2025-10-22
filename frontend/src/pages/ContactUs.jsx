import React, { useState } from 'react';
import {
  Phone, Mail, MapPin, Clock, MessageCircle,
  Send, CheckCircle, Facebook, Twitter, Instagram,
  Linkedin, Youtube, HelpCircle, Headphones
} from 'lucide-react';
import Navbar from '../components/common/Navbar';
import "../styles/ContactUs.css";

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    inquiry_type: 'general',
    message: ''
  });
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  const [activeAccordion, setActiveAccordion] = useState(null);
  const [showCallModal, setShowCallModal] = useState(false);

  const faqs = [
    { id: 1, question: "How do I book a tour package?", answer: "Booking a tour is easy! Simply browse our destinations, select a package, choose your travel date, fill in the booking form, and proceed with payment. You'll receive a confirmation email immediately after." },
    { id: 2, question: "What is your cancellation policy?", answer: "Our cancellation policy varies by package. Generally, you can cancel up to 7 days before travel for a full refund. Check the specific package details for exact terms." },
    { id: 3, question: "Do you offer group discounts?", answer: "Yes! We offer attractive discounts for groups of 10 or more people. Contact us for a custom quote based on your group size and destination." },
    { id: 4, question: "What's included in the tour packages?", answer: "Most packages include accommodation, meals as specified, transportation, guide services, and entrance fees. Check individual package details for specifics." },
    { id: 5, question: "How can I modify my booking?", answer: "You can modify your booking up to 48 hours before travel by logging into your dashboard or contacting our support team." }
  ];

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.subject.trim()) newErrors.subject = 'Subject is required';
    if (!formData.message.trim()) newErrors.message = 'Message is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setSending(true);
    try {
      const response = await fetch('http://localhost:5000/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSubmitted(true);
        setFormData({ name: '', email: '', phone: '', subject: '', inquiry_type: 'general', message: '' });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // ✅ WhatsApp Live Chat function — Direct + Twilio API
  const handleWhatsAppChat = async () => {
    const phoneNumber = "919876543210"; // ✅ Replace with your actual WhatsApp number
    const message = encodeURIComponent("Hello! I’d like to know more about your tour packages.");
    const whatsappURL = `https://wa.me/${phoneNumber}?text=${message}`;

    // Open WhatsApp directly
    window.open(whatsappURL, "_blank");

    // Also send message to Twilio backend (no UI change)
    try {
      await fetch('http://localhost:5000/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name || 'Visitor',
          message: "Hello! I’d like to know more about your tour packages."
        })
      });
    } catch (err) {
      console.error("Twilio WhatsApp API error:", err);
    }
  };

  return (
    <div className="contact-page">
      <Navbar />

      {/* Hero Section */}
      <section className="hero-section">
        <h1>Get in Touch</h1>
        <p>We're here to help you plan your perfect journey. Reach out to us anytime!</p>
      </section>

      {/* Contact Info Cards */}
      <section className="info-section">
        <div className="info-card">
          <div className="icon-box teal"><Phone /></div>
          <h3>Phone</h3>
          <p>+91 98765 43210</p>
          <p>+91 98765 43211</p>
        </div>
        <div className="info-card">
          <div className="icon-box blue"><Mail /></div>
          <h3>Email</h3>
          <p>info@journeyhub.com</p>
          <p>support@journeyhub.com</p>
        </div>
        <div className="info-card">
          <div className="icon-box purple"><MapPin /></div>
          <h3>Address</h3>
          <p>123, Travel Street</p>
          <p>Tiruppur, Tamil Nadu</p>
        </div>
        <div className="info-card">
          <div className="icon-box orange"><Clock /></div>
          <h3>Working Hours</h3>
          <p>Mon - Fri: 9AM - 8PM</p>
          <p>Sat - Sun: 10AM - 6PM</p>
        </div>
      </section>

      {/* Form & FAQ */}
      <section className="form-faq-section">
        {/* Contact Form */}
        <div className="form-container">
          <h2>Send us a Message</h2>
          {submitted ? (
            <div className="submitted-box">
              <div className="success-icon"><CheckCircle /></div>
              <h3>Message Sent!</h3>
              <p>We'll get back to you within 24 hours.</p>
              <button onClick={() => setSubmitted(false)}>Send another message</button>
            </div>
          ) : (
            <div className="form-fields">
              <div>
                <label>Your Name*</label>
                <input type="text" value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                {errors.name && <span className="error-text">{errors.name}</span>}
              </div>

              <div>
                <label>Your Email*</label>
                <input type="email" value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                {errors.email && <span className="error-text">{errors.email}</span>}
              </div>

              <div>
                <label>Phone Number</label>
                <input type="tel" value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              </div>

              <div>
                <label>Inquiry Type</label>
                <select value={formData.inquiry_type}
                  onChange={(e) => setFormData({ ...formData, inquiry_type: e.target.value })}>
                  <option value="general">General Inquiry</option>
                  <option value="booking">Booking Support</option>
                  <option value="support">Technical Support</option>
                  <option value="partnership">Partnership</option>
                  <option value="complaint">Complaint</option>
                </select>
              </div>

              <div>
                <label>Subject*</label>
                <input type="text" value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })} />
                {errors.subject && <span className="error-text">{errors.subject}</span>}
              </div>

              <div>
                <label>Message*</label>
                <textarea rows="5" value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}></textarea>
                {errors.message && <span className="error-text">{errors.message}</span>}
              </div>

              <button onClick={handleSubmit} disabled={sending}>
                {sending ? 'Sending...' : <><Send /> Send Message</>}
              </button>
            </div>
          )}
        </div>

        {/* FAQ */}
        <div className="faq-container">
          <h2>Frequently Asked Questions</h2>
          {faqs.map((faq) => (
            <div key={faq.id} className="faq-item">
              <button
                className="faq-question"
                onClick={() => setActiveAccordion(activeAccordion === faq.id ? null : faq.id)}
              >
                {faq.question}
                <HelpCircle className={`faq-icon ${activeAccordion === faq.id ? 'rotate' : ''}`} />
              </button>
              {activeAccordion === faq.id && <div className="faq-answer">{faq.answer}</div>}
            </div>
          ))}
          <div className="extra-support">
            <h3>Still have questions?</h3>
            <p>Our support team is available 24/7 to help you with any queries.</p>
            <div className="support-buttons">
              <button onClick={handleWhatsAppChat}><MessageCircle /> Live Chat</button>
              <button onClick={() => setShowCallModal(true)}><Headphones /> Call Support</button>
            </div>
          </div>
        </div>
      </section>

      {/* Map */}
      <section className="map-section">
        <h2>Find Us Here</h2>
        <div className="map-box">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d125323.40819094618!2d77.2689!3d11.1085!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ba907c0cb2bfd87%3A0x9e7b2f6d4d2e5a6!2sTiruppur%2C%20Tamil%20Nadu!5e0!3m2!1sen!2sin!4v1635959520981!5m2!1sen!2sin"
            width="100%" height="100%" style={{ border: 0 }} allowFullScreen="" loading="lazy"
          ></iframe>
        </div>
      </section>

      {/* Social */}
      <section className="social-section">
        <h2>Connect With Us</h2>
        <p>Follow us on social media for travel inspiration and updates</p>
        <div className="social-icons">
          <a href="#"><Facebook /></a>
          <a href="#"><Twitter /></a>
          <a href="#"><Instagram /></a>
          <a href="#"><Linkedin /></a>
          <a href="#"><Youtube /></a>
        </div>
      </section>

      {/* 📞 Call Support Modal */}
      {showCallModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <button className="close-btn" onClick={() => setShowCallModal(false)}>✖</button>
            <h2>Call Support</h2>
            <p>Our support team is here to assist you 24/7.</p>
            <a href="tel:+919876543210" className="call-btn">
              📞 +91 98765 43210
            </a>
          </div>
        </div>
      )}

      
    </div>
  );
};

export default ContactUs;
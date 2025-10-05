import React, { useState } from 'react';
import { 
  Phone, Mail, MapPin, Clock, MessageCircle, 
  Send, CheckCircle, Facebook, Twitter, Instagram,
  Linkedin, Youtube, HelpCircle, Headphones, FileText
} from 'lucide-react';

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

  const faqs = [
    {
      id: 1,
      question: "How do I book a tour package?",
      answer: "Booking a tour is easy! Simply browse our destinations, select a package, choose your travel date, fill in the booking form, and proceed with payment. You'll receive a confirmation email immediately after."
    },
    {
      id: 2,
      question: "What is your cancellation policy?",
      answer: "Our cancellation policy varies by package. Generally, you can cancel up to 7 days before travel for a full refund. Check the specific package details for exact terms."
    },
    {
      id: 3,
      question: "Do you offer group discounts?",
      answer: "Yes! We offer attractive discounts for groups of 10 or more people. Contact us for a custom quote based on your group size and destination."
    },
    {
      id: 4,
      question: "What's included in the tour packages?",
      answer: "Most packages include accommodation, meals as specified, transportation, guide services, and entrance fees. Check individual package details for specifics."
    },
    {
      id: 5,
      question: "How can I modify my booking?",
      answer: "You can modify your booking up to 48 hours before travel by logging into your dashboard or contacting our support team."
    }
  ];

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }
    
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    
    if (!validateForm()) {
      return;
    }

    setSending(true);
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSubmitted(true);
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          inquiry_type: 'general',
          message: ''
        });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-teal-600 to-blue-600 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Get in Touch</h1>
            <p className="text-xl text-teal-100 max-w-2xl mx-auto">
              We're here to help you plan your perfect journey. Reach out to us anytime!
            </p>
          </div>
        </div>
      </div>

      {/* Contact Info Cards */}
      <div className="container mx-auto px-4 -mt-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
            <div className="bg-teal-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone className="w-8 h-8 text-teal-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Phone</h3>
            <p className="text-gray-600">+91 98765 43210</p>
            <p className="text-gray-600">+91 98765 43211</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Email</h3>
            <p className="text-gray-600">info@journeyhub.com</p>
            <p className="text-gray-600">support@journeyhub.com</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Address</h3>
            <p className="text-gray-600">123, Travel Street</p>
            <p className="text-gray-600">Tiruppur, Tamil Nadu</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
            <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Working Hours</h3>
            <p className="text-gray-600">Mon - Fri: 9AM - 8PM</p>
            <p className="text-gray-600">Sat - Sun: 10AM - 6PM</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Contact Form */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Send us a Message</h2>
            
            {submitted ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Message Sent!</h3>
                <p className="text-gray-600 mb-6">We'll get back to you within 24 hours.</p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="text-teal-600 hover:underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Your Name*
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                        errors.name ? 'border-red-500' : ''
                      }`}
                      placeholder="John Doe"
                    />
                    {errors.name && (
                      <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Your Email*
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                        errors.email ? 'border-red-500' : ''
                      }`}
                      placeholder="john@example.com"
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Inquiry Type
                    </label>
                    <select
                      value={formData.inquiry_type}
                      onChange={(e) => setFormData({...formData, inquiry_type: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    >
                      <option value="general">General Inquiry</option>
                      <option value="booking">Booking Support</option>
                      <option value="support">Technical Support</option>
                      <option value="partnership">Partnership</option>
                      <option value="complaint">Complaint</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject*
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                      errors.subject ? 'border-red-500' : ''
                    }`}
                    placeholder="How can we help you?"
                  />
                  {errors.subject && (
                    <p className="text-red-500 text-sm mt-1">{errors.subject}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message*
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    rows="5"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                      errors.message ? 'border-red-500' : ''
                    }`}
                    placeholder="Tell us more about your inquiry..."
                  />
                  {errors.message && (
                    <p className="text-red-500 text-sm mt-1">{errors.message}</p>
                  )}
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={sending}
                  className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {sending ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send Message
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* FAQ Section */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Frequently Asked Questions</h2>
            
            <div className="space-y-4">
              {faqs.map((faq) => (
                <div key={faq.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <button
                    onClick={() => setActiveAccordion(activeAccordion === faq.id ? null : faq.id)}
                    className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-medium text-gray-800">{faq.question}</span>
                    <HelpCircle className={`w-5 h-5 text-gray-400 transform transition-transform ${
                      activeAccordion === faq.id ? 'rotate-180' : ''
                    }`} />
                  </button>
                  {activeAccordion === faq.id && (
                    <div className="px-6 py-4 bg-gray-50 border-t">
                      <p className="text-gray-600">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-8 bg-gradient-to-r from-teal-50 to-blue-50 rounded-xl p-6">
              <h3 className="font-semibold text-lg mb-3">Still have questions?</h3>
              <p className="text-gray-600 mb-4">
                Our support team is available 24/7 to help you with any queries.
              </p>
              <div className="flex gap-4">
                <button className="flex items-center gap-2 bg-white text-teal-600 px-4 py-2 rounded-lg hover:shadow-md transition-shadow">
                  <MessageCircle className="w-4 h-4" />
                  Live Chat
                </button>
                <button className="flex items-center gap-2 bg-white text-teal-600 px-4 py-2 rounded-lg hover:shadow-md transition-shadow">
                  <Headphones className="w-4 h-4" />
                  Call Support
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Map Section */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Find Us Here</h2>
          <div className="bg-white rounded-xl shadow-lg overflow-hidden h-96">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d125323.40819094618!2d77.2689!3d11.1085!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ba907c0cb2bfd87%3A0x9e7b2f6d4d2e5a6!2sTiruppur%2C%20Tamil%20Nadu!5e0!3m2!1sen!2sin!4v1635959520981!5m2!1sen!2sin"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
            ></iframe>
          </div>
        </div>

        {/* Social Media */}
        <div className="text-center mb-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Connect With Us</h2>
          <p className="text-gray-600 mb-6">Follow us on social media for travel inspiration and updates</p>
          <div className="flex justify-center gap-4">
            <a href="#" className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 transition-colors">
              <Facebook className="w-6 h-6" />
            </a>
            <a href="#" className="bg-blue-400 text-white p-3 rounded-full hover:bg-blue-500 transition-colors">
              <Twitter className="w-6 h-6" />
            </a>
            <a href="#" className="bg-pink-600 text-white p-3 rounded-full hover:bg-pink-700 transition-colors">
              <Instagram className="w-6 h-6" />
            </a>
            <a href="#" className="bg-blue-700 text-white p-3 rounded-full hover:bg-blue-800 transition-colors">
              <Linkedin className="w-6 h-6" />
            </a>
            <a href="#" className="bg-red-600 text-white p-3 rounded-full hover:bg-red-700 transition-colors">
              <Youtube className="w-6 h-6" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
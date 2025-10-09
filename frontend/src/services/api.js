import axios from 'axios';
import config from '../config';

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token expiration
api.interceptors.response.use(
  (response) => {return response},
  (error) => {
    if (error.response) {
      // Handle specific error cases
      switch (error.response.status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          break;
        case 403:
          console.error('Forbidden: You do not have permission to access this resource');
          break;
        case 404:
          console.error('Not Found: The requested resource does not exist');
          break;
        case 500:
          console.error('Server Error: Something went wrong on the server');
          break;
        default:
          console.error('API Error:', error.response.data?.error || 'Unknown error');
      }
    } else if (error.request) {
      console.error('Network Error: No response received from server');
    } else {
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  verifyToken: () => api.get('/auth/verify'),
};

// User Dashboard Endpoints (NEW)
export const userAPI = {
  // Profile Management
  getProfile: () => api.get('/user/profile'),
  updateProfile: (profileData) => api.put('/user/profile', profileData),
  uploadProfilePicture: (formData) => 
    api.post('/user/upload-profile-picture', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),

  // Bookings
  getBookings: () => api.get('/user/bookings'),
  getBookingsForReview: () => api.get('/user/bookings-for-review'),

  // Stats
  getStats: () => api.get('/user/stats'),

  // Wishlist
  getWishlist: () => api.get('/user/wishlist'),
  addToWishlist: (packageId, notes) => 
    api.post(`/user/wishlist/${packageId}`, { notes }),
  removeFromWishlist: (packageId) => 
    api.delete(`/user/wishlist/${packageId}`),

  // Reviews
  getReviews: () => api.get('/user/reviews'),
  createReview: (reviewData) => api.post('/user/reviews', reviewData),
  updateReview: (reviewId, reviewData) => 
    api.put(`/user/reviews/${reviewId}`, reviewData),

  // Notifications
  getNotifications: (params) => api.get('/user/notifications', { params }),
  markNotificationAsRead: (notificationId) => 
    api.put(`/user/notifications/${notificationId}/read`),
  markAllNotificationsAsRead: () => 
    api.put('/user/notifications/read-all'),
};

// WhatsApp Endpoints (NEW)
export const whatsappAPI = {
  sendBookingConfirmation: (bookingId) => 
    api.post('/whatsapp/send-booking-confirmation', { bookingId }),
  sendPaymentStatus: (bookingId, status) => 
    api.post('/whatsapp/send-payment-status', { bookingId, status }),
  sendPromotion: (userIds, offerDetails) => 
    api.post('/whatsapp/send-promotion', { userIds, offerDetails }),
};

// Destinations Endpoints (Existing)
export const destinationsAPI = {
  getCountries: () => api.get('/destinations/countries'),
  getPlacesByCountry: (countryId) => api.get(`/destinations/countries/${countryId}/places`),
  getPlaceById: (placeId) => api.get(`/destinations/places/${placeId}`),
  searchDestinations: (query) => api.get(`/destinations/search?q=${query}`),
};

// Packages Endpoints (Existing)
export const packagesAPI = {
  getPackagesByPlace: (placeId) => api.get(`/packages/place/${placeId}`),
  getPackageById: (packageId) => api.get(`/packages/${packageId}`),
  getAllPackages: () => api.get('/packages'),
};

// Bookings Endpoints (Existing)
export const bookingsAPI = {
  createBooking: (bookingData) => api.post('/bookings', bookingData),
  getBookingById: (bookingId) => api.get(`/bookings/${bookingId}`),
  getCompleteBookingDetails: (bookingId) => 
    api.get(`/bookings/${bookingId}/complete-details`),
  processPayment: (paymentData) => api.post('/bookings/payments', paymentData),
  getAllPayments: () => api.get('/bookings/payments/all'),
  resendEmail: (bookingId) => api.post(`/bookings/${bookingId}/resend-email`),
};

// Admin Endpoints (if needed)
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getAllBookings: (params) => api.get('/admin/bookings', { params }),
  getAllUsers: (params) => api.get('/admin/users', { params }),
  updateBookingStatus: (bookingId, status) => 
    api.put(`/admin/bookings/${bookingId}/status`, { status }),
};

export default api;
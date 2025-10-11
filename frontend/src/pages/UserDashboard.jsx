import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Calendar, Heart, Star, Settings, LogOut, 
  TrendingUp, Package, Bell, Plane, Award, MapPin,
  Clock, CreditCard, Shield, Menu, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import { ShoppingCart } from 'lucide-react'; // Add ShoppingCart to existing lucide imports
import { useCart } from '../context/CartContext';
import CartCard from '../components/dashboard/CartCard';
// Import custom components
import StatsCard from '../components/dashboard/StatsCard';
import BookingCard from '../components/dashboard/BookingCard';
import WishlistCard from '../components/dashboard/WishlistCard';
import ReviewCard from '../components/dashboard/ReviewCard';
import NotificationPanel from '../components/dashboard/NotificationPanel';
import ProfileEditor from '../components/dashboard/ProfileEditor';
import { useWishlist } from '../context/WishlistContext';
// Import styles
import '../styles/UserDashboard.css';

const UserDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { cartItems, cartCount, removeFromCart, clearCart, fetchCart } = useCart();
  const { wishlistItems, wishlistCount, removeFromWishlist, clearWishlist } = useWishlist();
  // State Management
  const [activeTab, setActiveTab] = useState('overview');
  const [bookings, setBookings] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    totalBookings: 0,
    placesVisited: 0,
    wishlistCount: 0,
    cartCount: 0, 
    reviewsCount: 0
  });
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editProfile, setEditProfile] = useState(false);
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useEffect(() => {
  console.log('🛒 Cart Items State:', cartItems);
  console.log('🛒 Cart Count State:', cartCount);
}, [cartItems, cartCount]);
  // Fetch all dashboard data
  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);
useEffect(() => {
  setStats(prev => ({
    ...prev,
    cartCount: cartCount,
    wishlistCount: wishlistCount
  }));
}, [cartCount, wishlistCount]);
  // FIND THIS FUNCTION IN UserDashboard.jsx (around line 50-75)
// REPLACE the fetchDashboardData function with this fixed version:
const fetchDashboardData = async () => {
  try {
    setLoading(true);
    
    // Fetch data - some endpoints might not exist yet, so we handle failures gracefully
    const results = await Promise.allSettled([
      api.get('/user/bookings'),
      api.get('/user/reviews'),
      api.get('/user/stats')
    ]);

    // Extract responses
    const [bookingsRes, reviewsRes, statsRes] = results;

    // Set bookings
    if (bookingsRes.status === 'fulfilled') {
      setBookings(bookingsRes.value.data.bookings || []);
    } else {
      console.warn('Failed to fetch bookings');
      setBookings([]);
    }

    // Set reviews
    if (reviewsRes.status === 'fulfilled') {
      setReviews(reviewsRes.value.data.reviews || []);
    } else {
      console.warn('Failed to fetch reviews');
      setReviews([]);
    }

    // Set stats - KEEP cart and wishlist from context
    if (statsRes.status === 'fulfilled') {
      setStats({
        totalBookings: statsRes.value.data.stats?.totalBookings || 0,
        placesVisited: statsRes.value.data.stats?.placesVisited || 0,
        cartCount: cartCount, // From CartContext
        wishlistCount: wishlistCount, // From WishlistContext - will be updated by useEffect
        reviewsCount: statsRes.value.data.stats?.reviewsCount || 0
      });
    } else {
      console.warn('Failed to fetch stats');
      setStats({
        totalBookings: 0,
        placesVisited: 0,
        cartCount: cartCount,
        wishlistCount: wishlistCount,
        reviewsCount: 0
      });
    }

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
  } finally {
    setLoading(false);
  }
};


  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to clear your entire cart?')) {
      const result = await clearCart();
    }
  };

  const handleCartBookNow = (item) => {
    navigate(`/packages/${item.place_id}`);
  };

  // Profile Management
  const handleProfileUpdate = async (profileData) => {
    try {
      const response = await api.put('/user/profile', profileData);

      if (response.data.success) {
        toast.success('Profile updated successfully!');
        setEditProfile(false);
        fetchDashboardData(); // Refresh data
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const handleImageUpload = async (file) => {
    try {
      const formData = new FormData();
      formData.append('profile_picture', file);

      const response = await api.post('/user/upload-profile-picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        toast.success('Profile picture updated!');
        fetchDashboardData(); // Refresh data
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    }
  };

  // Wishlist Management
  const handleRemoveFromWishlist = async (wishlistId) => {
  console.log('🗑️ Removing wishlist item with ID:', wishlistId); // Debug log
  const result = await removeFromWishlist(wishlistId);
  if (result.success) {
    console.log('✅ Successfully removed from wishlist');
  } else {
    console.log('❌ Failed to remove from wishlist');
  }
};
const handleClearWishlist = async () => {
  if (window.confirm('Are you sure you want to clear your entire wishlist?')) {
    const result = await clearWishlist();
  }
};

  

  const handleViewPackageDetails = (item) => {
    navigate(`/packages/${item.place_id}`);
  };

  // Booking Management
  const handleViewBookingDetails = (booking) => {
    // You can create a booking details modal or page
    toast.info('Booking details view - Coming soon!');
  };

  const handleDownloadReceipt = (booking) => {
    toast.info('Receipt download - Coming soon!');
  };

  // Notification Management
  const handleMarkAsRead = async (notificationId) => {
    try {
      await api.put(`/user/notifications/${notificationId}/read`);
      
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/user/notifications/read-all');
      
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark notifications as read');
    }
  };

  const handleDeleteNotification = (notificationId) => {
    setNotifications(notifications.filter(n => n.id !== notificationId));
    toast.success('Notification deleted');
  };
  const handleRemoveFromCart = async (cartId) => {
  const result = await removeFromCart(cartId);
  if (result.success) {
    // Cart is already updated in CartContext
    // Optionally refresh dashboard data
  }
};



const handleBookNow = (item) => {
  // Navigate to packages page for this place
  navigate(`/packages/${item.place_id}`);
};
  const handleNotificationClick = (notification) => {
    if (notification.link) {
      const path = notification.link.split('?')[0];
      const params = new URLSearchParams(notification.link.split('?')[1]);
      const tab = params.get('tab');
      
      if (tab) {
        setActiveTab(tab);
      } else {
        navigate(notification.link);
      }
    }
    
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }
    
    setNotificationPanelOpen(false);
  };

  // Logout
  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  // Navigation tabs
  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'bookings', label: 'My Bookings', icon: Calendar },
    { id: 'wishlist', label: 'Wishlist', icon: Heart },
    { id: 'cart', label: 'My Cart', icon: ShoppingCart },
    { id: 'reviews', label: 'Reviews', icon: Star },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-teal-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Render Functions
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Bookings"
          value={stats.totalBookings}
          icon={Package}
          gradient="bg-gradient-to-br from-teal-500 to-teal-600"
          trend="up"
          trendValue={12}
          description="All time bookings"
        />
        <StatsCard
          title="Places Visited"
          value={stats.placesVisited}
          icon={MapPin}
          gradient="bg-gradient-to-br from-blue-500 to-blue-600"
          description="Completed trips"
        />
        <StatsCard
  title="Cart Items"
  value={cartCount}
  icon={ShoppingCart}
  gradient="bg-gradient-to-br from-yellow-500 to-orange-600"
  description="Ready to checkout"
/>
        <StatsCard
          title="Wishlist"
          value={stats.wishlistCount}
          icon={Heart}
          gradient="bg-gradient-to-br from-pink-500 to-pink-600"
          description="Saved destinations"
        />
        <StatsCard
          title="Reviews"
          value={stats.reviewsCount}
          icon={Star}
          gradient="bg-gradient-to-br from-orange-500 to-orange-600"
          description="Shared experiences"
        />
        
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-teal-600" />
            Recent Bookings
          </h3>
          <button
            onClick={() => setActiveTab('bookings')}
            className="text-teal-600 hover:text-teal-700 font-semibold text-sm flex items-center gap-1 hover:gap-2 transition-all"
          >
            View All
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {bookings.length === 0 ? (
          <div className="text-center py-12">
            <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <Package className="w-10 h-10 text-gray-400" />
            </div>
            <h4 className="text-lg font-semibold text-gray-700 mb-2">No bookings yet</h4>
            <p className="text-gray-500 mb-4">Start exploring amazing destinations!</p>
            <button
              onClick={() => navigate('/destinations')}
              className="px-6 py-3 bg-gradient-to-r from-teal-500 to-blue-500 text-white rounded-xl hover:from-teal-600 hover:to-blue-600 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Explore Destinations
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookings.slice(0, 3).map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onViewDetails={handleViewBookingDetails}
                onDownloadReceipt={handleDownloadReceipt}
              />
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => navigate('/destinations')}
          className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 text-center group transform hover:-translate-y-1"
        >
          <div className="p-3 bg-teal-100 rounded-xl w-fit mx-auto mb-3 group-hover:bg-teal-500 transition-colors">
            <Plane className="w-8 h-8 text-teal-600 group-hover:text-white transition-colors" />
          </div>
          <p className="font-semibold text-gray-800 group-hover:text-teal-600 transition-colors">
            Book a Trip
          </p>
        </button>

        <button
          onClick={() => setActiveTab('wishlist')}
          className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 text-center group transform hover:-translate-y-1"
        >
          <div className="p-3 bg-pink-100 rounded-xl w-fit mx-auto mb-3 group-hover:bg-pink-500 transition-colors">
            <Heart className="w-8 h-8 text-pink-600 group-hover:text-white transition-colors" />
          </div>
          <p className="font-semibold text-gray-800 group-hover:text-pink-600 transition-colors">
            My Wishlist
          </p>
        </button>

        <button
          onClick={() => setActiveTab('reviews')}
          className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 text-center group transform hover:-translate-y-1"
        >
          <div className="p-3 bg-yellow-100 rounded-xl w-fit mx-auto mb-3 group-hover:bg-yellow-500 transition-colors">
            <Star className="w-8 h-8 text-yellow-600 group-hover:text-white transition-colors" />
          </div>
          <p className="font-semibold text-gray-800 group-hover:text-yellow-600 transition-colors">
            Write Review
          </p>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 text-center group transform hover:-translate-y-1"
        >
          <div className="p-3 bg-gray-100 rounded-xl w-fit mx-auto mb-3 group-hover:bg-gray-500 transition-colors">
            <Settings className="w-8 h-8 text-gray-600 group-hover:text-white transition-colors" />
          </div>
          <p className="font-semibold text-gray-800 group-hover:text-gray-600 transition-colors">
            Settings
          </p>
        </button>
      </div>
    </div>
  );

  const renderBookings = () => (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Calendar className="w-6 h-6 text-teal-600" />
        All Bookings
      </h3>
      
      {bookings.length === 0 ? (
        <div className="text-center py-12">
          <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <Package className="w-10 h-10 text-gray-400" />
          </div>
          <h4 className="text-lg font-semibold text-gray-700 mb-2">No bookings found</h4>
          <p className="text-gray-500 mb-4">Book your first trip now!</p>
          <button
            onClick={() => navigate('/destinations')}
            className="px-6 py-3 bg-gradient-to-r from-teal-500 to-blue-500 text-white rounded-xl hover:from-teal-600 hover:to-blue-600 transition-all duration-300 font-semibold"
          >
            Explore Destinations
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onViewDetails={handleViewBookingDetails}
              onDownloadReceipt={handleDownloadReceipt}
            />
          ))}
        </div>
      )}
    </div>
  );

  const renderWishlist = () => (
  <div className="space-y-6">
    {/* Header */}
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <Heart className="w-6 h-6 text-pink-600" />
        My Wishlist ({wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'})
      </h3>
      {wishlistItems.length > 0 && (
        <button
          onClick={handleClearWishlist}
          className="px-4 py-2 text-red-600 hover:text-red-700 font-semibold text-sm border border-red-300 rounded-lg hover:bg-red-50 transition-all"
        >
          Clear All
        </button>
      )}
    </div>

    {/* Wishlist Items */}
    {wishlistItems.length === 0 ? (
      <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
        <div className="p-4 bg-pink-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
          <Heart className="w-10 h-10 text-pink-400" />
        </div>
        <h4 className="text-lg font-semibold text-gray-700 mb-2">Your wishlist is empty</h4>
        <p className="text-gray-500 mb-4">Save your favorite destinations here!</p>
        <button
          onClick={() => navigate('/destinations')}
          className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl hover:from-pink-600 hover:to-purple-600 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          Explore Destinations
        </button>
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {wishlistItems.map((item) => (
          <WishlistCard
            key={item.wishlist_id}
            item={item}
            onRemove={handleRemoveFromWishlist}
            onBookNow={handleBookNow}
          />
        ))}
      </div>
    )}
  </div>
);
  const renderCart = () => (
  <div className="space-y-6">
    {/* Header */}
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <ShoppingCart className="w-6 h-6 text-teal-600" />
        My Cart ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})
      </h3>
      {cartItems.length > 0 && (
        <button
          onClick={handleClearCart}
          className="px-4 py-2 text-red-600 hover:text-red-700 font-semibold text-sm border border-red-300 rounded-lg hover:bg-red-50 transition-all"
        >
          Clear All
        </button>
      )}
    </div>

    {/* Cart Items */}
    {cartItems.length === 0 ? (
      <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
        <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
          <ShoppingCart className="w-10 h-10 text-gray-400" />
        </div>
        <h4 className="text-lg font-semibold text-gray-700 mb-2">Your cart is empty</h4>
        <p className="text-gray-500 mb-4">Start adding destinations to your cart!</p>
        <button
          onClick={() => navigate('/destinations')}
          className="px-6 py-3 bg-gradient-to-r from-teal-500 to-blue-500 text-white rounded-xl hover:from-teal-600 hover:to-blue-600 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          Explore Destinations
        </button>
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cartItems.map((item) => (
          <CartCard
            key={item.cart_id}
            item={item}
            onRemove={handleRemoveFromCart}
            onBookNow={handleBookNow}
          />
        ))}
      </div>
    )}
  </div>
);

  const renderReviews = () => (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Star className="w-6 h-6 text-yellow-600" />
        My Reviews
      </h3>
      
      {reviews.length === 0 ? (
        <div className="text-center py-12">
          <div className="p-4 bg-yellow-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <Star className="w-10 h-10 text-yellow-400" />
          </div>
          <h4 className="text-lg font-semibold text-gray-700 mb-2">No reviews yet</h4>
          <p className="text-gray-500 mb-4">Share your travel experiences!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onEdit={(review) => toast.info('Edit review - Coming soon!')}
            />
          ))}
        </div>
      )}
    </div>
  );

  const renderProfile = () => (
    <ProfileEditor
      user={user}
      isEditing={editProfile}
      onSave={handleProfileUpdate}
      onCancel={() => setEditProfile(false)}
      onImageUpload={handleImageUpload}
    />
  );

  const renderSettings = () => (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Settings className="w-6 h-6 text-gray-600" />
        Settings
      </h3>
      
      <div className="space-y-6">
        {/* Account Settings */}
        <div>
          <h4 className="font-semibold text-lg text-gray-800 mb-4">Account Settings</h4>
          <div className="space-y-3">
            <button
              onClick={() => {
                setActiveTab('profile');
                setEditProfile(true);
              }}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-600" />
                <span className="font-medium text-gray-800">Edit Profile</span>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-gray-600" />
                <span className="font-medium text-gray-800">Change Password</span>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="font-medium text-gray-800">Notification Preferences</span>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div>
          <h4 className="font-semibold text-lg text-red-600 mb-4">Danger Zone</h4>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 p-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors font-semibold"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );

  return (
  <div className="user-dashboard">
    {/* Header */}
    <div className="dashboard-header">
      <div className="header-content">
        <div className="header-flex">
          {/* User Info */}
          <div className="user-info-section">
            <div className="user-avatar-wrapper">
              <img 
                src={user?.profile_picture || `https://ui-avatars.com/api/?name=${user?.name}&size=100&background=14b8a6&color=fff&bold=true`}
                alt={user?.name}
                className="user-avatar"
              />
              <div className="online-badge"></div>
            </div>
            <div className="user-greeting">
              <h1>Welcome back, {user?.name?.split(' ')[0]}! 👋</h1>
              <p>Manage your travel journey</p>
            </div>
          </div>

          {/* Actions */}
          <div className="header-actions">
            <button 
              onClick={() => setNotificationPanelOpen(true)}
              className="notification-btn"
            >
              <Bell className="icon" />
              {unreadCount > 0 && (
                <span className="notification-badge">{unreadCount}</span>
              )}
            </button>
            <button onClick={handleLogout} className="logout-btn">
              <LogOut className="icon" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* Navigation */}
    <div className="dashboard-nav">
      <div className="nav-container">
        <div className="nav-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === 'profile') setEditProfile(false);
              }}
              className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
            >
              <tab.icon className="icon" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>

    {/* Main Content */}
    <div className="dashboard-content">
      {activeTab === 'overview' && (
        <div className="overview-section">
          {/* Stats Cards */}
          <div className="stats-grid">
            <StatsCard
              title="Total Bookings"
              value={stats.totalBookings}
              icon={Package}
              gradient="gradient-teal"
              description="All time bookings"
            />
            <StatsCard
              title="Places Visited"
              value={stats.placesVisited}
              icon={MapPin}
              gradient="gradient-blue"
              description="Completed trips"
            />
            <StatsCard
              title="Wishlist"
              value={stats.wishlistCount}
              icon={Heart}
              gradient="gradient-pink"
              description="Saved destinations"
            />
            <StatsCard
              title="Reviews"
              value={stats.reviewsCount}
              icon={Star}
              gradient="gradient-orange"
              description="Shared experiences"
            />
          </div>

          {/* Recent Bookings */}
          <div className="content-card">
            <div className="content-card-header">
              <h3 className="content-card-title">
                <Calendar className="icon" />
                Recent Bookings
              </h3>
              <button onClick={() => setActiveTab('bookings')} className="view-all-btn">
                View All →
              </button>
            </div>

            {bookings.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <Package className="icon" />
                </div>
                <h4 className="empty-state-title">No bookings yet</h4>
                <p className="empty-state-text">Start exploring amazing destinations!</p>
                <button onClick={() => navigate('/destinations')} className="empty-state-btn">
                  Explore Destinations
                </button>
              </div>
            ) : (
              <div className="bookings-grid">
                {bookings.slice(0, 3).map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    onViewDetails={handleViewBookingDetails}
                    onDownloadReceipt={handleDownloadReceipt}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="quick-actions-grid">
            <button onClick={() => navigate('/destinations')} className="quick-action-card">
              <div className="quick-action-icon icon-teal">
                <Plane className="icon" />
              </div>
              <p className="quick-action-label">Book a Trip</p>
            </button>

            <button onClick={() => setActiveTab('wishlist')} className="quick-action-card">
              <div className="quick-action-icon icon-pink">
                <Heart className="icon" />
              </div>
              <p className="quick-action-label">My Wishlist</p>
            </button>

            <button onClick={() => setActiveTab('reviews')} className="quick-action-card">
              <div className="quick-action-icon icon-yellow">
                <Star className="icon" />
              </div>
              <p className="quick-action-label">Write Review</p>
            </button>

            <button onClick={() => setActiveTab('settings')} className="quick-action-card">
              <div className="quick-action-icon icon-gray">
                <Settings className="icon" />
              </div>
              <p className="quick-action-label">Settings</p>
            </button>
          </div>
        </div>
      )}

      {activeTab === 'bookings' && (
        <div className="content-card">
          <h3 className="content-card-title">
            <Calendar className="icon" />
            All Bookings
          </h3>
          {bookings.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Package className="icon" />
              </div>
              <h4 className="empty-state-title">No bookings found</h4>
              <p className="empty-state-text">Book your first trip now!</p>
              <button onClick={() => navigate('/destinations')} className="empty-state-btn">
                Explore Destinations
              </button>
            </div>
          ) : (
            <div className="bookings-grid">
              {bookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onViewDetails={handleViewBookingDetails}
                  onDownloadReceipt={handleDownloadReceipt}
                />
              ))}
            </div>
          )}
        </div>
      )}
      {activeTab === 'cart' && renderCart()}
      {activeTab === 'wishlist' && renderWishlist()}
      {activeTab === 'reviews' && (
        <div className="content-card">
          <h3 className="content-card-title">
            <Star className="icon" />
            My Reviews
          </h3>
          {reviews.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon icon-yellow">
                <Star className="icon" />
              </div>
              <h4 className="empty-state-title">No reviews yet</h4>
              <p className="empty-state-text">Share your travel experiences!</p>
            </div>
          ) : (
            <div className="reviews-grid">
              {reviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  onEdit={() => toast.info('Edit review - Coming soon!')}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'profile' && (
        <ProfileEditor
          user={user}
          isEditing={editProfile}
          onSave={handleProfileUpdate}
          onCancel={() => setEditProfile(false)}
          onImageUpload={handleImageUpload}
        />
      )}

      {activeTab === 'settings' && (
        <div className="content-card">
          <h3 className="content-card-title">
            <Settings className="icon" />
            Settings
          </h3>
          
          <div className="settings-container">
            <div className="settings-section">
              <h4 className="settings-section-title">Account Settings</h4>
              <div className="settings-items">
                <button onClick={() => { setActiveTab('profile'); setEditProfile(true); }} className="settings-item">
                  <div className="settings-item-content">
                    <User className="settings-item-icon" />
                    <span className="settings-item-label">Edit Profile</span>
                  </div>
                  <span className="settings-arrow">→</span>
                </button>

                <button className="settings-item">
                  <div className="settings-item-content">
                    <Shield className="settings-item-icon" />
                    <span className="settings-item-label">Change Password</span>
                  </div>
                  <span className="settings-arrow">→</span>
                </button>

                <button className="settings-item">
                  <div className="settings-item-content">
                    <Bell className="settings-item-icon" />
                    <span className="settings-item-label">Notification Preferences</span>
                  </div>
                  <span className="settings-arrow">→</span>
                </button>
              </div>
            </div>

            <div className="settings-section danger-zone">
              <h4 className="settings-section-title">Danger Zone</h4>
              <button onClick={handleLogout} className="settings-item">
                <div className="settings-item-content">
                  <LogOut className="settings-item-icon" />
                  <span className="settings-item-label">Logout</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Notification Panel */}
    <NotificationPanel
      notifications={notifications}
      unreadCount={unreadCount}
      isOpen={notificationPanelOpen}
      onClose={() => setNotificationPanelOpen(false)}
      onMarkAsRead={handleMarkAsRead}
      onMarkAllAsRead={handleMarkAllAsRead}
      onDelete={handleDeleteNotification}
      onNotificationClick={handleNotificationClick}
    />
    
  </div>
);
};

export default UserDashboard;
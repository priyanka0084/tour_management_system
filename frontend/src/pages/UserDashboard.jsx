import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Calendar, Heart, Star, Settings, LogOut, 
  MapPin, CreditCard, Clock, TrendingUp, Package,
  Bell, Shield, ChevronRight, Download, Eye,
  X, Edit2, Save, Camera, Plane, Hotel, Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';

const UserDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [bookings, setBookings] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [editProfile, setEditProfile] = useState(false);
  const [profileData, setProfileData] = useState({});
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [bookingsRes, wishlistRes, reviewsRes, statsRes, notifRes] = await Promise.all([
        api.get('/user/bookings'),
        api.get('/user/wishlist'),
        api.get('/user/reviews'),
        api.get('/user/stats'),
        api.get('/user/notifications')
      ]);

      setBookings(bookingsRes.data.bookings || []);
      setWishlist(wishlistRes.data.wishlist || []);
      setReviews(reviewsRes.data.reviews || []);
      setStats(statsRes.data.stats || {});
      setNotifications(notifRes.data.notifications || []);
      setProfileData(user);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async () => {
    try {
      const response = await api.put('/user/profile', profileData);

      if (response.data.success) {
        toast.success('Profile updated successfully!');
        setEditProfile(false);
        // Update local user state would need to refresh auth context
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('profile_picture', file);

      try {
        const response = await api.post('/user/upload-profile-picture', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (response.data.success) {
          setProfileData({ ...profileData, profilePicture: response.data.imageUrl });
          toast.success('Profile picture updated!');
        }
      } catch (error) {
        console.error('Error uploading image:', error);
        toast.error('Failed to upload image');
      }
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getBookingStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-teal-600"></div>
      </div>
    );
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl text-white">
          <Package className="w-10 h-10 mb-3 opacity-80" />
          <p className="text-3xl font-bold">{stats.totalBookings || 0}</p>
          <p className="text-sm opacity-90">Total Bookings</p>
        </div>
        
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 p-6 rounded-xl text-white">
          <MapPin className="w-10 h-10 mb-3 opacity-80" />
          <p className="text-3xl font-bold">{stats.placesVisited || 0}</p>
          <p className="text-sm opacity-90">Places Visited</p>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-xl text-white">
          <Heart className="w-10 h-10 mb-3 opacity-80" />
          <p className="text-3xl font-bold">{stats.wishlistCount || 0}</p>
          <p className="text-sm opacity-90">Wishlist Items</p>
        </div>
        
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-xl text-white">
          <Star className="w-10 h-10 mb-3 opacity-80" />
          <p className="text-3xl font-bold">{stats.reviewsCount || 0}</p>
          <p className="text-sm opacity-90">Reviews Given</p>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">Recent Bookings</h3>
          <button 
            onClick={() => setActiveTab('bookings')}
            className="text-teal-600 hover:underline text-sm flex items-center gap-1"
          >
            View All <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {bookings.slice(0, 3).map((booking) => (
          <div key={booking.id} className="border-b last:border-0 pb-4 mb-4 last:mb-0 last:pb-0">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold text-gray-800">{booking.packageName || booking.tour_destination}</h4>
                <p className="text-sm text-gray-600 mt-1">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  {booking.tour_destination}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  {new Date(booking.tour_date).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getBookingStatusColor(booking.status)}`}>
                  {booking.status}
                </span>
                <p className="text-lg font-bold text-gray-800 mt-2">₹{booking.amount?.toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button onClick={() => navigate('/destinations')} className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition-shadow text-center">
          <Plane className="w-8 h-8 mx-auto mb-2 text-teal-600" />
          <p className="text-sm font-medium">Book a Trip</p>
        </button>
        <button onClick={() => setActiveTab('wishlist')} className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition-shadow text-center">
          <Heart className="w-8 h-8 mx-auto mb-2 text-pink-600" />
          <p className="text-sm font-medium">My Wishlist</p>
        </button>
        <button onClick={() => setActiveTab('reviews')} className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition-shadow text-center">
          <Star className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
          <p className="text-sm font-medium">Write Review</p>
        </button>
        <button onClick={() => setActiveTab('settings')} className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition-shadow text-center">
          <Settings className="w-8 h-8 mx-auto mb-2 text-gray-600" />
          <p className="text-sm font-medium">Settings</p>
        </button>
      </div>
    </div>
  );

  const renderBookings = () => (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-2xl font-bold text-gray-800 mb-6">My Bookings</h3>
      
      {bookings.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No bookings yet</p>
          <button onClick={() => navigate('/destinations')} className="mt-4 inline-block text-teal-600 hover:underline">
            Start exploring destinations
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div key={booking.id} className="border rounded-xl p-4 hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-lg font-semibold">{booking.packageName || booking.tour_destination}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs ${getBookingStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                    <div>
                      <p className="font-medium text-gray-500">Booking Ref</p>
                      <p className="font-mono">{booking.booking_reference}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-500">Travel Date</p>
                      <p>{new Date(booking.tour_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-500">Travelers</p>
                      <p>{(booking.adults || 0) + (booking.children || 0) + (booking.infants || 0)} Person(s)</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-500">Amount</p>
                      <p className="font-bold text-gray-800">₹{booking.amount?.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-4 md:mt-0 md:ml-4">
                  <button className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors">
                    <Eye className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderProfile = () => (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-gray-800">My Profile</h3>
        <button
          onClick={() => setEditProfile(!editProfile)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
        >
          {editProfile ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
          {editProfile ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Profile Picture */}
        <div className="text-center">
          <div className="relative inline-block">
            <img
              src={profileData.profilePicture || user?.profilePicture || `https://ui-avatars.com/api/?name=${user?.name}&size=200`}
              alt={user?.name}
              className="w-32 h-32 rounded-full object-cover border-4 border-teal-100"
            />
            {editProfile && (
              <label className="absolute bottom-0 right-0 bg-teal-600 text-white p-2 rounded-full cursor-pointer hover:bg-teal-700">
                <Camera className="w-4 h-4" />
                <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
              </label>
            )}
          </div>
          <p className="mt-4 text-sm text-gray-600">Member since {new Date(user?.created_at || Date.now()).getFullYear()}</p>
        </div>

        {/* Profile Form */}
        <div className="md:col-span-2 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              {editProfile ? (
                <input
                  type="text"
                  value={profileData.name || ''}
                  onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-800">{user?.name}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <p className="text-gray-800">{user?.email}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              {editProfile ? (
                <input
                  type="tel"
                  value={profileData.phone || ''}
                  onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-800">{user?.phone || 'Not provided'}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Date of Birth</label>
              {editProfile ? (
                <input
                  type="date"
                  value={profileData.date_of_birth || ''}
                  onChange={(e) => setProfileData({...profileData, date_of_birth: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-800">{user?.date_of_birth || 'Not provided'}</p>
              )}
            </div>
          </div>

          {editProfile && (
            <button
              onClick={handleProfileUpdate}
              className="w-full md:w-auto px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2 justify-center"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const renderWishlist = () => (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-2xl font-bold text-gray-800 mb-6">My Wishlist</h3>
      
      {wishlist.length === 0 ? (
        <div className="text-center py-12">
          <Heart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Your wishlist is empty</p>
          <button onClick={() => navigate('/destinations')} className="mt-4 inline-block text-teal-600 hover:underline">
            Explore destinations
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlist.map((item) => (
            <div key={item.id} className="border rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
              <img 
                src={item.image_url} 
                alt={item.name}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h4 className="font-semibold text-gray-800 mb-2">{item.name}</h4>
                <p className="text-sm text-gray-600 mb-3">{item.country}</p>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-teal-600">
                    ₹{item.price_per_person?.toLocaleString()}
                  </span>
                  <button className="text-red-500 hover:text-red-700">
                    <Heart className="w-5 h-5 fill-current" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-blue-600 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-4 mb-4 md:mb-0">
              <img 
                src={user?.profilePicture || `https://ui-avatars.com/api/?name=${user?.name}&size=100`}
                alt={user?.name}
                className="w-16 h-16 rounded-full border-4 border-white/30"
              />
              <div>
                <h1 className="text-2xl font-bold">Welcome back, {user?.name}!</h1>
                <p className="text-teal-100">Manage your travel journey</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button className="relative p-2 hover:bg-white/10 rounded-lg transition-colors">
                <Bell className="w-6 h-6" />
                {notifications.filter(n => !n.is_read).length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
                    {notifications.filter(n => !n.is_read).length}
                  </span>
                )}
              </button>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: TrendingUp },
              { id: 'bookings', label: 'My Bookings', icon: Calendar },
              { id: 'profile', label: 'Profile', icon: User },
              { id: 'wishlist', label: 'Wishlist', icon: Heart },
              { id: 'reviews', label: 'Reviews', icon: Star },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-teal-600 text-teal-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'bookings' && renderBookings()}
        {activeTab === 'profile' && renderProfile()}
        {activeTab === 'wishlist' && renderWishlist()}
        {activeTab === 'reviews' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">My Reviews</h3>
            <p className="text-gray-600">Reviews section coming soon...</p>
          </div>
        )}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Settings</h3>
            <p className="text-gray-600">Settings section coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
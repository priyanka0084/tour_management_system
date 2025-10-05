import React, { useState, useEffect } from 'react';
import { 
  Users, Calendar, MapPin, Package, TrendingUp, DollarSign,
  BarChart3, Settings, Menu, X, Search, Bell, LogOut,
  Plus, Edit, Trash2, Eye, Download, Filter, ChevronDown,
  Star, AlertCircle, CheckCircle, Clock, RefreshCw, Shield
} from 'lucide-react';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [stats, setStats] = useState({});
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, bookingsRes, usersRes, destinationsRes, packagesRes] = await Promise.all([
        fetch('/api/admin/stats', { credentials: 'include' }),
        fetch('/api/admin/bookings?limit=10', { credentials: 'include' }),
        fetch('/api/admin/users?limit=10', { credentials: 'include' }),
        fetch('/api/admin/destinations?limit=10', { credentials: 'include' }),
        fetch('/api/admin/packages?limit=10', { credentials: 'include' })
      ]);

      setStats(await statsRes.json());
      setBookings(await bookingsRes.json());
      setUsers(await usersRes.json());
      setDestinations(await destinationsRes.json());
      setPackages(await packagesRes.json());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'bookings', label: 'Bookings', icon: Calendar },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'destinations', label: 'Destinations', icon: MapPin },
    { id: 'packages', label: 'Packages', icon: Package },
    { id: 'reviews', label: 'Reviews', icon: Star },
    { id: 'promo', label: 'Promo Codes', icon: DollarSign },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const renderStatCard = (title, value, icon, color, trend) => (
    <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          {icon}
        </div>
        {trend && (
          <span className={`text-sm font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <p className="text-3xl font-bold text-gray-800">{value}</p>
      <p className="text-sm text-gray-600 mt-1">{title}</p>
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {renderStatCard(
          'Total Bookings',
          stats.totalBookings || 0,
          <Calendar className="w-6 h-6 text-white" />,
          'bg-blue-500',
          stats.bookingsTrend
        )}
        {renderStatCard(
          'Total Revenue',
          `₹${(stats.totalRevenue || 0).toLocaleString()}`,
          <DollarSign className="w-6 h-6 text-white" />,
          'bg-green-500',
          stats.revenueTrend
        )}
        {renderStatCard(
          'Active Users',
          stats.activeUsers || 0,
          <Users className="w-6 h-6 text-white" />,
          'bg-purple-500',
          stats.usersTrend
        )}
        {renderStatCard(
          'Total Destinations',
          stats.totalDestinations || 0,
          <MapPin className="w-6 h-6 text-white" />,
          'bg-orange-500',
          stats.destinationsTrend
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Revenue Overview</h3>
          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Revenue Chart Placeholder</p>
          </div>
        </div>

        {/* Booking Status */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Booking Status</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Pending</span>
              </div>
              <span className="font-medium">{stats.pendingBookings || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Confirmed</span>
              </div>
              <span className="font-medium">{stats.confirmedBookings || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Completed</span>
              </div>
              <span className="font-medium">{stats.completedBookings || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Cancelled</span>
              </div>
              <span className="font-medium">{stats.cancelledBookings || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Bookings</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Booking ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Package</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {bookings.slice(0, 5).map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 text-sm font-mono">{booking.booking_reference}</td>
                  <td className="px-4 py-4 text-sm">{booking.name}</td>
                  <td className="px-4 py-4 text-sm">{booking.packageName}</td>
                  <td className="px-4 py-4 text-sm font-medium">₹{booking.amount?.toLocaleString()}</td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <button className="text-teal-600 hover:text-teal-800">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderBookings = () => (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search bookings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
          
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
          
          <button className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Apply Filters
          </button>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Booking Ref</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Package</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Travel Date</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-mono">{booking.booking_reference}</td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium">{booking.name}</p>
                      <p className="text-xs text-gray-600">{booking.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">{booking.packageName}</td>
                  <td className="px-6 py-4 text-sm">{new Date(booking.tour_date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm font-medium">₹{booking.amount?.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      booking.payment_status === 'completed' ? 'bg-green-100 text-green-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {booking.payment_status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button className="text-teal-600 hover:text-teal-800">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-blue-600 hover:text-blue-800">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-800">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-6 py-4 bg-gray-50 flex justify-between items-center">
          <p className="text-sm text-gray-600">Showing 1 to 10 of {stats.totalBookings} bookings</p>
          <div className="flex gap-2">
            <button className="px-3 py-1 border rounded-lg hover:bg-gray-100">Previous</button>
            <button className="px-3 py-1 bg-teal-600 text-white rounded-lg">1</button>
            <button className="px-3 py-1 border rounded-lg hover:bg-gray-100">2</button>
            <button className="px-3 py-1 border rounded-lg hover:bg-gray-100">3</button>
            <button className="px-3 py-1 border rounded-lg hover:bg-gray-100">Next</button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6">
      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <Users className="w-10 h-10 text-purple-600 mb-3" />
          <p className="text-2xl font-bold">{stats.totalUsers || 0}</p>
          <p className="text-sm text-gray-600">Total Users</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <CheckCircle className="w-10 h-10 text-green-600 mb-3" />
          <p className="text-2xl font-bold">{stats.verifiedUsers || 0}</p>
          <p className="text-sm text-gray-600">Verified Users</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <Clock className="w-10 h-10 text-blue-600 mb-3" />
          <p className="text-2xl font-bold">{stats.activeToday || 0}</p>
          <p className="text-sm text-gray-600">Active Today</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <Shield className="w-10 h-10 text-orange-600 mb-3" />
          <p className="text-2xl font-bold">{stats.adminUsers || 0}</p>
          <p className="text-sm text-gray-600">Admin Users</p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-800">User Management</h3>
            <button className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add User
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={user.profile_image || `https://ui-avatars.com/api/?name=${user.name}&size=40`}
                        alt={user.name}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-gray-600">{user.personality_type || 'Not specified'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">{new Date(user.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      user.is_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {user.is_verified ? 'Verified' : 'Unverified'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button className="text-teal-600 hover:text-teal-800">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-blue-600 hover:text-blue-800">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-800">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white shadow-lg transition-all duration-300`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <h1 className={`font-bold text-2xl text-teal-600 ${!sidebarOpen && 'hidden'}`}>
              JourneyHub
            </h1>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-600 hover:text-gray-800"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          <nav className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === item.id
                    ? 'bg-teal-50 text-teal-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6 border-t">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors">
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm px-6 py-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">
              {menuItems.find(item => item.id === activeTab)?.label}
            </h2>
            
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              
              <button className="relative p-2 hover:bg-gray-100 rounded-lg">
                <Bell className="w-6 h-6 text-gray-600" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">
                  3
                </span>
              </button>
              
              <div className="flex items-center gap-3">
                <img
                  src="https://ui-avatars.com/api/?name=Admin&size=40"
                  alt="Admin"
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <p className="text-sm font-medium">Admin User</p>
                  <p className="text-xs text-gray-600">admin@journeyhub.com</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-6 overflow-auto">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'bookings' && renderBookings()}
          {activeTab === 'users' && renderUsers()}
          {activeTab === 'destinations' && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Destinations Management</h3>
              <p className="text-gray-600">Destinations management section coming soon...</p>
            </div>
          )}
          {activeTab === 'packages' && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Packages Management</h3>
              <p className="text-gray-600">Packages management section coming soon...</p>
            </div>
          )}
          {activeTab === 'reviews' && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Reviews Management</h3>
              <p className="text-gray-600">Reviews management section coming soon...</p>
            </div>
          )}
          {activeTab === 'promo' && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Promo Codes Management</h3>
              <p className="text-gray-600">Promo codes management section coming soon...</p>
            </div>
          )}
          {activeTab === 'reports' && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Reports</h3>
              <p className="text-gray-600">Reports section coming soon...</p>
            </div>
          )}
          {activeTab === 'settings' && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Settings</h3>
              <p className="text-gray-600">Settings section coming soon...</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
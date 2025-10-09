import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DestinationManager from '../components/admin/DestinationManager';
import PackageManager from '../components/admin/PackageManager';
import BookingManager from '../components/admin/BookingManager';
import UserManager from '../components/admin/UserManager';
import config from '../config';
import '../styles/adminDashboard.css';

const AdminDashboard = ({ user }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBookings: 0,
    totalDestinations: 0,
    totalPackages: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch destinations count
      const destResponse = await fetch(`${config.API_BASE_URL}/admin/destinations/places`);
      const destData = await destResponse.json();
      
      // Fetch packages count
      const pkgResponse = await fetch(`${config.API_BASE_URL}/admin/packages`);
      const pkgData = await pkgResponse.json();

      // Fetch users count
      const usersResponse = await fetch(`${config.API_BASE_URL}/admin/users`);
      const usersData = await usersResponse.json();

      // Fetch bookings count
      const bookingsResponse = await fetch(`${config.API_BASE_URL}/admin/bookings`);
      const bookingsData = await bookingsResponse.json();

      setStats({
        totalUsers: usersData.success ? usersData.users.length : 0,
        totalBookings: bookingsData.success ? bookingsData.bookings.length : 0,
        totalDestinations: destData.success ? destData.places.length : 0,
        totalPackages: pkgData.success ? pkgData.packages.length : 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <h2>🌍 JourneyHub</h2>
          <p>Admin Panel</p>
        </div>
        
        <nav className="admin-nav">
          <button 
            className={activeTab === 'overview' ? 'active' : ''}
            onClick={() => setActiveTab('overview')}
          >
            <span className="icon">📊</span>
            <span>Overview</span>
          </button>
          
          <button 
            className={activeTab === 'destinations' ? 'active' : ''}
            onClick={() => setActiveTab('destinations')}
          >
            <span className="icon">🗺️</span>
            <span>Destinations</span>
          </button>
          
          <button 
            className={activeTab === 'packages' ? 'active' : ''}
            onClick={() => setActiveTab('packages')}
          >
            <span className="icon">📦</span>
            <span>Packages</span>
          </button>
          
          <button 
            className={activeTab === 'users' ? 'active' : ''}
            onClick={() => setActiveTab('users')}
          >
            <span className="icon">👥</span>
            <span>Users</span>
          </button>
          
          <button 
            className={activeTab === 'bookings' ? 'active' : ''}
            onClick={() => setActiveTab('bookings')}
          >
            <span className="icon">📋</span>
            <span>Bookings</span>
          </button>
        </nav>

        <button className="logout-btn" onClick={handleLogout}>
          <span className="icon">🚪</span>
          <span>Logout</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <header className="admin-header">
          <h1>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
          <div className="admin-user">
            <span>Welcome, {user?.fullName || 'Admin'}</span>
            <div className="avatar">{user?.fullName?.charAt(0) || 'A'}</div>
          </div>
        </header>

        <div className="admin-content">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="overview-section">
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">👥</div>
                  <div className="stat-info">
                    <h3>{stats.totalUsers}</h3>
                    <p>Total Users</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">📋</div>
                  <div className="stat-info">
                    <h3>{stats.totalBookings}</h3>
                    <p>Total Bookings</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">🗺️</div>
                  <div className="stat-info">
                    <h3>{stats.totalDestinations}</h3>
                    <p>Destinations</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">📦</div>
                  <div className="stat-info">
                    <h3>{stats.totalPackages}</h3>
                    <p>Packages</p>
                  </div>
                </div>
              </div>

              <div className="quick-actions">
                <h3>Quick Actions</h3>
                <div className="action-buttons">
                  <button className="action-btn" onClick={() => setActiveTab('destinations')}>
                    <span>➕</span> Add Destination
                  </button>
                  <button className="action-btn" onClick={() => setActiveTab('packages')}>
                    <span>➕</span> Add Package
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Destinations Tab */}
          {activeTab === 'destinations' && <DestinationManager />}

          {/* Packages Tab */}
          {activeTab === 'packages' && <PackageManager />}

          {/* Users Tab */}
          {activeTab === 'users' && <UserManager />}

          {/* Bookings Tab */}
          {activeTab === 'bookings' && <BookingManager />}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
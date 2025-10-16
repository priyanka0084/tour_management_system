import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import config from '../../config';

const ReportsManager = () => {
  const [activeSection, setActiveSection] = useState('summary');
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start_date: '',
    end_date: ''
  });
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Data states
  const [summaryData, setSummaryData] = useState(null);
  const [packageAnalytics, setPackageAnalytics] = useState([]);
  const [bookingStatus, setBookingStatus] = useState({ breakdown: [], trends: [] });
  const [avgBookingValue, setAvgBookingValue] = useState({ stats: {}, distribution: [] });
  const [topCustomers, setTopCustomers] = useState([]);
  const [revenueAnalytics, setRevenueAnalytics] = useState([]);
  const [destinationAnalytics, setDestinationAnalytics] = useState([]);
  const [revenuePeriod, setRevenuePeriod] = useState('day');

  // Filter states for Top Customers
  const [customerFilters, setCustomerFilters] = useState({
    name: '',
    email: '',
    phone: '',
    minBookings: '',
    maxBookings: '',
    minSpent: '',
    maxSpent: ''
  });

  // Filter states for Package Analytics
  const [packageFilters, setPackageFilters] = useState({
    name: '',
    minBookings: '',
    maxBookings: '',
    minRevenue: '',
    maxRevenue: ''
  });

  // Filter states for Destinations
  const [destinationFilters, setDestinationFilters] = useState({
    name: '',
    minBookings: '',
    maxBookings: '',
    minRevenue: '',
    maxRevenue: ''
  });

  const [sortConfig, setSortConfig] = useState({ key: 'total_spent', direction: 'desc' });

  // Chart colors
  const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a'];

  // Fetch all data
  useEffect(() => {
    fetchAllData();
  }, [dateRange]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchAllData();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, dateRange]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchSummary(),
        fetchPackageAnalytics(),
        fetchBookingStatus(),
        fetchAvgBookingValue(),
        fetchTopCustomers(),
        fetchRevenueAnalytics(),
        fetchDestinationAnalytics()
      ]);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  // API Calls
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    if (dateRange.start_date) params.append('start_date', dateRange.start_date);
    if (dateRange.end_date) params.append('end_date', dateRange.end_date);
    return params.toString();
  };

  const fetchSummary = async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/admin/reports/summary?${buildQueryParams()}`);
      const data = await response.json();
      if (data.success) setSummaryData(data.data);
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const fetchPackageAnalytics = async () => {
    try {
      console.log('🔵 Fetching package analytics...');
      const url = `${config.API_BASE_URL}/admin/reports/packages-analytics?${buildQueryParams()}`;
      console.log('📡 Request URL:', url);
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('📦 Package analytics API response:', data);
      console.log('📦 Data array length:', data.data?.length);
      console.log('📦 First package:', data.data?.[0]);
      
      if (data.success) {
        setPackageAnalytics(data.data);
        console.log('✅ Package analytics state updated:', data.data.length, 'items');
      } else {
        console.error('❌ API returned error:', data.error);
      }
    } catch (error) {
      console.error('❌ Error fetching package analytics:', error);
    }
  };

  const fetchBookingStatus = async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/admin/reports/booking-status?${buildQueryParams()}`);
      const data = await response.json();
      if (data.success) setBookingStatus(data.data);
    } catch (error) {
      console.error('Error fetching booking status:', error);
    }
  };

  const fetchAvgBookingValue = async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/admin/reports/average-booking-value?${buildQueryParams()}`);
      const data = await response.json();
      if (data.success) setAvgBookingValue(data.data);
    } catch (error) {
      console.error('Error fetching avg booking value:', error);
    }
  };

  const fetchTopCustomers = async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/admin/reports/top-customers?${buildQueryParams()}&limit=10`);
      const data = await response.json();
      console.log('Top customers API response:', data); // Debug log
      if (data.success) {
        setTopCustomers(data.data);
        console.log('Top customers data:', data.data); // Debug log
      } else {
        console.error('API returned error:', data.error);
      }
    } catch (error) {
      console.error('Error fetching top customers:', error);
    }
  };

  const fetchRevenueAnalytics = async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/admin/reports/revenue-analytics?${buildQueryParams()}&period=${revenuePeriod}`);
      const data = await response.json();
      if (data.success) setRevenueAnalytics(data.data);
    } catch (error) {
      console.error('Error fetching revenue analytics:', error);
    }
  };

  const fetchDestinationAnalytics = async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/admin/reports/destination-analytics?${buildQueryParams()}`);
      const data = await response.json();
      if (data.success) setDestinationAnalytics(data.data);
    } catch (error) {
      console.error('Error fetching destination analytics:', error);
    }
  };

  // Export functions
  const handleExport = async (reportType) => {
    try {
      const response = await fetch(
        `${config.API_BASE_URL}/admin/reports/export/csv?report_type=${reportType}&${buildQueryParams()}`
      );
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data');
    }
  };

  const handleDateRangeChange = (e) => {
    setDateRange({ ...dateRange, [e.target.name]: e.target.value });
  };

  const clearDateRange = () => {
    setDateRange({ start_date: '', end_date: '' });
  };

  // Filter and sort customers
  const handleCustomerFilterChange = (e) => {
    setCustomerFilters({ ...customerFilters, [e.target.name]: e.target.value });
  };

  const clearCustomerFilters = () => {
    setCustomerFilters({
      name: '',
      email: '',
      phone: '',
      minBookings: '',
      maxBookings: '',
      minSpent: '',
      maxSpent: ''
    });
  };

  const handlePackageFilterChange = (e) => {
    setPackageFilters({ ...packageFilters, [e.target.name]: e.target.value });
  };

  const clearPackageFilters = () => {
    setPackageFilters({
      name: '',
      minBookings: '',
      maxBookings: '',
      minRevenue: '',
      maxRevenue: ''
    });
  };

  const handleDestinationFilterChange = (e) => {
    setDestinationFilters({ ...destinationFilters, [e.target.name]: e.target.value });
  };

  const clearDestinationFilters = () => {
    setDestinationFilters({
      name: '',
      minBookings: '',
      maxBookings: '',
      minRevenue: '',
      maxRevenue: ''
    });
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getFilteredAndSortedCustomers = () => {
    let filtered = [...topCustomers];

    // Apply filters
    if (customerFilters.name) {
      filtered = filtered.filter(customer =>
        customer.customer_name.toLowerCase().includes(customerFilters.name.toLowerCase())
      );
    }

    if (customerFilters.email) {
      filtered = filtered.filter(customer =>
        customer.email.toLowerCase().includes(customerFilters.email.toLowerCase())
      );
    }

    if (customerFilters.phone) {
      filtered = filtered.filter(customer =>
        customer.phone.includes(customerFilters.phone)
      );
    }

    if (customerFilters.minBookings) {
      filtered = filtered.filter(customer =>
        customer.total_bookings >= parseInt(customerFilters.minBookings)
      );
    }

    if (customerFilters.maxBookings) {
      filtered = filtered.filter(customer =>
        customer.total_bookings <= parseInt(customerFilters.maxBookings)
      );
    }

    if (customerFilters.minSpent) {
      filtered = filtered.filter(customer =>
        customer.total_spent >= parseFloat(customerFilters.minSpent)
      );
    }

    if (customerFilters.maxSpent) {
      filtered = filtered.filter(customer =>
        customer.total_spent <= parseFloat(customerFilters.maxSpent)
      );
    }

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  };

  const filteredCustomers = getFilteredAndSortedCustomers();

  // Filter and sort packages
  const getFilteredAndSortedPackages = () => {
    console.log('🔍 Filtering packages. Total packages:', packageAnalytics.length);
    console.log('🔍 Current filters:', packageFilters);
    
    let filtered = [...packageAnalytics];

    if (packageFilters.name) {
      filtered = filtered.filter(pkg =>
        pkg.package_name.toLowerCase().includes(packageFilters.name.toLowerCase())
      );
      console.log('🔍 After name filter:', filtered.length);
    }

    if (packageFilters.minBookings) {
      filtered = filtered.filter(pkg =>
        pkg.total_bookings >= parseInt(packageFilters.minBookings)
      );
      console.log('🔍 After minBookings filter:', filtered.length);
    }

    if (packageFilters.maxBookings) {
      filtered = filtered.filter(pkg =>
        pkg.total_bookings <= parseInt(packageFilters.maxBookings)
      );
      console.log('🔍 After maxBookings filter:', filtered.length);
    }

    if (packageFilters.minRevenue) {
      filtered = filtered.filter(pkg =>
        pkg.total_revenue >= parseFloat(packageFilters.minRevenue)
      );
      console.log('🔍 After minRevenue filter:', filtered.length);
    }

    if (packageFilters.maxRevenue) {
      filtered = filtered.filter(pkg =>
        pkg.total_revenue <= parseFloat(packageFilters.maxRevenue)
      );
      console.log('🔍 After maxRevenue filter:', filtered.length);
    }

    if (sortConfig.key && sortConfig.key !== 'total_spent') {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    console.log('✅ Final filtered packages:', filtered.length);
    console.log('✅ First filtered package:', filtered[0]);
    
    return filtered;
  };

  const filteredPackages = getFilteredAndSortedPackages();

  // Filter and sort destinations
  const getFilteredAndSortedDestinations = () => {
    let filtered = [...destinationAnalytics];

    if (destinationFilters.name) {
      filtered = filtered.filter(dest =>
        dest.destination.toLowerCase().includes(destinationFilters.name.toLowerCase())
      );
    }

    if (destinationFilters.minBookings) {
      filtered = filtered.filter(dest =>
        dest.total_bookings >= parseInt(destinationFilters.minBookings)
      );
    }

    if (destinationFilters.maxBookings) {
      filtered = filtered.filter(dest =>
        dest.total_bookings <= parseInt(destinationFilters.maxBookings)
      );
    }

    if (destinationFilters.minRevenue) {
      filtered = filtered.filter(dest =>
        dest.total_revenue >= parseFloat(destinationFilters.minRevenue)
      );
    }

    if (destinationFilters.maxRevenue) {
      filtered = filtered.filter(dest =>
        dest.total_revenue <= parseFloat(destinationFilters.maxRevenue)
      );
    }

    if (sortConfig.key && sortConfig.key !== 'total_spent') {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  };

  const filteredDestinations = getFilteredAndSortedDestinations();

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  // Render sections
  const sections = [
    { id: 'summary', label: '📊 Summary', icon: '📊' },
    { id: 'packages', label: '📦 Package Analytics', icon: '📦' },
    { id: 'status', label: '📈 Booking Status', icon: '📈' },
    { id: 'value', label: '💰 Booking Value', icon: '💰' },
    { id: 'customers', label: '👥 Top Customers', icon: '👥' },
    { id: 'revenue', label: '💵 Revenue Analytics', icon: '💵' },
    { id: 'destinations', label: '🗺️ Destinations', icon: '🗺️' },
    { id: 'export', label: '📄 Export Reports', icon: '📄' }
  ];

  return (
    <div className="reports-manager">
      {/* Header with filters */}
      <div className="reports-header">
        <div className="reports-title">
          <h2>📊 Reports & Analytics</h2>
          <p>Comprehensive insights into your business performance</p>
        </div>

        <div className="reports-controls">
          <div className="date-filters">
            <input
              type="date"
              name="start_date"
              value={dateRange.start_date}
              onChange={handleDateRangeChange}
              className="date-input"
              placeholder="Start Date"
            />
            <span className="date-separator">to</span>
            <input
              type="date"
              name="end_date"
              value={dateRange.end_date}
              onChange={handleDateRangeChange}
              className="date-input"
              placeholder="End Date"
            />
            {(dateRange.start_date || dateRange.end_date) && (
              <button onClick={clearDateRange} className="clear-date-btn">
                ✕ Clear
              </button>
            )}
          </div>

          <div className="auto-refresh-toggle">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              <span className="toggle-switch"></span>
              Auto-refresh (30s)
            </label>
          </div>

          <button onClick={fetchAllData} className="refresh-btn" disabled={loading}>
            {loading ? '🔄 Loading...' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="reports-nav">
        {sections.map(section => (
          <button
            key={section.id}
            className={`reports-nav-btn ${activeSection === section.id ? 'active' : ''}`}
            onClick={() => setActiveSection(section.id)}
          >
            <span className="nav-icon">{section.icon}</span>
            <span className="nav-label">{section.label}</span>
          </button>
        ))}
      </div>

      {/* Content area */}
      <div className="reports-content">
        {loading && <div className="reports-loading">Loading data...</div>}

        {/* Summary Section */}
        {activeSection === 'summary' && summaryData && (
          <div className="report-section">
            <h3 className="section-title">📊 Business Overview</h3>
            <div className="summary-grid">
              <div className="summary-card">
                <div className="summary-icon" style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>📋</div>
                <div className="summary-info">
                  <h4>{summaryData.total_bookings}</h4>
                  <p>Total Bookings</p>
                </div>
              </div>

              <div className="summary-card">
                <div className="summary-icon" style={{ background: 'linear-gradient(135deg, #43e97b, #38f9d7)' }}>✅</div>
                <div className="summary-info">
                  <h4>{summaryData.successful_bookings}</h4>
                  <p>Successful</p>
                </div>
              </div>

              <div className="summary-card">
                <div className="summary-icon" style={{ background: 'linear-gradient(135deg, #fa709a, #fee140)' }}>⏳</div>
                <div className="summary-info">
                  <h4>{summaryData.pending_bookings}</h4>
                  <p>Pending</p>
                </div>
              </div>

              <div className="summary-card">
                <div className="summary-icon" style={{ background: 'linear-gradient(135deg, #ff6b6b, #ee5a6f)' }}>❌</div>
                <div className="summary-info">
                  <h4>{summaryData.cancelled_bookings}</h4>
                  <p>Cancelled</p>
                </div>
              </div>

              <div className="summary-card">
                <div className="summary-icon" style={{ background: 'linear-gradient(135deg, #4facfe, #00f2fe)' }}>💰</div>
                <div className="summary-info">
                  <h4>{formatCurrency(summaryData.total_revenue)}</h4>
                  <p>Total Revenue</p>
                </div>
              </div>

              <div className="summary-card">
                <div className="summary-icon" style={{ background: 'linear-gradient(135deg, #a8edea, #fed6e3)' }}>📊</div>
                <div className="summary-info">
                  <h4>{formatCurrency(summaryData.average_booking_value)}</h4>
                  <p>Avg Booking Value</p>
                </div>
              </div>

              <div className="summary-card">
                <div className="summary-icon" style={{ background: 'linear-gradient(135deg, #f093fb, #f5576c)' }}>👥</div>
                <div className="summary-info">
                  <h4>{summaryData.unique_customers}</h4>
                  <p>Unique Customers</p>
                </div>
              </div>

              <div className="summary-card">
                <div className="summary-icon" style={{ background: 'linear-gradient(135deg, #fccb90, #d57eeb)' }}>🗺️</div>
                <div className="summary-info">
                  <h4>{summaryData.unique_destinations}</h4>
                  <p>Destinations</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Package Analytics Section */}
        {activeSection === 'packages' && (
          <div className="report-section">
            <h3 className="section-title">📦 Package Performance Analytics</h3>
            
            {/* Filter Controls */}
            {Object.values(packageFilters).some(val => val !== '') && (
              <button onClick={clearPackageFilters} className="clear-filters-btn" style={{ marginBottom: '15px' }}>
                ✕ Clear All Filters
              </button>
            )}
            
            {packageAnalytics.length > 0 ? (
              <>

                <div className="chart-container">
                  <h4>Top Packages by Revenue</h4>
                  {filteredPackages.slice(0, 10).length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={filteredPackages.slice(0, 10)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="package_name" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Legend />
                        <Bar dataKey="total_revenue" fill="#667eea" name="Total Revenue" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ padding: '50px', textAlign: 'center', color: '#999' }}>
                      No data available for chart
                    </div>
                  )}
                </div>

                <div className="data-table">
                  <table>
                    <thead>
                      <tr>
                        <th>
                          <div className="th-content">
                            <span>Package Name</span>
                            <button 
                              className="sort-btn" 
                              onClick={() => handleSort('package_name')}
                              title="Sort by name"
                            >
                              {sortConfig.key === 'package_name' 
                                ? (sortConfig.direction === 'asc' ? '▲' : '▼')
                                : '⇅'
                              }
                            </button>
                          </div>
                          <div className="filter-input-wrapper">
                            <span className="search-icon">🔍</span>
                            <input
                              type="text"
                              name="name"
                              value={packageFilters.name}
                              onChange={handlePackageFilterChange}
                              placeholder="Search package..."
                              className="filter-input"
                            />
                          </div>
                        </th>
                        <th>
                          <div className="th-content">
                            <span>Total Bookings</span>
                            <button 
                              className="sort-btn" 
                              onClick={() => handleSort('total_bookings')}
                              title="Sort by bookings"
                            >
                              {sortConfig.key === 'total_bookings' 
                                ? (sortConfig.direction === 'asc' ? '▲' : '▼')
                                : '⇅'
                              }
                            </button>
                          </div>
                          <div className="filter-input-wrapper" style={{ display: 'flex', gap: '6px' }}>
                            <input
                              type="number"
                              name="minBookings"
                              value={packageFilters.minBookings}
                              onChange={handlePackageFilterChange}
                              placeholder="Min"
                              className="filter-input"
                              style={{ width: '70px', padding: '10px 6px' }}
                            />
                            <input
                              type="number"
                              name="maxBookings"
                              value={packageFilters.maxBookings}
                              onChange={handlePackageFilterChange}
                              placeholder="Max"
                              className="filter-input"
                              style={{ width: '70px', padding: '10px 6px' }}
                            />
                          </div>
                        </th>
                        <th>
                          <div className="th-content">
                            <span>Successful</span>
                            <button 
                              className="sort-btn" 
                              onClick={() => handleSort('successful_bookings')}
                              title="Sort by successful"
                            >
                              {sortConfig.key === 'successful_bookings' 
                                ? (sortConfig.direction === 'asc' ? '▲' : '▼')
                                : '⇅'
                              }
                            </button>
                          </div>
                        </th>
                        <th>
                          <div className="th-content">
                            <span>Pending</span>
                            <button 
                              className="sort-btn" 
                              onClick={() => handleSort('pending_bookings')}
                              title="Sort by pending"
                            >
                              {sortConfig.key === 'pending_bookings' 
                                ? (sortConfig.direction === 'asc' ? '▲' : '▼')
                                : '⇅'
                              }
                            </button>
                          </div>
                        </th>
                        <th>
                          <div className="th-content">
                            <span>Total Revenue</span>
                            <button 
                              className="sort-btn" 
                              onClick={() => handleSort('total_revenue')}
                              title="Sort by revenue"
                            >
                              {sortConfig.key === 'total_revenue' 
                                ? (sortConfig.direction === 'asc' ? '▲' : '▼')
                                : '⇅'
                              }
                            </button>
                          </div>
                          <div className="filter-input-wrapper" style={{ display: 'flex', gap: '6px' }}>
                            <input
                              type="number"
                              name="minRevenue"
                              value={packageFilters.minRevenue}
                              onChange={handlePackageFilterChange}
                              placeholder="Min"
                              className="filter-input"
                              style={{ width: '75px', padding: '10px 6px' }}
                            />
                            <input
                              type="number"
                              name="maxRevenue"
                              value={packageFilters.maxRevenue}
                              onChange={handlePackageFilterChange}
                              placeholder="Max"
                              className="filter-input"
                              style={{ width: '75px', padding: '10px 6px' }}
                            />
                          </div>
                        </th>
                        <th>
                          <div className="th-content">
                            <span>Avg Value</span>
                            <button 
                              className="sort-btn" 
                              onClick={() => handleSort('avg_booking_value')}
                              title="Sort by average"
                            >
                              {sortConfig.key === 'avg_booking_value' 
                                ? (sortConfig.direction === 'asc' ? '▲' : '▼')
                                : '⇅'
                              }
                            </button>
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPackages.length > 0 ? (
                        filteredPackages.map((pkg, index) => (
                          <tr key={index}>
                            <td><strong>{pkg.package_name}</strong></td>
                            <td>{pkg.total_bookings}</td>
                            <td><span className="badge success">{pkg.successful_bookings}</span></td>
                            <td><span className="badge warning">{pkg.pending_bookings}</span></td>
                            <td><strong>{formatCurrency(pkg.total_revenue)}</strong></td>
                            <td>{formatCurrency(pkg.avg_booking_value)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#999' }}>
                            No packages match the selected filters
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="no-data">No package data available</div>
            )}
          </div>
        )}

        {/* Booking Status Section */}
        {activeSection === 'status' && (
          <div className="report-section">
            <h3 className="section-title">📈 Booking Status Breakdown</h3>
            
            <div className="charts-row">
              <div className="chart-container half">
                <h4>Status Distribution</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={bookingStatus.breakdown}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={(entry) => `${entry.status}: ${entry.percentage}%`}
                    >
                      {bookingStatus.breakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="status-stats">
                <h4>Status Summary</h4>
                {bookingStatus.breakdown.map((status, index) => (
                  <div key={index} className="status-item">
                    <div className="status-indicator" style={{ background: COLORS[index % COLORS.length] }}></div>
                    <div className="status-details">
                      <span className="status-name">{status.status}</span>
                      <span className="status-count">{status.count} bookings</span>
                      <span className="status-amount">{formatCurrency(status.total_amount)}</span>
                    </div>
                    <div className="status-percentage">{status.percentage}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Average Booking Value Section */}
        {activeSection === 'value' && avgBookingValue.stats && (
          <div className="report-section">
            <h3 className="section-title">💰 Average Booking Value Analysis</h3>
            
            <div className="value-stats-grid">
              <div className="value-stat-card">
                <h4>Average Value</h4>
                <p className="value-amount">{formatCurrency(avgBookingValue.stats.average_value)}</p>
              </div>
              <div className="value-stat-card">
                <h4>Minimum Value</h4>
                <p className="value-amount">{formatCurrency(avgBookingValue.stats.min_value)}</p>
              </div>
              <div className="value-stat-card">
                <h4>Maximum Value</h4>
                <p className="value-amount">{formatCurrency(avgBookingValue.stats.max_value)}</p>
              </div>
              <div className="value-stat-card">
                <h4>Total Revenue</h4>
                <p className="value-amount">{formatCurrency(avgBookingValue.stats.total_revenue)}</p>
              </div>
            </div>

            <div className="chart-container">
              <h4>Booking Value Distribution</h4>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={avgBookingValue.distribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="value_range" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="count" fill="#667eea" name="Number of Bookings" />
                  <Bar dataKey="total_revenue" fill="#764ba2" name="Total Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Top Customers Section */}
        {activeSection === 'customers' && (
          <div className="report-section">
            <h3 className="section-title">👥 Top Customers by Spending</h3>
            
            {/* Filter Controls */}
            {Object.values(customerFilters).some(val => val !== '') && (
              <button onClick={clearCustomerFilters} className="clear-filters-btn" style={{ marginBottom: '15px' }}>
                ✕ Clear All Filters
              </button>
            )}
            
            {topCustomers.length > 0 ? (
              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>
                        <div className="th-content">
                          <span>Rank</span>
                        </div>
                      </th>
                      <th>
                        <div className="th-content">
                          <span>Customer Name</span>
                          <button 
                            className="sort-btn" 
                            onClick={() => handleSort('customer_name')}
                            title="Sort by name"
                          >
                            {sortConfig.key === 'customer_name' 
                              ? (sortConfig.direction === 'asc' ? '▲' : '▼')
                              : '⇅'
                            }
                          </button>
                        </div>
                        <div className="filter-input-wrapper">
                          <span className="search-icon">🔍</span>
                          <input
                            type="text"
                            name="name"
                            value={customerFilters.name}
                            onChange={handleCustomerFilterChange}
                            placeholder="Search name..."
                            className="filter-input"
                          />
                        </div>
                      </th>
                      <th>
                        <div className="th-content">
                          <span>Email</span>
                          <button 
                            className="sort-btn" 
                            onClick={() => handleSort('email')}
                            title="Sort by email"
                          >
                            {sortConfig.key === 'email' 
                              ? (sortConfig.direction === 'asc' ? '▲' : '▼')
                              : '⇅'
                            }
                          </button>
                        </div>
                        <div className="filter-input-wrapper">
                          <span className="search-icon">🔍</span>
                          <input
                            type="text"
                            name="email"
                            value={customerFilters.email}
                            onChange={handleCustomerFilterChange}
                            placeholder="Search email..."
                            className="filter-input"
                          />
                        </div>
                      </th>
                      <th>
                        <div className="th-content">
                          <span>Phone</span>
                          <button 
                            className="sort-btn" 
                            onClick={() => handleSort('phone')}
                            title="Sort by phone"
                          >
                            {sortConfig.key === 'phone' 
                              ? (sortConfig.direction === 'asc' ? '▲' : '▼')
                              : '⇅'
                            }
                          </button>
                        </div>
                        <div className="filter-input-wrapper">
                          <span className="search-icon">🔍</span>
                          <input
                            type="text"
                            name="phone"
                            value={customerFilters.phone}
                            onChange={handleCustomerFilterChange}
                            placeholder="Search phone..."
                            className="filter-input"
                          />
                        </div>
                      </th>
                      <th>
                        <div className="th-content">
                          <span>Total Bookings</span>
                          <button 
                            className="sort-btn" 
                            onClick={() => handleSort('total_bookings')}
                            title="Sort by bookings"
                          >
                            {sortConfig.key === 'total_bookings' 
                              ? (sortConfig.direction === 'asc' ? '▲' : '▼')
                              : '⇅'
                            }
                          </button>
                        </div>
                        <div className="filter-input-wrapper" style={{ display: 'flex', gap: '6px' }}>
                          <input
                            type="number"
                            name="minBookings"
                            value={customerFilters.minBookings}
                            onChange={handleCustomerFilterChange}
                            placeholder="Min"
                            className="filter-input"
                            style={{ width: '70px', padding: '10px 6px' }}
                          />
                          <input
                            type="number"
                            name="maxBookings"
                            value={customerFilters.maxBookings}
                            onChange={handleCustomerFilterChange}
                            placeholder="Max"
                            className="filter-input"
                            style={{ width: '70px', padding: '10px 6px' }}
                          />
                        </div>
                      </th>
                      <th>
                        <div className="th-content">
                          <span>Total Spent</span>
                          <button 
                            className="sort-btn" 
                            onClick={() => handleSort('total_spent')}
                            title="Sort by spending"
                          >
                            {sortConfig.key === 'total_spent' 
                              ? (sortConfig.direction === 'asc' ? '▲' : '▼')
                              : '⇅'
                            }
                          </button>
                        </div>
                        <div className="filter-input-wrapper" style={{ display: 'flex', gap: '6px' }}>
                          <input
                            type="number"
                            name="minSpent"
                            value={customerFilters.minSpent}
                            onChange={handleCustomerFilterChange}
                            placeholder="Min"
                            className="filter-input"
                            style={{ width: '75px', padding: '10px 6px' }}
                          />
                          <input
                            type="number"
                            name="maxSpent"
                            value={customerFilters.maxSpent}
                            onChange={handleCustomerFilterChange}
                            placeholder="Max"
                            className="filter-input"
                            style={{ width: '75px', padding: '10px 6px' }}
                          />
                        </div>
                      </th>
                      <th>
                        <div className="th-content">
                          <span>Avg Booking</span>
                          <button 
                            className="sort-btn" 
                            onClick={() => handleSort('avg_booking_value')}
                            title="Sort by average"
                          >
                            {sortConfig.key === 'avg_booking_value' 
                              ? (sortConfig.direction === 'asc' ? '▲' : '▼')
                              : '⇅'
                            }
                          </button>
                        </div>
                      </th>
                      <th>
                        <div className="th-content">
                          <span>Last Booking</span>
                          <button 
                            className="sort-btn" 
                            onClick={() => handleSort('last_booking_date')}
                            title="Sort by date"
                          >
                            {sortConfig.key === 'last_booking_date' 
                              ? (sortConfig.direction === 'asc' ? '▲' : '▼')
                              : '⇅'
                            }
                          </button>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.length > 0 ? (
                      filteredCustomers.map((customer, index) => (
                        <tr key={index} className={index < 3 ? 'top-customer' : ''}>
                          <td>
                            <span className="rank-badge">
                              {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                            </span>
                          </td>
                          <td><strong>{customer.customer_name}</strong></td>
                          <td>{customer.email}</td>
                          <td>{customer.phone}</td>
                          <td>{customer.total_bookings}</td>
                          <td><strong>{formatCurrency(customer.total_spent)}</strong></td>
                          <td>{formatCurrency(customer.avg_booking_value)}</td>
                          <td>{new Date(customer.last_booking_date).toLocaleDateString()}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#999' }}>
                          No customers match the selected filters
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="no-data">
                <p>No customer data available</p>
                <p style={{ fontSize: '14px', color: '#999', marginTop: '10px' }}>
                  {dateRange.start_date || dateRange.end_date 
                    ? 'Try clearing the date filter or selecting a different date range' 
                    : 'No bookings found in the database'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Revenue Analytics Section */}
        {activeSection === 'revenue' && (
          <div className="report-section">
            <h3 className="section-title">💵 Revenue Analytics</h3>
            
            <div className="period-selector">
              <button
                className={`period-btn ${revenuePeriod === 'day' ? 'active' : ''}`}
                onClick={() => { setRevenuePeriod('day'); fetchRevenueAnalytics(); }}
              >
                Daily
              </button>
              <button
                className={`period-btn ${revenuePeriod === 'week' ? 'active' : ''}`}
                onClick={() => { setRevenuePeriod('week'); fetchRevenueAnalytics(); }}
              >
                Weekly
              </button>
              <button
                className={`period-btn ${revenuePeriod === 'month' ? 'active' : ''}`}
                onClick={() => { setRevenuePeriod('month'); fetchRevenueAnalytics(); }}
              >
                Monthly
              </button>
            </div>

            {revenueAnalytics.length > 0 ? (
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={revenueAnalytics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Line type="monotone" dataKey="total_revenue" stroke="#667eea" strokeWidth={3} name="Revenue" />
                    <Line type="monotone" dataKey="total_bookings" stroke="#43e97b" strokeWidth={2} name="Bookings" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="no-data">No revenue data available</div>
            )}
          </div>
        )}

        {/* Destinations Section */}
        {activeSection === 'destinations' && (
          <div className="report-section">
            <h3 className="section-title">🗺️ Destination Performance</h3>
            
            {/* Filter Controls */}
            {Object.values(destinationFilters).some(val => val !== '') && (
              <button onClick={clearDestinationFilters} className="clear-filters-btn" style={{ marginBottom: '15px' }}>
                ✕ Clear All Filters
              </button>
            )}
            
            {destinationAnalytics.length > 0 ? (
              <>
                <div className="chart-container">
                  <h4>Top Destinations by Bookings</h4>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={filteredDestinations.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="destination" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="total_bookings" fill="#667eea" name="Total Bookings" />
                      <Bar dataKey="successful_bookings" fill="#43e97b" name="Successful" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="data-table">
                  <table>
                    <thead>
                      <tr>
                        <th>
                          <div className="th-content">
                            <span>Destination</span>
                            <button 
                              className="sort-btn" 
                              onClick={() => handleSort('destination')}
                              title="Sort by name"
                            >
                              {sortConfig.key === 'destination' 
                                ? (sortConfig.direction === 'asc' ? '▲' : '▼')
                                : '⇅'
                              }
                            </button>
                          </div>
                          <div className="filter-input-wrapper">
                            <span className="search-icon">🔍</span>
                            <input
                              type="text"
                              name="name"
                              value={destinationFilters.name}
                              onChange={handleDestinationFilterChange}
                              placeholder="Search destination..."
                              className="filter-input"
                            />
                          </div>
                        </th>
                        <th>
                          <div className="th-content">
                            <span>Total Bookings</span>
                            <button 
                              className="sort-btn" 
                              onClick={() => handleSort('total_bookings')}
                              title="Sort by bookings"
                            >
                              {sortConfig.key === 'total_bookings' 
                                ? (sortConfig.direction === 'asc' ? '▲' : '▼')
                                : '⇅'
                              }
                            </button>
                          </div>
                          <div className="filter-input-wrapper" style={{ display: 'flex', gap: '6px' }}>
                            <input
                              type="number"
                              name="minBookings"
                              value={destinationFilters.minBookings}
                              onChange={handleDestinationFilterChange}
                              placeholder="Min"
                              className="filter-input"
                              style={{ width: '70px', padding: '10px 6px' }}
                            />
                            <input
                              type="number"
                              name="maxBookings"
                              value={destinationFilters.maxBookings}
                              onChange={handleDestinationFilterChange}
                              placeholder="Max"
                              className="filter-input"
                              style={{ width: '70px', padding: '10px 6px' }}
                            />
                          </div>
                        </th>
                        <th>
                          <div className="th-content">
                            <span>Successful</span>
                            <button 
                              className="sort-btn" 
                              onClick={() => handleSort('successful_bookings')}
                              title="Sort by successful"
                            >
                              {sortConfig.key === 'successful_bookings' 
                                ? (sortConfig.direction === 'asc' ? '▲' : '▼')
                                : '⇅'
                              }
                            </button>
                          </div>
                        </th>
                        <th>
                          <div className="th-content">
                            <span>Total Revenue</span>
                            <button 
                              className="sort-btn" 
                              onClick={() => handleSort('total_revenue')}
                              title="Sort by revenue"
                            >
                              {sortConfig.key === 'total_revenue' 
                                ? (sortConfig.direction === 'asc' ? '▲' : '▼')
                                : '⇅'
                              }
                            </button>
                          </div>
                          <div className="filter-input-wrapper" style={{ display: 'flex', gap: '6px' }}>
                            <input
                              type="number"
                              name="minRevenue"
                              value={destinationFilters.minRevenue}
                              onChange={handleDestinationFilterChange}
                              placeholder="Min"
                              className="filter-input"
                              style={{ width: '75px', padding: '10px 6px' }}
                            />
                            <input
                              type="number"
                              name="maxRevenue"
                              value={destinationFilters.maxRevenue}
                              onChange={handleDestinationFilterChange}
                              placeholder="Max"
                              className="filter-input"
                              style={{ width: '75px', padding: '10px 6px' }}
                            />
                          </div>
                        </th>
                        <th>
                          <div className="th-content">
                            <span>Avg Revenue</span>
                            <button 
                              className="sort-btn" 
                              onClick={() => handleSort('avg_revenue')}
                              title="Sort by average"
                            >
                              {sortConfig.key === 'avg_revenue' 
                                ? (sortConfig.direction === 'asc' ? '▲' : '▼')
                                : '⇅'
                              }
                            </button>
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDestinations.length > 0 ? (
                        filteredDestinations.map((dest, index) => (
                          <tr key={index}>
                            <td><strong>{dest.destination}</strong></td>
                            <td>{dest.total_bookings}</td>
                            <td><span className="badge success">{dest.successful_bookings}</span></td>
                            <td><strong>{formatCurrency(dest.total_revenue)}</strong></td>
                            <td>{formatCurrency(dest.avg_revenue)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#999' }}>
                            No destinations match the selected filters
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="no-data">No destination data available</div>
            )}
          </div>
        )}

        {/* Export Reports Section */}
        {activeSection === 'export' && (
          <div className="report-section">
            <h3 className="section-title">📄 Export Reports</h3>
            
            <div className="export-grid">
              <div className="export-card">
                <div className="export-icon">📋</div>
                <h4>Bookings Report</h4>
                <p>Export all booking data with payment details</p>
                <button onClick={() => handleExport('bookings')} className="export-btn">
                  📥 Download CSV
                </button>
              </div>

              <div className="export-card">
                <div className="export-icon">📦</div>
                <h4>Packages Analytics</h4>
                <p>Export package performance metrics</p>
                <button onClick={() => handleExport('packages')} className="export-btn">
                  📥 Download CSV
                </button>
              </div>

              <div className="export-card">
                <div className="export-icon">👥</div>
                <h4>Top Customers</h4>
                <p>Export customer spending analysis</p>
                <button onClick={() => handleExport('customers')} className="export-btn">
                  📥 Download CSV
                </button>
              </div>
            </div>

            <div className="export-info">
              <h4>📌 Export Notes:</h4>
              <ul>
                <li>All exports respect the selected date range</li>
                <li>CSV files can be opened in Excel or Google Sheets</li>
                <li>Data is exported in real-time from the database</li>
                <li>File names include the current date for easy organization</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsManager;
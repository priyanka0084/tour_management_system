import React, { useState, useEffect } from 'react';
import { 
  FiShield,        // Make Admin icon
  FiUserMinus,    // Make User icon
  FiTrash2,       // Delete icon
  FiSearch,       // Search icon
  FiFilter,       // Filter toggle icon
  FiChevronUp,    // Sort up icon
  FiChevronDown,  // Sort down icon
  FiX             // Clear filters icon
} from 'react-icons/fi';
import config from '../../config';

const UserManager = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'admin', 'user'
  const [filters, setFilters] = useState({
    id: '',
    full_name: '',
    email: '',
    role_filter: 'all',      // Column dropdown filter
    date_from: '',           // Date range start
    date_to: ''              // Date range end
  });

  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc'
  });

  const [showFilters, setShowFilters] = useState(true);
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${config.API_BASE_URL}/admin/users`);
      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      alert('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeRole = async (id, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!window.confirm(`Change user role to ${newRole}?`)) return;

    try {
      const response = await fetch(`${config.API_BASE_URL}/admin/users/${id}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });

      const data = await response.json();
      
      if (data.success) {
        alert(data.message);
        fetchUsers();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Error changing role:', error);
      alert('Failed to change role');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      const response = await fetch(`${config.API_BASE_URL}/admin/users/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.success) {
        alert(data.message);
        fetchUsers();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRoleBadge = (role) => {
    const isAdmin = role === 'admin';
    return (
      <span style={{
        padding: '5px 12px',
        borderRadius: '15px',
        fontSize: '12px',
        fontWeight: '600',
        backgroundColor: isAdmin ? '#d1ecf1' : '#d4edda',
        color: isAdmin ? '#0c5460' : '#155724'
      }}>
        {role?.toUpperCase() || 'USER'}
      </span>
    );
  };
  // ===================================
// STEP 2: ADD THESE FUNCTIONS AFTER getRoleBadge()
// Add these before the existing filteredUsers logic
// ===================================

// Handle filter changes
const handleFilterChange = (field, value) => {
  setFilters(prev => ({
    ...prev,
    [field]: value
  }));
};

// Handle sorting
const handleSort = (key) => {
  let direction = 'asc';
  if (sortConfig.key === key && sortConfig.direction === 'asc') {
    direction = 'desc';
  }
  setSortConfig({ key, direction });
};

// Clear all column filters
const clearFilters = () => {
  setFilters({
    id: '',
    full_name: '',
    email: '',
    role_filter: 'all',
    date_from: '',
    date_to: ''
  });
  setSortConfig({ key: null, direction: 'asc' });
};

// Enhanced filter and sort function
const getFilteredAndSortedUsers = () => {
  let filtered = [...users];

  // Apply top filter buttons (All/Admin/User)
  if (filter === 'admin') {
    filtered = filtered.filter(user => user.role === 'admin');
  } else if (filter === 'user') {
    filtered = filtered.filter(user => user.role === 'user' || !user.role);
  }

  // Apply column filters
  if (filters.id) {
    filtered = filtered.filter(user => 
      user.id.toString().includes(filters.id)
    );
  }

  if (filters.full_name) {
    filtered = filtered.filter(user =>
      user.full_name.toLowerCase().includes(filters.full_name.toLowerCase())
    );
  }

  if (filters.email) {
    filtered = filtered.filter(user =>
      user.email.toLowerCase().includes(filters.email.toLowerCase())
    );
  }

  // Role column dropdown filter
  if (filters.role_filter !== 'all') {
    filtered = filtered.filter(user => {
      if (filters.role_filter === 'admin') return user.role === 'admin';
      if (filters.role_filter === 'user') return user.role === 'user' || !user.role;
      return true;
    });
  }

  // Date range filter
  if (filters.date_from) {
    const fromDate = new Date(filters.date_from);
    filtered = filtered.filter(user => {
      const userDate = new Date(user.created_at);
      return userDate >= fromDate;
    });
  }

  if (filters.date_to) {
    const toDate = new Date(filters.date_to);
    toDate.setHours(23, 59, 59, 999); // Include the entire day
    filtered = filtered.filter(user => {
      const userDate = new Date(user.created_at);
      return userDate <= toDate;
    });
  }

  // Apply sorting
  if (sortConfig.key) {
    filtered.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      // Handle date sorting
      if (sortConfig.key === 'created_at') {
        aVal = new Date(a.created_at);
        bVal = new Date(b.created_at);
      }

      // Handle null/undefined values
      if (!aVal) aVal = '';
      if (!bVal) bVal = '';

      // Convert to lowercase for string comparison
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      if (aVal < bVal) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aVal > bVal) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  return filtered;
};
  const filteredUsers = users.filter(user => {
    if (filter === 'all') return true;
    if (filter === 'admin') return user.role === 'admin';
    if (filter === 'user') return user.role === 'user' || !user.role;
    return true;
  });
  {/* ===================================
    STEP 3: REPLACE THE ENTIRE RETURN SECTION
    Replace from the return statement onwards
    =================================== */}

return (
  <div className="user-manager">
    <div className="section-header">
      <h2>Users Management</h2>
      <button className="add-btn" onClick={fetchUsers}>
        🔄 Refresh
      </button>
    </div>

    {/* ✅ Keep existing filter buttons */}
    <div className="filter-buttons" style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
      <button 
        onClick={() => setFilter('all')}
        style={{
          padding: '10px 20px',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          background: filter === 'all' ? 'linear-gradient(135deg, #667eea, #764ba2)' : '#f0f0f0',
          color: filter === 'all' ? 'white' : '#333',
          fontWeight: '600',
          transition: 'all 0.3s ease'
        }}
      >
        All ({users.length})
      </button>
      <button 
        onClick={() => setFilter('admin')}
        style={{
          padding: '10px 20px',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          background: filter === 'admin' ? 'linear-gradient(135deg, #667eea, #764ba2)' : '#f0f0f0',
          color: filter === 'admin' ? 'white' : '#333',
          fontWeight: '600',
          transition: 'all 0.3s ease'
        }}
      >
        Admins ({users.filter(u => u.role === 'admin').length})
      </button>
      <button 
        onClick={() => setFilter('user')}
        style={{
          padding: '10px 20px',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          background: filter === 'user' ? 'linear-gradient(135deg, #667eea, #764ba2)' : '#f0f0f0',
          color: filter === 'user' ? 'white' : '#333',
          fontWeight: '600',
          transition: 'all 0.3s ease'
        }}
      >
        Users ({users.filter(u => u.role === 'user' || !u.role).length})
      </button>
    </div>

    {loading ? (
      <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
    ) : (
      <div className="data-table">
        {/* Filter Toggle Button for Mobile */}
        <button 
          className="filter-toggle-btn"
          onClick={() => setShowFilters(!showFilters)}
        >
          <FiFilter size={18} />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>

        {/* Clear Filters Button */}
        {(filters.id || filters.full_name || filters.email || 
          filters.role_filter !== 'all' || filters.date_from || 
          filters.date_to || sortConfig.key) && (
          <button className="clear-filters-btn" onClick={clearFilters}>
            <FiX size={16} />
            Clear All Filters
          </button>
        )}

        <table>
          <thead>
            <tr>
              {/* ID Column */}
              <th>
                <div className="th-content">
                  <span>ID</span>
                  <button 
                    className="sort-btn"
                    onClick={() => handleSort('id')}
                  >
                    {sortConfig.key === 'id' ? (
                      sortConfig.direction === 'asc' ? 
                        <FiChevronUp size={16} /> : <FiChevronDown size={16} />
                    ) : (
                      <FiChevronDown size={16} className="sort-icon-default" />
                    )}
                  </button>
                </div>
                {showFilters && (
                  <div className="filter-input-wrapper">
                    <FiSearch size={14} className="search-icon" />
                    <input
                      type="text"
                      placeholder="Search ID..."
                      value={filters.id}
                      onChange={(e) => handleFilterChange('id', e.target.value)}
                      className="filter-input"
                    />
                  </div>
                )}
              </th>

              {/* Avatar Column - NO FILTER */}
              <th>
                <div className="th-content">
                  <span>Avatar</span>
                </div>
              </th>

              {/* Full Name Column */}
              <th>
                <div className="th-content">
                  <span>Full Name</span>
                  <button 
                    className="sort-btn"
                    onClick={() => handleSort('full_name')}
                  >
                    {sortConfig.key === 'full_name' ? (
                      sortConfig.direction === 'asc' ? 
                        <FiChevronUp size={16} /> : <FiChevronDown size={16} />
                    ) : (
                      <FiChevronDown size={16} className="sort-icon-default" />
                    )}
                  </button>
                </div>
                {showFilters && (
                  <div className="filter-input-wrapper">
                    <FiSearch size={14} className="search-icon" />
                    <input
                      type="text"
                      placeholder="Search name..."
                      value={filters.full_name}
                      onChange={(e) => handleFilterChange('full_name', e.target.value)}
                      className="filter-input"
                    />
                  </div>
                )}
              </th>

              {/* Email Column */}
              <th>
                <div className="th-content">
                  <span>Email</span>
                  <button 
                    className="sort-btn"
                    onClick={() => handleSort('email')}
                  >
                    {sortConfig.key === 'email' ? (
                      sortConfig.direction === 'asc' ? 
                        <FiChevronUp size={16} /> : <FiChevronDown size={16} />
                    ) : (
                      <FiChevronDown size={16} className="sort-icon-default" />
                    )}
                  </button>
                </div>
                {showFilters && (
                  <div className="filter-input-wrapper">
                    <FiSearch size={14} className="search-icon" />
                    <input
                      type="text"
                      placeholder="Search email..."
                      value={filters.email}
                      onChange={(e) => handleFilterChange('email', e.target.value)}
                      className="filter-input"
                    />
                  </div>
                )}
              </th>

              {/* Role Column */}
              <th>
                <div className="th-content">
                  <span>Role</span>
                  <button 
                    className="sort-btn"
                    onClick={() => handleSort('role')}
                  >
                    {sortConfig.key === 'role' ? (
                      sortConfig.direction === 'asc' ? 
                        <FiChevronUp size={16} /> : <FiChevronDown size={16} />
                    ) : (
                      <FiChevronDown size={16} className="sort-icon-default" />
                    )}
                  </button>
                </div>
                {showFilters && (
                  <div className="filter-input-wrapper">
                    <select
                      value={filters.role_filter}
                      onChange={(e) => handleFilterChange('role_filter', e.target.value)}
                      className="filter-select"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="all">All Roles</option>
                      <option value="admin">Admin</option>
                      <option value="user">User</option>
                    </select>
                  </div>
                )}
              </th>

              {/* Registered On Column */}
              <th>
                <div className="th-content">
                  <span>Registered On</span>
                  <button 
                    className="sort-btn"
                    onClick={() => handleSort('created_at')}
                  >
                    {sortConfig.key === 'created_at' ? (
                      sortConfig.direction === 'asc' ? 
                        <FiChevronUp size={16} /> : <FiChevronDown size={16} />
                    ) : (
                      <FiChevronDown size={16} className="sort-icon-default" />
                    )}
                  </button>
                </div>
                {showFilters && (
                  <div className="filter-input-wrapper" style={{ display: 'flex', gap: '5px', flexDirection: 'column' }}>
                    <input
                      type="date"
                      placeholder="From date"
                      value={filters.date_from}
                      onChange={(e) => handleFilterChange('date_from', e.target.value)}
                      className="filter-input"
                      style={{ fontSize: '12px', padding: '6px' }}
                    />
                    <input
                      type="date"
                      placeholder="To date"
                      value={filters.date_to}
                      onChange={(e) => handleFilterChange('date_to', e.target.value)}
                      className="filter-input"
                      style={{ fontSize: '12px', padding: '6px' }}
                    />
                  </div>
                )}
              </th>

              {/* Actions Column */}
              <th>
                <div className="th-content">
                  <span>Actions</span>
                </div>
              </th>
            </tr>
          </thead>
          
          <tbody>
            {getFilteredAndSortedUsers().length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                  No users found matching your filters
                </td>
              </tr>
            ) : (
              getFilteredAndSortedUsers().map(user => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #667eea, #764ba2)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '16px'
                    }}>
                      {user.full_name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  </td>
                  <td>{user.full_name}</td>
                  <td>{user.email}</td>
                  <td>{getRoleBadge(user.role)}</td>
                  <td>{formatDate(user.created_at)}</td>
                  <td className="action-buttons">
                    {/* ✨ Icon Buttons - Beautiful Actions */}
                    <button 
                      className="icon-btn"
                      onClick={() => handleChangeRole(user.id, user.role)}
                      title={user.role === 'admin' ? 'Make User' : 'Make Admin'}
                      style={{
                        background: user.role === 'admin' 
                          ? 'rgba(52, 152, 219, 0.2)' 
                          : 'rgba(255, 193, 7, 0.2)',
                        color: user.role === 'admin' ? '#3498db' : '#ffc107',
                        boxShadow: user.role === 'admin' 
                          ? '0 4px 15px rgba(52, 152, 219, 0.3)' 
                          : '0 4px 15px rgba(255, 193, 7, 0.3)'
                      }}
                    >
                      {user.role === 'admin' ? (
                        <FiUserMinus size={16} />
                      ) : (
                        <FiShield size={16} />
                      )}
                    </button>
                    
                    <button 
                      className="icon-btn delete-icon-btn"
                      onClick={() => handleDeleteUser(user.id)}
                      title="Delete User"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    )}
  </div>
);
};

export default UserManager;
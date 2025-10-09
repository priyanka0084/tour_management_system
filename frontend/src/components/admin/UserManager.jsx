import React, { useState, useEffect } from 'react';
import config from '../../config';

const UserManager = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'admin', 'user'

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

  const filteredUsers = users.filter(user => {
    if (filter === 'all') return true;
    if (filter === 'admin') return user.role === 'admin';
    if (filter === 'user') return user.role === 'user' || !user.role;
    return true;
  });

  return (
    <div className="user-manager">
      <div className="section-header">
        <h2>Users Management</h2>
        <button className="add-btn" onClick={fetchUsers}>
          🔄 Refresh
        </button>
      </div>

      {/* Filter Buttons */}
      <div className="filter-buttons" style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button 
          onClick={() => setFilter('all')}
          style={{
            padding: '8px 16px',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            background: filter === 'all' ? '#667eea' : '#f0f0f0',
            color: filter === 'all' ? 'white' : '#333',
            fontWeight: '500'
          }}
        >
          All ({users.length})
        </button>
        <button 
          onClick={() => setFilter('admin')}
          style={{
            padding: '8px 16px',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            background: filter === 'admin' ? '#667eea' : '#f0f0f0',
            color: filter === 'admin' ? 'white' : '#333',
            fontWeight: '500'
          }}
        >
          Admins ({users.filter(u => u.role === 'admin').length})
        </button>
        <button 
          onClick={() => setFilter('user')}
          style={{
            padding: '8px 16px',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            background: filter === 'user' ? '#667eea' : '#f0f0f0',
            color: filter === 'user' ? 'white' : '#333',
            fontWeight: '500'
          }}
        >
          Users ({users.filter(u => u.role === 'user' || !u.role).length})
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
      ) : (
        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Avatar</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Registered On</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
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
                      <button 
                        className="edit-btn"
                        onClick={() => handleChangeRole(user.id, user.role)}
                        style={{ background: '#ffc107', color: '#000' }}
                      >
                        {user.role === 'admin' ? 'Make User' : 'Make Admin'}
                      </button>
                      <button 
                        className="delete-btn"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        Delete
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
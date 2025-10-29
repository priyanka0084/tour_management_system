// frontend/src/components/admin/TopCustomersCard.jsx

import React from 'react';
import '../../styles/topCustomers.css';

const TopCustomersCard = ({ customers, loading }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getMedalEmoji = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return null;
  };

  const getGradient = (index) => {
    const gradients = [
      'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)', // Gold
      'linear-gradient(135deg, #C0C0C0 0%, #808080 100%)', // Silver
      'linear-gradient(135deg, #CD7F32 0%, #8B4513 100%)'  // Bronze
    ];
    return gradients[index] || 'linear-gradient(135deg, #667eea, #764ba2)';
  };

  if (loading) {
    return (
      <div className="top-customers-card">
        <div className="top-customers-header">
          <h3>🏆 Top 3 Customers</h3>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!customers || customers.length === 0) {
    return (
      <div className="top-customers-card">
        <div className="top-customers-header">
          <h3>🏆 Top 3 Customers</h3>
          <p>No customer data available</p>
        </div>
      </div>
    );
  }

  // Get top 3 customers only
  const topThree = customers.slice(0, 3);

  return (
    <div className="top-customers-card">
      <div className="top-customers-header">
        <h3>🏆 Top 3 Customers</h3>
        <p>Highest spending customers</p>
      </div>

      <div className="customers-grid">
        {topThree.map((customer, index) => (
          <div 
            key={index} 
            className="customer-card" 
            style={{ background: getGradient(index) }}
          >
            <div className="medal-badge">
              {getMedalEmoji(index)}
            </div>

            <div className="customer-info">
              <h4 className="customer-name">{customer.customer_name}</h4>
              <p className="customer-email">{customer.email}</p>
            </div>

            <div className="customer-stats">
              <div className="stat-item">
                <span className="stat-label">Total Bookings</span>
                <span className="stat-value">{customer.total_bookings}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Total Spent</span>
                <span className="stat-value">{formatCurrency(customer.total_spent)}</span>
              </div>
            </div>

            <div className="customer-badge">
              <span className="rank-text">Rank #{index + 1}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopCustomersCard;
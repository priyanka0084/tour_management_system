// ========================================
// ADMIN REVIEW MANAGER COMPONENT
// Main interface for managing all reviews
// ========================================

import React, { useState, useEffect } from 'react';
import {
  Star,
  Filter,
  CheckCircle,
  XCircle,
  Trash2,
  Eye,
  MoreVertical,
  Search,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  MessageSquare,
  ThumbsUp,
  Flag
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../services/api';
import StarRating from '../reviews/StarRating';
import ReviewImages from '../reviews/ReviewImages';
import '../../styles/adminReviews.css';

const ReviewManager = () => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    total_reviews: 0,
    pending_reviews: 0,
    approved_reviews: 0,
    rejected_reviews: 0,
    average_rating: 0
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    rating: 'all',
    sort_by: 'recent'
  });
  const [selectedReviews, setSelectedReviews] = useState([]);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);

  useEffect(() => {
    fetchReviews();
    fetchStats();
  }, [filters]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        status: filters.status,
        rating: filters.rating,
        sort_by: filters.sort_by,
        limit: 50
      });

      const response = await api.get(`/admin/reviews?${params}`);
      if (response.data.success) {
        setReviews(response.data.reviews || []);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/reviews/stats');
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleApprove = async (reviewId) => {
    try {
      const response = await api.put(`/admin/reviews/${reviewId}/approve`);
      if (response.data.success) {
        toast.success('Review approved successfully');
        fetchReviews();
        fetchStats();
      }
    } catch (error) {
      console.error('Error approving review:', error);
      toast.error('Failed to approve review');
    }
  };

  const handleReject = async (reviewId) => {
    try {
      const response = await api.put(`/admin/reviews/${reviewId}/reject`);
      if (response.data.success) {
        toast.success('Review rejected');
        fetchReviews();
        fetchStats();
      }
    } catch (error) {
      console.error('Error rejecting review:', error);
      toast.error('Failed to reject review');
    }
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await api.delete(`/admin/reviews/${reviewId}`);
      if (response.data.success) {
        toast.success('Review deleted successfully');
        fetchReviews();
        fetchStats();
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      toast.error('Failed to delete review');
    }
  };

  const handleBulkApprove = async () => {
    if (selectedReviews.length === 0) {
      toast.warning('Please select reviews to approve');
      return;
    }

    try {
      const response = await api.post('/admin/reviews/bulk-approve', {
        review_ids: selectedReviews
      });
      if (response.data.success) {
        toast.success(`${selectedReviews.length} reviews approved`);
        setSelectedReviews([]);
        fetchReviews();
        fetchStats();
      }
    } catch (error) {
      console.error('Error bulk approving:', error);
      toast.error('Failed to approve reviews');
    }
  };

  const handleBulkReject = async () => {
    if (selectedReviews.length === 0) {
      toast.warning('Please select reviews to reject');
      return;
    }

    try {
      const response = await api.post('/admin/reviews/bulk-reject', {
        review_ids: selectedReviews
      });
      if (response.data.success) {
        toast.success(`${selectedReviews.length} reviews rejected`);
        setSelectedReviews([]);
        fetchReviews();
        fetchStats();
      }
    } catch (error) {
      console.error('Error bulk rejecting:', error);
      toast.error('Failed to reject reviews');
    }
  };

  const handleSelectAll = () => {
    if (selectedReviews.length === reviews.length) {
      setSelectedReviews([]);
    } else {
      setSelectedReviews(reviews.map(r => r.id));
    }
  };

  const handleSelectReview = (reviewId) => {
    if (selectedReviews.includes(reviewId)) {
      setSelectedReviews(selectedReviews.filter(id => id !== reviewId));
    } else {
      setSelectedReviews([...selectedReviews, reviewId]);
    }
  };

  const viewDetails = async (reviewId) => {
    try {
      const response = await api.get(`/admin/reviews/${reviewId}`);
      if (response.data.success) {
        setSelectedReview(response.data.review);
        setShowDetailsModal(true);
      }
    } catch (error) {
      console.error('Error fetching review details:', error);
      toast.error('Failed to load review details');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { class: 'status-pending', icon: AlertCircle, text: 'Pending' },
      approved: { class: 'status-approved', icon: CheckCircle, text: 'Approved' },
      rejected: { class: 'status-rejected', icon: XCircle, text: 'Rejected' }
    };
    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;

    return (
      <span className={`status-badge ${badge.class}`}>
        <Icon size={14} />
        {badge.text}
      </span>
    );
  };

  return (
    <div className="review-manager">
      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card stat-total">
          <div className="stat-icon">
            <MessageSquare size={32} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats.total_reviews}</div>
            <div className="stat-label">Total Reviews</div>
          </div>
        </div>

        <div className="stat-card stat-pending">
          <div className="stat-icon">
            <AlertCircle size={32} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats.pending_reviews}</div>
            <div className="stat-label">Pending Approval</div>
          </div>
        </div>

        <div className="stat-card stat-approved">
          <div className="stat-icon">
            <CheckCircle size={32} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats.approved_reviews}</div>
            <div className="stat-label">Approved</div>
          </div>
        </div>

        <div className="stat-card stat-rating">
          <div className="stat-icon">
            <Star size={32} fill="currentColor" />
          </div>
          <div className="stat-info">
            <div className="stat-value">{Number(stats.average_rating || 0).toFixed(1)}</div>
            <div className="stat-label">Avg Rating</div>
          </div>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="admin-toolbar">
        <div className="toolbar-filters">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={filters.rating}
            onChange={(e) => setFilters({ ...filters, rating: e.target.value })}
            className="filter-select"
          >
            <option value="all">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4+ Stars</option>
            <option value="3">3+ Stars</option>
            <option value="2">2+ Stars</option>
            <option value="1">1+ Stars</option>
          </select>

          <select
            value={filters.sort_by}
            onChange={(e) => setFilters({ ...filters, sort_by: e.target.value })}
            className="filter-select"
          >
            <option value="recent">Most Recent</option>
            <option value="oldest">Oldest First</option>
            <option value="rating_high">Highest Rated</option>
            <option value="rating_low">Lowest Rated</option>
            <option value="reported">Most Reported</option>
          </select>

          <button onClick={fetchReviews} className="btn-icon" title="Refresh">
            <RefreshCw size={18} />
          </button>
        </div>

        {selectedReviews.length > 0 && (
          <div className="bulk-actions">
            <span className="bulk-count">{selectedReviews.length} selected</span>
            <button onClick={handleBulkApprove} className="btn-approve">
              <CheckCircle size={18} />
              Approve
            </button>
            <button onClick={handleBulkReject} className="btn-reject">
              <XCircle size={18} />
              Reject
            </button>
          </div>
        )}
      </div>

      {/* Reviews Table */}
      <div className="reviews-table-container">
        {loading ? (
          <div className="loading-state">
            <RefreshCw className="spinner" size={40} />
            <p>Loading reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="empty-state">
            <MessageSquare size={60} strokeWidth={1.5} />
            <h3>No Reviews Found</h3>
            <p>No reviews match your current filters</p>
          </div>
        ) : (
          <table className="reviews-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <input
                    type="checkbox"
                    checked={selectedReviews.length === reviews.length}
                    onChange={handleSelectAll}
                  />
                </th>
                <th>Review</th>
                <th>Rating</th>
                <th>Place</th>
                <th>User</th>
                <th>Date</th>
                <th>Status</th>
                <th style={{ width: '120px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) => (
                <tr key={review.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedReviews.includes(review.id)}
                      onChange={() => handleSelectReview(review.id)}
                    />
                  </td>
                  <td>
                    <div className="review-cell">
                      <strong>{review.title}</strong>
                      <p className="review-excerpt">
                        {review.review_text.substring(0, 100)}...
                      </p>
                      {review.images && (
                        <div className="review-images-indicator">
                          📷 {review.images.split(',').length} {review.images.split(',').length === 1 ? 'image' : 'images'}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <StarRating rating={review.rating} size={16} />
                  </td>
                  <td>
                    <div className="place-cell">
                      {review.place_name}
                      <span className="country-name">{review.country_name}</span>
                    </div>
                  </td>
                  <td>
                    <div className="user-cell">
                      {review.user_name}
                      {review.verified_purchase && (
                        <span className="verified-badge">✓</span>
                      )}
                    </div>
                  </td>
                  <td>
                    {new Date(review.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </td>
                  <td>{getStatusBadge(review.status)}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => viewDetails(review.id)}
                        className="btn-action btn-view"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      {review.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(review.id)}
                            className="btn-action btn-approve"
                            title="Approve"
                          >
                            <CheckCircle size={16} />
                          </button>
                          <button
                            onClick={() => handleReject(review.id)}
                            className="btn-action btn-reject"
                            title="Reject"
                          >
                            <XCircle size={16} />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(review.id)}
                        className="btn-action btn-delete"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Review Details Modal */}
      {showDetailsModal && selectedReview && (
        <ReviewDetailsModal
          review={selectedReview}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedReview(null);
          }}
          onApprove={handleApprove}
          onReject={handleReject}
          onDelete={handleDelete}
          onRefresh={fetchReviews}
        />
      )}
    </div>
  );
};

// Review Details Modal Component
const ReviewDetailsModal = ({ review, onClose, onApprove, onReject, onDelete, onRefresh }) => {
  const [adminNotes, setAdminNotes] = useState(review.admin_notes || '');
  const [saving, setSaving] = useState(false);

  const saveNotes = async () => {
    setSaving(true);
    try {
      await api.put(`/admin/reviews/${review.id}/notes`, { admin_notes: adminNotes });
      toast.success('Notes saved');
      onRefresh();
    } catch (error) {
      toast.error('Failed to save notes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content review-details-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Review Details</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* Review Info */}
          <div className="review-detail-section">
            <div className="detail-header">
              <StarRating rating={review.rating} size={24} showNumber />
              {getStatusBadge(review.status)}
            </div>
            <h3>{review.title}</h3>
            <p className="review-full-text">{review.review_text}</p>
          </div>

          {/* Images */}
          {review.images && review.images.length > 0 && (
            <div className="review-detail-section">
              <h4>Images</h4>
              <ReviewImages images={review.images.map(img => img.image_url)} />
            </div>
          )}

          {/* User & Place Info */}
          <div className="review-detail-grid">
            <div className="review-detail-section">
              <h4>User Information</h4>
              <p><strong>Name:</strong> {review.user_name}</p>
              <p><strong>Email:</strong> {review.user_email}</p>
              <p><strong>Verified:</strong> {review.verified_purchase ? 'Yes ✓' : 'No'}</p>
            </div>

            <div className="review-detail-section">
              <h4>Place Information</h4>
              <p><strong>Place:</strong> {review.place_name}</p>
              <p><strong>Country:</strong> {review.country_name}</p>
              {review.package_name && (
                <p><strong>Package:</strong> {review.package_name}</p>
              )}
            </div>
          </div>

          {/* Engagement Stats */}
          <div className="review-detail-section">
            <h4>Engagement</h4>
            <div className="engagement-stats">
              <div className="engagement-item">
                <ThumbsUp size={16} />
                <span>{review.helpful_count || 0} helpful votes</span>
              </div>
              <div className="engagement-item">
                <Flag size={16} />
                <span>{review.reported_count || 0} reports</span>
              </div>
            </div>
          </div>

          {/* Admin Notes */}
          <div className="review-detail-section">
            <h4>Admin Notes</h4>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Add internal notes about this review..."
              rows={4}
              className="admin-notes-input"
            />
            <button onClick={saveNotes} disabled={saving} className="btn-save-notes">
              {saving ? 'Saving...' : 'Save Notes'}
            </button>
          </div>
        </div>

        <div className="modal-actions">
          {review.status === 'pending' && (
            <>
              <button
                onClick={() => {
                  onApprove(review.id);
                  onClose();
                }}
                className="btn-primary btn-approve"
              >
                <CheckCircle size={18} />
                Approve Review
              </button>
              <button
                onClick={() => {
                  onReject(review.id);
                  onClose();
                }}
                className="btn-secondary btn-reject"
              >
                <XCircle size={18} />
                Reject Review
              </button>
            </>
          )}
          <button
            onClick={() => {
              onDelete(review.id);
              onClose();
            }}
            className="btn-danger"
          >
            <Trash2 size={18} />
            Delete Review
          </button>
        </div>
      </div>
    </div>
  );
};

const getStatusBadge = (status) => {
  const badges = {
    pending: { class: 'badge-warning', text: 'Pending' },
    approved: { class: 'badge-success', text: 'Approved' },
    rejected: { class: 'badge-danger', text: 'Rejected' }
  };
  const badge = badges[status] || badges.pending;

  return <span className={`badge ${badge.class}`}>{badge.text}</span>;
};

export default ReviewManager;
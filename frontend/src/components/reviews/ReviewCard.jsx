// ========================================
// REVIEW CARD COMPONENT
// Individual review display with images, helpful votes, etc.
// ========================================

import React, { useState } from 'react';
import { 
  ThumbsUp, 
  MapPin, 
  Package, 
  Calendar,
  CheckCircle,
  Flag,
  MoreVertical,
  Edit,
  Trash2,
  X
} from 'lucide-react';
import StarRating from './StarRating';
import ReviewImages from './ReviewImages';
import { toast } from 'react-toastify';
import api from '../../services/api';

const ReviewCard = ({ 
  review, 
  isOwn = false,
  onEdit,
  onDelete,
  onRefresh,
  showActions = true
}) => {
  const [isHelpful, setIsHelpful] = useState(false);
  const [helpfulCount, setHelpfulCount] = useState(review.helpful_count || 0);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(false);

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Handle helpful vote
  const handleHelpful = async () => {
    try {
      const response = await api.post(`/reviews/${review.id}/helpful`);
      
      if (response.data.success) {
        setIsHelpful(response.data.helpful);
        setHelpfulCount(prev => response.data.helpful ? prev + 1 : prev - 1);
        toast.success(response.data.helpful ? 'Marked as helpful!' : 'Removed helpful vote');
      }
    } catch (error) {
      console.error('Error marking helpful:', error);
      toast.error('Please login to mark reviews as helpful');
    }
  };

  // Handle report
  const handleReport = async (reason, description) => {
    setLoading(true);
    try {
      const response = await api.post(`/reviews/${review.id}/report`, {
        reason,
        description
      });

      if (response.data.success) {
        toast.success('Report submitted successfully');
        setShowReportModal(false);
      }
    } catch (error) {
      console.error('Error reporting review:', error);
      toast.error(error.response?.data?.error || 'Failed to report review');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDeleteClick = async () => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;

    setLoading(true);
    try {
      await api.delete(`/reviews/${review.id}`);
      toast.success('Review deleted successfully');
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error deleting review:', error);
      toast.error('Failed to delete review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="review-card">
      {/* Header */}
      <div className="review-header">
        <div className="review-author-section">
          {/* Author Avatar */}
          <img
            src={
              review.user_image || 
              `https://ui-avatars.com/api/?name=${encodeURIComponent(review.user_name)}&size=48&background=14b8a6&color=fff&bold=true`
            }
            alt={review.user_name}
            className="review-avatar"
          />

          <div className="review-author-info">
            <div className="review-author-header">
              <h4 className="review-author-name">{review.user_name}</h4>
              {review.verified_purchase && (
                <span className="verified-badge" title="Verified Purchase">
                  <CheckCircle size={16} />
                  <span>Verified</span>
                </span>
              )}
            </div>
            
            <div className="review-meta">
              <span className="review-date">{formatDate(review.created_at)}</span>
              {review.place_name && (
                <>
                  <span className="review-meta-separator">•</span>
                  <span className="review-location">
                    <MapPin size={14} />
                    {review.place_name}, {review.country_name}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Actions Menu */}
        {showActions && (
          <div className="review-actions-menu">
            <button 
              className="review-menu-btn"
              onClick={() => setShowMenu(!showMenu)}
            >
              <MoreVertical size={20} />
            </button>

            {showMenu && (
              <div className="review-menu-dropdown">
                {isOwn ? (
                  <>
                    <button onClick={() => {
                      setShowMenu(false);
                      if (onEdit) onEdit(review);
                    }}>
                      <Edit size={16} />
                      <span>Edit Review</span>
                    </button>
                    <button 
                      onClick={() => {
                        setShowMenu(false);
                        handleDeleteClick();
                      }}
                      className="danger"
                    >
                      <Trash2 size={16} />
                      <span>Delete Review</span>
                    </button>
                  </>
                ) : (
                  <button onClick={() => {
                    setShowMenu(false);
                    setShowReportModal(true);
                  }}>
                    <Flag size={16} />
                    <span>Report Review</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Rating & Title */}
      <div className="review-rating-section">
        <StarRating rating={review.rating} size={20} />
        <h3 className="review-title">{review.title}</h3>
      </div>

      {/* Review Text */}
      <p className="review-text">{review.review_text}</p>

      {/* Review Images */}
      {review.images && review.images.length > 0 && (
        <ReviewImages images={review.images} />
      )}

      {/* Package Info (if available) */}
      {review.package_name && (
        <div className="review-package-info">
          <Package size={16} />
          <span>{review.package_name}</span>
          {review.tour_date && (
            <>
              <span className="review-meta-separator">•</span>
              <Calendar size={16} />
              <span>Traveled in {new Date(review.tour_date).toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
            </>
          )}
        </div>
      )}

      {/* Footer Actions */}
      <div className="review-footer">
        <button 
          className={`helpful-btn ${isHelpful ? 'active' : ''}`}
          onClick={handleHelpful}
        >
          <ThumbsUp size={18} />
          <span>Helpful ({helpfulCount})</span>
        </button>

        {review.status && review.status !== 'approved' && (
          <span className={`review-status-badge ${review.status}`}>
            {review.status === 'pending' ? 'Pending Approval' : 'Rejected'}
          </span>
        )}
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <ReportModal
          onClose={() => setShowReportModal(false)}
          onSubmit={handleReport}
          loading={loading}
        />
      )}
    </div>
  );
};

// Report Modal Component
const ReportModal = ({ onClose, onSubmit, loading }) => {
  const [reason, setReason] = useState('spam');
  const [description, setDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(reason, description);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Report Review</h3>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Reason for reporting</label>
            <select 
              value={reason} 
              onChange={(e) => setReason(e.target.value)}
              required
            >
              <option value="spam">Spam</option>
              <option value="offensive">Offensive Content</option>
              <option value="fake">Fake Review</option>
              <option value="irrelevant">Irrelevant</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label>Additional details (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide more information..."
              rows="4"
            />
          </div>

          <div className="modal-actions">
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewCard;
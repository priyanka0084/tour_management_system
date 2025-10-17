// ========================================
// WRITE REVIEW MODAL COMPONENT
// Review submission form with image upload
// ========================================

import React, { useState } from 'react';
import { X, Upload, Star, Image as ImageIcon, Trash2, Loader } from 'lucide-react';
import StarRating from './StarRating';
import { toast } from 'react-toastify';
import api from '../../services/api';

const WriteReviewModal = ({ 
  booking, 
  onClose, 
  onSuccess 
}) => {
  const [formData, setFormData] = useState({
    rating: 0,
    title: '',
    review_text: ''
  });
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Handle rating change
  const handleRatingChange = (rating) => {
    setFormData(prev => ({ ...prev, rating }));
    if (errors.rating) {
      setErrors(prev => ({ ...prev, rating: null }));
    }
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    // Validate total images
    if (images.length + files.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    // Validate each file
    const validFiles = [];
    const newPreviews = [];

    files.forEach(file => {
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`);
        return;
      }

      // Check file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 5MB limit`);
        return;
      }

      validFiles.push(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result);
        if (newPreviews.length === validFiles.length) {
          setImagePreviews(prev => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });

    setImages(prev => [...prev, ...validFiles]);
  };

  // Remove image
  const handleRemoveImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Validate form
  const validate = () => {
    const newErrors = {};

    if (formData.rating === 0) {
      newErrors.rating = 'Please select a rating';
    }

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 10) {
      newErrors.title = 'Title must be at least 10 characters';
    } else if (formData.title.length > 200) {
      newErrors.title = 'Title must be less than 200 characters';
    }

    if (!formData.review_text.trim()) {
      newErrors.review_text = 'Review text is required';
    } else if (formData.review_text.length < 50) {
      newErrors.review_text = 'Review must be at least 50 characters';
    } else if (formData.review_text.length > 2000) {
      newErrors.review_text = 'Review must be less than 2000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);

    try {
      // Create FormData for multipart upload
      const formDataToSend = new FormData();
      formDataToSend.append('booking_id', booking.id);
      formDataToSend.append('place_id', booking.place_id);
      if (booking.package_id) {
        formDataToSend.append('package_id', booking.package_id);
      }
      formDataToSend.append('rating', formData.rating);
      formDataToSend.append('title', formData.title);
      formDataToSend.append('review_text', formData.review_text);

      // Append images
      images.forEach((image) => {
        formDataToSend.append('images', image);
      });

      const response = await api.post('/reviews', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        toast.success('Review submitted successfully! It will be visible after admin approval.');
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error(error.response?.data?.error || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content write-review-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2>Write a Review</h2>
            <p className="modal-subtitle">
              {booking.place_name && `${booking.place_name} - `}
              {booking.package_name || booking.tour_destination}
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose} disabled={loading}>
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="write-review-form">
          {/* Rating */}
          <div className="form-group">
            <label className="form-label required">
              <Star size={18} />
              Your Rating
            </label>
            <div className="rating-input-container">
              <StarRating
                rating={formData.rating}
                interactive
                size={40}
                onRatingChange={handleRatingChange}
              />
              {formData.rating > 0 && (
                <span className="rating-text">
                  {getRatingText(formData.rating)}
                </span>
              )}
            </div>
            {errors.rating && <span className="error-text">{errors.rating}</span>}
          </div>

          {/* Title */}
          <div className="form-group">
            <label className="form-label required">Review Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Summarize your experience in one line..."
              maxLength={200}
              disabled={loading}
              className={errors.title ? 'error' : ''}
            />
            <div className="form-helper">
              <span>{formData.title.length}/200 characters</span>
            </div>
            {errors.title && <span className="error-text">{errors.title}</span>}
          </div>

          {/* Review Text */}
          <div className="form-group">
            <label className="form-label required">Your Review</label>
            <textarea
              name="review_text"
              value={formData.review_text}
              onChange={handleChange}
              placeholder="Share your detailed experience... What did you like? What could be better?"
              rows={8}
              maxLength={2000}
              disabled={loading}
              className={errors.review_text ? 'error' : ''}
            />
            <div className="form-helper">
              <span>{formData.review_text.length}/2000 characters (minimum 50)</span>
            </div>
            {errors.review_text && <span className="error-text">{errors.review_text}</span>}
          </div>

          {/* Image Upload */}
          <div className="form-group">
            <label className="form-label">
              <ImageIcon size={18} />
              Add Photos (Optional)
            </label>
            <p className="form-helper-text">
              Upload up to 5 images (max 5MB each)
            </p>

            {/* Image Previews */}
            {imagePreviews.length > 0 && (
              <div className="image-previews-grid">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="image-preview-item">
                    <img src={preview} alt={`Preview ${index + 1}`} />
                    <button
                      type="button"
                      className="remove-image-btn"
                      onClick={() => handleRemoveImage(index)}
                      disabled={loading}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Button */}
            {images.length < 5 && (
              <label className="image-upload-btn">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  disabled={loading}
                  style={{ display: 'none' }}
                />
                <Upload size={20} />
                <span>Choose Images</span>
              </label>
            )}
          </div>

          {/* Form Actions */}
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
              {loading ? (
                <>
                  <Loader className="spinner" size={18} />
                  Submitting...
                </>
              ) : (
                'Submit Review'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Helper function for rating text
const getRatingText = (rating) => {
  const texts = {
    1: 'Poor',
    2: 'Fair',
    3: 'Good',
    4: 'Very Good',
    5: 'Excellent'
  };
  return texts[rating] || '';
};

export default WriteReviewModal;
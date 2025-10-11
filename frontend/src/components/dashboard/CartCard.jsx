import React from 'react';
import { MapPin, Calendar, Star, Trash2, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CartCard = ({ item, onRemove, onBookNow }) => {
  console.log('📦 CartCard received item:', item);
  const navigate = useNavigate();

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(price);
  };

  const handleBookNow = () => {
    // Navigate to packages page with this place
    navigate(`/packages/${item.place_id}`);
  };

  const handleRemoveClick = () => {
    if (window.confirm(`Remove ${item.place_name} from cart?`)) {
      onRemove(item.cart_id);
    }
  };

  return (
    <div className="cart-card">
      {/* Cart Item Image */}
      <div className="cart-card-image">
        <img
          src={item.image_url || 'https://via.placeholder.com/400x300?text=No+Image'}
          alt={item.place_name}
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
          }}
        />
        <div className="cart-rating-badge">
          <Star className="star-icon" fill="currentColor" />
          <span>{item.rating || '0.0'}/5</span>
        </div>
      </div>

      {/* Cart Item Details */}
      <div className="cart-card-content">
        {/* Header */}
        <div className="cart-card-header">
          <h3 className="cart-place-title">{item.place_name}</h3>
          <button 
            className="cart-remove-btn"
            onClick={handleRemoveClick}
            title="Remove from cart"
          >
            <Trash2 className="trash-icon" />
          </button>
        </div>

        {/* Location */}
        <div className="cart-location">
          <MapPin className="location-icon" />
          <span>{item.country_name}</span>
        </div>

        {/* Description */}
        <p className="cart-description">
          {item.place_description && item.place_description.length > 100
            ? `${item.place_description.substring(0, 100)}...`
            : item.place_description || 'Explore this amazing destination'}
        </p>

        {/* Info Grid */}
        <div className="cart-info-grid">
          <div className="cart-info-item">
            <Calendar className="info-icon" />
            <div className="info-content">
              <span className="info-label">Duration</span>
              <span className="info-value">{item.duration_days} days</span>
            </div>
          </div>

          <div className="cart-info-item">
            <ShoppingBag className="info-icon" />
            <div className="info-content">
              <span className="info-label">Price</span>
              <span className="info-value price">{formatPrice(item.price_per_person)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="cart-card-actions">
          <button 
            className="book-now-btn"
            onClick={handleBookNow}
          >
            <ShoppingBag className="btn-icon" />
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartCard;
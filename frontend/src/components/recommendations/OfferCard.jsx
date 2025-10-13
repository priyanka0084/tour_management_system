import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Clock, MapPin, Star, Calendar } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';

const OfferCard = ({ offer }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { addToCart, isInCart } = useCart();

  const [timeLeft, setTimeLeft] = useState('');
  const [isWishlistAnimating, setIsWishlistAnimating] = useState(false);
  const [isCartAnimating, setIsCartAnimating] = useState(false);

  // Check if offer is in wishlist/cart
  const inWishlist = isInWishlist(offer.place_id);
  const inCart = isInCart(offer.place_id);

  // Calculate time remaining
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const validUntil = new Date(offer.valid_until);
      const difference = validUntil - now;

      if (difference <= 0) {
        setTimeLeft('Expired');
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h left`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m left`);
      } else {
        setTimeLeft(`${minutes}m left`);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [offer.valid_until]);

  // Handle card click
  const handleCardClick = () => {
    navigate(`/packages/${offer.place_id}`);
  };

  // Handle add to wishlist
  const handleWishlist = async (e) => {
    e.stopPropagation();

    if (!user) {
      toast.info('Please login to add to wishlist');
      navigate('/login');
      return;
    }

    setIsWishlistAnimating(true);

    try {
      if (inWishlist) {
        await removeFromWishlist(offer.place_id);
        toast.success('Removed from wishlist', {
          position: 'bottom-right',
          autoClose: 2000
        });
      } else {
        await addToWishlist({
          place_id: offer.place_id,
          place_name: offer.place_name,
          place_image: offer.image_url,
          country_name: offer.country_name,
          price: offer.new_price,
          rating: offer.rating,
          duration: offer.duration_days
        });
        toast.success('❤️ Added to wishlist!', {
          position: 'bottom-right',
          autoClose: 2000
        });
      }
    } catch (error) {
      console.error('Error updating wishlist:', error);
      toast.error('Failed to update wishlist');
    } finally {
      setTimeout(() => setIsWishlistAnimating(false), 600);
    }
  };

  // Handle add to cart
  const handleCart = async (e) => {
    e.stopPropagation();

    if (!user) {
      toast.info('Please login to add to cart');
      navigate('/login');
      return;
    }

    if (inCart) {
      toast.info('Already in cart!');
      return;
    }

    setIsCartAnimating(true);

    try {
      await addToCart({
        place_id: offer.place_id,
        place_name: offer.place_name,
        place_image: offer.image_url,
        country_name: offer.country_name,
        price: offer.new_price,
        rating: offer.rating,
        duration: offer.duration_days,
        quantity: 1
      });
      
      toast.success('🛒 Added to cart!', {
        position: 'bottom-right',
        autoClose: 2000
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add to cart');
    } finally {
      setTimeout(() => setIsCartAnimating(false), 600);
    }
  };

  // Calculate savings amount
  const savingsAmount = offer.old_price - offer.new_price;

  // Check if offer is expiring soon
  const isExpiringSoon = offer.days_remaining <= 3;

  // Check if limited spots
  const isLimited = offer.spots_left <= 5;

  return (
    <div className="offer-card" onClick={handleCardClick}>
      {/* Discount Badge */}
      <div className="offer-badge">
        {offer.discount_percent}% OFF
      </div>

      {/* Image Section */}
      <div className="offer-card-image">
        <img 
          src={offer.image_url || 'https://via.placeholder.com/400x250?text=Special+Offer'} 
          alt={offer.place_name}
          loading="lazy"
        />

        {/* Countdown Timer */}
        <div className={`offer-timer ${isExpiringSoon ? 'expiring-soon' : ''}`}>
          <Clock size={16} />
          <span>{timeLeft}</span>
        </div>

        {/* Action Buttons */}
        <div className="offer-card-actions">
          <button
            onClick={handleWishlist}
            className={`card-action-btn ${inWishlist ? 'liked' : ''} ${isWishlistAnimating ? 'animating' : ''}`}
            title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart className={inWishlist ? 'filled' : ''} />
          </button>

          <button
            onClick={handleCart}
            className={`card-action-btn ${inCart ? 'in-cart' : ''} ${isCartAnimating ? 'animating' : ''}`}
            title={inCart ? 'Already in cart' : 'Add to cart'}
            disabled={inCart}
          >
            <ShoppingCart />
          </button>
        </div>
      </div>

      {/* Content Section */}
      <div className="offer-card-content">
        {/* Title */}
        <h3 className="offer-title">{offer.title || offer.place_name}</h3>

        {/* Location */}
        <div className="offer-location">
          <MapPin size={16} />
          <span>{offer.place_name}, {offer.country_name}</span>
        </div>

        {/* Description */}
        {offer.description && (
          <p className="offer-description">
            {offer.description.length > 80 
              ? `${offer.description.substring(0, 80)}...` 
              : offer.description
            }
          </p>
        )}

        {/* Rating & Duration */}
        <div className="offer-details">
          {offer.rating && (
            <div className="offer-detail-item">
              <Star size={14} fill="#ffc107" color="#ffc107" />
              <span>{Number(offer.rating).toFixed(1)}</span>
            </div>
          )}
          {offer.duration_days && (
            <div className="offer-detail-item">
              <Calendar size={14} />
              <span>{offer.duration_days} days</span>
            </div>
          )}
        </div>

        {/* Pricing */}
        <div className="offer-pricing">
          <div className="price-group">
            <span className="old-price">₹{Number(offer.old_price).toLocaleString()}</span>
            <span className="new-price">₹{Number(offer.new_price).toLocaleString()}</span>
          </div>
          <div className="savings">
            Save ₹{savingsAmount.toLocaleString()}
          </div>
        </div>

        {/* Footer */}
        <div className="offer-footer">
          {isLimited && (
            <span className="spots-left">
              🔥 Only {offer.spots_left} spots left!
            </span>
          )}
          <button 
            className="book-offer-btn"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/packages/${offer.place_id}`);
            }}
          >
            Book Now
          </button>
        </div>
      </div>

      {/* Expiring Soon Ribbon (if applicable) */}
      {isExpiringSoon && (
        <div className="expiring-ribbon">
          ⚡ Ending Soon!
        </div>
      )}
    </div>
  );
};

export default OfferCard;
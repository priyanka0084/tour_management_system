import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Star, MapPin, Eye, ThumbsUp, Clock } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import axios from 'axios';

const RecommendedPlaceCard = ({ place, showBadges = true }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { addToCart, isInCart } = useCart();

  const [isLiked, setIsLiked] = useState(place.is_liked || false);
  const [likeCount, setLikeCount] = useState(place.total_likes || 0);
  const [isWishlistAnimating, setIsWishlistAnimating] = useState(false);
  const [isCartAnimating, setIsCartAnimating] = useState(false);

  // Check if place is in wishlist
  const inWishlist = isInWishlist(place.id);
  const inCart = isInCart(place.id);

  // Handle card click - navigate to packages page
  const handleCardClick = () => {
    // Track view
    trackView();
    // Navigate to packages page for this place
    navigate(`/packages/${place.id}`);
  };

  // Track place view
  const trackView = async () => {
    try {
      await axios.post('http://localhost:5000/api/recommendations/track-view', {
        placeId: place.id,
        userId: user?.id || null,
        sessionId: sessionStorage.getItem('session_id') || generateSessionId()
      });
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  // Generate session ID for anonymous users
  const generateSessionId = () => {
    const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem('session_id', sessionId);
    return sessionId;
  };

  // Handle like/unlike
  const handleLike = async (e) => {
    e.stopPropagation(); // Prevent card click

    if (!user) {
      toast.info('Please login to like places');
      navigate('/login');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(
        'http://localhost:5000/api/recommendations/track-like',
        { placeId: place.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setIsLiked(response.data.liked);
        setLikeCount(prev => response.data.liked ? prev + 1 : prev - 1);
        
        toast.success(response.data.liked ? '❤️ Place liked!' : 'Removed from likes', {
          position: 'bottom-right',
          autoClose: 2000
        });
      }
    } catch (error) {
      console.error('Error liking place:', error);
      toast.error('Failed to update like status');
    }
  };

  // Handle add to wishlist
  const handleWishlist = async (e) => {
    e.stopPropagation(); // Prevent card click

    if (!user) {
      toast.info('Please login to add to wishlist');
      navigate('/login');
      return;
    }

    setIsWishlistAnimating(true);

    try {
      if (inWishlist) {
        await removeFromWishlist(place.id);
        toast.success('Removed from wishlist', {
          position: 'bottom-right',
          autoClose: 2000
        });
      } else {
        await addToWishlist({
          id: place.id,
          place_id: place.id,
          place_name: place.name,
          place_image: place.image_url,
          country_name: place.country_name,
          price: place.price_per_person,
          rating: place.rating,
          duration: place.duration_days
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
    e.stopPropagation(); // Prevent card click

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
        id: place.id,
        place_id: place.id,
        place_name: place.name,
        place_image: place.image_url,
        country_name: place.country_name,
        price: place.price_per_person,
        rating: place.rating,
        duration: place.duration_days,
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

  // Get first 2 tags for badges
  const displayTags = place.place_tags?.slice(0, 2) || [];
  const displayIcons = place.tag_icons?.slice(0, 2) || [];

  return (
    <div className="place-card" onClick={handleCardClick}>
      {/* Image Section */}
      <div className="place-card-image">
        <img 
          src={place.image_url || 'https://via.placeholder.com/400x300?text=No+Image'} 
          alt={place.name}
          loading="lazy"
        />

        {/* Smart Badges */}
        {showBadges && displayTags.length > 0 && (
          <div className="place-card-badges">
            {displayTags.map((tag, index) => (
              <span key={index} className="badge" title={`Perfect for ${tag}`}>
                <span>{displayIcons[index] || '🏷️'}</span>
                <span>{tag}</span>
              </span>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="place-card-actions">
          {/* Wishlist Button */}
          <button
            onClick={handleWishlist}
            className={`card-action-btn ${inWishlist ? 'liked' : ''} ${isWishlistAnimating ? 'animating' : ''}`}
            title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart className={inWishlist ? 'filled' : ''} />
          </button>

          {/* Cart Button */}
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
      <div className="place-card-content">
        {/* Header */}
        <div className="place-card-header">
          <h3 className="place-card-title">{place.name}</h3>
          {place.rating && (
            <div className="place-card-rating">
              <Star size={16} fill="currentColor" />
              <span>{Number(place.rating).toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Location */}
        <div className="place-card-location">
          <MapPin size={16} />
          <span>{place.country_name}</span>
        </div>

        {/* Stats */}
        <div className="place-card-stats">
          {place.total_views > 0 && (
            <div className="stat-item" title="Total views">
              <Eye size={16} />
              <span>{place.total_views.toLocaleString()}</span>
            </div>
          )}
          {likeCount > 0 && (
            <div className="stat-item" title="Total likes">
              <ThumbsUp size={16} />
              <span>{likeCount}</span>
            </div>
          )}
          {place.duration_days && (
            <div className="stat-item" title="Duration">
              <Clock size={16} />
              <span>{place.duration_days} days</span>
            </div>
          )}
        </div>

        {/* Description (if available) */}
        {place.description && (
          <p className="place-card-description">
            {place.description.length > 100 
              ? `${place.description.substring(0, 100)}...` 
              : place.description
            }
          </p>
        )}

        {/* Footer */}
        <div className="place-card-footer">
          <div className="place-card-price">
            <span className="price-label">Starting from</span>
            <span className="price-value">
              ₹{Number(place.price_per_person).toLocaleString()}
            </span>
          </div>
          <button 
            className="view-details-btn"
            onClick={handleCardClick}
          >
            View Details →
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecommendedPlaceCard;
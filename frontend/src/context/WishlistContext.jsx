import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch wishlist when user logs in
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchWishlist();
    } else {
      // Clear wishlist when user logs out
      setWishlistItems([]);
      setWishlistCount(0);
    }
  }, [isAuthenticated, user]);

  // ==================== FETCH WISHLIST ITEMS ====================
  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const response = await api.get('/wishlist');
      
      console.log('❤️ Wishlist API Response:', response.data);
      
      if (response.data.success) {
        console.log('✅ Wishlist Items:', response.data.wishlist);
        console.log('✅ Wishlist Count:', response.data.count);
        
        setWishlistItems(response.data.wishlist || []);
        setWishlistCount(response.data.count || 0);
      }
    } catch (error) {
      console.error('❌ Error fetching wishlist:', error);
      setWishlistItems([]);
      setWishlistCount(0);
    } finally {
      setLoading(false);
    }
  };

  // ==================== ADD TO WISHLIST ====================
  const addToWishlist = async (place) => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to wishlist', {
        position: 'top-right',
        autoClose: 2000
      });
      return { success: false, needsLogin: true };
    }

    try {
      console.log('💖 Adding place to wishlist:', place);
      
      const response = await api.post('/wishlist/add', {
        place_id: place.id,
        package_id: null,
        notes: null
      });

      console.log('📥 Add to wishlist response:', response.data);

      if (response.data.success) {
        toast.success(`❤️ ${place.name} added to wishlist!`, {
          position: 'top-right',
          autoClose: 2000
        });

        // Update wishlist count
        setWishlistCount(response.data.wishlistCount || wishlistCount + 1);
        
        // Refresh full wishlist
        await fetchWishlist();

        return { success: true };
      }
    } catch (error) {
      console.error('❌ Error adding to wishlist:', error);
      
      if (error.response?.data?.alreadyInWishlist) {
        toast.warning('This place is already in your wishlist!', {
          position: 'top-right',
          autoClose: 2000
        });
        return { success: false, alreadyInWishlist: true };
      }

      toast.error(error.response?.data?.error || 'Failed to add to wishlist', {
        position: 'top-right',
        autoClose: 2000
      });
      return { success: false };
    }
  };

  // ==================== REMOVE FROM WISHLIST ====================
  const removeFromWishlist = async (wishlistId) => {
    try {
      const response = await api.delete(`/wishlist/remove/${wishlistId}`);

      if (response.data.success) {
        toast.success(response.data.message || 'Removed from wishlist', {
          position: 'top-right',
          autoClose: 2000
        });

        // Update local state
        setWishlistItems(wishlistItems.filter(item => item.wishlist_id !== wishlistId));
        setWishlistCount(response.data.wishlistCount || Math.max(0, wishlistCount - 1));

        return { success: true };
      }
    } catch (error) {
      console.error('❌ Error removing from wishlist:', error);
      toast.error('Failed to remove from wishlist', {
        position: 'top-right',
        autoClose: 2000
      });
      return { success: false };
    }
  };

  // ==================== CLEAR WISHLIST ====================
  const clearWishlist = async () => {
    try {
      const response = await api.delete('/wishlist/clear');

      if (response.data.success) {
        toast.success('Wishlist cleared successfully!', {
          position: 'top-right',
          autoClose: 2000
        });

        setWishlistItems([]);
        setWishlistCount(0);

        return { success: true };
      }
    } catch (error) {
      console.error('❌ Error clearing wishlist:', error);
      toast.error('Failed to clear wishlist', {
        position: 'top-right',
        autoClose: 2000
      });
      return { success: false };
    }
  };

  // ==================== CHECK IF IN WISHLIST ====================
  const isInWishlist = (placeId) => {
    return wishlistItems.some(item => item.place_id === placeId);
  };

  const value = {
    wishlistItems,
    wishlistCount,
    loading,
    addToWishlist,
    removeFromWishlist,
    clearWishlist,
    fetchWishlist,
    isInWishlist
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};

// Custom hook to use wishlist context
export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within WishlistProvider');
  }
  return context;
};

export default WishlistContext;
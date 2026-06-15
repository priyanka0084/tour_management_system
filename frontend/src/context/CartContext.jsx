import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch cart when user logs in
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchCart();
    } else {
      // Clear cart when user logs out
      setCartItems([]);
      setCartCount(0);
    }
  }, [isAuthenticated, user]);

  // ==================== FETCH CART ITEMS ====================
  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await api.get('/cart');
      
      console.log('🛒 Cart API Response:', response.data);
      
      if (response.data.success) {
        console.log('✅ Cart Items:', response.data.cart);
        console.log('✅ Cart Count:', response.data.count);
        
        setCartItems(response.data.cart || []);
        setCartCount(response.data.count || 0);
      }
    } catch (error) {
      console.error('❌ Error fetching cart:', error);
      // Don't show error toast on initial fetch
      setCartItems([]);
      setCartCount(0);
    } finally {
      setLoading(false);
    }
  };

  // ==================== ADD TO CART ====================
  const addToCart = async (place) => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart', {
        position: 'top-right',
        autoClose: 2000
      });
      return { success: false, needsLogin: true };
    }

    try {
      console.log('🎯 Adding place to cart:', place);
      
      const response = await api.post('/cart/add', {
        place_id: place.id || place.place_id,  // ✅ THIS IS THE ONLY CHANGE
        package_id: null,
        quantity: 1
      });

      console.log('📥 Add to cart response:', response.data);

      if (response.data.success) {
        toast.success(`✅ ${place.name} added to cart!`, {
  position: 'top-right',
  autoClose: 2000,
  toastId: `cart-add-${placeId}`  // ✅ prevents duplicate toasts
});

        setCartCount(response.data.cartCount || cartCount + 1);
        await fetchCart();
        return { success: true };
      }
    } catch (error) {
      console.error('❌ Error adding to cart:', error);
      
      if (error.response?.data?.alreadyInCart) {
        toast.warning('This place is already in your cart!', {
          position: 'top-right',
          autoClose: 2000
        });
        return { success: false, alreadyInCart: true };
      }

      toast.error(error.response?.data?.error || 'Failed to add to cart', {
        position: 'top-right',
        autoClose: 2000,
        toastId: `cart-error-${placeId}`
      });
      return { success: false };
    }
  };

  // ==================== REMOVE FROM CART ====================
  const removeFromCart = async (cartId) => {
    try {
      const response = await api.delete(`/cart/remove/${cartId}`);

      if (response.data.success) {
        toast.success(response.data.message || 'Removed from cart', {
          position: 'top-right',
          autoClose: 2000
        });

        // Update local state
        setCartItems(cartItems.filter(item => item.cart_id !== cartId));
        setCartCount(response.data.cartCount || Math.max(0, cartCount - 1));

        return { success: true };
      }
    } catch (error) {
      console.error('❌ Error removing from cart:', error);
      toast.error('Failed to remove from cart', {
        position: 'top-right',
        autoClose: 2000
      });
      return { success: false };
    }
  };

  // ==================== UPDATE QUANTITY ====================
  const updateQuantity = async (cartId, newQuantity) => {
    try {
      const response = await api.put(`/cart/update/${cartId}`, {
        quantity: newQuantity
      });

      if (response.data.success) {
        toast.success('Cart updated!', {
          position: 'top-right',
          autoClose: 1500
        });

        // Update local state
        setCartItems(cartItems.map(item => 
          item.cart_id === cartId 
            ? { ...item, quantity: newQuantity }
            : item
        ));

        return { success: true };
      }
    } catch (error) {
      console.error('❌ Error updating cart:', error);
      toast.error('Failed to update cart', {
        position: 'top-right',
        autoClose: 2000
      });
      return { success: false };
    }
  };

  // ==================== CLEAR CART ====================
  const clearCart = async () => {
    try {
      const response = await api.delete('/cart/clear');

      if (response.data.success) {
        toast.success('Cart cleared successfully!', {
          position: 'top-right',
          autoClose: 2000
        });

        setCartItems([]);
        setCartCount(0);

        return { success: true };
      }
    } catch (error) {
      console.error('❌ Error clearing cart:', error);
      toast.error('Failed to clear cart', {
        position: 'top-right',
        autoClose: 2000
      });
      return { success: false };
    }
  };

  // ==================== CHECK IF IN CART ====================
  const isInCart = (placeId) => {
    return cartItems.some(item => item.place_id === placeId);
  };

  // ==================== GET CART TOTAL ====================
  const getCartTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + (item.price_per_person * (item.quantity || 1));
    }, 0);
  };

  const value = {
    cartItems,
    cartCount,
    loading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    fetchCart,
    isInCart,
    getCartTotal
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

// Custom hook to use cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export default CartContext;
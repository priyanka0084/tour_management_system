// Create this file: frontend/src/components/CartDebug.jsx
// Add it temporarily to your UserDashboard to see what's happening

import React, { useEffect, useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const CartDebug = () => {
  const { cartItems, cartCount } = useCart();
  const { user } = useAuth();
  const [rawCartData, setRawCartData] = useState(null);
  const [dbCheck, setDbCheck] = useState(null);

  useEffect(() => {
    // Fetch raw cart data directly
    const fetchRawCart = async () => {
      try {
        const response = await api.get('/cart');
        console.log('📊 Raw Cart Response:', response);
        setRawCartData(response.data);
      } catch (error) {
        console.error('❌ Error fetching raw cart:', error);
        setRawCartData({ error: error.message });
      }
    };

    fetchRawCart();
  }, []);

  const testAddToCart = async () => {
    try {
      // Test adding a sample place to cart
      const testPlace = {
        id: 1, // Change this to an actual place_id from your database
        name: 'Test Place',
        price_per_person: 10000
      };

      const response = await api.post('/cart/add', {
        place_id: testPlace.id,
        package_id: null,
        quantity: 1
      });

      console.log('🧪 Test Add Response:', response.data);
      alert(JSON.stringify(response.data, null, 2));
      
      // Refresh cart data
      window.location.reload();
    } catch (error) {
      console.error('❌ Test Add Error:', error);
      alert('Error: ' + error.message);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: 'white',
      border: '2px solid #333',
      borderRadius: '10px',
      padding: '20px',
      maxWidth: '400px',
      maxHeight: '500px',
      overflow: 'auto',
      zIndex: 9999,
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
    }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>🔍 Cart Debug Panel</h3>
      
      <div style={{ marginBottom: '15px', padding: '10px', background: '#f5f5f5', borderRadius: '5px' }}>
        <strong>User Info:</strong>
        <pre style={{ fontSize: '11px', margin: '5px 0' }}>
          {JSON.stringify({
            id: user?.id,
            name: user?.name || user?.full_name,
            email: user?.email
          }, null, 2)}
        </pre>
      </div>

      <div style={{ marginBottom: '15px', padding: '10px', background: '#f0f9ff', borderRadius: '5px' }}>
        <strong>CartContext State:</strong>
        <pre style={{ fontSize: '11px', margin: '5px 0' }}>
          cartCount: {cartCount}
          {'\n'}cartItems length: {cartItems?.length || 0}
        </pre>
      </div>

      <div style={{ marginBottom: '15px', padding: '10px', background: '#fef3c7', borderRadius: '5px' }}>
        <strong>Raw API Response:</strong>
        <pre style={{ fontSize: '10px', margin: '5px 0', maxHeight: '150px', overflow: 'auto' }}>
          {JSON.stringify(rawCartData, null, 2)}
        </pre>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <strong>Cart Items Detail:</strong>
        {cartItems && cartItems.length > 0 ? (
          <div>
            {cartItems.map((item, index) => (
              <div key={index} style={{ 
                padding: '8px', 
                background: '#e8f5e9', 
                marginTop: '5px',
                borderRadius: '5px',
                fontSize: '11px'
              }}>
                <div>Cart ID: {item.cart_id}</div>
                <div>Place: {item.place_name}</div>
                <div>Price: ₹{item.price_per_person}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: '#666', fontSize: '12px', marginTop: '5px' }}>
            No items in cart
          </div>
        )}
      </div>

      <button
        onClick={testAddToCart}
        style={{
          width: '100%',
          padding: '10px',
          background: '#10b981',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontWeight: 'bold',
          marginBottom: '10px'
        }}
      >
        🧪 Test Add to Cart
      </button>

      <div style={{ fontSize: '11px', color: '#666', marginTop: '10px' }}>
        <strong>Checklist:</strong>
        <div>✓ JWT Token: {localStorage.getItem('accessToken') ? 'Present' : '❌ Missing'}</div>
        <div>✓ User Logged In: {user ? '✅' : '❌'}</div>
        <div>✓ Cart API Called: {rawCartData ? '✅' : '⏳'}</div>
        <div>✓ Items in DB: {rawCartData?.count > 0 ? '✅' : '❌'}</div>
      </div>

      <button
        onClick={() => {
          console.log('=== FULL CART DEBUG INFO ===');
          console.log('User:', user);
          console.log('CartContext cartItems:', cartItems);
          console.log('CartContext cartCount:', cartCount);
          console.log('Raw Cart Data:', rawCartData);
          console.log('Token:', localStorage.getItem('accessToken'));
          console.log('===========================');
        }}
        style={{
          width: '100%',
          padding: '8px',
          background: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '12px',
          marginTop: '10px'
        }}
      >
        📋 Log All to Console
      </button>
    </div>
  );
};

export default CartDebug;
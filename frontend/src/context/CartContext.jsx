import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { DEFAULT_SHIPPING_FEE, DEFAULT_TAX_RATE, FREE_DELIVERY_THRESHOLD } from '../utils/currency';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [shippingRates, setShippingRates] = useState({ taxRate: DEFAULT_TAX_RATE, shippingFee: DEFAULT_SHIPPING_FEE });

  // Load cart from LocalStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('cartItems');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }

    // Fetch tax and shipping configurations
    const fetchRates = async () => {
      try {
        const { data } = await axios.get('/api/settings');
        if (data) {
          setShippingRates({
            taxRate: data.taxRate || DEFAULT_TAX_RATE,
            shippingFee: data.shippingFee || DEFAULT_SHIPPING_FEE
          });
        }
      } catch (err) {
        console.warn('Could not load shipping rates, using defaults.');
      }
    };
    fetchRates();
  }, []);

  const saveCart = (items) => {
    setCartItems(items);
    localStorage.setItem('cartItems', JSON.stringify(items));
  };

  const addToCart = (product, variantName, quantity = 1) => {
    const items = [...cartItems];
    
    // Find active variant pricing and SKU
    let price = product.basePrice;
    let costPrice = product.costPrice;
    let sku = product.sku;
    
    if (variantName && product.variants && product.variants.length > 0) {
      const variant = product.variants.find(v => v.name === variantName);
      if (variant) {
        price = variant.price;
        costPrice = variant.costPrice;
        sku = variant.sku;
      }
    }

    // Apply product discounts
    if (product.discount > 0) {
      price = price - (price * (product.discount / 100));
    }

    const existingIndex = items.findIndex(
      (item) => item.productId === product._id && item.variantName === (variantName || '')
    );

    if (existingIndex !== -1) {
      items[existingIndex].quantity += quantity;
    } else {
      items.push({
        productId: product._id,
        name: product.name,
        image: product.images[0],
        variantName: variantName || '',
        quantity,
        price,
        costPrice,
        sku,
      });
    }

    saveCart(items);
  };

  const removeFromCart = (productId, variantName) => {
    const items = cartItems.filter(
      (item) => !(item.productId === productId && item.variantName === (variantName || ''))
    );
    saveCart(items);
  };

  const updateQuantity = (productId, variantName, quantity) => {
    const items = [...cartItems];
    const index = items.findIndex(
      (item) => item.productId === productId && item.variantName === (variantName || '')
    );
    if (index !== -1) {
      items[index].quantity = Math.max(1, quantity);
      saveCart(items);
    }
  };

  const clearCart = () => {
    saveCart([]);
  };

  const [isCartOpen, setIsCartOpen] = useState(false);

  // calculations
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * (shippingRates.taxRate / 100);
  const shippingFee = subtotal >= FREE_DELIVERY_THRESHOLD || subtotal === 0 ? 0 : shippingRates.shippingFee;
  const total = subtotal + tax + shippingFee;

  const placeOrder = async (customerDetails, paymentMethod) => {
    try {
      const orderPayload = {
        customerDetails,
        items: cartItems,
        subtotal,
        shippingFee,
        tax,
        total,
        paymentMethod,
      };

      const { data } = await axios.post('/api/orders', orderPayload);
      clearCart();
      return { success: true, order: data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Checkout failed. Please try again.'
      };
    }
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        isCartOpen,
        setIsCartOpen,
        subtotal,
        tax,
        shippingFee,
        total,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        placeOrder,
        taxRate: shippingRates.taxRate,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

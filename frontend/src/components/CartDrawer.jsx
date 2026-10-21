import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { X, Trash2, ShoppingBag, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatPrice, FREE_DELIVERY_THRESHOLD } from '../utils/currency';

const CartDrawer = () => {
  const { 
    cartItems, 
    isCartOpen, 
    setIsCartOpen, 
    subtotal, 
    tax, 
    shippingFee, 
    total, 
    updateQuantity, 
    removeFromCart 
  } = useContext(CartContext);
  
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleCheckoutClick = () => {
    setIsCartOpen(false);
    if (!user) {
      navigate('/profile?redirect=checkout');
    } else {
      navigate('/checkout');
    }
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop mask */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-black z-50 cursor-pointer"
          />

          {/* Sliding Cart Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-[450px] bg-[#F6EFE3] z-50 shadow-2xl flex flex-col font-sans border-l border-[#8A6A4B]/10 text-left"
          >
            {/* Header */}
            <div className="p-6 border-b border-[#8A6A4B]/10 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#2F4B3C]" />
                <span className="font-serif text-lg font-bold text-[#2F4B3C]">Your Harvest Basket</span>
                <span className="text-[10px] bg-[#2F4B3C]/5 text-[#2F4B3C] px-2 py-0.5 rounded-full font-bold">
                  {cartItems.reduce((acc, item) => acc + item.quantity, 0)} Items
                </span>
              </div>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Freshness banner & Free Shipping Progress Bar */}
            <div className="bg-[#2F4B3C]/10 border-b border-[#2F4B3C]/15 px-6 py-3 flex flex-col gap-2 shrink-0 select-none">
              <div className="flex items-center justify-between text-xs font-bold text-[#2F4B3C]">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-[#2F4B3C]" />
                  <span>{subtotal >= FREE_DELIVERY_THRESHOLD ? '🎉 Free Delivery Unlocked!' : `Add ${formatPrice(FREE_DELIVERY_THRESHOLD - subtotal)} more for Free Delivery`}</span>
                </div>
                <span className="text-[10px] text-[#A65D3D]">{Math.min(100, Math.round((subtotal / FREE_DELIVERY_THRESHOLD) * 100))}%</span>
              </div>
              <div className="h-1.5 w-full bg-white rounded-full overflow-hidden border border-gray-200">
                <div 
                  className="h-full bg-gradient-to-r from-[#2F4B3C] to-[#A65D3D] transition-all duration-300 rounded-full"
                  style={{ width: `${Math.min(100, Math.round((subtotal / FREE_DELIVERY_THRESHOLD) * 100))}%` }}
                />
              </div>
            </div>

            {/* Cart Items List */}
            <div className="grow overflow-y-auto p-6 space-y-4">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <span className="text-3xl">🌾</span>
                  <h3 className="font-serif text-base font-bold text-[#2F4B3C]">Basket is Empty</h3>
                  <p className="text-xs text-gray-500 font-light max-w-xs leading-relaxed">
                    No farm-fresh specialties have been added yet. Visit our shop and select your harvests!
                  </p>
                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      navigate('/catalog');
                    }}
                    className="bg-[#2F4B3C] hover:bg-[#A65D3D] text-white text-[10px] uppercase font-bold tracking-widest px-6 py-2.5 rounded transition-colors cursor-pointer"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                cartItems.map((item, idx) => (
                  <div 
                    key={idx}
                    className="bg-white border border-[#8A6A4B]/5 rounded-xl p-4 flex gap-4 items-center justify-between hover:border-[#8A6A4B]/15 transition-all shadow-sm"
                  >
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600';
                      }}
                      className="w-16 h-16 rounded object-cover shrink-0 bg-gray-50 border border-gray-100"
                    />
                    
                    {/* Item Details */}
                    <div className="grow min-w-0 space-y-1">
                      <h4 className="font-bold text-xs text-gray-950 truncate">{item.name}</h4>
                      {item.variantName && (
                        <span className="inline-block text-[9px] bg-[#2F4B3C]/10 border border-[#2F4B3C]/20 text-[#2F4B3C] font-semibold px-2 py-0.5 rounded uppercase tracking-wider scale-95 origin-left">
                          {item.variantName}
                        </span>
                      )}
                      
                      {/* Controls and pricing */}
                      <div className="flex items-center justify-between pt-1">
                        {/* Quantity adjustments */}
                        <div className="flex items-center border border-gray-200 rounded h-7 px-1.5 bg-gray-50">
                          <button
                            onClick={() => updateQuantity(item.productId, item.variantName, item.quantity - 1)}
                            className="text-gray-400 hover:text-[#2F4B3C] px-1 text-xs cursor-pointer font-bold"
                          >
                            -
                          </button>
                          <span className="text-[11px] font-bold w-5 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.variantName, item.quantity + 1)}
                            className="text-gray-400 hover:text-[#2F4B3C] px-1 text-xs cursor-pointer font-bold"
                          >
                            +
                          </button>
                        </div>

                        {/* Price Display */}
                        <span className="font-bold text-xs text-[#2F4B3C]">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>

                    {/* Delete item */}
                    <button
                      onClick={() => removeFromCart(item.productId, item.variantName)}
                      className="text-gray-300 hover:text-red-600 transition-colors p-1 cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Summary Footer */}
            {cartItems.length > 0 && (
              <div className="p-6 bg-white border-t border-[#8A6A4B]/10 space-y-4 shrink-0 shadow-inner">
                <div className="space-y-2.5 text-xs text-gray-500 font-sans">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-bold text-gray-900">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated Surcharges & Tax</span>
                    <span className="font-bold text-gray-900">{formatPrice(tax)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Charge</span>
                    {shippingFee === 0 ? (
                      <span className="text-[#2F4B3C] font-bold uppercase text-[9px] tracking-wider bg-[#2F4B3C]/10 border border-[#2F4B3C]/20 px-1.5 py-0.5 rounded">Free Shipping</span>
                    ) : (
                      <span className="font-bold text-gray-900">{formatPrice(shippingFee)}</span>
                    )}
                  </div>
                  {shippingFee > 0 && (
                    <p className="text-[9px] text-gray-400 font-light text-center select-none pt-1">
                      Add <span className="font-bold text-[#2F4B3C]">{formatPrice(FREE_DELIVERY_THRESHOLD - subtotal)}</span> more to receive FREE delivery!
                    </p>
                  )}
                </div>

                <hr className="border-[#8A6A4B]/5" />

                <div className="flex justify-between items-baseline">
                  <span className="text-xs uppercase tracking-widest font-bold text-gray-800 font-serif">Total Bill</span>
                  <span className="text-xl font-bold text-[#2F4B3C]">{formatPrice(total)}</span>
                </div>

                <button
                  onClick={handleCheckoutClick}
                  className="w-full flex items-center justify-center gap-1.5 bg-[#2F4B3C] hover:bg-[#A65D3D] text-white font-bold py-3.5 rounded text-xs uppercase tracking-widest transition-colors shadow-md cursor-pointer"
                >
                  Proceed to Checkout <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;

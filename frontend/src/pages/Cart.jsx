import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { Trash2, ShoppingBag, ArrowRight, ShieldCheck } from 'lucide-react';
import { formatPrice, FREE_DELIVERY_THRESHOLD } from '../utils/currency';

const Cart = () => {
  const { 
    cartItems, 
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
    if (!user) {
      navigate('/profile?redirect=checkout');
    } else {
      navigate('/checkout');
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-24 px-4 space-y-6 bg-white border border-gray-100 rounded-xl mt-12 shadow-sm font-sans">
        <span className="text-4xl block">🌾</span>
        <h2 className="text-xl font-serif font-bold text-[#2F4B3C]">Basket is Empty</h2>
        <p className="text-xs text-gray-500 font-light leading-relaxed max-w-xs mx-auto">
          No farm-fresh specialties have been added yet. Browse our collections of dry fish, eggs, and chickens to get started!
        </p>
        <Link
          to="/catalog"
          className="inline-flex items-center gap-2 bg-[#2F4B3C] hover:bg-[#A65D3D] text-white text-xs uppercase tracking-widest font-bold px-8 py-3.5 rounded transition-all shadow-sm"
        >
          Start Sourcing <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 text-left font-sans bg-[#F6EFE3]">
      
      {/* Title */}
      <div>
        <h1 className="text-3xl font-serif text-[#2F4B3C] font-semibold">Shopping basket</h1>
        <p className="text-xs text-gray-400 mt-1 font-light">Confirm your quantities, verify origin traceability details, and proceed.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left List */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Freshness notification */}
          <div className="bg-[#2F4B3C]/20 border border-[#2F4B3C]/30 px-5 py-3 rounded-lg flex items-center gap-2 text-xs text-[#2F4B3C] font-medium select-none">
            <ShieldCheck className="w-4.5 h-4.5 text-[#2F4B3C]" />
            <span>Packed fresh the morning of dispatch.</span>
          </div>

          {cartItems.map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center gap-5 justify-between hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4 w-full">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-16 h-16 rounded object-cover shrink-0 bg-gray-50 border border-gray-100"
                />
                <div className="min-w-0">
                  <h3 className="font-bold text-gray-900 text-xs truncate">{item.name}</h3>
                  {item.variantName && (
                    <span className="text-[9px] bg-[#2F4B3C]/10 border border-[#2F4B3C]/20 text-[#2F4B3C] font-bold px-2 py-0.5 rounded mt-1 inline-block uppercase tracking-wider">
                      {item.variantName}
                    </span>
                  )}
                  <div className="text-[10px] text-gray-400 mt-1 font-light">SKU: {item.sku}</div>
                </div>
              </div>

              {/* Quantity modifications */}
              <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto shrink-0 border-t sm:border-t-0 pt-4 sm:pt-0 mt-4 sm:mt-0">
                
                <div className="flex items-center border border-gray-200 rounded h-9 px-2 bg-gray-50">
                  <button
                    onClick={() => updateQuantity(item.productId, item.variantName, item.quantity - 1)}
                    className="text-gray-400 hover:text-[#2F4B3C] font-bold px-1.5 cursor-pointer text-xs"
                  >
                    -
                  </button>
                  <span className="text-xs font-bold w-6 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.productId, item.variantName, item.quantity + 1)}
                    className="text-gray-400 hover:text-[#2F4B3C] font-bold px-1.5 cursor-pointer text-xs"
                  >
                    +
                  </button>
                </div>

                {/* Price Display */}
                <div className="text-right w-24">
                  <div className="font-bold text-[#2F4B3C] text-sm">{formatPrice(item.price * item.quantity)}</div>
                  <div className="text-[10px] text-gray-400 font-light">{formatPrice(item.price)} ea</div>
                </div>

                {/* Remove */}
                <button
                  onClick={() => removeFromCart(item.productId, item.variantName)}
                  className="text-gray-300 hover:text-red-600 transition-colors p-2 cursor-pointer"
                  title="Remove Item"
                >
                  <Trash2 className="w-4.5 h-4.5" />
                </button>
              </div>

            </div>
          ))}
        </div>

        {/* Right Summary */}
        <div className="lg:col-span-4 bg-white border border-[#8A6A4B]/10 rounded-xl p-6 shadow-sm space-y-6">
          <h3 className="text-base font-serif text-[#2F4B3C] font-semibold pb-3 border-b border-[#8A6A4B]/5">Order Summary</h3>

          <div className="space-y-3.5 text-xs text-gray-500 font-sans">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-bold text-gray-900">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax & Curing Fee</span>
              <span className="font-bold text-gray-900">{formatPrice(tax)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Delivery Charges</span>
              {shippingFee === 0 ? (
                <span className="text-[#2F4B3C] font-bold uppercase text-[9px] tracking-wider bg-[#2F4B3C]/10 border border-[#2F4B3C]/20 px-1.5 py-0.5 rounded">Free Shipping</span>
              ) : (
                <span className="font-bold text-gray-900">{formatPrice(shippingFee)}</span>
              )}
            </div>
            {shippingFee > 0 && (
              <p className="text-[9px] text-gray-400 font-light leading-relaxed pt-1">
                Add <span className="font-bold text-[#2F4B3C]">{formatPrice(FREE_DELIVERY_THRESHOLD - subtotal)}</span> more to receive FREE delivery!
              </p>
            )}
          </div>

          <hr className="border-[#8A6A4B]/5" />

          <div className="flex justify-between items-baseline">
            <span className="text-xs uppercase tracking-widest font-bold text-gray-800 font-serif">Total Bill</span>
            <span className="text-lg font-bold text-[#2F4B3C]">{formatPrice(total)}</span>
          </div>

          <button
            onClick={handleCheckoutClick}
            className="w-full flex items-center justify-center gap-1.5 bg-[#2F4B3C] hover:bg-[#A65D3D] text-white font-bold py-3.5 rounded text-xs uppercase tracking-widest transition-colors shadow-md cursor-pointer"
          >
            Proceed to Checkout <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};

export default Cart;

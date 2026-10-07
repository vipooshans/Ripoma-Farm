import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { NotificationContext } from '../context/NotificationContext';
import { ShieldCheck, Truck, CreditCard, ChevronRight, CheckCircle, Lock, AlertTriangle, MapPin, Clock, Calendar } from 'lucide-react';
import { ValidatedInput, PhoneInput, CreditCardInput } from '../components/FormFields';
import RipomaLogo from '../components/RipomaLogo';
import { formatPrice } from '../utils/currency';
import { isValidSriLankanPhone, normalizeSriLankanPhone, PHONE_FORMAT_ERROR } from '../utils/phone';

const Checkout = () => {
  const { cartItems, subtotal, tax, shippingFee, total, placeOrder } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const { showToast } = useContext(NotificationContext);
  const navigate = useNavigate();

  // Delivery Slots state
  const [selectedSlot, setSelectedSlot] = useState('slot-1');

  const deliverySlots = [
    { id: 'slot-1', title: 'Tomorrow Morning', time: '8:00 AM – 11:00 AM', available: true },
    { id: 'slot-2', title: 'Tomorrow Afternoon', time: '1:00 PM – 4:00 PM', available: true },
    { id: 'slot-3', title: 'Evening Dispatch', time: '5:00 PM – 8:00 PM', available: false }
  ];

  // Address inputs state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Sri Lanka'
  });

  // Payment gateway simulation selection
  const [paymentMethod, setPaymentMethod] = useState('Stripe');
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: '',
    holder: ''
  });

  // Validation States
  const [addressErrors, setAddressErrors] = useState({});
  const [addressTouched, setAddressTouched] = useState({});
  
  const [cardErrors, setCardErrors] = useState({});
  const [cardTouched, setCardTouched] = useState({});

  const [loading, setLoading] = useState(false);
  const [successOrder, setSuccessOrder] = useState(null);

  const serviceableCities = ['Organic City', 'Green Valley', 'Bay Area', 'Organic Hills'];

  // Prepopulate details
  useEffect(() => {
    if (!user) {
      navigate('/profile?redirect=checkout');
      return;
    }

    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      street: user.address?.street || '',
      city: user.address?.city || '',
      state: user.address?.state || '',
      zipCode: user.address?.zipCode || '',
      country: user.address?.country || 'Sri Lanka'
    });
  }, [user, navigate]);

  // Luhn Check Card number validator
  const checkLuhn = (code) => {
    let cleanCode = code.replace(/\s+/g, '');
    if (!/^\d+$/.test(cleanCode)) return false;
    let len = cleanCode.length;
    let parity = len % 2;
    let sum = 0;
    for (let i = 0; i < len; i++) {
      let d = parseInt(cleanCode.charAt(i));
      if (i % 2 === parity) {
        d = d * 2;
        if (d > 9) d -= 9;
      }
      sum += d;
    }
    return (sum % 10) === 0;
  };

  const validateAddressField = (name, value) => {
    let err = '';
    switch (name) {
      case 'name':
        if (!value.trim()) err = 'Full name is required';
        else if (value.length < 2 || value.length > 60) err = 'Name must be 2 to 60 characters';
        break;
      case 'phone':
        if (!value.trim()) err = 'Contact phone is required';
        else if (!isValidSriLankanPhone(value)) err = PHONE_FORMAT_ERROR;
        break;
      case 'street':
        if (!value.trim()) err = 'Street address is required';
        else if (value.length < 5) err = 'Street address must be at least 5 characters';
        break;
      case 'city':
        if (!value.trim()) err = 'City is required';
        else if (!serviceableCities.includes(value.trim())) {
          err = "We don't deliver here yet. (Available: Organic City, Green Valley, Bay Area)";
        }
        break;
      case 'zipCode':
        if (!value.trim()) err = 'Postal code is required';
        else if (!/^[a-zA-Z0-9\s-]{5,10}$/.test(value)) err = 'Invalid zip code format';
        break;
      default:
        break;
    }
    return err;
  };

  const validateCardField = (name, value) => {
    let err = '';
    switch (name) {
      case 'number':
        const cleanNum = value.replace(/\s+/g, '');
        if (!value.trim()) err = 'Card number is required';
        else if (cleanNum.length < 13 || cleanNum.length > 19) err = 'Number must be 13 to 19 digits';
        else if (!checkLuhn(cleanNum)) err = 'Invalid card number (Luhn check failed)';
        break;
      case 'expiry':
        if (!value.trim()) err = 'Expiry MM/YY required';
        else if (!/^\d{2}\/\d{2}$/.test(value)) err = 'Must be MM/YY format';
        else {
          const [m, y] = value.split('/').map(Number);
          const today = new Date();
          const currentYear = today.getFullYear() % 100;
          const currentMonth = today.getMonth() + 1;
          if (m < 1 || m > 12) err = 'Invalid month';
          else if (y < currentYear || (y === currentYear && m < currentMonth)) err = 'Card has expired';
        }
        break;
      case 'cvv':
        if (!value.trim()) err = 'CVV is required';
        else if (!/^\d{3,4}$/.test(value)) err = 'CVV must be 3 or 4 digits';
        break;
      case 'holder':
        if (!value.trim()) err = 'Holder name is required';
        break;
      default:
        break;
    }
    return err;
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (addressTouched[name]) {
      const err = validateAddressField(name, value);
      setAddressErrors(prev => ({ ...prev, [name]: err }));
    }
  };

  const handleFormBlur = (e) => {
    const { name, value } = e.target;
    setAddressTouched(prev => ({ ...prev, [name]: true }));
    const err = validateAddressField(name, value);
    setAddressErrors(prev => ({ ...prev, [name]: err }));
  };

  const handleCardChange = (e) => {
    const { name, value } = e.target;
    setCardDetails(prev => ({ ...prev, [name]: value }));

    if (cardTouched[name]) {
      const err = validateCardField(name, value);
      setCardErrors(prev => ({ ...prev, [name]: err }));
    }
  };

  const handleCardBlur = (e) => {
    const { name, value } = e.target;
    setCardTouched(prev => ({ ...prev, [name]: true }));
    const err = validateCardField(name, value);
    setCardErrors(prev => ({ ...prev, [name]: err }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (cartItems.length === 0) {
      showToast('Your basket is empty', 'warning');
      return;
    }

    // Run address validations
    const allAddressErrors = {};
    Object.keys(formData).forEach(key => {
      const err = validateAddressField(key, formData[key]);
      if (err) allAddressErrors[key] = err;
    });
    setAddressErrors(allAddressErrors);
    setAddressTouched({ name: true, phone: true, street: true, city: true, zipCode: true });

    // Run card validations if Stripe
    let allCardErrors = {};
    if (paymentMethod === 'Stripe') {
      Object.keys(cardDetails).forEach(key => {
        const err = validateCardField(key, cardDetails[key]);
        if (err) allCardErrors[key] = err;
      });
      setCardErrors(allCardErrors);
      setCardTouched({ number: true, expiry: true, cvv: true, holder: true });
    }

    if (
      Object.values(allAddressErrors).some(err => err !== '') ||
      (paymentMethod === 'Stripe' && Object.values(allCardErrors).some(err => err !== ''))
    ) {
      showToast('Please fix checkout warnings before placing order.', 'error');
      return;
    }

    setLoading(true);

    // Simulate payment processing delay
    setTimeout(async () => {
      const response = await placeOrder({ ...formData, phone: normalizeSriLankanPhone(formData.phone) }, paymentMethod);
      setLoading(false);
      
      if (response.success) {
        setSuccessOrder(response.order);
        showToast('Harvest order confirmed!', 'success');
      } else {
        showToast(response.message, 'error');
      }
    }, 1500);
  };

  const getAddressInputClass = (fieldName) => {
    const baseClass = "w-full border outline-none rounded py-2.5 px-3 text-xs leading-relaxed input-field ";
    if (!addressTouched[fieldName]) return baseClass + "border-gray-200 focus:border-[#2F4B3C]";
    return addressErrors[fieldName] ? baseClass + "input-invalid" : baseClass + "input-valid";
  };

  const getCardInputClass = (fieldName) => {
    const baseClass = "w-full bg-white border outline-none rounded py-2 px-3 text-xs input-field ";
    if (!cardTouched[fieldName]) return baseClass + "border-gray-200 focus:border-[#2F4B3C]";
    return cardErrors[fieldName] ? baseClass + "input-invalid" : baseClass + "input-valid";
  };

  const hasCheckoutErrors = 
    Object.values(addressErrors).some(e => e !== '') ||
    (paymentMethod === 'Stripe' && Object.values(cardErrors).some(e => e !== ''));

  if (successOrder) {
    return (
      <div className="max-w-xl mx-auto py-16 px-6 text-center space-y-6 animate-fade-in-up bg-white rounded-xl border border-gray-100 shadow-sm mt-12 font-sans">
        <div className="flex justify-center mb-2">
          <RipomaLogo variant="compact" color="color" height={36} />
        </div>
        <CheckCircle className="w-12 h-12 text-emerald-700 mx-auto" />
        <h2 className="text-2xl font-serif text-[#2F4B3C] font-semibold">Order Confirmed</h2>
        <p className="text-xs text-gray-500 leading-relaxed max-w-sm mx-auto font-light">
          Your order has been queued for harvesting and packaging. We've sent a detailed invoice receipt to <span className="font-bold text-gray-800">{formData.email}</span>.
        </p>

        <div className="bg-[#F6EFE3] border border-[#8A6A4B]/10 rounded-lg p-5 text-left text-xs space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-400">Order ID</span>
            <span className="font-mono text-gray-800">{successOrder._id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Invoice Reference</span>
            <span className="font-bold text-gray-800">{successOrder.invoiceNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Total Charged</span>
            <span className="font-bold text-[#2F4B3C]">{formatPrice(successOrder.total)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Order Status</span>
            <span className="bg-[#2F4B3C]/20 border border-[#2F4B3C]/30 text-[#2F4B3C] font-bold px-2.5 py-0.5 rounded text-[9px] uppercase tracking-wider">
              {successOrder.orderStatus}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4">
          <Link
            to="/profile"
            className="bg-[#2F4B3C] hover:bg-[#A65D3D] text-white font-bold px-6 py-3 rounded text-[10px] uppercase tracking-widest transition-colors"
          >
            My Orders Dashboard
          </Link>
          <Link
            to="/catalog"
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold px-6 py-3 rounded text-[10px] uppercase tracking-widest transition-colors"
          >
            Continue Sourcing
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-left font-sans bg-[#F6EFE3]">
      
      {/* Checkout progress tracker */}
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-gray-400 font-medium select-none">
        <Link to="/cart" className="hover:text-[#2F4B3C] transition-colors">Basket</Link> 
        <ChevronRight className="w-3 h-3" /> 
        <span className="text-[#2F4B3C] font-bold">Checkout & Sourcing Details</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Forms */}
        <form onSubmit={handleSubmit} className="lg:col-span-8 space-y-6">
          
          {/* Sourcing/Delivery address info */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h3 className="text-lg font-serif text-[#2F4B3C] font-semibold flex items-center gap-2">
                <Truck className="w-5 h-5 text-[#A65D3D]" /> Delivery & Sourcing Address
              </h3>
              {formData.city && serviceableCities.includes(formData.city) && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold animate-pop-scale">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Serviceable Zone Pin Confirmed
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <ValidatedInput
                id="name"
                name="name"
                label="Full Name"
                value={formData.name}
                onChange={handleFormChange}
                onBlur={handleFormBlur}
                error={addressErrors.name}
                touched={addressTouched.name}
                isValid={!addressErrors.name}
                required
              />

              <PhoneInput
                value={formData.phone}
                onChange={(e) => handleFormChange({ target: { name: 'phone', value: e.target.value } })}
                onBlur={handleFormBlur}
                error={addressErrors.phone}
                touched={addressTouched.phone}
                isValid={!addressErrors.phone}
                required
              />
            </div>

            <div className="space-y-2">
              <ValidatedInput
                id="street"
                name="street"
                label="Street Address"
                value={formData.street}
                onChange={handleFormChange}
                onBlur={handleFormBlur}
                error={addressErrors.street}
                touched={addressTouched.street}
                isValid={!addressErrors.street}
                placeholder="Door, apartment, street details..."
                required
              />

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="col-span-2">
                  <ValidatedInput
                    id="city"
                    name="city"
                    label="City"
                    value={formData.city}
                    onChange={handleFormChange}
                    onBlur={handleFormBlur}
                    error={addressErrors.city}
                    touched={addressTouched.city}
                    isValid={!addressErrors.city}
                    placeholder="Organic City"
                    required
                  />
                </div>

                <ValidatedInput
                  id="state"
                  name="state"
                  label="State"
                  value={formData.state}
                  onChange={handleFormChange}
                  onBlur={handleFormBlur}
                  error={addressErrors.state}
                  touched={addressTouched.state}
                  isValid={!addressErrors.state}
                  required
                />

                <ValidatedInput
                  id="zipCode"
                  name="zipCode"
                  label="Zip Code"
                  value={formData.zipCode}
                  onChange={handleFormChange}
                  onBlur={handleFormBlur}
                  error={addressErrors.zipCode}
                  touched={addressTouched.zipCode}
                  isValid={!addressErrors.zipCode}
                  required
                />
              </div>
            </div>

            {/* Delivery Slot Selector */}
            <div className="pt-4 border-t border-gray-100 space-y-3">
              <label className="text-xs font-bold text-[#2F4B3C] uppercase tracking-wider block flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#A65D3D]" /> Preferred Delivery Slot
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {deliverySlots.map((slot) => {
                  const isSelected = selectedSlot === slot.id;
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      disabled={!slot.available}
                      onClick={() => setSelectedSlot(slot.id)}
                      className={`p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                        !slot.available
                          ? 'opacity-40 bg-gray-100 border-gray-200 cursor-not-allowed line-through'
                          : isSelected
                          ? 'border-[#2F4B3C] bg-[#2F4B3C]/10 ring-2 ring-[#2F4B3C]/20 shadow-sm transform -translate-y-1'
                          : 'border-gray-200 bg-white hover:-translate-y-1 hover:shadow-md hover:border-[#2F4B3C]/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#2F4B3C]">{slot.title}</span>
                        {isSelected && <CheckCircle className="w-4 h-4 text-[#2F4B3C]" />}
                      </div>
                      <span className="text-[10px] text-gray-500 font-medium block mt-1">{slot.time}</span>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Payment gateway */}
          <div className="bg-white border border-gray-100 rounded-xl p-6 sm:p-8 shadow-sm space-y-6">
            <h3 className="text-base font-serif text-[#2F4B3C] font-semibold flex items-center gap-2 border-b border-gray-50 pb-3">
              <CreditCard className="w-4 h-4 text-[#A65D3D]" /> Payment Gateway
            </h3>

            {/* Methods Selection Tabs */}
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setPaymentMethod('Stripe')}
                className={`py-3.5 px-4 border rounded text-[10px] uppercase tracking-wider font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  paymentMethod === 'Stripe'
                    ? 'border-[#2F4B3C] bg-[#2F4B3C]/10 text-[#2F4B3C]'
                    : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                💳 Credit / Debit Card (Stripe)
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('Cash on Delivery')}
                className={`py-3.5 px-4 border rounded text-[10px] uppercase tracking-wider font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  paymentMethod === 'Cash on Delivery'
                    ? 'border-[#2F4B3C] bg-[#2F4B3C]/10 text-[#2F4B3C]'
                    : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                📦 Cash on Delivery
              </button>
            </div>

            {/* Credit Card Fields */}
            {paymentMethod === 'Stripe' && (
              <div className="space-y-4 bg-[#F6EFE3] border border-[#8A6A4B]/10 rounded-lg p-5 animate-fade-in-up">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">Cardholder Name</label>
                  <input
                    type="text"
                    name="holder"
                    placeholder="Jane Doe"
                    value={cardDetails.holder}
                    onChange={handleCardChange}
                    onBlur={handleCardBlur}
                    className={getCardInputClass('holder')}
                  />
                  {cardTouched.holder && cardErrors.holder && (
                    <span className="text-red-500 font-bold text-[9px] tracking-wide flex items-center gap-1 mt-0.5">
                      <AlertTriangle className="w-3 h-3 shrink-0" /> {cardErrors.holder}
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">Card Number</label>
                  <input
                    type="text"
                    name="number"
                    placeholder="4242 4242 4242 4242"
                    value={cardDetails.number}
                    onChange={handleCardChange}
                    onBlur={handleCardBlur}
                    className={getCardInputClass('number')}
                  />
                  {cardTouched.number && cardErrors.number && (
                    <span className="text-red-500 font-bold text-[9px] tracking-wide flex items-center gap-1 mt-0.5">
                      <AlertTriangle className="w-3 h-3 shrink-0" /> {cardErrors.number}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">Expiry Month/Year</label>
                    <input
                      type="text"
                      name="expiry"
                      placeholder="MM/YY"
                      value={cardDetails.expiry}
                      onChange={handleCardChange}
                      onBlur={handleCardBlur}
                      className={getCardInputClass('expiry')}
                    />
                    {cardTouched.expiry && cardErrors.expiry && (
                      <span className="text-red-500 font-bold text-[9px] tracking-wide flex items-center gap-1 mt-0.5">
                        <AlertTriangle className="w-3 h-3 shrink-0" /> {cardErrors.expiry}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">CVV Security Code</label>
                    <input
                      type="password"
                      name="cvv"
                      placeholder="***"
                      value={cardDetails.cvv}
                      onChange={handleCardChange}
                      onBlur={handleCardBlur}
                      className={getCardInputClass('cvv')}
                    />
                    {cardTouched.cvv && cardErrors.cvv && (
                      <span className="text-red-500 font-bold text-[9px] tracking-wide flex items-center gap-1 mt-0.5">
                        <AlertTriangle className="w-3 h-3 shrink-0" /> {cardErrors.cvv}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || hasCheckoutErrors}
            className="w-full bg-[#2F4B3C] hover:bg-[#A65D3D] text-white font-bold py-4 rounded text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 shadow-md disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? 'Confirming secure order...' : `Complete Sourcing Order — ${formatPrice(total)}`}
          </button>
        </form>

        {/* Right Summary column */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Summary Basket */}
          <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800 pb-3 border-b border-gray-50">Items List</h3>
            <div className="max-h-64 overflow-y-auto space-y-3.5 pr-1">
              {cartItems.map((item, idx) => (
                <div key={idx} className="flex gap-3 justify-between items-center text-xs">
                  <div className="flex gap-2.5 items-center min-w-0">
                    <img src={item.image} alt={item.name} className="w-8 h-8 rounded object-cover bg-gray-50 border border-gray-100" />
                    <div className="min-w-0">
                      <h4 className="font-bold text-gray-800 truncate text-[11px]">{item.name}</h4>
                      <span className="text-[9px] text-gray-400 font-light">{item.variantName ? `${item.variantName} x ` : ''}{item.quantity} units</span>
                    </div>
                  </div>
                  <span className="font-bold text-gray-950 text-[11px]">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing totals */}
          <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm space-y-3 text-xs text-gray-500 font-sans">
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
              <span className="font-bold text-gray-900">
                {shippingFee === 0 ? 'FREE' : formatPrice(shippingFee)}
              </span>
            </div>
            
            <hr className="border-gray-50" />
            
            <div className="flex justify-between text-sm items-baseline text-gray-950 font-bold">
              <span>Total Bill</span>
              <span className="text-base font-bold text-[#2F4B3C]">{formatPrice(total)}</span>
            </div>

            {/* Secure payment shield info */}
            <div className="bg-emerald-50 rounded border border-emerald-100 p-4 flex gap-2.5 text-[10px] text-emerald-800 mt-4 leading-relaxed font-light">
              <Lock className="w-4 h-4 shrink-0 text-emerald-700 mt-0.5" />
              <p>
                Secure payment gateway. Transactions are encrypted using standard industry protocol sets. Freshness dispatch guaranteed.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Checkout;

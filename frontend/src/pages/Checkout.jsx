import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { NotificationContext } from '../context/NotificationContext';
import { ShieldCheck, Truck, ChevronRight, CheckCircle, AlertTriangle, MapPin, Building2, Landmark, Copy, Check, Phone, HelpCircle, Clock, Lock } from 'lucide-react';
import { ValidatedInput, PhoneInput } from '../components/FormFields';
import RipomaLogo from '../components/RipomaLogo';
import { formatPrice } from '../utils/currency';
import { isValidSriLankanPhone, normalizeSriLankanPhone, PHONE_FORMAT_ERROR } from '../utils/phone';

const BANK_DETAILS = {
  accountName: 'RIPOMA GLOBAL TRADIN',
  bankName: "People's Bank",
  accountNo: '255100110082556',
  whatsappNumber: '0772078909',
  whatsappIntl: '94772078909',
};

const WhatsAppIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.007c.106.005.249-.04.39.299.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.173.086.275.072.376-.043.101-.116.433-.506.549-.68.116-.173.231-.145.39-.086.159.058 1.011.477 1.184.564.173.087.289.13.332.202.043.072.043.419-.101.824z" />
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2.05 21.95l4.908-1.341C8.384 21.492 10.134 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.2c-1.63 0-3.15-.47-4.43-1.28l-.32-.2-2.91.8.81-2.84-.21-.33C4.1 15.08 3.6 13.58 3.6 12c0-4.63 3.77-8.4 8.4-8.4s8.4 3.77 8.4 8.4-3.77 8.4-8.4 8.4z" />
  </svg>
);

const buildWhatsAppMessage = (order, customer, items, slotTitle, totals) => {
  const itemList = (items || []).map(item => {
    const variantStr = item.variantName ? ` (${item.variantName})` : '';
    return `• ${item.name}${variantStr} x ${item.quantity} — ${formatPrice(item.price * item.quantity)}`;
  }).join('\n');

  const fullAddress = [
    customer.street,
    customer.city,
    customer.state,
    customer.zipCode,
    customer.country || 'Sri Lanka'
  ].filter(Boolean).join(', ');

  return `🌾 *RIPOMA FARM — ORDER CONFIRMATION* 🌾
━━━━━━━━━━━━━━━━━━━━━
📋 *Invoice Reference:* ${order?.invoiceNumber || 'Processing'}
🔖 *Order ID:* #${order?._id || 'New Order'}
📅 *Date:* ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}

👤 *Customer Details:*
• *Name:* ${customer.name}
• *Phone:* ${customer.phone}
• *Delivery Address:* ${fullAddress}
${slotTitle ? `• *Delivery Slot:* ${slotTitle}\n` : ''}
📦 *Product Details:*
${itemList}

💰 *Payment Summary:*
• *Subtotal:* ${formatPrice(totals.subtotal)}
• *Delivery Fee:* ${totals.shippingFee > 0 ? formatPrice(totals.shippingFee) : 'Free'}
• *Tax:* ${formatPrice(totals.tax)}
━━━━━━━━━━━━━━━━━━━━━
*Total Amount Due:* ${formatPrice(totals.total)}

🏦 *Pay To (Bank Account Details):*
• *Bank Name:* ${BANK_DETAILS.bankName}
• *Account Name:* ${BANK_DETAILS.accountName}
• *Account No:* ${BANK_DETAILS.accountNo}

📸 *Payment Process:*
Please transfer *${formatPrice(totals.total)}* to the account above and reply to this message with your payment slip or receipt screenshot. Our team will verify and dispatch your order. Thank you!`;
};

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
  const paymentMethod = 'Bank Transfer (WhatsApp)';
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [orderSummaryForWa, setOrderSummaryForWa] = useState(null);

  // Validation States
  const [addressErrors, setAddressErrors] = useState({});
  const [addressTouched, setAddressTouched] = useState({});

  const [loading, setLoading] = useState(false);
  const [successOrder, setSuccessOrder] = useState(null);

  const handleCopyAccount = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(BANK_DETAILS.accountNo);
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2000);
      showToast('Bank account number copied!', 'success');
    }
  };

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

    if (Object.values(allAddressErrors).some(err => err !== '')) {
      showToast('Please fix delivery address warnings before proceeding.', 'error');
      return;
    }

    setLoading(true);

    const snapshotItems = [...cartItems];
    const snapshotTotals = { subtotal, shippingFee, tax, total };
    const slotObj = deliverySlots.find(s => s.id === selectedSlot);
    const slotTitle = slotObj ? `${slotObj.title} (${slotObj.time})` : '';

    try {
      const response = await placeOrder(
        { ...formData, phone: normalizeSriLankanPhone(formData.phone), deliverySlot: slotTitle },
        paymentMethod
      );
      setLoading(false);
      
      if (response.success) {
        const orderData = response.order;
        const waMsg = buildWhatsAppMessage(orderData, formData, snapshotItems, slotTitle, snapshotTotals);
        const waUrl = `https://wa.me/${BANK_DETAILS.whatsappIntl}?text=${encodeURIComponent(waMsg)}`;

        setOrderSummaryForWa({
          order: orderData,
          customer: { ...formData },
          items: snapshotItems,
          slotTitle,
          totals: snapshotTotals,
          waUrl,
        });

        setSuccessOrder(orderData);
        showToast('Harvest order confirmed! Opening WhatsApp...', 'success');

        // Automatically open WhatsApp in a new tab
        window.open(waUrl, '_blank');
      } else {
        showToast(response.message, 'error');
      }
    } catch (err) {
      setLoading(false);
      showToast('Failed to complete order. Please try again.', 'error');
    }
  };

  const getAddressInputClass = (fieldName) => {
    const baseClass = "w-full border outline-none rounded py-2.5 px-3 text-xs leading-relaxed input-field ";
    if (!addressTouched[fieldName]) return baseClass + "border-gray-200 focus:border-[#2F4B3C]";
    return addressErrors[fieldName] ? baseClass + "input-invalid" : baseClass + "input-valid";
  };

  const hasCheckoutErrors = Object.values(addressErrors).some(e => e !== '');

  if (successOrder) {
    const waUrl = orderSummaryForWa?.waUrl || `https://wa.me/${BANK_DETAILS.whatsappIntl}`;

    return (
      <div className="max-w-xl mx-auto py-16 px-6 text-center space-y-6 animate-fade-in-up bg-white rounded-2xl border border-gray-150 shadow-sm mt-12 font-sans">
        <div className="flex justify-center mb-2">
          <RipomaLogo variant="compact" color="color" height={36} />
        </div>
        <CheckCircle className="w-12 h-12 text-emerald-700 mx-auto" />
        <h2 className="text-2xl font-serif text-[#2F4B3C] font-semibold">Order Placed &amp; Queued</h2>
        <p className="text-xs text-gray-500 leading-relaxed max-w-sm mx-auto font-light">
          Your order has been recorded! Please transfer the payment to the People's Bank account below and send your receipt screenshot via WhatsApp.
        </p>

        {/* Bank Transfer Details Box */}
        <div className="bg-[#1E3A2F] text-white rounded-xl p-5 text-left text-xs space-y-3 shadow-md border border-[#2F4B3C]">
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
            <div>
              <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider block">Pay To (Bank Details)</span>
              <span className="text-sm font-serif font-bold text-white">{BANK_DETAILS.bankName}</span>
            </div>
            <Landmark className="w-5 h-5 text-emerald-300" />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-gray-300 uppercase tracking-wider block">Beneficiary Name</span>
            <span className="text-xs font-semibold text-white block">{BANK_DETAILS.accountName}</span>
          </div>

          <div className="flex items-center justify-between bg-black/30 rounded-lg p-2.5 border border-white/10">
            <div>
              <span className="text-[9px] text-gray-400 uppercase tracking-wider block">Account Number</span>
              <span className="font-mono text-sm font-bold text-emerald-300">{BANK_DETAILS.accountNo}</span>
            </div>
            <button
              type="button"
              onClick={handleCopyAccount}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-white/15 hover:bg-white/25 text-white text-[11px] font-semibold transition-all cursor-pointer"
            >
              {copiedAccount ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedAccount ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-white/10">
            <span className="text-[11px] text-gray-300">Total Amount to Pay</span>
            <span className="text-sm font-bold text-emerald-300">{formatPrice(successOrder.total)}</span>
          </div>
        </div>

        {/* WhatsApp Action Button */}
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold py-3.5 px-6 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] cursor-pointer"
        >
          <WhatsAppIcon className="w-4 h-4" />
          Continue with WhatsApp to Send Payment Slip
        </a>

        {/* Order Details Accordion / Summary */}
        <div className="bg-[#F6EFE3] border border-[#8A6A4B]/10 rounded-lg p-4 text-left text-xs space-y-2.5">
          <div className="flex justify-between">
            <span className="text-gray-400">Order ID</span>
            <span className="font-mono text-gray-800">{successOrder._id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Invoice Reference</span>
            <span className="font-bold text-gray-800">{successOrder.invoiceNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Payment Method</span>
            <span className="font-bold text-[#2F4B3C]">Bank Transfer (WhatsApp)</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Order Status</span>
            <span className="bg-[#2F4B3C]/20 border border-[#2F4B3C]/30 text-[#2F4B3C] font-bold px-2 py-0.5 rounded text-[9px] uppercase tracking-wider">
              {successOrder.orderStatus}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
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
              {formData.city && formData.city.trim() && !addressErrors.city && (
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
                    placeholder="Enter city"
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

          {/* Payment gateway — Bank Transfer via WhatsApp */}
          <div className="bg-white border border-gray-150 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h3 className="text-base font-serif text-[#2F4B3C] font-semibold flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#25D366]" /> Payment Method — Bank Transfer
              </h3>
              <span className="flex items-center gap-1 text-[11px] font-bold text-[#128C7E] bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5" /> Verified Account
              </span>
            </div>

            {/* Bank Card Display */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#1E3A2F] via-[#2F4B3C] to-[#1a3026] text-white rounded-2xl p-6 shadow-md border border-[#2F4B3C]/30">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-300">Bank Transfer Details</span>
                  <h4 className="text-xl font-serif font-bold tracking-wide mt-1 text-white">
                    {BANK_DETAILS.bankName}
                  </h4>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm">
                  <Landmark className="w-5 h-5 text-emerald-300" />
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <div>
                  <span className="text-[10px] text-gray-300 uppercase tracking-wider block">Beneficiary Name</span>
                  <span className="text-sm font-semibold tracking-wide text-white">{BANK_DETAILS.accountName}</span>
                </div>

                <div className="flex items-center justify-between bg-black/25 rounded-xl p-3 border border-white/10">
                  <div>
                    <span className="text-[9px] text-gray-300 uppercase tracking-widest block font-medium">Account Number</span>
                    <span className="font-mono text-base font-bold tracking-wider text-emerald-200">
                      {BANK_DETAILS.accountNo}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyAccount}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition-all active:scale-95 cursor-pointer"
                  >
                    {copiedAccount ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-300" />
                        <span className="text-emerald-300 text-[11px]">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-gray-200">
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-300" /> WhatsApp Support: <strong className="text-white">{BANK_DETAILS.whatsappNumber}</strong>
                </span>
                <span className="text-emerald-300 font-bold">Total: {formatPrice(total)}</span>
              </div>
            </div>

            {/* How it works info */}
            <div className="bg-[#F6EFE3]/80 border border-[#8A6A4B]/20 rounded-xl p-4 text-xs space-y-2 text-gray-700">
              <h5 className="font-bold text-[#2F4B3C] text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-[#A65D3D]" /> Payment Process
              </h5>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-gray-600 font-normal leading-relaxed">
                <li>Complete your delivery address and contact information above.</li>
                <li>Click <strong>"Continue with WhatsApp"</strong> below to create your order and open the WhatsApp chat with your order summary &amp; bank details.</li>
                <li>Transfer <strong>{formatPrice(total)}</strong> to the People's Bank account and send a screenshot of your transfer slip in the WhatsApp chat to confirm dispatch.</li>
              </ol>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || hasCheckoutErrors}
            className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold py-4 rounded-xl text-xs uppercase tracking-widest transition-all duration-200 flex items-center justify-center gap-2.5 shadow-lg hover:shadow-xl active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              'Creating your order...'
            ) : (
              <>
                <WhatsAppIcon className="w-5 h-5 fill-current" />
                Continue with WhatsApp — {formatPrice(total)}
              </>
            )}
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
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600';
                      }}
                      className="w-8 h-8 rounded object-cover bg-gray-50 border border-gray-100" 
                    />
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

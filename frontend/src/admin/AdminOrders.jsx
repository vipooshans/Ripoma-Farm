import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { NotificationContext } from '../context/NotificationContext';
import { 
  ClipboardList, CheckCircle, PackageCheck, Truck, ShieldCheck, 
  Trash2, X, Printer, Loader, AlertTriangle, ChevronRight, Filter, PlusCircle, CheckCircle2
} from 'lucide-react';
import { QuantityStepper } from '../components/FormFields';
import RipomaLogo from '../components/RipomaLogo';
import { DEFAULT_SHIPPING_FEE, formatPrice } from '../utils/currency';
import { formatSriLankanPhoneInput, isValidSriLankanPhone, normalizeSriLankanPhone, PHONE_FORMAT_ERROR, PHONE_PLACEHOLDER } from '../utils/phone';

// Satisfying row flash on completion (Packed / Delivered)
const useFulfilmentFlash = () => {
  const [flashedOrders, setFlashedOrders] = useState(new Set());
  const triggerFlash = (orderId) => {
    setFlashedOrders(prev => new Set([...prev, orderId]));
    setTimeout(() => {
      setFlashedOrders(prev => {
        const next = new Set([...prev]);
        next.delete(orderId);
        return next;
      });
    }, 1400);
  };
  return { flashedOrders, triggerFlash };
};

const AdminOrders = () => {
  const { showToast } = useContext(NotificationContext);
  const { flashedOrders, triggerFlash } = useFulfilmentFlash();
  
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pipeline');
  const [statusFilter, setStatusFilter] = useState('');

  // Sourcing Manual Order state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [manualForm, setManualForm] = useState({
    name: '',
    email: '',
    phone: '',
    street: '',
    city: 'Organic City',
    zipCode: '',
    paymentMethod: 'Stripe'
  });
  const [selectedItems, setSelectedItems] = useState([]); // { product, variant, quantity }
  const [submittingManual, setSubmittingManual] = useState(false);

  // Cancellation modal state
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [cancelReason, setCancelReason] = useState('customer request');
  const [cancelNotes, setCancelNotes] = useState('');

  // Packing Slip modal state
  const [isSlipOpen, setIsSlipOpen] = useState(false);
  const [activeSlipOrder, setActiveSlipOrder] = useState(null);

  // Load orders & products
  const fetchData = async () => {
    try {
      const ordRes = await axios.get('/api/orders');
      setOrders(ordRes.data);

      const prodRes = await axios.get('/api/products');
      setProducts(prodRes.data);
    } catch (err) {
      showToast('Could not load orders or products.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Pipeline transitions
  const pipelineTransitions = {
    'Pending': ['Confirmed', 'Cancelled'],
    'Confirmed': ['Packed', 'Cancelled'],
    'Packed': ['Out for Delivery', 'Cancelled'],
    'Out for Delivery': ['Delivered', 'Cancelled'],
    'Delivered': [],
    'Cancelled': []
  };

  const handleUpdateStatus = async (orderId, currentStatus, newStatus) => {
    const allowed = pipelineTransitions[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      showToast(`Invalid progression from "${currentStatus}" to "${newStatus}"`, 'error');
      return;
    }

    if (newStatus === 'Cancelled') {
      setSelectedOrderId(orderId);
      setIsCancelModalOpen(true);
      return;
    }

    try {
      const payload = { orderStatus: newStatus };
      if (newStatus === 'Out for Delivery') {
        payload.trackingNumber = `TRK-SHIP-${Math.floor(100000 + Math.random() * 900000)}`;
      }
      await axios.put(`/api/orders/${orderId}/status`, payload);
      
      // Trigger satisfying row flash animation for milestone transitions
      if (newStatus === 'Packed' || newStatus === 'Delivered') {
        triggerFlash(orderId);
      }
      
      showToast(`Order marked: ${newStatus} ✓`, 'success');
      fetchData();
    } catch (err) {
      showToast('Failed to update status.', 'error');
    }
  };

  const submitCancellation = async (e) => {
    e.preventDefault();
    try {
      const orderToCancel = orders.find(o => o._id === selectedOrderId);
      const invoiceRef = orderToCancel ? orderToCancel.invoiceNumber : 'Selected Order';
      
      const serializedCancel = `CANCELLED - Reason: ${cancelReason} (${cancelNotes || 'No notes'})`;
      await axios.put(`/api/orders/${selectedOrderId}/status`, {
        orderStatus: 'Cancelled',
        trackingNumber: serializedCancel
      });
      showToast(`Order "${invoiceRef}" cancelled successfully.`, 'success');
      setIsCancelModalOpen(false);
      setCancelNotes('');
      fetchData();
    } catch (err) {
      showToast('Failed to record cancellation.', 'error');
    }
  };

  // Grouped picking sheets
  const getPickedItemsByCategory = () => {
    const categories = { 'Dry Fish': [], 'Eggs': [], 'Chicken': [] };
    orders
      .filter(o => o.orderStatus === 'Pending' || o.orderStatus === 'Confirmed')
      .forEach(order => {
        order.items.forEach(item => {
          const category = item.category || 'Eggs';
          if (!categories[category]) categories[category] = [];
          
          const existing = categories[category].find(
            x => x.name === item.name && x.variantName === item.variantName
          );
          if (existing) {
            existing.quantity += item.quantity;
          } else {
            categories[category].push({
              name: item.name,
              variantName: item.variantName,
              quantity: item.quantity,
              sku: item.sku || 'RIP-BASE'
            });
          }
        });
      });
    return categories;
  };

  const filteredOrders = orders.filter(o => 
    statusFilter === '' ? true : o.orderStatus === statusFilter
  );

  const pickingData = getPickedItemsByCategory();

  const handlePrintSlip = (order) => {
    setActiveSlipOrder(order);
    setIsSlipOpen(true);
  };

  // Manual Sourcing Order helpers
  const addManualItem = (prodId, varName = '') => {
    const product = products.find(p => p._id === prodId);
    if (!product) return;

    let price = product.basePrice;
    let sku = product.sku;
    if (varName && product.variants && product.variants.length > 0) {
      const v = product.variants.find(x => x.name === varName);
      if (v) {
        price = v.price;
        sku = v.sku;
      }
    }

    const existingIndex = selectedItems.findIndex(
      i => i.productId === prodId && i.variantName === varName
    );

    if (existingIndex !== -1) {
      const updated = [...selectedItems];
      updated[existingIndex].quantity += 1;
      setSelectedItems(updated);
    } else {
      setSelectedItems([
        ...selectedItems,
        {
          productId: prodId,
          name: product.name,
          variantName: varName,
          quantity: 1,
          price: price,
          sku: sku,
          image: product.images[0] || 'https://images.unsplash.com/photo-1548550022-cbf418b711d9?w=100',
          category: product.category
        }
      ]);
    }
  };

  const removeManualItem = (index) => {
    const updated = [...selectedItems];
    updated.splice(index, 1);
    setSelectedItems(updated);
  };

  const updateItemQty = (index, qty) => {
    const updated = [...selectedItems];
    updated[index].quantity = Math.max(1, parseInt(qty) || 1);
    setSelectedItems(updated);
  };

  const submitManualOrder = async (e) => {
    e.preventDefault();
    if (selectedItems.length === 0) {
      showToast('Manual order must have at least one product.', 'error');
      return;
    }
    if (!manualForm.city.trim()) {
      showToast('Delivery city is required.', 'error');
      return;
    }
    if (!isValidSriLankanPhone(manualForm.phone)) {
      showToast(PHONE_FORMAT_ERROR, 'error');
      return;
    }

    setSubmittingManual(true);

    const sub = selectedItems.reduce((acc, i) => acc + (i.price * i.quantity), 0);
    const taxAmt = sub * 0.05;
    const shipFee = DEFAULT_SHIPPING_FEE;
    const grandTotal = sub + taxAmt + shipFee;

    const payload = {
      customerDetails: {
        name: manualForm.name,
        email: manualForm.email,
        phone: normalizeSriLankanPhone(manualForm.phone),
        address: manualForm.street,
        city: manualForm.city,
        postalCode: manualForm.zipCode,
        country: 'Sri Lanka'
      },
      items: selectedItems,
      subtotal: sub,
      shippingFee: shipFee,
      tax: taxAmt,
      total: grandTotal,
      paymentMethod: manualForm.paymentMethod
    };

    try {
      await axios.post('/api/orders', payload);
      showToast('Manual phone order created successfully!', 'success');
      setIsCreateOpen(false);
      setSelectedItems([]);
      setManualForm({
        name: '',
        email: '',
        phone: '',
        street: '',
        city: 'Organic City',
        zipCode: '',
        paymentMethod: 'Stripe'
      });
      fetchData();
    } catch (err) {
      showToast('Failed to create manual order.', 'error');
    } finally {
      setSubmittingManual(false);
    }
  };

  // Category Theme tags mapping
  const getCategoryColor = (cat) => {
    if (cat === 'Dry Fish') return 'text-[#3E6B6B] border-[#3E6B6B]/20 bg-[#3E6B6B]/10';
    if (cat === 'Eggs') return 'text-[#C99A3A] border-[#C99A3A]/20 bg-[#C99A3A]/10';
    return 'text-[#2F4B3C] border-[#2F4B3C]/20 bg-[#2F4B3C]/10';
  };

  return (
    <div className="space-y-6 text-left font-sans">
      
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h2 className="text-lg font-serif font-semibold text-[#2F4B3C]">Order Fulfillment & Logistics</h2>
          <p className="text-[10px] text-gray-400 font-light">Trace order timelines, generate packing slips, log manual phone orders, and review status pipelines.</p>
        </div>
        
        <div className="flex flex-wrap gap-2.5 items-center">
          {/* Tab triggers */}
          <div className="flex bg-white border border-gray-150 p-1.5 rounded gap-2 text-[9px] uppercase tracking-wider font-bold select-none">
            <button 
              onClick={() => setActiveTab('pipeline')}
              className={`px-3 py-1.5 rounded cursor-pointer ${activeTab === 'pipeline' ? 'bg-[#2F4B3C] text-white' : 'text-gray-500 hover:text-gray-800'}`}
            >
              Pipeline Roster
            </button>
            <button 
              onClick={() => setActiveTab('picking')}
              className={`px-3 py-1.5 rounded cursor-pointer ${activeTab === 'picking' ? 'bg-[#2F4B3C] text-white' : 'text-gray-500 hover:text-gray-800'}`}
            >
              Picking List (Grouped)
            </button>
          </div>

          <button
            onClick={() => { setSelectedItems([]); setIsCreateOpen(true); }}
            className="bg-[#2F4B3C] hover:bg-[#A65D3D] text-white font-bold text-[9px] uppercase tracking-widest py-3 px-4 rounded transition-colors flex items-center gap-1 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" /> New Phone Order
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center text-gray-400 text-xs"><Loader className="w-5 h-5 animate-spin" /></div>
      ) : activeTab === 'pipeline' ? (
        
        /* PIPELINE VIEW */
        <div className="space-y-5 print:hidden">
          {/* Filters */}
          <div className="bg-white border border-gray-150/60 rounded p-4 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-bold text-gray-500">Filter Status:</span>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-gray-200 outline-none rounded py-1.5 px-3 text-xs text-gray-700 cursor-pointer"
            >
              <option value="">All Orders</option>
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Packed">Packed</option>
              <option value="Out for Delivery">Out for Delivery</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* Orders registry table */}
          <div className="bg-white border border-gray-200 rounded overflow-hidden shadow-sm">
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-150/60 text-gray-400 font-bold uppercase tracking-wider text-[9px] bg-gray-50/50">
                    <th className="p-4">Invoice</th>
                    <th className="p-4">Customer info</th>
                    <th className="p-4">Total Amount</th>
                    <th className="p-4">Current Pipeline</th>
                    <th className="p-4 text-center">Fulfillment Actions</th>
                    <th className="p-4 text-right">Documents</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map(order => (
                    <tr 
                      key={order._id} 
                      className={`border-b border-gray-50 hover:bg-[#F6EFE3]/30 transition-all duration-500 ${
                        flashedOrders.has(order._id) 
                          ? 'bg-emerald-50 border-emerald-200 shadow-sm scale-[1.001]' 
                          : ''
                      }`}
                    >
                      <td className="p-4 font-mono font-bold text-gray-450">{order.invoiceNumber}</td>
                      <td className="p-4">
                        <div className="text-gray-900 font-bold">{order.customerDetails.name}</div>
                        <div className="text-[10px] text-gray-400">{order.customerDetails.phone} • {order.customerDetails.email}</div>
                      </td>
                      <td className="p-4 font-bold text-[#2F4B3C]">{formatPrice(order.total)}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border ${
                          order.orderStatus === 'Delivered' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' :
                          order.orderStatus === 'Cancelled' ? 'bg-red-50 text-red-700 border-red-100' :
                          order.orderStatus === 'Out for Delivery' ? 'bg-blue-50 text-blue-800 border-blue-100' :
                          order.orderStatus === 'Packed' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' :
                          'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>
                          {order.orderStatus}
                        </span>
                      </td>
                      
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2 select-none">
                          {order.orderStatus === 'Pending' && (
                            <button
                              onClick={() => handleUpdateStatus(order._id, 'Pending', 'Confirmed')}
                              className="bg-gray-100 hover:bg-[#2F4B3C] hover:text-white border border-gray-200 text-gray-700 text-[9px] uppercase tracking-wider font-bold px-3 py-1.5 rounded transition-all cursor-pointer"
                            >
                              Confirm
                            </button>
                          )}
                          {order.orderStatus === 'Confirmed' && (
                            <button
                              onClick={() => handleUpdateStatus(order._id, 'Confirmed', 'Packed')}
                              className="bg-amber-50 hover:bg-amber-150 text-amber-800 border border-amber-200 text-[9px] uppercase tracking-wider font-bold px-3 py-1.5 rounded transition-all cursor-pointer"
                            >
                              Mark Packed
                            </button>
                          )}
                          {order.orderStatus === 'Packed' && (
                            <button
                              onClick={() => handleUpdateStatus(order._id, 'Packed', 'Out for Delivery')}
                              className="bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-[9px] uppercase tracking-wider font-bold px-3 py-1.5 rounded transition-all cursor-pointer"
                            >
                              Ship Order
                            </button>
                          )}
                          {order.orderStatus === 'Out for Delivery' && (
                            <button
                              onClick={() => handleUpdateStatus(order._id, 'Out for Delivery', 'Delivered')}
                              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[9px] uppercase tracking-wider font-bold px-3 py-1.5 rounded transition-all cursor-pointer"
                            >
                              Deliver
                            </button>
                          )}
                          
                          {order.orderStatus !== 'Delivered' && order.orderStatus !== 'Cancelled' && (
                            <button
                              onClick={() => handleUpdateStatus(order._id, order.orderStatus, 'Cancelled')}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded cursor-pointer"
                              title="Cancel Order"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="p-4 text-right">
                        <button
                          onClick={() => handlePrintSlip(order)}
                          className="text-[#2F4B3C] hover:text-[#A65D3D] inline-flex items-center gap-1 hover:underline font-bold text-[9px] uppercase cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" /> Packing Slip
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        
        /* PICK LIST */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:hidden">
          {Object.entries(pickingData).map(([category, items]) => (
            <div key={category} className="bg-white border border-gray-150/60 rounded p-5 shadow-sm space-y-4">
              <h3 className={`text-xs font-serif font-bold uppercase tracking-wider border rounded p-2.5 flex items-center gap-2 ${getCategoryColor(category)}`}>
                <span>{category} picking sheet</span>
              </h3>
              
              {items.length === 0 ? (
                <p className="text-center py-6 text-gray-400 font-light text-[11px]">No pending units to pick.</p>
              ) : (
                <div className="space-y-2 text-[11px] font-sans">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center border-b border-gray-50 pb-2">
                      <div>
                        <div className="font-bold text-gray-800">{item.name}</div>
                        {item.variantName && <span className="text-[9px] text-gray-400">{item.variantName}</span>}
                      </div>
                      <span className="bg-[#2F4B3C] text-white px-2 py-0.5 rounded font-black text-xs">
                        × {item.quantity}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* CREATE MANUAL PHONE ORDER MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 border border-gray-150/60 shadow-2xl relative animate-fade-in-up flex flex-col max-h-[90vh]">
            
            <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4 select-none">
              <h3 className="font-serif text-sm font-bold text-[#2F4B3C]">Create Manual Phone Order</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer font-bold">✕</button>
            </div>

            <form onSubmit={submitManualOrder} className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto pr-1 text-xs text-gray-600">
              
              {/* Left Column: Customer details */}
              <div className="space-y-3">
                <h4 className="font-serif font-bold text-gray-800 uppercase tracking-wider text-[9px] border-b border-gray-50 pb-1 text-[#A65D3D]">Customer Info</h4>
                
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Full Name</label>
                  <input
                    type="text"
                    required
                    value={manualForm.name}
                    onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}
                    className="w-full border border-gray-200 outline-none rounded py-2 px-3 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
                    required
                    value={manualForm.email}
                    onChange={(e) => setManualForm({ ...manualForm, email: e.target.value })}
                    className="w-full border border-gray-200 outline-none rounded py-2 px-3 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Phone</label>
                  <input
                    type="tel"
                    required
                    placeholder={PHONE_PLACEHOLDER}
                    value={manualForm.phone}
                    onChange={(e) => setManualForm({ ...manualForm, phone: formatSriLankanPhoneInput(e.target.value) })}
                    className={`w-full border ${manualForm.phone && !isValidSriLankanPhone(manualForm.phone) ? 'border-red-400' : 'border-gray-200'} outline-none rounded py-2 px-3 text-xs`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Street Address</label>
                  <input
                    type="text"
                    required
                    value={manualForm.street}
                    onChange={(e) => setManualForm({ ...manualForm, street: e.target.value })}
                    className="w-full border border-gray-200 outline-none rounded py-2 px-3 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">City</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Colombo, Kandy"
                      value={manualForm.city}
                      onChange={(e) => setManualForm({ ...manualForm, city: e.target.value })}
                      className="w-full border border-gray-200 outline-none rounded py-2 px-3 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Zip Code</label>
                    <input
                      type="text"
                      required
                      value={manualForm.zipCode}
                      onChange={(e) => setManualForm({ ...manualForm, zipCode: e.target.value })}
                      className="w-full border border-gray-200 outline-none rounded py-2 px-3 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Payment Gateway</label>
                  <select
                    value={manualForm.paymentMethod}
                    onChange={(e) => setManualForm({ ...manualForm, paymentMethod: e.target.value })}
                    className="w-full border border-gray-200 outline-none rounded py-2 px-3 text-xs bg-white"
                  >
                    <option value="Bank Transfer (WhatsApp)">Bank Transfer (WhatsApp)</option>
                    <option value="Stripe">Stripe (Card Payment)</option>
                    <option value="Cash on Delivery">Cash on Delivery (COD)</option>
                  </select>
                </div>
              </div>

              {/* Right Column: Catalog Basket Builder */}
              <div className="space-y-3 flex flex-col max-h-[50vh] md:max-h-none">
                <h4 className="font-serif font-bold text-gray-800 uppercase tracking-wider text-[9px] border-b border-gray-50 pb-1 text-[#A65D3D]">Item Basket</h4>
                
                {/* Catalog select dropdown */}
                <div className="bg-[#F6EFE3] border border-gray-150 p-3 rounded space-y-2">
                  <label className="text-[8px] font-black uppercase text-gray-400 tracking-wider">Select Product to Add</label>
                  <div className="space-y-1.5 max-h-28 overflow-y-auto">
                    {products.map(p => {
                      if (p.variants && p.variants.length > 0) {
                        return p.variants.map((v, vIdx) => (
                          <button
                            key={`${p._id}-${vIdx}`}
                            type="button"
                            onClick={() => addManualItem(p._id, v.name)}
                            className="w-full text-left bg-white border border-gray-200 hover:border-[#2F4B3C] p-2 rounded text-[10px] font-bold flex justify-between items-center cursor-pointer"
                          >
                            <span>{p.name} ({v.name})</span>
                            <span className="text-[#2F4B3C]">{formatPrice(v.price)}</span>
                          </button>
                        ));
                      }
                      return (
                        <button
                          key={p._id}
                          type="button"
                          onClick={() => addManualItem(p._id)}
                          className="w-full text-left bg-white border border-gray-200 hover:border-[#2F4B3C] p-2 rounded text-[10px] font-bold flex justify-between items-center cursor-pointer"
                        >
                          <span>{p.name}</span>
                          <span className="text-[#2F4B3C]">{formatPrice(p.basePrice)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selected basket list */}
                <div className="flex-1 space-y-2 max-h-36 overflow-y-auto bg-gray-50/50 p-2.5 border border-gray-100 rounded">
                  <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Current Basket</span>
                  {selectedItems.length === 0 ? (
                    <div className="text-center py-6 text-gray-450 italic text-[10px]">Basket is currently empty.</div>
                  ) : (
                    selectedItems.map((item, idx) => (
                      <div key={idx} className="bg-white border border-gray-100 p-2 rounded flex justify-between items-center text-[10px]">
                        <div>
                          <div className="font-bold text-gray-800 truncate max-w-[150px]">{item.name}</div>
                          {item.variantName && <div className="text-[9px] text-[#A65D3D]">{item.variantName}</div>}
                          <div className="text-gray-400 font-mono text-[9px]">{formatPrice(item.price)} each</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItemQty(idx, e.target.value)}
                            className="w-10 border border-gray-200 text-center font-bold rounded py-0.5"
                          />
                          <button
                            type="button"
                            onClick={() => removeManualItem(idx)}
                            className="text-red-500 hover:text-red-700 cursor-pointer font-bold"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Action Buttons footer spans 2 cols */}
              <div className="col-span-1 md:col-span-2 flex justify-end gap-2 pt-3 border-t border-gray-100 select-none">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-750 font-bold py-2 px-4 rounded uppercase text-[9px] tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingManual || selectedItems.length === 0}
                  className="bg-[#2F4B3C] disabled:bg-gray-300 disabled:text-gray-500 hover:bg-[#A65D3D] text-white font-bold py-2 px-4 rounded uppercase text-[9px] tracking-wider cursor-pointer"
                >
                  {submittingManual ? 'Saving Order...' : 'Log Phone Order'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* CANCELLATION DIALOG MODAL */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-gray-200 max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-serif text-sm font-bold text-[#2F4B3C] flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-[#A65D3D]" /> Log Cancellation Reason
            </h3>
            
            <form onSubmit={submitCancellation} className="space-y-4 text-xs text-gray-600">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Primary Reason</label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full bg-white border border-gray-200 outline-none rounded py-2 px-3 text-xs text-gray-700 cursor-pointer"
                >
                  <option value="customer request">Customer Request</option>
                  <option value="stock issue">Stock Level Issue</option>
                  <option value="payment failed">Payment Verification Failed</option>
                  <option value="other">Other Sourcing Issue</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Additional audit notes</label>
                <textarea
                  required
                  rows="2"
                  value={cancelNotes}
                  onChange={(e) => setCancelNotes(e.target.value)}
                  placeholder="Provide audit notes for logs..."
                  className="w-full border border-gray-200 outline-none rounded py-2 px-3 text-xs text-gray-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 select-none">
                <button
                  type="button"
                  onClick={() => setIsCancelModalOpen(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded uppercase text-[9px] tracking-wider"
                >
                  Dismiss
                </button>
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded uppercase text-[9px] tracking-wider"
                >
                  Record Cancellation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PACKING SLIP PRINT VIEW OVERLAY */}
      {isSlipOpen && activeSlipOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs print:relative print:inset-auto print:bg-transparent print:p-0">
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-6 relative print:shadow-none print:border-none print:p-0">
            
            <button 
              onClick={() => setIsSlipOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 print:hidden cursor-pointer"
            >
              ✕
            </button>

            <div className="space-y-6 text-left font-sans text-xs">
              
              <div className="flex justify-between items-start border-b border-gray-150 pb-4">
                <div>
                  <RipomaLogo variant="full" color="mono" height={36} />
                  <span className="text-[8px] uppercase tracking-widest text-gray-500 block pt-1 font-semibold">Official Packing Slip / Fulfillment Document</span>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-gray-900">{activeSlipOrder.invoiceNumber}</div>
                  <div className="text-[9px] text-gray-400">{new Date(activeSlipOrder.createdAt).toLocaleDateString()}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 text-[10px] text-gray-600 border-b border-gray-50 pb-4">
                <div>
                  <h4 className="font-bold uppercase tracking-wider text-gray-400 text-[8px] mb-1">Customer Address</h4>
                  <div className="font-bold text-gray-950">{activeSlipOrder.customerDetails.name}</div>
                  <div className="font-light">{activeSlipOrder.customerDetails.address}</div>
                  <div className="font-light">{activeSlipOrder.customerDetails.city}, {activeSlipOrder.customerDetails.postalCode}</div>
                </div>
                <div>
                  <h4 className="font-bold uppercase tracking-wider text-gray-400 text-[8px] mb-1">Fulfillment Details</h4>
                  <div>Method: <span className="font-bold text-gray-800">{activeSlipOrder.paymentMethod}</span></div>
                  <div>Status: <span className="font-bold text-emerald-800">{activeSlipOrder.orderStatus}</span></div>
                  <div>Phone: <span className="font-light">{activeSlipOrder.customerDetails.phone}</span></div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold uppercase tracking-wider text-gray-400 text-[8px]">Harvest Inventory Items</h4>
                <div className="border border-gray-150 rounded overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-gray-450 uppercase text-[8px] font-bold tracking-wider border-b border-gray-150">
                        <th className="p-2.5">Item</th>
                        <th className="p-2.5">Option</th>
                        <th className="p-2.5 text-right">Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeSlipOrder.items.map((item, idx) => (
                        <tr key={idx} className="border-b border-gray-50 font-light">
                          <td className="p-2.5 font-bold text-gray-900">{item.name}</td>
                          <td className="p-2.5 capitalize">{item.variantName || 'N/A'}</td>
                          <td className="p-2.5 text-right font-bold text-gray-900">× {item.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <div className="text-[9px] text-[#2F4B3C] font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#2F4B3C]" />
                  <span>Harvest Freshness Certified</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-400">Total Charged: </span>
                  <span className="font-bold text-gray-900 text-sm">{formatPrice(activeSlipOrder.total)}</span>
                </div>
              </div>

            </div>

            <div className="flex justify-end gap-2 border-t border-gray-100 pt-4 print:hidden select-none">
              <button
                onClick={() => setIsSlipOpen(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-750 font-bold py-2.5 px-6 rounded uppercase text-[9px] tracking-wider cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="bg-[#2F4B3C] hover:bg-[#A65D3D] text-white font-bold py-2.5 px-6 rounded transition-colors uppercase text-[9px] tracking-wider cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" /> Print packing slip
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default AdminOrders;

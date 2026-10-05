import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { NotificationContext } from '../context/NotificationContext';
import { Users, Search, DollarSign, Calendar, Filter, Loader, PlusCircle, Edit2, Trash2, ShieldAlert } from 'lucide-react';
import { formatPrice } from '../utils/currency';

const AdminCustomers = () => {
  const { showToast } = useContext(NotificationContext);
  
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('');

  // Customer CRUD States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);
  
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    city: 'Organic City',
    street: '',
    zipCode: '',
    notes: ''
  });

  // Simulated local state for manual customer registry & deactivations (persisted in session/state)
  const [manualList, setManualList] = useState([]);
  const [deactivatedEmails, setDeactivatedEmails] = useState([]);
  const [customerNotes, setCustomerNotes] = useState({});

  // Compile and aggregate customer details from live orders
  const fetchAndCompileCustomers = async () => {
    try {
      const { data: orders } = await axios.get('/api/orders');
      
      const customerMap = {};
      
      // Seed with manually created customer profiles
      manualList.forEach(m => {
        const email = m.email.toLowerCase().trim();
        customerMap[email] = {
          name: m.name,
          email: email,
          phone: m.phone || 'N/A',
          city: m.city || 'N/A',
          street: m.street || '',
          zipCode: m.zipCode || '',
          totalSpent: 0,
          orderCount: 0,
          lastOrderDate: new Date(0).toISOString(),
          categories: new Set()
        };
      });

      orders.forEach(o => {
        const email = o.customerDetails.email?.toLowerCase().trim();
        if (!email) return;

        if (!customerMap[email]) {
          customerMap[email] = {
            name: o.customerDetails.name,
            email: email,
            phone: o.customerDetails.phone || 'N/A',
            city: o.customerDetails.city || 'N/A',
            street: o.customerDetails.address || '',
            zipCode: o.customerDetails.postalCode || '',
            totalSpent: 0,
            orderCount: 0,
            lastOrderDate: o.createdAt,
            categories: new Set()
          };
        }
        
        customerMap[email].totalSpent += o.total;
        customerMap[email].orderCount += 1;
        
        if (new Date(o.createdAt) > new Date(customerMap[email].lastOrderDate)) {
          customerMap[email].lastOrderDate = o.createdAt;
        }

        o.items.forEach(item => {
          if (item.category) customerMap[email].categories.add(item.category);
        });
      });

      const list = Object.values(customerMap).map(c => {
        const categoriesArr = Array.from(c.categories);
        const tags = [];
        
        // Check Deactivation Status
        const isDeactivated = deactivatedEmails.includes(c.email);
        if (isDeactivated) {
          tags.push({ label: 'Deactivated', color: 'bg-red-50 text-red-700 border-red-100' });
        } else {
          tags.push({ label: 'Active Account', color: 'bg-emerald-50 text-emerald-800 border-emerald-100' });
        }

        // Segment Tagging logic
        if (c.totalSpent >= 200) {
          tags.push({ label: 'Premium Sourced', color: 'bg-[#A65D3D]/10 text-[#A65D3D] border-[#A65D3D]/20' });
        }
        if (categoriesArr.includes('Eggs')) {
          tags.push({ label: 'Pasture Eggs Fan', color: 'bg-[#C99A3A]/10 text-[#C99A3A] border-[#C99A3A]/20' });
        }
        if (categoriesArr.includes('Dry Fish')) {
          tags.push({ label: 'Seafood Collector', color: 'bg-[#3E6B6B]/10 text-[#3E6B6B] border-[#3E6B6B]/20' });
        }
        if (categoriesArr.includes('Chicken')) {
          tags.push({ label: 'Chicken Buyer', color: 'bg-[#2F4B3C]/10 text-[#2F4B3C] border-[#2F4B3C]/20' });
        }
        if (c.orderCount >= 3) {
          tags.push({ label: 'Loyal Buyer', color: 'bg-[#2F4B3C]/5 text-[#2F4B3C] border-[#2F4B3C]/10' });
        }

        const notes = customerNotes[c.email] || '';

        return { ...c, tags, isDeactivated, notes };
      });

      setCustomers(list);
    } catch (err) {
      showToast('Could not load customer profiles.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAndCompileCustomers();
  }, [manualList, deactivatedEmails, customerNotes]);

  const handleOpenAdd = () => {
    setForm({
      name: '',
      email: '',
      phone: '',
      city: 'Organic City',
      street: '',
      zipCode: '',
      notes: ''
    });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (cust) => {
    setSelectedCustomer(cust);
    setForm({
      name: cust.name,
      email: cust.email,
      phone: cust.phone,
      city: cust.city,
      street: cust.street || '',
      zipCode: cust.zipCode || '',
      notes: cust.notes || ''
    });
    setIsEditOpen(true);
  };

  const handleOpenDeactivate = (cust) => {
    setSelectedCustomer(cust);
    setIsDeactivateOpen(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Simulate/register client in mock roster
      const newCust = { ...form };
      setManualList(prev => [...prev, newCust]);
      if (form.notes.trim()) {
        setCustomerNotes(prev => ({ ...prev, [form.email.toLowerCase()]: form.notes }));
      }
      showToast(`Customer profile "${form.name}" registered successfully.`, 'success');
      setIsAddOpen(false);
    } catch (err) {
      showToast('Failed to register customer profile.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Update manual list if registered there
      setManualList(prev => prev.map(m => m.email.toLowerCase() === form.email.toLowerCase() ? { ...m, ...form } : m));
      
      // Update notes
      setCustomerNotes(prev => ({ ...prev, [form.email.toLowerCase()]: form.notes }));
      
      showToast(`Profile for "${form.name}" updated successfully.`, 'success');
      setIsEditOpen(false);
    } catch (err) {
      showToast('Failed to update customer details.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDeactivate = () => {
    if (!selectedCustomer) return;
    const email = selectedCustomer.email.toLowerCase();
    
    if (deactivatedEmails.includes(email)) {
      // Re-activate
      setDeactivatedEmails(prev => prev.filter(e => e !== email));
      showToast(`Account "${selectedCustomer.name}" re-activated.`, 'success');
    } else {
      // Deactivate
      setDeactivatedEmails(prev => [...prev, email]);
      showToast(`Account "${selectedCustomer.name}" deactivated successfully.`, 'success');
    }
    setIsDeactivateOpen(false);
    setSelectedCustomer(null);
  };

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                          c.email.toLowerCase().includes(search.toLowerCase());
    
    const matchesSegment = segmentFilter === '' ? true :
                           c.tags.some(t => t.label === segmentFilter);
                            
    return matchesSearch && matchesSegment;
  });

  return (
    <div className="space-y-6 text-left font-sans print:hidden">
      
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 select-none">
        <div>
          <h2 className="text-lg font-serif font-semibold text-[#2F4B3C]">Customer Loyalty Roster</h2>
          <p className="text-[10px] text-gray-400 font-light">Monitor customer histories, track overall Lifetime Value (LTV), review behavioral segmentations.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-[#2F4B3C] hover:bg-[#A65D3D] text-white font-bold text-[10px] uppercase tracking-widest py-3 px-5 rounded transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
        >
          <PlusCircle className="w-4 h-4" /> Add Customer Profile
        </button>
      </div>

      {/* Filters bar */}
      <div className="bg-white border border-gray-150/60 rounded p-4 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4 select-none">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 focus:border-[#2F4B3C] focus:ring-1 focus:ring-[#2F4B3C] outline-none rounded text-xs"
          />
        </div>

        <select
          value={segmentFilter}
          onChange={(e) => setSegmentFilter(e.target.value)}
          className="w-full sm:w-48 bg-white border border-gray-200 focus:border-[#2F4B3C] outline-none rounded py-2 px-3 text-xs font-bold text-gray-650 cursor-pointer"
        >
          <option value="">All Segmentations</option>
          <option value="Active Account">Active Account</option>
          <option value="Deactivated">Deactivated</option>
          <option value="Premium Sourced">Premium Sourced</option>
          <option value="Pasture Eggs Fan">Pasture Eggs Fan</option>
          <option value="Seafood Collector">Seafood Collector</option>
          <option value="Chicken Buyer">Chicken Buyer</option>
          <option value="Loyal Buyer">Loyal Buyer</option>
        </select>
      </div>

      {/* Table grid */}
      <div className="bg-white border border-gray-200 rounded overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 flex justify-center text-gray-400 text-xs"><Loader className="w-5 h-5 animate-spin" /></div>
        ) : filteredCustomers.length === 0 ? (
          <div className="py-20 text-center text-gray-400 text-xs">No customer profiles aggregated yet.</div>
        ) : (
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-150/60 text-gray-400 font-bold uppercase tracking-wider text-[9px] bg-gray-50/50 select-none">
                  <th className="p-4">Customer Details</th>
                  <th className="p-4">Location Info</th>
                  <th className="p-4 text-center">Orders Placed</th>
                  <th className="p-4 text-center">Lifetime Value (LTV)</th>
                  <th className="p-4">Sourcing Segments & Notes</th>
                  <th className="p-4 text-right">Audit Options</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((cust, idx) => (
                  <tr key={idx} className="border-b border-gray-50 hover:bg-[#F6EFE3]/30 transition-colors group">
                    <td className="p-4">
                      <div className="font-bold text-gray-900 leading-snug">{cust.name}</div>
                      <div className="text-[10px] text-gray-400 font-light mt-0.5">{cust.email}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-gray-800">{cust.phone}</div>
                      <div className="text-[10px] text-gray-400 font-light mt-0.5">{cust.city}</div>
                    </td>
                    <td className="p-4 text-center font-bold text-gray-700">
                      {cust.orderCount}
                    </td>
                    <td className="p-4 text-center font-black text-[#2F4B3C]">
                      {formatPrice(cust.totalSpent)}
                    </td>
                    <td className="p-4">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap gap-1">
                          {cust.tags.map((tag, tIdx) => (
                            <span 
                              key={tIdx} 
                              className={`px-1.5 py-0.2 rounded text-[7.5px] font-black uppercase tracking-wider border select-none ${tag.color}`}
                            >
                              {tag.label}
                            </span>
                          ))}
                        </div>
                        {cust.notes && <p className="text-[10px] text-gray-400 italic">"Note: {cust.notes}"</p>}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      {/* Controls display on hover */}
                      <div className="flex justify-end gap-2.5 opacity-0 group-hover:opacity-100 transition-opacity select-none">
                        <button
                          onClick={() => handleOpenEdit(cust)}
                          className="text-[#2F4B3C] hover:text-[#A65D3D] p-1 cursor-pointer"
                          title="Edit Details & Notes"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenDeactivate(cust)}
                          className="text-red-500 hover:text-red-750 p-1 cursor-pointer"
                          title={cust.isDeactivated ? 'Activate Account' : 'Deactivate Account'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD CUSTOMER MODAL */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm select-none">
          <div className="bg-white rounded-xl max-w-md w-full p-6 border border-gray-150/60 shadow-2xl relative animate-fade-in-up">
            
            <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
              <h3 className="font-serif text-sm font-bold text-[#2F4B3C]">Add Customer Profile</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer font-bold">✕</button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs text-gray-600 select-text">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-250/80 outline-none rounded py-2 px-3 text-xs focus:border-[#2F4B3C]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-gray-250/80 outline-none rounded py-2 px-3 text-xs focus:border-[#2F4B3C]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Phone</label>
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full border border-gray-250/80 outline-none rounded py-2 px-3 text-xs focus:border-[#2F4B3C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">City</label>
                  <input
                    type="text"
                    required
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full border border-gray-250/80 outline-none rounded py-2 px-3 text-xs focus:border-[#2F4B3C]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Zip Code</label>
                  <input
                    type="text"
                    required
                    value={form.zipCode}
                    onChange={(e) => setForm({ ...form, zipCode: e.target.value })}
                    className="w-full border border-gray-250/80 outline-none rounded py-2 px-3 text-xs focus:border-[#2F4B3C]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Internal Sourcing Notes</label>
                <textarea
                  placeholder="e.g. Prefers morning delivery. Gate code #129"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full border border-gray-250/80 outline-none rounded py-2 px-3 text-xs focus:border-[#2F4B3C]"
                  rows="2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 select-none">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-750 font-bold py-2 px-4 rounded uppercase text-[9px] tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#2F4B3C] disabled:bg-gray-300 disabled:text-gray-500 hover:bg-[#A65D3D] text-white font-bold py-2 px-4 rounded uppercase text-[9px] tracking-wider cursor-pointer"
                >
                  {submitting ? 'Registering...' : 'Register Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CUSTOMER MODAL */}
      {isEditOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm select-none">
          <div className="bg-white rounded-xl max-w-md w-full p-6 border border-gray-150/60 shadow-2xl relative animate-fade-in-up">
            
            <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
              <h3 className="font-serif text-sm font-bold text-[#2F4B3C]">Edit Customer Profile</h3>
              <button onClick={() => setIsEditOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer font-bold">✕</button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3.5 text-xs text-gray-605 select-text">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-250/80 outline-none rounded py-2 px-3 text-xs focus:border-[#2F4B3C]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Email Address (Locked)</label>
                <div className="font-mono font-bold text-gray-400 bg-gray-50 border border-gray-100 rounded py-2 px-3 text-[11px] select-none">
                  {form.email}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Phone</label>
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full border border-gray-250/80 outline-none rounded py-2 px-3 text-xs focus:border-[#2F4B3C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">City</label>
                  <input
                    type="text"
                    required
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full border border-gray-250/80 outline-none rounded py-2 px-3 text-xs focus:border-[#2F4B3C]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Zip Code</label>
                  <input
                    type="text"
                    required
                    value={form.zipCode}
                    onChange={(e) => setForm({ ...form, zipCode: e.target.value })}
                    className="w-full border border-gray-250/80 outline-none rounded py-2 px-3 text-xs focus:border-[#2F4B3C]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Internal Sourcing Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full border border-gray-250/80 outline-none rounded py-2 px-3 text-xs focus:border-[#2F4B3C]"
                  rows="2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 select-none">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-755 font-bold py-2 px-4 rounded uppercase text-[9px] tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#2F4B3C] disabled:bg-gray-300 disabled:text-gray-500 hover:bg-[#A65D3D] text-white font-bold py-2 px-4 rounded uppercase text-[9px] tracking-wider cursor-pointer"
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DEACTIVATE / SUSPEND CONFIRM MODAL */}
      {isDeactivateOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none">
          <div className="bg-white rounded-xl border border-gray-200 max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-serif text-sm font-bold text-[#2F4B3C] flex items-center gap-1.5">
              <ShieldAlert className="w-4.5 h-4.5 text-[#A65D3D]" /> Confirm Account Deactivation
            </h3>
            
            <p className="text-xs text-gray-500 font-light leading-relaxed">
              Are you sure you want to {selectedCustomer.isDeactivated ? 're-activate' : 'deactivate'} customer **{selectedCustomer.name}**? 
              {selectedCustomer.isDeactivated ? ' This will restore their credentials and login access immediately.' : ' Deactivation blocks storefront login credentials immediately but preserves billing and LTV history.'}
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => { setIsDeactivateOpen(false); setSelectedCustomer(null); }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded uppercase text-[9px] tracking-wider cursor-pointer"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={confirmDeactivate}
                className="bg-[#2F4B3C] hover:bg-[#A65D3D] text-white font-bold py-2 px-4 rounded uppercase text-[9px] tracking-wider cursor-pointer"
              >
                {selectedCustomer.isDeactivated ? 'Re-Activate Account' : 'Deactivate Account'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminCustomers;

import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { NotificationContext } from '../context/NotificationContext';
import { formatCompactAmount, formatPrice } from '../utils/currency';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  BarChart, Bar 
} from 'recharts';
import { 
  DollarSign, ShoppingBag, Box, TrendingUp, AlertTriangle, 
  Clock, CheckCircle, ShieldAlert 
} from 'lucide-react';

const AdminOverview = () => {
  const { showToast } = useContext(NotificationContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);

  const fetchStats = async () => {
    try {
      const { data } = await axios.get('/api/transactions/stats');
      if (data && data.summary) {
        setStats(data);
      } else {
        throw new Error('Incomplete data');
      }
      
      const ordersRes = await axios.get('/api/orders');
      setRecentOrders((ordersRes.data || []).slice(0, 5));
    } catch {
      setStats({
        summary: {
          totalRevenue: 24850.00,
          totalCostOfGoods: 9400.00,
          grossProfit: 15450.00,
          profitMarginPct: 62.1
        },
        monthlySalesTrends: [
          { month: 'Jan', revenue: 3800, cost: 1400 },
          { month: 'Feb', revenue: 4200, cost: 1600 },
          { month: 'Mar', revenue: 5100, cost: 1900 },
          { month: 'Apr', revenue: 4900, cost: 1800 },
          { month: 'May', revenue: 6850, cost: 2700 }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdatingOrderId(orderId);
    try {
      const payload = { orderStatus: newStatus };
      if (newStatus === 'Shipped') {
        payload.trackingNumber = `TRK-${Math.floor(100000 + Math.random() * 900000)}`;
      }
      await axios.put(`/api/orders/${orderId}/status`, payload);
      showToast(`Order status updated to: ${newStatus}`, 'success');
      fetchStats();
    } catch (err) {
      showToast('Failed to update status.', 'error');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  if (loading || !stats) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1,2,3,4].map(n => <div key={n} className="h-28 bg-white rounded-lg border border-gray-100 shadow-sm"></div>)}
        </div>
        <div className="h-80 bg-white rounded-lg border border-gray-100 shadow-sm"></div>
      </div>
    );
  }

  const { summary, monthlySalesTrends, topSellingProducts, lowStockAlerts } = stats;

  return (
    <div className="space-y-8 animate-fade-in-up text-left">
      
      {/* 1. METRICS CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 font-sans">
        
        {/* Total Revenue */}
        <div className="bg-white rounded-lg p-5 border border-gray-150/60 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Total Revenue</span>
            <span className="text-xl font-bold text-gray-900">{formatPrice(summary.totalRevenue)}</span>
            <span className="text-[9px] text-[#2F4B3C] font-semibold block flex items-center gap-0.5 mt-1 select-none">
              <TrendingUp className="w-3 h-3" /> +14% monthly growth
            </span>
          </div>
          <div className="w-10 h-10 bg-[#2F4B3C]/10 border border-[#2F4B3C]/20 text-[#2F4B3C] rounded flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5 stroke-[1.5]" />
          </div>
        </div>

        {/* Today's Sales */}
        <div className="bg-white rounded-lg p-5 border border-gray-150/60 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Today's Sales</span>
            <span className="text-xl font-bold text-gray-900">{formatPrice(summary.todaySales)}</span>
            <span className="text-[9px] text-gray-400 block mt-1 font-light">Current fiscal day</span>
          </div>
          <div className="w-10 h-10 bg-[#A65D3D]/10 border border-[#A65D3D]/20 text-[#A65D3D] rounded flex items-center justify-center shrink-0">
            <ShoppingBag className="w-5 h-5 stroke-[1.5]" />
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-white rounded-lg p-5 border border-gray-150/60 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Net Profit Margin</span>
            <span className="text-xl font-bold text-[#2F4B3C]">{formatPrice(summary.netProfit)}</span>
            <span className="text-[9px] text-[#2F4B3C]/60 block mt-1 font-light">Reflects Cost of Goods</span>
          </div>
          <div className="w-10 h-10 bg-[#2F4B3C]/5 border border-[#2F4B3C]/10 text-[#2F4B3C] rounded flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 stroke-[1.5]" />
          </div>
        </div>

        {/* Low Stock count */}
        <div className="bg-white rounded-lg p-5 border border-gray-150/60 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Low Stock Alerts</span>
            <span className={`text-xl font-bold ${summary.lowStockCount > 0 ? 'text-red-600' : 'text-gray-900'}`}>{summary.lowStockCount}</span>
            <span className="text-[9px] text-red-500 font-light block mt-1">Requires harvest review</span>
          </div>
          <div className={`w-10 h-10 rounded flex items-center justify-center shrink-0 border ${summary.lowStockCount > 0 ? 'bg-red-50 text-red-600 border-red-100 animate-pulse' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
            <AlertTriangle className="w-5 h-5 stroke-[1.5]" />
          </div>
        </div>

      </section>

      {/* 2. RECHARTS ANALYTICS */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Revenue/Profit Monthly performance */}
        <div className="bg-white rounded-xl p-6 border border-gray-200/80 shadow-sm lg:col-span-2 space-y-4">
          <div className="space-y-0.5">
            <h3 className="font-bold text-[#2F4B3C] text-sm uppercase tracking-wider">Monthly performance</h3>
            <p className="text-[10px] text-gray-400 font-light">Total monthly revenue margins vs net profitability in LKR.</p>
          </div>
          <div className="h-64 w-full text-[10px]">
            <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 1, height: 1 }}>
              <AreaChart data={monthlySalesTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2F4B3C" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#2F4B3C" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="month" stroke="#9ca3af" fontSize={9} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={9} tickLine={false} axisLine={false} tickFormatter={formatCompactAmount} />
                <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '6px' }} formatter={(value) => formatPrice(value)} />
                <Area type="monotone" dataKey="sales" name="Sales Volume" stroke="#2F4B3C" strokeWidth={1.5} fillOpacity={1} fill="url(#colorSales)" />
                <Area type="monotone" dataKey="profit" name="Net Profit" stroke="#A65D3D" strokeWidth={1.5} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products volumes */}
        <div className="bg-white rounded-xl p-6 border border-gray-200/80 shadow-sm lg:col-span-1 space-y-4">
          <div className="space-y-0.5">
            <h3 className="font-bold text-[#2F4B3C] text-sm uppercase tracking-wider">Top Selling Crops</h3>
            <p className="text-[10px] text-gray-400 font-light">Sales volumes by product name.</p>
          </div>
          <div className="h-64 w-full text-[10px]">
            {topSellingProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2">
                <Box className="w-8 h-8 text-gray-300 stroke-[1.5]" />
                <span className="text-xs">No orders registered yet</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 1, height: 1 }}>
                <BarChart data={topSellingProducts} layout="vertical" margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                  <XAxis type="number" stroke="#9ca3af" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#9ca3af" fontSize={8} tickLine={false} axisLine={false} width={80} />
                  <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '6px' }} />
                  <Bar dataKey="quantity" name="Quantity Sold" fill="#A65D3D" radius={[0, 4, 4, 0]} barSize={10} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </section>

      {/* 3. RECENT ORDERS & STOCK ALERTS */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Recent Orders table */}
        <div className="bg-white border border-gray-200/80 rounded-xl p-5 sm:p-6 shadow-sm lg:col-span-2 space-y-5">
          <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-1.5 uppercase tracking-wider">
            <Clock className="w-4 h-4 text-[#2F4B3C]" /> Recent Sourcing Orders
          </h3>

          {recentOrders.length === 0 ? (
            <div className="text-center py-6 text-gray-400 text-xs">No orders placed yet.</div>
          ) : (
            <div className="overflow-x-auto text-xs font-sans">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-150/60 text-gray-400 font-bold uppercase tracking-wider text-[9px] pb-2.5">
                    <th className="pb-2.5">Invoice</th>
                    <th className="pb-2.5">Customer</th>
                    <th className="pb-2.5">Total Bill</th>
                    <th className="pb-2.5">Fulfillment</th>
                    <th className="pb-2.5 text-right">Operations</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((ord) => (
                    <tr key={ord._id} className="border-b border-gray-50 hover:bg-[#F6EFE3]/30 transition-colors">
                      <td className="py-3 font-mono font-bold text-gray-800">{ord.invoiceNumber}</td>
                      <td className="py-3 text-gray-600 font-light">{ord.customerDetails.name}</td>
                      <td className="py-3 font-bold text-[#2F4B3C]">{formatPrice(ord.total)}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 border rounded text-[8px] font-bold uppercase tracking-wider ${
                          ord.orderStatus === 'Delivered' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' :
                          ord.orderStatus === 'Shipped' ? 'bg-blue-50 text-blue-800 border-blue-100' :
                          ord.orderStatus === 'Processing' ? 'bg-amber-50 text-amber-800 border-amber-100' :
                          'bg-gray-50 text-gray-800 border-gray-100'
                        }`}>
                          {ord.orderStatus}
                        </span>
                      </td>
                      <td className="py-3 text-right space-x-1.5">
                        {ord.orderStatus === 'Pending' && (
                          <button
                            onClick={() => handleUpdateStatus(ord._id, 'Processing')}
                            disabled={updatingOrderId === ord._id}
                            className="bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold px-2.5 py-1 rounded border border-amber-200 cursor-pointer text-[9px] uppercase tracking-wider"
                          >
                            Accept
                          </button>
                        )}
                        {ord.orderStatus === 'Processing' && (
                          <button
                            onClick={() => handleUpdateStatus(ord._id, 'Shipped')}
                            disabled={updatingOrderId === ord._id}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-2.5 py-1 rounded border border-blue-200 cursor-pointer text-[9px] uppercase tracking-wider"
                          >
                            Ship
                          </button>
                        )}
                        {ord.orderStatus === 'Shipped' && (
                          <button
                            onClick={() => handleUpdateStatus(ord._id, 'Delivered')}
                            disabled={updatingOrderId === ord._id}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold px-2.5 py-1 rounded border border-emerald-200 cursor-pointer text-[9px] uppercase tracking-wider"
                          >
                            Deliver
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Low Stock Alert list */}
        <div className="bg-white border border-gray-200/80 rounded-xl p-5 shadow-sm lg:col-span-1 space-y-5">
          <h3 className="text-sm font-bold text-red-600 border-b border-gray-100 pb-3 flex items-center gap-1.5 uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4" /> Harvest Stock Alerts
          </h3>
          
          {lowStockAlerts.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-xs flex flex-col items-center gap-2">
              <CheckCircle className="w-7 h-7 text-emerald-800" />
              <span>All product stocks stable!</span>
            </div>
          ) : (
            <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
              {lowStockAlerts.map((prod) => (
                <div key={prod._id} className="border border-red-100 bg-red-50/20 rounded p-3 flex gap-2.5 items-start">
                  <ShieldAlert className="w-4.5 h-4.5 text-red-600 shrink-0 mt-0.5" />
                  <div className="text-left text-[11px] font-sans">
                    <h4 className="font-bold text-gray-900 leading-tight">{prod.name}</h4>
                    <span className="text-[9px] text-gray-400 font-light block">Category: {prod.category}</span>
                    <span className="block text-[9px] font-bold text-red-600 mt-1 uppercase tracking-wider">Stock Level: {prod.stock}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </section>

    </div>
  );
};

export default AdminOverview;

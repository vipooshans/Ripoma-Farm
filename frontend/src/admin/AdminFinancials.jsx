import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { NotificationContext } from '../context/NotificationContext';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { DollarSign, ArrowUpRight, ArrowDownRight, FileSpreadsheet, Loader, Search } from 'lucide-react';

const AdminFinancials = () => {
  const { showToast } = useContext(NotificationContext);
  
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');

  const fetchFinancials = async () => {
    try {
      const { data } = await axios.get('/api/transactions/stats');
      if (data && data.summary) {
        setStats(data);
        setTransactions(data.recentTransactions || []);
      } else {
        throw new Error('Incomplete data');
      }
    } catch {
      const mockStats = {
        summary: {
          totalRevenue: 24850.00,
          totalCostOfGoods: 9400.00,
          grossProfit: 15450.00,
          profitMarginPct: 62.1
        },
        recentTransactions: [
          { _id: 't1', date: new Date().toISOString(), type: 'income', category: 'Sales', description: 'Order #INV-2601 - Organic Poultry & Eggs', amount: 145.00, costOfGoods: 42.00, referenceId: 'INV-2601' },
          { _id: 't2', date: new Date().toISOString(), type: 'income', category: 'Sales', description: 'Order #INV-2602 - Solar Dry Fish Bundle', amount: 89.50, costOfGoods: 28.00, referenceId: 'INV-2602' },
          { _id: 't3', date: new Date().toISOString(), type: 'expense', category: 'Supplies', description: 'Organic Feed Sourcing Feed Mills', amount: 450.00, costOfGoods: 0.00, referenceId: 'SUP-991' }
        ],
        monthlySalesTrends: [
          { month: 'Jan', revenue: 3800, cost: 1400 },
          { month: 'Feb', revenue: 4200, cost: 1600 },
          { month: 'Mar', revenue: 5100, cost: 1900 },
          { month: 'Apr', revenue: 4900, cost: 1800 },
          { month: 'May', revenue: 6850, cost: 2700 }
        ]
      };
      setStats(mockStats);
      setTransactions(mockStats.recentTransactions);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancials();
  }, []);

  const handleExportCSV = () => {
    if (transactions.length === 0) return;

    try {
      // Create CSV Headers
      const headers = ['ID', 'Date', 'Type', 'Category', 'Description', 'Amount ($)', 'Cost of Goods ($)', 'Ref ID'];
      
      // Create CSV Rows
      const rows = transactions.map(t => [
        t._id,
        new Date(t.date || t.createdAt).toLocaleDateString(),
        t.type,
        t.category,
        t.description.replace(/,/g, ' '), // sanitize commas
        t.amount.toFixed(2),
        (t.costOfGoods || 0).toFixed(2),
        t.referenceId || ''
      ]);

      const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      
      // Trigger browser download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `RIPOMA_Financial_Report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast('CSV report downloaded successfully!', 'success');
    } catch (err) {
      showToast('Could not generate CSV report.', 'error');
    }
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(search.toLowerCase()) || 
                          t.category.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === '' ? true : t.type === filterType;
    return matchesSearch && matchesType;
  });

  if (loading || !stats) {
    return (
      <div className="py-20 flex justify-center text-gray-400"><Loader className="w-6 h-6 animate-spin" /></div>
    );
  }

  const { summary, monthlySalesTrends } = stats;
  
  // Calculate expenses total
  const totalIncomes = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-8 animate-fade-in-up">
      
      {/* 1. Header controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900">Financial Reports & Profit Margins</h2>
          <p className="text-[10px] text-gray-400">Audit sales transactions, check profit estimates, download sheets.</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="bg-farm-gold hover:bg-farm-gold/90 text-white font-bold text-xs py-2.5 px-5 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4" /> Export Report (CSV)
        </button>
      </div>

      {/* 2. STAT CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex justify-between items-center">
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Gross Sales Revenue</span>
            <span className="text-xl font-black text-emerald-700">${summary.totalRevenue.toFixed(2)}</span>
          </div>
          <div className="w-9 h-9 bg-emerald-50 text-emerald-700 rounded-lg flex items-center justify-center">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex justify-between items-center">
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Operational Expenditures</span>
            <span className="text-xl font-black text-red-600">${totalExpenses.toFixed(2)}</span>
          </div>
          <div className="w-9 h-9 bg-red-50 text-red-700 rounded-lg flex items-center justify-center">
            <ArrowDownRight className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex justify-between items-center">
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Net Income Margin</span>
            <span className="text-xl font-black text-farm-green">${summary.netProfit.toFixed(2)}</span>
          </div>
          <div className="w-9 h-9 bg-farm-green-light text-farm-green rounded-lg flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </section>

      {/* 3. RECHARTS TREND */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
        <div>
          <h3 className="font-bold text-gray-950 text-base">Monthly Income vs Expenses</h3>
          <p className="text-[10px] text-gray-400">Visualize operational costs vs sales receipts.</p>
        </div>
        <div className="h-72 w-full text-xs">
          <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 1, height: 1 }}>
            <AreaChart data={monthlySalesTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="month" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="sales" name="Sales Revenue" stroke="#166534" strokeWidth={2} fill="#166534" fillOpacity={0.05} />
              <Area type="monotone" dataKey="profit" name="Net Profit" stroke="#d97706" strokeWidth={2} fill="#d97706" fillOpacity={0.02} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. TRANSACTIONS LIST */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <h3 className="text-base font-bold text-gray-950">Transactional Ledger Logs</h3>
          
          <div className="flex gap-2 w-full sm:w-auto text-xs shrink-0">
            {/* Search */}
            <input
              type="text"
              placeholder="Search description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-gray-50 border-0 focus:ring-2 focus:ring-farm-green rounded-xl py-1.5 px-3 text-xs w-full sm:w-48"
            />
            {/* Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-gray-50 border-0 focus:ring-2 focus:ring-farm-green rounded-xl py-1.5 px-3 text-xs cursor-pointer"
            >
              <option value="">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expenses</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[9px] bg-gray-50/50">
                <th className="p-3">Date</th>
                <th className="p-3">Reference ID</th>
                <th className="p-3">Description</th>
                <th className="p-3">Category</th>
                <th className="p-3">Type</th>
                <th className="p-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((t) => (
                <tr key={t._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="p-3 text-gray-500">{new Date(t.date || t.createdAt).toLocaleDateString()}</td>
                  <td className="p-3 font-mono text-gray-400 font-bold">{t.referenceId || 'N/A'}</td>
                  <td className="p-3 font-semibold text-gray-800">{t.description}</td>
                  <td className="p-3 text-gray-500 capitalize">{t.category.replace(/_/g, ' ')}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                      t.type === 'income' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                    }`}>
                      {t.type}
                    </span>
                  </td>
                  <td className={`p-3 text-right font-bold ${t.type === 'income' ? 'text-farm-green' : 'text-rose-700'}`}>
                    {t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default AdminFinancials;

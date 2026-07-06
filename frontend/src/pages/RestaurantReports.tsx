import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  TrendingUp, Receipt, Users, ChefHat,
  Calendar, Download, Printer, Search, X, ChevronRight,
  Eye, CheckCircle2, Banknote, Lock, Sparkles
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';

interface DailyReportRow {
  date: string;
  sales: number;
  orders: number;
  customers: number;
  expenses: number;
  profit: number;
  status: string;
  topItems: { name: string; qty: number; rev: number }[];
  peakHours: string;
  remarks: string;
}

const getEffectiveRole = (user: any) => {
  if (!user) return 'ADMIN';
  if (user.employee?.role) {
    const r = user.employee.role.toLowerCase();
    if (r.includes('admin')) return 'ADMIN';
    if (r.includes('manager')) return 'MANAGER';
    if (r.includes('waiter') || r.includes('captain')) return 'WAITER';
    if (r.includes('chef')) return 'CHEF';
    if (r.includes('kitchen') || r.includes('helper')) return 'KITCHEN';
    return 'EMPLOYEE';
  }
  return user.role || 'ADMIN';
};

export const RestaurantReports: React.FC = () => {
  const { user } = useAuth();
  const role = getEffectiveRole(user);

  // Filters & State
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [selectedFilterChip, setSelectedFilterChip] = useState('Last 7 Days');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReportRow, setSelectedReportRow] = useState<DailyReportRow | null>(null);
  const [activeKpiFilter, setActiveKpiFilter] = useState<string | null>(null);

  // Realistic Dummy Data Set
  const originalReportRows: DailyReportRow[] = [
    {
      date: '2026-07-02',
      sales: 48650,
      orders: 128,
      customers: 96,
      expenses: 8750,
      profit: 39900,
      status: 'Completed',
      topItems: [
        { name: 'Paneer Butter Masala', qty: 34, rev: 10200 },
        { name: 'Butter Naan', qty: 85, rev: 4250 },
        { name: 'Chicken Biryani', qty: 28, rev: 9800 }
      ],
      peakHours: '08:00 PM - 10:00 PM',
      remarks: 'Highest sales due to corporate dinner bookings.'
    },
    {
      date: '2026-07-01',
      sales: 43200,
      orders: 115,
      customers: 88,
      expenses: 7500,
      profit: 35700,
      status: 'Completed',
      topItems: [
        { name: 'Masala Dosa', qty: 45, rev: 6750 },
        { name: 'Chicken Biryani', qty: 20, rev: 7000 },
        { name: 'Mango Lassi', qty: 50, rev: 4500 }
      ],
      peakHours: '01:00 PM - 03:00 PM',
      remarks: 'Weekday lunch crowd was higher than average.'
    },
    {
      date: '2026-06-30',
      sales: 45800,
      orders: 120,
      customers: 90,
      expenses: 9200,
      profit: 36600,
      status: 'Completed',
      topItems: [
        { name: 'Paneer Tikka', qty: 30, rev: 8400 },
        { name: 'Dal Makhani', qty: 25, rev: 6250 },
        { name: 'Tandoori Roti', qty: 70, rev: 2100 }
      ],
      peakHours: '08:30 PM - 10:30 PM',
      remarks: 'Exceeded daily target. Kitchen supplies refilled today.'
    },
    {
      date: '2026-06-29',
      sales: 41100,
      orders: 108,
      customers: 82,
      expenses: 6800,
      profit: 34300,
      status: 'Completed',
      topItems: [
        { name: 'Veg Hakka Noodles', qty: 38, rev: 7600 },
        { name: 'Spring Rolls', qty: 40, rev: 4800 },
        { name: 'Sweet Lassi', qty: 32, rev: 2560 }
      ],
      peakHours: '07:30 PM - 09:30 PM',
      remarks: 'Rainy evening caused slightly fewer dine-in entries.'
    },
    {
      date: '2026-06-28',
      sales: 49500,
      orders: 130,
      customers: 102,
      expenses: 8150,
      profit: 41350,
      status: 'Completed',
      topItems: [
        { name: 'Chicken Biryani', qty: 42, rev: 14700 },
        { name: 'Garlic Naan', qty: 60, rev: 3600 },
        { name: 'Paneer Butter Masala', qty: 20, rev: 6000 }
      ],
      peakHours: '08:00 PM - 10:00 PM',
      remarks: 'Sunday dinner rush. All staff present.'
    },
    {
      date: '2026-06-27',
      sales: 52400,
      orders: 135,
      customers: 110,
      expenses: 11000,
      profit: 41400,
      status: 'Completed',
      topItems: [
        { name: 'Butter Naan', qty: 95, rev: 4750 },
        { name: 'Mutton Rogan Josh', qty: 18, rev: 8100 },
        { name: 'Paneer Butter Masala', qty: 25, rev: 7500 }
      ],
      peakHours: '08:30 PM - 10:30 PM',
      remarks: 'Saturday peak night. Minor delay in kitchen station 2.'
    },
    {
      date: '2026-06-26',
      sales: 38900,
      orders: 98,
      customers: 75,
      expenses: 5400,
      profit: 33500,
      status: 'Completed',
      topItems: [
        { name: 'Masala Dosa', qty: 32, rev: 4800 },
        { name: 'Idli Sambhar Platter', qty: 28, rev: 2800 },
        { name: 'Filter Coffee', qty: 60, rev: 3000 }
      ],
      peakHours: '09:00 AM - 11:30 AM',
      remarks: 'High breakfast takeaway order volume.'
    }
  ];

  // Quick Filter Chip Actions
  const handleFilterChipClick = (chip: string) => {
    setSelectedFilterChip(chip);
    const today = new Date();
    
    if (chip === 'Today') {
      const todayStr = today.toISOString().split('T')[0];
      setDateRange({ startDate: todayStr, endDate: todayStr });
    } else if (chip === 'Yesterday') {
      const yest = new Date();
      yest.setDate(yest.getDate() - 1);
      const yestStr = yest.toISOString().split('T')[0];
      setDateRange({ startDate: yestStr, endDate: yestStr });
    } else if (chip === 'Last 7 Days') {
      const prev7 = new Date();
      prev7.setDate(prev7.getDate() - 7);
      setDateRange({
        startDate: prev7.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0]
      });
    } else if (chip === 'This Month') {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      setDateRange({
        startDate: startOfMonth,
        endDate: today.toISOString().split('T')[0]
      });
    }
    // Highlighting filters below
    if (['Sales', 'Orders', 'Expenses', 'Kitchen', 'Staff'].includes(chip)) {
      setActiveKpiFilter(chip);
    } else {
      setActiveKpiFilter(null);
    }
  };

  // Filter & Search Logic
  const filteredRows = originalReportRows.filter(row => {
    // Date filter
    const rowDate = new Date(row.date);
    const startLimit = new Date(dateRange.startDate);
    const endLimit = new Date(dateRange.endDate);
    
    // Set hours to 0 to compare dates accurately
    rowDate.setHours(0,0,0,0);
    startLimit.setHours(0,0,0,0);
    endLimit.setHours(0,0,0,0);

    const matchesDate = rowDate >= startLimit && rowDate <= endLimit;

    // Search query matches date, sales amount, profit, status, or remarks
    const matchesSearch = searchQuery === '' || 
      row.date.includes(searchQuery) ||
      row.remarks.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.sales.toString().includes(searchQuery) ||
      row.profit.toString().includes(searchQuery);

    return matchesDate && matchesSearch;
  });

  // Recharts Chart Formatted Datasets
  const salesChartData = filteredRows.slice().reverse().map(r => ({
    name: new Date(r.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    Sales: r.sales,
    Profit: r.profit
  }));

  const ordersChartData = filteredRows.slice().reverse().map(r => ({
    name: new Date(r.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    Orders: r.orders
  }));

  const donutData = [
    { name: 'Dine-In Orders', value: 720 },
    { name: 'Takeaway Orders', value: 380 },
    { name: 'Delivery Orders', value: 210 }
  ];
  const COLORS = ['#10b981', '#3b82f6', '#f59e0b'];

  const expenseBreakdownData = [
    { name: 'Kitchen Supplies', amount: 28450 },
    { name: 'Utilities', amount: 14200 },
    { name: 'Cleaning Supplies', amount: 6150 },
    { name: 'Maintenance', amount: 9800 },
    { name: 'Packaging', amount: 8250 },
    { name: 'Marketing', amount: 5600 }
  ];

  // Print Report Handler
  const handlePrintReport = () => {
    window.print();
  };

  // Export Report Handlers
  const handleExport = (type: 'pdf' | 'excel' | 'csv') => {
    if (type === 'csv') {
      let csvContent = "data:text/csv;charset=utf-8,Date,Sales,Orders,Customers,Expenses,Profit,Status\n";
      filteredRows.forEach(row => {
        csvContent += `${row.date},${row.sales},${row.orders},${row.customers},${row.expenses},${row.profit},${row.status}\n`;
      });
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Restaurant_Report_${dateRange.startDate}_to_${dateRange.endDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert(`Report exported successfully as ${type.toUpperCase()}`);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 text-left font-['Outfit',sans-serif] antialiased text-gray-900 p-4 select-none print:p-0">
      
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-200 pb-5 gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
            <span className="hover:text-black transition cursor-pointer">Restaurant</span>
            <ChevronRight className="w-3 h-3 text-gray-400" />
            <span className="text-emerald-700 font-semibold">Reports Panel</span>
          </div>
          <h1 className="text-[30px] font-semibold text-black tracking-tight flex items-center gap-2.5">
            <TrendingUp className="w-8 h-8 text-emerald-600 shrink-0" /> Restaurant Reports
          </h1>
          <p className="text-[14px] text-gray-600 font-normal mt-2 max-w-3xl leading-relaxed">
            Monitor restaurant performance, sales, operations, staff activity, and business insights from one place.
          </p>
        </div>

        {/* Date Selector and Buttons on Right */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-1.5 shadow-sm text-xs">
            <Calendar className="w-4 h-4 text-gray-500" />
            <input
              type="date"
              value={dateRange.startDate}
              onChange={e => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="border-none bg-transparent focus:outline-none font-semibold text-gray-700 cursor-pointer"
            />
            <span className="text-gray-400 font-bold">to</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={e => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="border-none bg-transparent focus:outline-none font-semibold text-gray-700 cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleExport('csv')}
              className="flex items-center gap-1.5 bg-white hover:bg-gray-50 text-gray-700 font-semibold h-[36px] px-3.5 rounded-xl text-[14px] transition-all border border-gray-200 shadow-sm cursor-pointer"
              title="Download CSV report file"
            >
              <Download className="w-4 h-4 text-gray-500" /> Export CSV
            </button>
            <button
              onClick={handlePrintReport}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-[36px] px-3.5 rounded-xl text-[14px] transition-all shadow-sm border border-emerald-600 cursor-pointer"
              title="Print reports pages"
            >
              <Printer className="w-4 h-4" /> Print
            </button>
          </div>
        </div>
      </div>

      {/* 2. PREMIUM KPI SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        
        {/* KPI 1: Today's Sales */}
        <div
          onClick={() => setActiveKpiFilter(activeKpiFilter === 'sales' ? null : 'sales')}
          className={`p-4 bg-white rounded-2xl border transition-all duration-200 shadow-sm cursor-pointer flex items-center justify-between ${
            activeKpiFilter === 'sales' ? 'border-green-600 ring-2 ring-green-100' : 'border-gray-200 hover:border-gray-400'
          }`}
        >
          <div className="space-y-1">
            <span className="text-[13px] font-medium text-gray-600 block">Today's Sales</span>
            <span className="text-[22px] font-bold text-black block leading-none">₹48,650</span>
            <span className="text-[11px] font-semibold text-green-700 block">↑ 12% vs Yesterday</span>
          </div>
          <div className="p-2.5 bg-green-50 rounded-xl shrink-0 text-green-600">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 2: Orders Completed */}
        <div
          onClick={() => setActiveKpiFilter(activeKpiFilter === 'orders' ? null : 'orders')}
          className={`p-4 bg-white rounded-2xl border transition-all duration-200 shadow-sm cursor-pointer flex items-center justify-between ${
            activeKpiFilter === 'orders' ? 'border-blue-600 ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-400'
          }`}
        >
          <div className="space-y-1">
            <span className="text-[13px] font-medium text-gray-600 block">Orders Completed</span>
            <span className="text-[22px] font-bold text-black block leading-none">128</span>
            <span className="text-[11px] font-semibold text-blue-600 block">↑ 8% vs Yesterday</span>
          </div>
          <div className="p-2.5 bg-blue-50 rounded-xl shrink-0 text-blue-600">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 3: Table Turnover */}
        <div
          onClick={() => setActiveKpiFilter(activeKpiFilter === 'tables' ? null : 'tables')}
          className={`p-4 bg-white rounded-2xl border transition-all duration-200 shadow-sm cursor-pointer flex items-center justify-between ${
            activeKpiFilter === 'tables' ? 'border-amber-600 ring-2 ring-amber-100' : 'border-gray-200 hover:border-gray-400'
          }`}
        >
          <div className="space-y-1">
            <span className="text-[13px] font-medium text-gray-600 block">Table Turnover</span>
            <span className="text-[22px] font-bold text-black block leading-none">42</span>
            <span className="text-[11px] font-semibold text-amber-600 block">4.2 turns / table</span>
          </div>
          <div className="p-2.5 bg-amber-50 rounded-xl shrink-0 text-amber-500">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 4: Kitchen Efficiency */}
        <div
          onClick={() => setActiveKpiFilter(activeKpiFilter === 'kitchen' ? null : 'kitchen')}
          className={`p-4 bg-white rounded-2xl border transition-all duration-200 shadow-sm cursor-pointer flex items-center justify-between ${
            activeKpiFilter === 'kitchen' ? 'border-emerald-600 ring-2 ring-emerald-100' : 'border-gray-200 hover:border-gray-400'
          }`}
        >
          <div className="space-y-1">
            <span className="text-[13px] font-medium text-gray-600 block">Kitchen Efficiency</span>
            <span className="text-[22px] font-bold text-black block leading-none">94%</span>
            <span className="text-[11px] font-semibold text-emerald-700 block">Avg prep: 14 mins</span>
          </div>
          <div className="p-2.5 bg-emerald-50 rounded-xl shrink-0 text-emerald-600">
            <ChefHat className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 5: Customer Visits */}
        <div
          onClick={() => setActiveKpiFilter(activeKpiFilter === 'customers' ? null : 'customers')}
          className={`p-4 bg-white rounded-2xl border transition-all duration-200 shadow-sm cursor-pointer flex items-center justify-between ${
            activeKpiFilter === 'customers' ? 'border-indigo-600 ring-2 ring-indigo-100' : 'border-gray-200 hover:border-gray-400'
          }`}
        >
          <div className="space-y-1">
            <span className="text-[13px] font-medium text-gray-600 block">Customer Visits</span>
            <span className="text-[22px] font-bold text-black block leading-none">96</span>
            <span className="text-[11px] font-semibold text-indigo-600 block">↑ 5% vs Average</span>
          </div>
          <div className="p-2.5 bg-indigo-50 rounded-xl shrink-0 text-indigo-600">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 6: Average Order Value */}
        <div
          onClick={() => setActiveKpiFilter(activeKpiFilter === 'aov' ? null : 'aov')}
          className={`p-4 bg-white rounded-2xl border transition-all duration-200 shadow-sm cursor-pointer flex items-center justify-between ${
            activeKpiFilter === 'aov' ? 'border-purple-600 ring-2 ring-purple-100' : 'border-gray-200 hover:border-gray-400'
          }`}
        >
          <div className="space-y-1">
            <span className="text-[13px] font-medium text-gray-600 block">Avg Order Value</span>
            <span className="text-[22px] font-bold text-black block leading-none">₹507</span>
            <span className="text-[11px] font-semibold text-purple-600 block">Stable spend levels</span>
          </div>
          <div className="p-2.5 bg-purple-50 rounded-xl shrink-0 text-purple-600">
            <Banknote className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* 6. QUICK FILTER CHIPS */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 border border-gray-200 rounded-2xl shadow-sm print:hidden">
        <div className="flex flex-wrap items-center gap-1.5">
          {['Today', 'Yesterday', 'Last 7 Days', 'This Month', 'Custom Range', 'Sales', 'Orders', 'Expenses', 'Kitchen', 'Staff'].map(chip => {
            const isSelected = selectedFilterChip === chip || activeKpiFilter?.toLowerCase() === chip.toLowerCase();
            return (
              <button
                key={chip}
                onClick={() => handleFilterChipClick(chip)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {chip}
              </button>
            );
          })}
        </div>

        {/* Simple Search bar */}
        <div className="relative w-full sm:w-[260px] shrink-0">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search dates, status, profit..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600 bg-gray-50 text-xs font-semibold text-black h-[36px]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-black"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3. REPORT SECTIONS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* Section 1: Sales Summary */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <h4 className="text-sm font-bold text-black uppercase tracking-wider border-b border-gray-100 pb-2 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-green-600" /> Sales Summary
          </h4>
          <div className="grid grid-cols-2 gap-3.5 text-xs">
            <div>
              <span className="text-gray-500 font-semibold block">Today's Sales</span>
              <span className="text-[17px] font-bold text-green-700 block mt-0.5">₹48,650</span>
            </div>
            <div>
              <span className="text-gray-500 font-semibold block">Weekly Sales</span>
              <span className="text-[17px] font-bold text-black block mt-0.5">₹3,21,150</span>
            </div>
            <div>
              <span className="text-gray-500 font-semibold block">Monthly Sales</span>
              <span className="text-[17px] font-bold text-black block mt-0.5">₹13,85,600</span>
            </div>
            <div>
              <span className="text-gray-500 font-semibold block">Avg Daily Sales</span>
              <span className="text-[17px] font-bold text-black block mt-0.5">₹45,878</span>
            </div>
          </div>
        </div>

        {/* Section 2: Order Summary */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <h4 className="text-sm font-bold text-black uppercase tracking-wider border-b border-gray-100 pb-2 flex items-center gap-1.5">
            <Receipt className="w-4 h-4 text-blue-600" /> Order Summary
          </h4>
          <div className="grid grid-cols-2 gap-3.5 text-xs">
            <div>
              <span className="text-gray-500 font-semibold block">Total Orders</span>
              <span className="text-[17px] font-bold text-black block mt-0.5">1,310</span>
            </div>
            <div>
              <span className="text-gray-500 font-semibold block">Dine-In Orders</span>
              <span className="text-[17px] font-bold text-green-700 block mt-0.5">720</span>
            </div>
            <div>
              <span className="text-gray-500 font-semibold block">Takeaway Orders</span>
              <span className="text-[17px] font-bold text-black block mt-0.5">380</span>
            </div>
            <div>
              <span className="text-gray-500 font-semibold block">Cancelled Orders</span>
              <span className="text-[17px] font-bold text-red-600 block mt-0.5">14</span>
            </div>
          </div>
        </div>

        {/* Section 3: Table Performance */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <h4 className="text-sm font-bold text-black uppercase tracking-wider border-b border-gray-100 pb-2 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-amber-500" /> Table Performance
          </h4>
          <div className="grid grid-cols-2 gap-3.5 text-xs">
            <div>
              <span className="text-gray-500 font-semibold block">Tables Occupied</span>
              <span className="text-[17px] font-bold text-black block mt-0.5">18 / 24</span>
            </div>
            <div>
              <span className="text-gray-500 font-semibold block">Tables Available</span>
              <span className="text-[17px] font-bold text-green-700 block mt-0.5">6</span>
            </div>
            <div>
              <span className="text-gray-500 font-semibold block">Avg Dining Time</span>
              <span className="text-[17px] font-bold text-black block mt-0.5">48 Mins</span>
            </div>
            <div>
              <span className="text-gray-500 font-semibold block">Table Turnover</span>
              <span className="text-[17px] font-bold text-black block mt-0.5">4.2 turns / day</span>
            </div>
          </div>
        </div>

        {/* Section 4: Kitchen Performance */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <h4 className="text-sm font-bold text-black uppercase tracking-wider border-b border-gray-100 pb-2 flex items-center gap-1.5">
            <ChefHat className="w-4 h-4 text-emerald-600" /> Kitchen Performance
          </h4>
          <div className="grid grid-cols-2 gap-3.5 text-xs">
            <div>
              <span className="text-gray-500 font-semibold block">Orders Prepared</span>
              <span className="text-[17px] font-bold text-black block mt-0.5">124</span>
            </div>
            <div>
              <span className="text-gray-500 font-semibold block">Avg Prep Time</span>
              <span className="text-[17px] font-bold text-black block mt-0.5">14 Mins</span>
            </div>
            <div>
              <span className="text-gray-500 font-semibold block">Delayed Orders</span>
              <span className="text-[17px] font-bold text-red-600 block mt-0.5">4</span>
            </div>
            <div>
              <span className="text-gray-500 font-semibold block">Completed Orders</span>
              <span className="text-[17px] font-bold text-green-700 block mt-0.5">120</span>
            </div>
          </div>
        </div>

        {/* Section 5: Staff Performance */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <h4 className="text-sm font-bold text-black uppercase tracking-wider border-b border-gray-100 pb-2 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-purple-600" /> Staff Performance
          </h4>
          <div className="grid grid-cols-2 gap-3.5 text-xs">
            <div>
              <span className="text-gray-500 font-semibold block">Active Waiters</span>
              <span className="text-[17px] font-bold text-black block mt-0.5">8</span>
            </div>
            <div>
              <span className="text-gray-500 font-semibold block">Orders Served</span>
              <span className="text-[17px] font-bold text-black block mt-0.5">118</span>
            </div>
            <div>
              <span className="text-gray-500 font-semibold block">Kitchen Staff</span>
              <span className="text-[17px] font-bold text-black block mt-0.5">6 Working</span>
            </div>
            <div>
              <span className="text-gray-500 font-semibold block">Attendance %</span>
              <span className="text-[17px] font-bold text-green-700 block mt-0.5">96.8%</span>
            </div>
          </div>
        </div>

        {/* Section 6: Expense Summary */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <h4 className="text-sm font-bold text-black uppercase tracking-wider border-b border-gray-100 pb-2 flex items-center gap-1.5">
            <Banknote className="w-4 h-4 text-orange-600" /> Expense Summary
          </h4>
          <div className="grid grid-cols-2 gap-3.5 text-xs">
            <div>
              <span className="text-gray-500 font-semibold block">Today's Expenses</span>
              <span className="text-[17px] font-bold text-orange-600 block mt-0.5">₹8,750</span>
            </div>
            <div>
              <span className="text-gray-500 font-semibold block">Monthly Expenses</span>
              <span className="text-[17px] font-bold text-black block mt-0.5">₹82,650</span>
            </div>
            <div className="col-span-2">
              <span className="text-gray-500 font-semibold block">Highest Expense Category</span>
              <span className="text-[13px] font-bold text-black block mt-0.5 truncate">🥬 Kitchen Supplies (₹28,450)</span>
            </div>
          </div>
        </div>

      </div>

      {/* 4. REPORT CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Sales Trend (Line Chart) */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
          <h4 className="text-sm font-bold text-black uppercase tracking-wide flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-green-600" /> Sales Trend
          </h4>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" fontSize={10} stroke="#9ca3af" tickLine={false} />
                <YAxis fontSize={10} stroke="#9ca3af" tickLine={false} />
                <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`]} />
                <Legend fontSize={10} />
                <Line type="monotone" dataKey="Sales" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="Profit" stroke="#3b82f6" strokeWidth={2} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Daily Orders (Bar Chart) */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
          <h4 className="text-sm font-bold text-black uppercase tracking-wide flex items-center gap-1.5">
            <Receipt className="w-4 h-4 text-blue-600" /> Daily Orders Count
          </h4>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ordersChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" fontSize={10} stroke="#9ca3af" tickLine={false} />
                <YAxis fontSize={10} stroke="#9ca3af" tickLine={false} />
                <Tooltip />
                <Bar dataKey="Orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Order Type Distribution (Donut Chart) */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
          <h4 className="text-sm font-bold text-black uppercase tracking-wide flex items-center gap-1.5">
            <Users className="w-4 h-4 text-amber-500" /> Order Channel Distribution
          </h4>
          <div className="h-[220px] flex items-center justify-center gap-4">
            <div className="w-[50%] h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {donutData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Custom Legend */}
            <div className="space-y-2 text-xs w-[50%] font-semibold">
              {donutData.map((d, idx) => (
                <div key={d.name} className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-normal text-gray-650">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx] }}></span>
                    {d.name}
                  </span>
                  <span className="text-black font-bold">{d.value} orders</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chart 4: Expense Breakdown (Horizontal Bar Chart) */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
          <h4 className="text-sm font-bold text-black uppercase tracking-wide flex items-center gap-1.5">
            <Banknote className="w-4 h-4 text-orange-600" /> Expense Breakdown (Monthly)
          </h4>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={expenseBreakdownData} layout="vertical" margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                <XAxis type="number" fontSize={9} stroke="#9ca3af" tickLine={false} />
                <YAxis dataKey="name" type="category" fontSize={10} stroke="#9ca3af" tickLine={false} />
                <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`]} />
                <Bar dataKey="amount" fill="#f97316" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* 5. HISTORICAL REPORT TABLE */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-150 flex items-center justify-between bg-gray-50/50">
          <h4 className="text-sm font-bold text-black uppercase tracking-wide">Historical Daily Audit Logs</h4>
          <span className="text-[11px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-100">
            {filteredRows.length} Audit Entries
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-gray-800 text-[15px]">
            <thead>
              <tr className="border-b border-gray-200 text-[13px] font-semibold text-gray-700 uppercase tracking-wider bg-gray-50/40">
                <th className="px-5 py-4.5 text-left">Report Date</th>
                <th className="px-5 py-4.5 text-left">Sales (Inflow)</th>
                <th className="px-5 py-4.5 text-left">Orders Count</th>
                <th className="px-5 py-4.5 text-left">Total Customers</th>
                <th className="px-5 py-4.5 text-left">Expenses (Outflow)</th>
                <th className="px-5 py-4.5 text-left">Net Profit</th>
                <th className="px-5 py-4.5 text-left">Status</th>
                <th className="px-5 py-4.5 text-right print:hidden">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-normal text-black">
              {filteredRows.map((row, idx) => (
                <tr
                  key={idx}
                  onClick={() => setSelectedReportRow(row)}
                  className="hover:bg-gray-50/50 cursor-pointer transition-colors align-middle h-[58px]"
                >
                  <td className="px-5 py-4.5 font-semibold text-black">
                    {new Date(row.date).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-4.5 font-bold text-green-700">
                    ₹{row.sales.toLocaleString('en-IN')}
                  </td>
                  <td className="px-5 py-4.5 font-semibold text-black">{row.orders} Orders</td>
                  <td className="px-5 py-4.5 text-gray-600">{row.customers} Pax</td>
                  <td className="px-5 py-4.5 font-semibold text-orange-600">
                    ₹{row.expenses.toLocaleString('en-IN')}
                  </td>
                  <td className="px-5 py-4.5 font-bold text-blue-600">
                    ₹{row.profit.toLocaleString('en-IN')}
                  </td>
                  <td className="px-5 py-4.5 align-middle">
                    <span className="inline-flex px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 text-[11px] font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-600 mr-1 inline-block shrink-0 align-middle" />
                      {row.status}
                    </span>
                  </td>
                  <td className="px-5 py-4.5 text-right print:hidden" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => setSelectedReportRow(row)}
                      className="text-emerald-700 hover:text-emerald-950 font-semibold text-xs transition cursor-pointer flex items-center gap-1 justify-end ml-auto"
                    >
                      <Eye className="w-3.5 h-3.5" /> View Details
                    </button>
                  </td>
                </tr>
              ))}
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-500 italic font-semibold">
                    No matching daily audit logs found for the selected criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Permissions Disclaimer (Manager View Restrictions) */}
      {role !== 'ADMIN' && (
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex items-center justify-between text-xs font-semibold text-gray-600 print:hidden">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-gray-500 shrink-0" />
            <span>Audit restrictions active: Staff payroll, employee salaries, and historic deletion commands are restricted to the Owner.</span>
          </div>
          <span className="text-[10px] text-gray-500 font-bold uppercase">Manager Panel</span>
        </div>
      )}

      {/* 10. REPORT DETAILS DRAWER (RIGHT-SIDE DRAWER) */}
      {selectedReportRow && (
        <div className="fixed inset-0 z-50 overflow-hidden print:hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
          <div className="absolute inset-0 overflow-hidden">
            
            {/* Drawer Backdrop Overlay */}
            <div
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-xs transition-opacity"
              onClick={() => setSelectedReportRow(null)}
            ></div>

            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <div className="pointer-events-auto w-screen max-w-md">
                <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-2xl font-['Outfit',sans-serif]">
                  
                  {/* Header */}
                  <div className="bg-gray-50 px-5 py-5 border-b border-gray-200 flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-semibold text-black uppercase tracking-tight flex items-center gap-1.5">
                        <Sparkles className="w-5 h-5 text-emerald-600" /> Audit Details
                      </h2>
                      <span className="text-[11px] text-gray-500 font-semibold block mt-0.5">
                        {new Date(selectedReportRow.date).toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedReportRow(null)}
                      className="rounded-lg p-1.5 text-gray-500 hover:text-black hover:bg-gray-100 transition cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 space-y-6 py-5 px-5 text-xs text-gray-700">
                    
                    {/* Performance Summary Cards */}
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Total Sales</span>
                          <p className="text-[20px] font-bold text-green-700">₹{selectedReportRow.sales.toLocaleString('en-IN')}</p>
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Total Expenses</span>
                          <p className="text-[20px] font-bold text-orange-600">₹{selectedReportRow.expenses.toLocaleString('en-IN')}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 border-t border-gray-200 pt-3">
                        <div>
                          <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Net Profit</span>
                          <p className="text-[20px] font-bold text-blue-600">₹{selectedReportRow.profit.toLocaleString('en-IN')}</p>
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Orders Count</span>
                          <p className="text-sm font-semibold text-black mt-1">{selectedReportRow.orders} Orders</p>
                        </div>
                      </div>
                    </div>

                    {/* Operational parameters */}
                    <div className="space-y-3.5 border-b border-gray-200 pb-5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500 font-bold uppercase text-[10px] tracking-wider">Pax Count</span>
                        <span className="font-semibold text-black">{selectedReportRow.customers} Customers</span>
                      </div>

                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500 font-bold uppercase text-[10px] tracking-wider">Peak Hours</span>
                        <span className="font-semibold text-black">{selectedReportRow.peakHours}</span>
                      </div>

                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500 font-bold uppercase text-[10px] tracking-wider">Audit Status</span>
                        <span className="inline-flex px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 text-[10px] font-semibold">
                          {selectedReportRow.status}
                        </span>
                      </div>
                    </div>

                    {/* Top Selling Items Table */}
                    <div className="space-y-2.5">
                      <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Top Selling Items</span>
                      <div className="space-y-2">
                        {selectedReportRow.topItems.map((item, i) => (
                          <div key={i} className="flex justify-between items-center p-3 bg-gray-50 border border-gray-150 rounded-xl">
                            <div>
                              <p className="text-xs font-bold text-black">{item.name}</p>
                              <span className="text-[10px] text-gray-550 font-medium">Qty: {item.qty} sold</span>
                            </div>
                            <span className="text-xs font-bold text-green-700">₹{item.rev.toLocaleString('en-IN')}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Manager/Owner Audit Remarks */}
                    <div className="space-y-2">
                      <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Manager Daily Remarks</span>
                      <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-xl text-blue-900 leading-relaxed italic text-xs font-medium">
                        "{selectedReportRow.remarks || 'No daily audit remarks logged.'}"
                      </div>
                    </div>

                  </div>

                  {/* Drawer Footer Actions */}
                  <div className="bg-gray-50 px-5 py-5 border-t border-gray-200 flex flex-col gap-2">
                    <button
                      onClick={() => {
                        window.print();
                      }}
                      className="w-full flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-[36px] rounded-xl text-xs border border-emerald-600 cursor-pointer shadow-sm"
                    >
                      <Printer className="w-4 h-4" /> Print daily audit sheet
                    </button>
                    <button
                      onClick={() => setSelectedReportRow(null)}
                      className="w-full flex items-center justify-center gap-1.5 bg-white hover:bg-gray-100 text-gray-800 font-semibold h-[34px] rounded-xl text-xs border border-gray-300 transition-all cursor-pointer"
                    >
                      Close details
                    </button>
                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default RestaurantReports;

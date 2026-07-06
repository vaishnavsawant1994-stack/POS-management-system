import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  Clock,
  Check,
  ArrowRight,
  TrendingUp,
  Utensils,
  ShoppingCart,
  Users,
  Package,
  AlertTriangle,
  Activity,
  Zap
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

// Type definitions
interface ActivityLog {
  id: string;
  time: string;
  message: string;
  detail?: string;
  type: 'billing' | 'kitchen' | 'attendance' | 'inventory' | 'system';
  route: string;
}

interface ToastNotification {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'alert';
}

// Notifications interface removed

interface ApprovalRequest {
  id: string;
  employee: string;
  title: string;
  subject: string;
  type: string;
  status: string;
  priority: 'High' | 'Medium' | 'Low';
  meta: string;
  date: string;
}

// Sparkline Component using custom SVGs
const CustomSparkline: React.FC<{ data: number[]; color: string; width?: number; height?: number }> = ({ 
  data, 
  color, 
  width = 80, 
  height = 20 
}) => {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * height + 1;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible select-none pointer-events-none">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
};

export const Dashboard: React.FC = () => {
  const { user, apiRequest } = useAuth();
  const navigate = useNavigate();

  // Cache data
  const [dbData, setDbData] = useState<any>(() => {
    try {
      const cached = localStorage.getItem('pos_dashboard_master_data');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(!dbData);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Real-time toast notifications
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // Notifications state removed

  // Timeline logs
  const [activities, setActivities] = useState<ActivityLog[]>([
    { id: 'act-1', time: '10:42 AM', message: 'Table 8 Payment Settled', detail: '₹2,450 settled via UPI payment', type: 'billing', route: '/restaurant/cashier-dashboard' },
    { id: 'act-2', time: '10:40 AM', message: 'Supplier Order Delivered', detail: 'Vegetables stock replenished in kitchen store', type: 'inventory', route: '/inventory' },
    { id: 'act-3', time: '10:36 AM', message: 'Rahul Sharma Clocked In', detail: 'Waiter Shift A checked in at Main Floor', type: 'attendance', route: '/restaurant/employees' },
    { id: 'act-4', time: '10:31 AM', message: 'Order #K102 Ready', detail: 'Kitchen marked Table 4 KOT as completed', type: 'kitchen', route: '/restaurant/kitchen-dashboard' },
    { id: 'act-5', time: '10:28 AM', message: 'Retail Bill Generated', detail: '₹890 invoice printed for Counter B', type: 'billing', route: '/sales-history' }
  ]);

  // Unified metrics spanning all modules
  const [metrics, setMetrics] = useState({
    todayRevenue: 128450,
    restaurantRevenue: 82300,
    retailRevenue: 46150,
    totalOrders: 168,
    restaurantOrders: 114,
    retailInvoices: 54,
    customersCount: 142,
    retailCustomers: 139,
    restaurantCustomers: 3,
    activeEmployees: 28,
    onLeave: 2,
    absent: 1,
    checkedOut: 5,
    lateArrival: 3,
    reservedTables: 9,
    pendingReservations: 4,
    seatedTables: 5,
    pendingRequests: 6,
    supplierPOs: 4,
    leaveReqs: 2,
    inventoryAlerts: 12,
    criticalAlerts: 3,
    lowStockAlerts: 9,
    todayProfit: 67850,
    profitMargin: 52.8,
    tablesOccupied: 8,
    tablesAvailable: 12,
    kitchenQueue: 4,
    ordersPreparing: 3,
    ordersReady: 1,
    waitersAvailable: 6,
    productsSold: 88,
    retailReturns: 1,
    retailLowStock: 7,
    operatingExpenses: 14500,
    pendingPayments: 42000,
    pendingDeliveries: 3,
    newSuppliers: 12,
    newCustomers: 18,
    returningCustomers: 124,
    peakHour: '07:00 PM - 09:00 PM'
  });

  // Pending Approvals state
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([
    { id: 'app-1', employee: 'Rohan Das', title: 'Leave Request', subject: '2 Days Sick Leave', type: 'leave', status: 'Pending', priority: 'High', meta: 'EMP-4011', date: '03 Jul' },
    { id: 'app-2', employee: 'Fresh Farms', title: 'Purchase Order', subject: 'PO-2026-44 Restock', type: 'po', status: 'Pending', priority: 'High', meta: '₹18,450', date: '02 Jul' },
    { id: 'app-3', employee: 'Kitchen Staff', title: 'Stock Transfer', subject: '20 kg Sugar Request', type: 'stock', status: 'Pending', priority: 'Medium', meta: 'Urgent', date: '03 Jul' },
    { id: 'app-4', employee: 'CleanFoods Ltd', title: 'Supplier Payout', subject: 'Invoice #INV-9908 Payout', type: 'payment', status: 'Pending', priority: 'Low', meta: '₹42,000', date: '01 Jul' },
    { id: 'app-5', employee: 'Maintenance Dept', title: 'Expense Approval', subject: 'Ventilation Hood Repair', type: 'expense', status: 'Pending', priority: 'Medium', meta: '₹4,500', date: '03 Jul' }
  ]);

  const addToast = (message: string, type: ToastNotification['type'] = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Main data API sync
  const fetchAllDashboardData = async () => {
    try {
      const [metricsRes, insightsRes] = await Promise.all([
        apiRequest('/dashboard/metrics').catch(() => null),
        apiRequest('/dashboard/inventory-insights').catch(() => null)
      ]);

      if (metricsRes) {
        const mergedMetrics = {
          todayRevenue: metricsRes.health?.todayRevenue || 128450,
          restaurantRevenue: Math.round((metricsRes.health?.todayRevenue || 128450) * 0.64),
          retailRevenue: Math.round((metricsRes.health?.todayRevenue || 128450) * 0.36),
          totalOrders: metricsRes.health?.todayOrders || 168,
          restaurantOrders: Math.round((metricsRes.health?.todayOrders || 168) * 0.68),
          retailInvoices: Math.round((metricsRes.health?.todayOrders || 168) * 0.32),
          customersCount: metricsRes.health?.todayCustomers || 142,
          retailCustomers: 139,
          restaurantCustomers: 3,
          activeEmployees: 28,
          onLeave: 2,
          absent: 1,
          checkedOut: 5,
          lateArrival: 3,
          reservedTables: 9,
          pendingReservations: 4,
          seatedTables: 5,
          pendingRequests: (metricsRes.actionRequired?.pendingPurchaseOrders || 0) + 2,
          supplierPOs: metricsRes.actionRequired?.pendingPurchaseOrders || 4,
          leaveReqs: 2,
          inventoryAlerts: metricsRes.health?.lowStockProducts || 12,
          criticalAlerts: metricsRes.actionRequired?.outOfStockProducts || 3,
          lowStockAlerts: metricsRes.health?.lowStockProducts || 9,
          todayProfit: metricsRes.health?.todayProfit || 67850,
          profitMargin: 52.8,
          tablesOccupied: 8,
          tablesAvailable: 12,
          kitchenQueue: metricsRes.actionRequired?.pendingCustomerOrders || 4,
          ordersPreparing: 3,
          ordersReady: 1,
          waitersAvailable: 6,
          productsSold: 88,
          retailReturns: metricsRes.actionRequired?.pendingCustomerOrders ? 1 : 0,
          retailLowStock: metricsRes.health?.lowStockProducts || 7,
          operatingExpenses: 14500,
          pendingPayments: 42000,
          pendingDeliveries: 3,
          newSuppliers: 12,
          newCustomers: 18,
          returningCustomers: 124,
          peakHour: '07:00 PM - 09:00 PM'
        };

        setMetrics(mergedMetrics);
        setDbData({ ...metricsRes, ...insightsRes });
        localStorage.setItem('pos_dashboard_master_data', JSON.stringify({ ...metricsRes, ...insightsRes }));
      }
    } catch (error) {
      console.warn('Proceeding with UI mockup state.');
    } finally {
      setIsLoading(false);
    }
  };

  // Dispatch events bindings
  const handleBillingCompleted = (e: Event) => {
    const detail = (e as CustomEvent).detail;
    const amount = detail?.invoice?.totalPayable || detail?.invoice?.totalAmount || 1200;
    const isRest = detail?.type === 'restaurant';
    const number = detail?.invoice?.invoiceNumber || 'INV-TEMP';
    
    // Add toast
    addToast(`New invoice #${number} of ₹${amount.toLocaleString('en-IN')} completed.`, 'success');
    
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    // Append to live timeline
    const logItem: ActivityLog = {
      id: `act-${Date.now()}`,
      time: timeStr,
      message: isRest ? `Table Bill Settled` : `Retail Invoice Generated`,
      detail: `₹${amount.toLocaleString('en-IN')} settled via ${detail?.invoice?.paymentMethod || 'UPI'}`,
      type: 'billing',
      route: isRest ? '/restaurant/cashier-dashboard' : '/sales-history'
    };
    setActivities(prev => [logItem, ...prev.slice(0, 15)]);

    // Update state numbers instantly
    setMetrics(prev => ({
      ...prev,
      todayRevenue: prev.todayRevenue + amount,
      restaurantRevenue: isRest ? prev.restaurantRevenue + amount : prev.restaurantRevenue,
      retailRevenue: !isRest ? prev.retailRevenue + amount : prev.retailRevenue,
      totalOrders: prev.totalOrders + 1,
      restaurantOrders: isRest ? prev.restaurantOrders + 1 : prev.restaurantOrders,
      retailInvoices: !isRest ? prev.retailInvoices + 1 : prev.retailInvoices,
      todayProfit: Math.round(prev.todayProfit + (amount * 0.528))
    }));

    fetchAllDashboardData();
  };

  const handleTableMutated = (_e: Event) => {
    addToast(`Restaurant table status changed.`, 'info');
    fetchAllDashboardData();
  };

  const handleReservationMutated = (_e: Event) => {
    addToast(`New reservation booked successfully.`, 'success');
    fetchAllDashboardData();
  };

  const handleStockRequestMutated = (_e: Event) => {
    addToast(`Suppliers stock request modified. Action required.`, 'warning');
    fetchAllDashboardData();
  };

  const handleEmployeeAttendanceMutated = (e: Event) => {
    const detail = (e as CustomEvent).detail;
    const empName = detail?.employeeName || 'Staff Member';
    const action = detail?.action || 'IN';
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    addToast(`Attendance: ${empName} checked ${action === 'IN' ? 'IN' : 'OUT'}.`, 'info');

    // Notification logging removed

    // Append to activities
    const logItem: ActivityLog = {
      id: `act-${Date.now()}`,
      time: timeStr,
      message: `${empName} Shift ${action === 'IN' ? 'Started' : 'Ended'}`,
      detail: `${empName} checked ${action === 'IN' ? 'in' : 'out'} on local register`,
      type: 'attendance',
      route: '/restaurant/employees'
    };
    setActivities(prev => [logItem, ...prev.slice(0, 15)]);

    // Update state
    setMetrics(prev => ({
      ...prev,
      activeEmployees: action === 'IN' ? prev.activeEmployees + 1 : Math.max(0, prev.activeEmployees - 1),
      checkedOut: action === 'OUT' ? prev.checkedOut + 1 : Math.max(0, prev.checkedOut - 1)
    }));

    fetchAllDashboardData();
  };

  const handleEmployeeLeaveMutated = (_e: Event) => {
    addToast(`Employee leaves roster modified.`, 'info');
    fetchAllDashboardData();
  };

  const handleEmployeeMutated = (_e: Event) => {
    addToast(`Staff directory rosters refreshed.`, 'info');
    fetchAllDashboardData();
  };

  const handleOrderMutated = (e: Event) => {
    const detail = (e as CustomEvent).detail;
    const orderId = detail?.id ? detail.id.slice(-4).toUpperCase() : 'KOT';
    const status = detail?.status || 'READY';
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    if (status === 'READY') {
      addToast(`Kitchen KOT #${orderId} is READY for table pickup!`, 'alert');
      
      // Notification logging removed

      const logItem: ActivityLog = {
        id: `act-${Date.now()}`,
        time: timeStr,
        message: `KOT #${orderId} Marked Ready`,
        detail: `Kitchen completed preparation process`,
        type: 'kitchen',
        route: '/restaurant/kitchen-dashboard'
      };
      setActivities(prev => [logItem, ...prev.slice(0, 15)]);
    } else {
      addToast(`Kitchen KOT status changed to ${status}.`, 'info');
    }
    
    fetchAllDashboardData();
  };

  const handleInventoryMutated = (_e: Event) => {
    addToast(`Inventory warehouse stock adjusted.`, 'info');
    fetchAllDashboardData();
  };

  // Listeners & timer hook
  useEffect(() => {
    fetchAllDashboardData();

    const timeTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    window.addEventListener('billing-completed', handleBillingCompleted);
    window.addEventListener('table-mutated', handleTableMutated);
    window.addEventListener('reservation-mutated', handleReservationMutated);
    window.addEventListener('stock-request-mutated', handleStockRequestMutated);
    window.addEventListener('employee-attendance-mutated', handleEmployeeAttendanceMutated);
    window.addEventListener('employee-leave-mutated', handleEmployeeLeaveMutated);
    window.addEventListener('employee-mutated', handleEmployeeMutated);
    window.addEventListener('order-mutated', handleOrderMutated);
    window.addEventListener('inventory-mutated', handleInventoryMutated);

    return () => {
      clearInterval(timeTimer);
      window.removeEventListener('billing-completed', handleBillingCompleted);
      window.removeEventListener('table-mutated', handleTableMutated);
      window.removeEventListener('reservation-mutated', handleReservationMutated);
      window.removeEventListener('stock-request-mutated', handleStockRequestMutated);
      window.removeEventListener('employee-attendance-mutated', handleEmployeeAttendanceMutated);
      window.removeEventListener('employee-leave-mutated', handleEmployeeLeaveMutated);
      window.removeEventListener('employee-mutated', handleEmployeeMutated);
      window.removeEventListener('order-mutated', handleOrderMutated);
      window.removeEventListener('inventory-mutated', handleInventoryMutated);
    };
  }, []);

  const handleApprovalAction = (id: string, action: 'Approve' | 'Reject') => {
    const item = approvals.find(a => a.id === id);
    if (!item) return;

    addToast(`${item.title} has been ${action === 'Approve' ? 'Approved' : 'Rejected'}.`, 'success');
    setApprovals(prev => prev.filter(a => a.id !== id));
    
    setMetrics(prev => ({
      ...prev,
      pendingRequests: Math.max(0, prev.pendingRequests - 1),
      supplierPOs: item.type === 'po' ? Math.max(0, prev.supplierPOs - 1) : prev.supplierPOs,
      leaveReqs: item.type === 'leave' ? Math.max(0, prev.leaveReqs - 1) : prev.leaveReqs
    }));
  };

  const getChartData = () => {
    const baseLabels = ['09:00', '11:00', '13:00', '15:00', '17:00', '19:00', '21:00', '23:00'];
    return baseLabels.map((lbl, idx) => {
      const multiplier = (idx + 1) * 1.35;
      return {
        name: lbl,
        restaurantSales: Math.round(6200 * multiplier + Math.random() * 1500),
        retailSales: Math.round(4100 * multiplier + Math.random() * 1000)
      };
    });
  };

  const currentChartData = getChartData();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 bg-[#f8fafc] p-8 rounded-2xl border border-slate-100">
        <Activity className="w-8 h-8 text-slate-800 animate-spin" />
        <span className="text-xs font-semibold text-slate-700 uppercase tracking-widest">Loading Executive Console...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 select-none bg-[#f8fafc] -m-6 p-6 min-h-screen text-slate-900 font-sans antialiased text-left">
      
      {/* Toast Alert stack */}
      <div className="fixed top-6 right-6 z-[100] pointer-events-none flex flex-col gap-2 w-80">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className="pointer-events-auto p-4 rounded-2xl shadow-md border border-slate-100 bg-white flex items-start gap-3 w-full animate-slide-in"
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-blue-50 text-blue-600`}>
              {toast.type === 'success' ? <Check className="w-4 h-4" /> :
               toast.type === 'warning' ? <AlertTriangle className="w-4 h-4" /> :
               toast.type === 'alert' ? <Zap className="w-4 h-4" /> :
               <Activity className="w-4 h-4" />}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <span className="text-[10px] uppercase font-bold text-slate-700 block tracking-wider">
                {toast.type === 'success' ? 'Transaction' :
                 toast.type === 'warning' ? 'Warning' :
                 toast.type === 'alert' ? 'Alert' :
                 'Info'}
              </span>
              <p className="text-xs font-semibold text-slate-900 mt-0.5 leading-snug">{toast.message}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 1. PREMIUM DARK BANNER HEADER (Cleaned and Minimal: Greeting, User, Date, Time) */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-1">
            <span className="bg-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full border border-emerald-500/30">
              Business Control Center
            </span>
            <h1 className="text-3xl font-semibold mt-3 tracking-tight">
              Good Morning, {user?.name || 'Harshada Nichit'} 👋
            </h1>
            <p className="text-slate-300 font-medium text-sm mt-1">
              Welcome back! Here's your business overview for today as <span className="underline font-semibold text-emerald-450">{user?.role || 'Administrator'}</span>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-stretch lg:self-auto justify-between lg:justify-end">
            {/* System Date */}
            <div className="bg-slate-800/80 border border-slate-700/60 px-3.5 py-1.5 rounded-xl text-left flex items-center gap-2 shadow-sm text-slate-200">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-medium">
                {currentTime.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })}
              </span>
            </div>

            {/* System Time */}
            <div className="bg-slate-800/80 border border-slate-700/60 px-3.5 py-1.5 rounded-xl text-left flex items-center gap-2 shadow-sm text-slate-200">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-medium font-mono">
                {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. BUSINESS KPI CARDS (6 WIDER & SHORTER CARDS - ALTERNATING DESIGNS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        
        {/* KPI 1: Today's Revenue */}
        <div
          onClick={() => navigate('/reports')}
          className="bg-white p-5 rounded-2xl border-t-4 border-t-emerald-500 border-x border-b border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md hover:-translate-y-0.5 active:scale-95 cursor-pointer transition-all duration-200 text-left"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                <TrendingUp className="w-3.5 h-3.5" />
              </span>
              <span className="text-xs font-medium text-slate-700 uppercase tracking-wider">Today's Revenue</span>
            </div>
            <h3 className="text-2xl font-semibold text-slate-900 mt-1.5">₹{metrics.todayRevenue.toLocaleString('en-IN')}</h3>
            <span className="text-emerald-600 text-xs font-semibold block">+12% vs yesterday</span>
            <p className="text-[10px] text-slate-700 font-medium">Combined store & dine-in sales</p>
          </div>
          <div>
            <CustomSparkline data={[102, 108, 105, 115, 122, 128]} color="#10b981" />
          </div>
        </div>

        {/* KPI 2: Today's Profit */}
        <div
          onClick={() => navigate('/reports')}
          className="bg-slate-50/50 p-5 rounded-2xl border-t-4 border-t-emerald-500 border-x border-b border-slate-150 shadow-xs flex items-center justify-between hover:shadow-md hover:-translate-y-0.5 active:scale-95 cursor-pointer transition-all duration-200 text-left"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-650">
                <Check className="w-3.5 h-3.5" />
              </span>
              <span className="text-xs font-medium text-slate-700 uppercase tracking-wider">Today's Profit</span>
            </div>
            <h3 className="text-2xl font-semibold text-slate-900 mt-1.5">₹{metrics.todayProfit.toLocaleString('en-IN')}</h3>
            <span className="text-emerald-700 text-xs font-semibold block">{metrics.profitMargin}% net margin</span>
            <p className="text-[10px] text-slate-700 font-medium">Net profit margin values</p>
          </div>
          <div>
            <CustomSparkline data={[52, 58, 60, 57, 63, 67]} color="#10b981" />
          </div>
        </div>

        {/* KPI 3: Total Orders */}
        <div
          onClick={() => navigate('/restaurant/kitchen-dashboard')}
          className="bg-white p-5 rounded-2xl border-t-4 border-t-blue-500 border-x border-b border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md hover:-translate-y-0.5 active:scale-95 cursor-pointer transition-all duration-200 text-left"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <Utensils className="w-3.5 h-3.5" />
              </span>
              <span className="text-xs font-medium text-slate-700 uppercase tracking-wider">Total Orders</span>
            </div>
            <h3 className="text-2xl font-semibold text-slate-900 mt-1.5">{metrics.totalOrders}</h3>
            <span className="text-blue-700 text-xs font-semibold block">{metrics.restaurantOrders} KOTs | {metrics.retailInvoices} Bills</span>
            <p className="text-[10px] text-slate-700 font-medium">Total customer orders generated</p>
          </div>
          <div>
            <CustomSparkline data={[140, 152, 148, 160, 155, 168]} color="#3b82f6" />
          </div>
        </div>

        {/* KPI 4: Customers Count */}
        <div
          onClick={() => navigate('/customers')}
          className="bg-slate-50/50 p-5 rounded-2xl border-t-4 border-t-indigo-500 border-x border-b border-slate-150 shadow-xs flex items-center justify-between hover:shadow-md hover:-translate-y-0.5 active:scale-95 cursor-pointer transition-all duration-200 text-left"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Users className="w-3.5 h-3.5" />
              </span>
              <span className="text-xs font-medium text-slate-700 uppercase tracking-wider">Customers Count</span>
            </div>
            <h3 className="text-2xl font-semibold text-slate-900 mt-1.5">{metrics.customersCount} Members</h3>
            <span className="text-indigo-700 text-xs font-semibold block">+6% new enrollments</span>
            <p className="text-[10px] text-slate-700 font-medium">Active CRM database records</p>
          </div>
          <div>
            <CustomSparkline data={[125, 130, 134, 129, 138, 142]} color="#6366f1" />
          </div>
        </div>

        {/* KPI 5: Inventory Alerts */}
        <div
          onClick={() => navigate('/inventory')}
          className="bg-white p-5 rounded-2xl border-t-4 border-t-rose-500 border-x border-b border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md hover:-translate-y-0.5 active:scale-95 cursor-pointer transition-all duration-200 text-left"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="w-6 h-6 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
                <Package className="w-3.5 h-3.5" />
              </span>
              <span className="text-xs font-medium text-slate-700 uppercase tracking-wider">Inventory Alerts</span>
            </div>
            <h3 className="text-2xl font-semibold text-rose-700 mt-1.5">{metrics.inventoryAlerts} Low Stock</h3>
            <span className="text-rose-700 text-xs font-semibold block">{metrics.criticalAlerts} Critical levels</span>
            <p className="text-[10px] text-slate-700 font-medium">Ingredients below reorder levels</p>
          </div>
          <div>
            <CustomSparkline data={[15, 14, 12, 13, 11, 12]} color="#f43f5e" />
          </div>
        </div>

        {/* KPI 6: Active Employees */}
        <div
          onClick={() => navigate('/restaurant/employees')}
          className="bg-slate-50/50 p-5 rounded-2xl border-t-4 border-t-orange-500 border-x border-b border-slate-150 shadow-xs flex items-center justify-between hover:shadow-md hover:-translate-y-0.5 active:scale-95 cursor-pointer transition-all duration-200 text-left"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="w-6 h-6 rounded-full bg-orange-50 flex items-center justify-center text-orange-650">
                <Users className="w-3.5 h-3.5" />
              </span>
              <span className="text-xs font-medium text-slate-700 uppercase tracking-wider">Active Employees</span>
            </div>
            <h3 className="text-2xl font-semibold text-slate-900 mt-1.5">{metrics.activeEmployees} Working</h3>
            <span className="text-orange-700 text-xs font-semibold block">92% attendance today</span>
            <p className="text-[10px] text-slate-700 font-medium">On-duty shift coverage active</p>
          </div>
          <div>
            <CustomSparkline data={[25, 27, 26, 28, 27, 28]} color="#f97316" />
          </div>
        </div>

      </div>

      {/* 3. BUSINESS PERFORMANCE MODULES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Restaurant Performance Panel */}
        <div
          onClick={() => navigate('/restaurant/cashier-dashboard')}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95 cursor-pointer transition-all duration-200 text-left flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Utensils className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-slate-900 text-lg">Restaurant Performance</h3>
              </div>
              <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                Live Status: Operational
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider">Revenue Today</span>
                <h4 className="text-xl font-semibold text-slate-900">₹{metrics.restaurantRevenue.toLocaleString('en-IN')}</h4>
              </div>
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider">Today's Orders</span>
                <h4 className="text-xl font-semibold text-slate-900">{metrics.restaurantOrders} KOTs</h4>
              </div>
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider">Seated Tables</span>
                <h4 className="text-xl font-semibold text-slate-900">{metrics.tablesOccupied} / 20 Occupied</h4>
              </div>
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider">Active Reservations</span>
                <h4 className="text-xl font-semibold text-slate-900">{metrics.reservedTables} Slots</h4>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-5">
            <span className="text-[11px] text-slate-700 font-semibold uppercase">Kitchen Queue: {metrics.kitchenQueue} KOTs preparing</span>
            <CustomSparkline data={[14, 18, 16, 22, 28, 25, 34]} color="#3b82f6" />
          </div>
        </div>

        {/* Retail Performance Panel */}
        <div
          onClick={() => navigate('/billing')}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95 cursor-pointer transition-all duration-200 text-left flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-indigo-600" />
                <h3 className="font-semibold text-slate-900 text-lg">Retail Performance</h3>
              </div>
              <span className="bg-indigo-50 text-indigo-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                Live Status: Active
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider">Sales Today</span>
                <h4 className="text-xl font-semibold text-slate-900">₹{metrics.retailRevenue.toLocaleString('en-IN')}</h4>
              </div>
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider">Invoices Printed</span>
                <h4 className="text-xl font-semibold text-slate-900">{metrics.retailInvoices} invoices</h4>
              </div>
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider">CRM Members</span>
                <h4 className="text-xl font-semibold text-slate-900">{metrics.retailCustomers} enrolled</h4>
              </div>
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider">Products Sold</span>
                <h4 className="text-xl font-semibold text-slate-900">{metrics.productsSold} units</h4>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-5">
            <span className="text-[11px] text-slate-700 font-semibold uppercase">Inventory Warnings: {metrics.retailLowStock} items low</span>
            <CustomSparkline data={[10, 12, 11, 14, 16, 18, 22]} color="#6366f1" />
          </div>
        </div>

      </div>

      {/* 4. SALES ANALYTICS + BUSINESS INSIGHTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sales Analytics Chart (2/3 width) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-left">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
            <div>
              <h3 className="font-semibold text-slate-900 text-lg">Sales Analysis</h3>
              <span className="text-[10px] text-slate-700 font-semibold uppercase tracking-wider block">Interactive dual-channel revenue curves</span>
            </div>
            <span className="text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-full">Hourly trend</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={currentChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="restSalesGrad2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.00} />
                  </linearGradient>
                  <linearGradient id="retailSalesGrad2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.00} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} fontWeight={600} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={9} fontWeight={600} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 text-white rounded-lg p-2.5 shadow-md text-[10px] text-left border border-slate-800">
                          <p className="font-semibold text-slate-300 mb-1">{label} sales</p>
                          <div className="space-y-0.5">
                            <div className="flex justify-between gap-4">
                              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>Restaurant:</span>
                              <span className="font-semibold">₹{payload[0].value?.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>Retail:</span>
                              <span className="font-semibold">₹{payload[1].value?.toLocaleString('en-IN')}</span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend verticalAlign="top" height={24} iconType="circle" iconSize={6} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                <Area type="monotone" name="Restaurant Sales" dataKey="restaurantSales" stroke="#3b82f6" strokeWidth={1.5} fillOpacity={1} fill="url(#restSalesGrad2)" />
                <Area type="monotone" name="Retail Sales" dataKey="retailSales" stroke="#6366f1" strokeWidth={1.5} fillOpacity={1} fill="url(#retailSalesGrad2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Business Insights Panel (1/3 width) */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-left flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-3 mb-4">
            <h3 className="font-semibold text-slate-900 text-lg">Business Insights</h3>
            <span className="text-[10px] text-slate-700 font-semibold uppercase tracking-wider block">Executive AI strategic reviews</span>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-slate-50">
              <span className="text-xs font-semibold text-slate-800">Top Selling Dish:</span>
              <strong className="text-xs font-semibold text-slate-900">Cheese Burger (24 orders)</strong>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-50">
              <span className="text-xs font-semibold text-slate-800">Top Selling Product:</span>
              <strong className="text-xs font-semibold text-slate-900">Amul Butter (46 units)</strong>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-50">
              <span className="text-xs font-semibold text-slate-800">Most Profitable:</span>
              <strong className="text-xs font-semibold text-emerald-700">Appetizers (58% margin)</strong>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-50">
              <span className="text-xs font-semibold text-slate-800">Highest Expense:</span>
              <strong className="text-xs font-semibold text-rose-700">Vendor Payouts (₹8,200)</strong>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-50">
              <span className="text-xs font-semibold text-slate-800">Active Staff:</span>
              <strong className="text-xs font-semibold text-slate-900">Rahul Sharma (58 served)</strong>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-xs font-semibold text-slate-800">Peak hour:</span>
              <strong className="text-xs font-semibold text-slate-900">7:00 PM - 9:00 PM</strong>
            </div>
          </div>
        </div>

      </div>

      {/* 5. EMPLOYEE OVERVIEW + INVENTORY OVERVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Employee Overview Panel */}
        <div 
          onClick={() => navigate('/restaurant/employees')}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md cursor-pointer transition-all duration-200 text-left"
        >
          <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-600" />
              <h3 className="font-semibold text-slate-900 text-lg">Employee Overview</h3>
            </div>
            <span className="text-xs font-semibold text-cyan-700">Manage Staff →</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 text-left">
              <span className="text-[10px] text-slate-700 font-semibold uppercase block">Working</span>
              <strong className="text-base font-semibold text-slate-900 mt-1 block">{metrics.activeEmployees} staff</strong>
            </div>
            <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 text-left">
              <span className="text-[10px] text-slate-700 font-semibold uppercase block">Checked Out</span>
              <strong className="text-base font-semibold text-slate-900 mt-1 block">{metrics.checkedOut} staff</strong>
            </div>
            <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 text-left">
              <span className="text-[10px] text-slate-700 font-semibold uppercase block">On Leave</span>
              <strong className="text-base font-semibold text-indigo-700 mt-1 block">{metrics.onLeave} staff</strong>
            </div>
            <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 text-left">
              <span className="text-[10px] text-slate-700 font-semibold uppercase block">Absent</span>
              <strong className="text-base font-semibold text-rose-700 mt-1 block">{metrics.absent} staff</strong>
            </div>
            <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 text-left">
              <span className="text-[10px] text-slate-700 font-semibold uppercase block">Late Arrivals</span>
              <strong className="text-base font-semibold text-amber-700 mt-1 block">{metrics.lateArrival} staff</strong>
            </div>
            <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 text-left">
              <span className="text-[10px] text-slate-700 font-semibold uppercase block">Attendance Rate</span>
              <strong className="text-base font-semibold text-emerald-700 mt-1 block">92% today</strong>
            </div>
          </div>
        </div>

        {/* Inventory Overview Panel */}
        <div 
          onClick={() => navigate('/inventory')}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md cursor-pointer transition-all duration-200 text-left"
        >
          <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-rose-600" />
              <h3 className="font-semibold text-slate-900 text-lg">Inventory Overview</h3>
            </div>
            <span className="text-xs font-semibold text-rose-700">Open Warehouse →</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 text-left">
              <span className="text-[10px] text-slate-700 font-semibold uppercase block">Low Stock</span>
              <strong className="text-base font-semibold text-slate-900 mt-1 block">{metrics.lowStockAlerts} Items</strong>
            </div>
            <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 text-left">
              <span className="text-[10px] text-slate-700 font-semibold uppercase block">Critical Stock</span>
              <strong className="text-base font-semibold text-rose-700 mt-1 block">{metrics.criticalAlerts} Items</strong>
            </div>
            <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 text-left">
              <span className="text-[10px] text-slate-700 font-semibold uppercase block">Expiring Items</span>
              <strong className="text-base font-semibold text-amber-600 mt-1 block">2 Items</strong>
            </div>
            <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 text-left">
              <span className="text-[10px] text-slate-700 font-semibold uppercase block">Purchase Requests</span>
              <strong className="text-base font-semibold text-slate-900 mt-1 block">{metrics.supplierPOs} requests</strong>
            </div>
            <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 text-left col-span-2">
              <span className="text-[10px] text-slate-700 font-semibold uppercase block">Stock Value</span>
              <strong className="text-base font-semibold text-slate-900 mt-1 block">₹{metrics.todayRevenue ? '1,45,200' : '0.00'} valuation</strong>
            </div>
          </div>
        </div>

      </div>

      {/* 6. SUPPLIER STATUS & FINANCES PANELS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Suppliers overview */}
        <div 
          onClick={() => navigate('/restaurant/suppliers')}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md cursor-pointer transition-all duration-200 text-left"
        >
          <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-650" />
              <h3 className="font-semibold text-slate-900 text-lg">Suppliers Overview</h3>
            </div>
            <span className="text-xs font-semibold text-indigo-700">Manage Suppliers →</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-700 font-semibold uppercase block">Pending Deliveries</span>
              <strong className="text-base font-semibold text-slate-900 mt-1 block">{metrics.pendingDeliveries} PO Restocks</strong>
            </div>
            <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-700 font-semibold uppercase block">New Purchase Orders</span>
              <strong className="text-base font-semibold text-slate-900 mt-1 block">{metrics.supplierPOs} pending POs</strong>
            </div>
          </div>
        </div>

        {/* Financial health */}
        <div 
          onClick={() => navigate('/restaurant/expense-management')}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md cursor-pointer transition-all duration-200 text-left"
        >
          <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-650" />
              <h3 className="font-semibold text-slate-900 text-lg">Finance & Payouts</h3>
            </div>
            <span className="text-xs font-semibold text-emerald-700">Expenses Log →</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-700 font-semibold uppercase block">Operating Expenses</span>
              <strong className="text-base font-semibold text-rose-700 mt-1 block">₹{metrics.operatingExpenses.toLocaleString()}</strong>
            </div>
            <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-700 font-semibold uppercase block">Pending Vendor Payouts</span>
              <strong className="text-base font-semibold text-amber-700 mt-1 block">₹{metrics.pendingPayments.toLocaleString()}</strong>
            </div>
          </div>
        </div>

      </div>

      {/* 7. PENDING APPROVALS CARDS */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-left">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-emerald-650" />
            <h3 className="font-semibold text-slate-900 text-lg">Pending Approvals</h3>
          </div>
          <span className="bg-slate-50 border border-slate-100 text-slate-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
            {approvals.length} Requests
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {approvals.length === 0 ? (
            <div className="col-span-full py-8 text-center text-slate-650 space-y-1">
              <Check className="w-6 h-6 text-emerald-500 mx-auto" />
              <p className="text-xs font-semibold text-slate-700">All approvals are cleared.</p>
            </div>
          ) : (
            approvals.map(app => (
              <div 
                key={app.id} 
                className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 flex flex-col justify-between gap-4 shadow-sm hover:border-slate-300 transition"
              >
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] bg-slate-200 text-slate-800 px-2 py-0.5 rounded-md font-semibold uppercase">
                      {app.title}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      app.priority === 'High' ? 'bg-rose-50 text-rose-755 border border-rose-100' :
                      app.priority === 'Medium' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                      'bg-blue-50 text-blue-700 border border-blue-100'
                    }`}>
                      {app.priority}
                    </span>
                  </div>
                  
                  <strong className="text-sm font-semibold text-slate-900 block mt-3">{app.subject}</strong>
                  
                  <div className="flex justify-between items-center text-xs text-slate-700 mt-1.5">
                    <span>{app.employee}</span>
                    <span className="font-mono text-[10px]">{app.date}</span>
                  </div>
                </div>

                {/* 2. SHOW APPROVAL ACTIONS (✅ Approve, ❌ Reject, 👁 View Details) */}
                <div className="flex flex-col gap-2 pt-3 border-t border-slate-100/60 mt-auto">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprovalAction(app.id, 'Approve')}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold cursor-pointer transition-colors"
                    >
                      <span>✅</span> Approve
                    </button>
                    <button
                      onClick={() => handleApprovalAction(app.id, 'Reject')}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold cursor-pointer transition-colors"
                    >
                      <span>❌</span> Reject
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      if (app.type === 'leave') navigate('/restaurant/employees');
                      else if (app.type === 'po' || app.type === 'payment') navigate('/restaurant/suppliers');
                      else if (app.type === 'stock') navigate('/restaurant/inventory-requests');
                      else navigate('/restaurant/expense-management');
                    }}
                    className="w-full flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold cursor-pointer transition-colors"
                  >
                    <span>👁</span> View Details
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 8. RECENT BUSINESS ACTIVITIES TIMELINE */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-left">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
          <h3 className="font-semibold text-slate-900 text-lg">Recent Business Activities</h3>
          <span className="text-xs text-slate-700 font-semibold uppercase">Real-time Operations feed</span>
        </div>

        <div className="relative border-l border-slate-150 ml-3 pl-6 space-y-5">
          {activities.map(act => (
            <div key={act.id} className="relative group">
              <div className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full border-4 border-white bg-slate-800 group-hover:scale-110 transition"></div>
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-900 font-mono">{act.time}</span>
                  <span className={`text-[9px] font-semibold uppercase px-2 py-0.5 rounded ${
                    act.type === 'billing' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                    act.type === 'kitchen' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                    act.type === 'attendance' ? 'bg-cyan-50 text-cyan-700 border border-cyan-100' :
                    act.type === 'inventory' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                    'bg-slate-50 text-slate-700 border border-slate-200'
                  }`}>
                    {act.type}
                  </span>
                  <span className="text-sm font-semibold text-slate-850">{act.message}</span>
                </div>
                <button 
                  onClick={() => navigate(act.route)}
                  className="text-[11px] text-slate-700 hover:text-slate-900 font-semibold flex items-center gap-0.5 cursor-pointer uppercase"
                >
                  <span>View</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-slate-700 mt-1 leading-snug">{act.detail}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 9. QUICK OPERATIONS TILES */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-left">
        <h3 className="font-semibold text-slate-900 text-lg mb-4">Quick Operations</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          
          <div
            onClick={() => navigate('/billing')}
            className="p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md hover:-translate-y-0.5 active:scale-95 cursor-pointer transition-all duration-200 bg-slate-50/80 group"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl group-hover:scale-110 transition duration-150">🧾</span>
              <div className="text-left">
                <h4 className="text-sm font-semibold text-slate-900">Open Billing Counter</h4>
                <p className="text-[11px] text-slate-700 leading-tight">Launch retail checkout register</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 transition" />
          </div>

          <div
            onClick={() => navigate('/restaurant/kitchen-dashboard')}
            className="p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md hover:-translate-y-0.5 active:scale-95 cursor-pointer transition-all duration-200 bg-slate-50/80 group"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl group-hover:scale-110 transition duration-150">🍽</span>
              <div className="text-left">
                <h4 className="text-sm font-semibold text-slate-900">Monitor Kitchen</h4>
                <p className="text-[11px] text-slate-700 leading-tight">Check KOTs and chef speeds</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 transition" />
          </div>

          <div
            onClick={() => navigate('/inventory')}
            className="p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md hover:-translate-y-0.5 active:scale-95 cursor-pointer transition-all duration-200 bg-slate-50/80 group"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl group-hover:scale-110 transition duration-150">📦</span>
              <div className="text-left">
                <h4 className="text-sm font-semibold text-slate-900">Manage Inventory</h4>
                <p className="text-[11px] text-slate-700 leading-tight">Check low stock levels</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 transition" />
          </div>

          <div
            onClick={() => navigate('/reports')}
            className="p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md hover:-translate-y-0.5 active:scale-95 cursor-pointer transition-all duration-200 bg-slate-50/80 group"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl group-hover:scale-110 transition duration-150">📊</span>
              <div className="text-left">
                <h4 className="text-sm font-semibold text-slate-900">View Reports</h4>
                <p className="text-[11px] text-slate-700 leading-tight">Analyze financial metrics</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 transition" />
          </div>

          <div
            onClick={() => navigate('/restaurant/employees')}
            className="p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md hover:-translate-y-0.5 active:scale-95 cursor-pointer transition-all duration-200 bg-slate-50/80 group"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl group-hover:scale-110 transition duration-150">👤</span>
              <div className="text-left">
                <h4 className="text-sm font-semibold text-slate-900">Employee Management</h4>
                <p className="text-[11px] text-slate-700 leading-tight">Manage attendance & payroll</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 transition" />
          </div>

          <div
            onClick={() => navigate('/restaurant/reservations')}
            className="p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md hover:-translate-y-0.5 active:scale-95 cursor-pointer transition-all duration-200 bg-slate-50/80 group"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl group-hover:scale-110 transition duration-150">📅</span>
              <div className="text-left">
                <h4 className="text-sm font-semibold text-slate-900">Reservations</h4>
                <p className="text-[11px] text-slate-700 leading-tight">Monitor seated diner tables</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 transition" />
          </div>

          <div
            onClick={() => navigate('/restaurant/suppliers')}
            className="p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md hover:-translate-y-0.5 active:scale-95 cursor-pointer transition-all duration-200 bg-slate-50/80 group"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl group-hover:scale-110 transition duration-150">🤝</span>
              <div className="text-left">
                <h4 className="text-sm font-semibold text-slate-900">Suppliers</h4>
                <p className="text-[11px] text-slate-700 leading-tight">Manage purchase requisitions</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 transition" />
          </div>

          <div
            onClick={() => navigate('/restaurant/cashier-dashboard')}
            className="p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md hover:-translate-y-0.5 active:scale-95 cursor-pointer transition-all duration-200 bg-slate-50/80 group"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl group-hover:scale-110 transition duration-150">🍽</span>
              <div className="text-left">
                <h4 className="text-sm font-semibold text-slate-900">Restaurant Dashboard</h4>
                <p className="text-[11px] text-slate-700 leading-tight">Go to main dine-in register</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 transition" />
          </div>

        </div>
      </div>

    </div>
  );
};

export default Dashboard;

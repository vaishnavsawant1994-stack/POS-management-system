import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AttendanceWidget } from '../components/AttendanceWidget';
import {
  Bell,
  Plus,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ChefHat,
  Search,
  X,
  History,
  Trash2,
  SlidersHorizontal,
  Volume2,
  VolumeX,
  CheckSquare,
  Square,
  Calendar as CalendarIcon,
  CheckCircle
} from 'lucide-react';

// ==================== DATA SCHEMAS & INTERFACES ====================

interface MenuItem {
  name: string;
  price: number;
}

interface KitchenOrderItem {
  id: string;
  quantity: number;
  status: 'PENDING' | 'PREPARING' | 'READY';
  notes?: string | null;
  menuItem?: MenuItem;
  cookingTime?: string;
}

interface Table {
  tableNumber: string;
}

interface Waiter {
  name: string;
}

interface KitchenOrder {
  id: string;
  orderNo: string;
  source?: string;
  table?: Table | null;
  status: 'NEW' | 'ACCEPTED' | 'PREPARING' | 'PARTIALLY_READY' | 'READY' | 'COMPLETED' | 'SERVED' | 'CANCELLED';
  createdAt: string; // ISO string
  acceptedAt?: string | null;
  preparingAt?: string | null;
  readyAt?: string | null;
  waiter?: Waiter | null;
  notes?: string | null;
  priority: 'High' | 'Medium' | 'Low';
  estimatedPrepTime: number; // in minutes
  customerType: 'Dine-In' | 'Takeaway';
  items: KitchenOrderItem[];
}

// ==================== DUMMY DATA FOR THE WORKSPACE ====================

const INITIAL_MOCK_ORDERS: KitchenOrder[] = [
  {
    id: 'ko-1045',
    orderNo: '#1045',
    source: 'POS',
    table: { tableNumber: 'Table 7' },
    status: 'PREPARING',
    createdAt: new Date(Date.now() - 8 * 60 * 1000 - 35 * 1000).toISOString(), // 8 mins 35 secs ago
    waiter: { name: 'Rahul Patil' },
    notes: 'Make it spicy, tandoor items crispy',
    priority: 'High',
    estimatedPrepTime: 15,
    customerType: 'Dine-In',
    items: [
      { id: 'koi-1', quantity: 2, status: 'PREPARING', menuItem: { name: 'Paneer Butter Masala', price: 240 }, cookingTime: '12m' },
      { id: 'koi-2', quantity: 4, status: 'READY', menuItem: { name: 'Butter Naan', price: 40 }, cookingTime: '8m' },
      { id: 'koi-3', quantity: 1, status: 'PENDING', menuItem: { name: 'Veg Biryani', price: 180 }, cookingTime: '10m' }
    ]
  },
  {
    id: 'ko-1046',
    orderNo: '#1046',
    source: 'QR',
    table: { tableNumber: 'Table 3' },
    status: 'NEW',
    createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    waiter: { name: 'Akshay Kumar' },
    notes: 'Less oil',
    priority: 'Medium',
    estimatedPrepTime: 12,
    customerType: 'Dine-In',
    items: [
      { id: 'koi-4', quantity: 1, status: 'PENDING', menuItem: { name: 'Chicken Biryani', price: 280 }, cookingTime: '15m' },
      { id: 'koi-5', quantity: 2, status: 'PENDING', menuItem: { name: 'Coke', price: 40 }, cookingTime: '3m' }
    ]
  },
  {
    id: 'ko-1047',
    orderNo: '#1047',
    source: 'POS',
    table: { tableNumber: 'Table 12' },
    status: 'READY',
    createdAt: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
    waiter: { name: 'Priya Singh' },
    notes: null,
    priority: 'Low',
    estimatedPrepTime: 20,
    customerType: 'Dine-In',
    items: [
      { id: 'koi-6', quantity: 1, status: 'READY', menuItem: { name: 'Veg Manchurian', price: 190 }, cookingTime: '10m' },
      { id: 'koi-7', quantity: 1, status: 'READY', menuItem: { name: 'Fried Rice', price: 160 }, cookingTime: '12m' },
      { id: 'koi-8', quantity: 2, status: 'READY', menuItem: { name: 'Fresh Lime Soda', price: 70 }, cookingTime: '5m' }
    ]
  },
  {
    id: 'ko-1048',
    orderNo: '#1048',
    source: 'POS',
    table: { tableNumber: 'Table 5' },
    status: 'PREPARING',
    createdAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(), // 18 mins ago (LATE!)
    waiter: { name: 'Rahul Patil' },
    notes: 'Urgent table, child friendly spice level',
    priority: 'High',
    estimatedPrepTime: 15,
    customerType: 'Dine-In',
    items: [
      { id: 'koi-9', quantity: 2, status: 'PREPARING', menuItem: { name: 'Butter Chicken', price: 320 }, cookingTime: '15m' },
      { id: 'koi-10', quantity: 3, status: 'PREPARING', menuItem: { name: 'Garlic Naan', price: 50 }, cookingTime: '8m' }
    ]
  },
  {
    id: 'ko-1049',
    orderNo: '#1049',
    source: 'QR',
    table: { tableNumber: 'Table 9' },
    status: 'NEW',
    createdAt: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
    waiter: { name: 'Priya Singh' },
    notes: 'No butter on roti',
    priority: 'Low',
    estimatedPrepTime: 18,
    customerType: 'Dine-In',
    items: [
      { id: 'koi-11', quantity: 1, status: 'PENDING', menuItem: { name: 'Dal Makhani', price: 210 }, cookingTime: '15m' },
      { id: 'koi-12', quantity: 4, status: 'PENDING', menuItem: { name: 'Tandoori Roti', price: 20 }, cookingTime: '6m' }
    ]
  },
  {
    id: 'ko-1050',
    orderNo: '#1050',
    source: 'POS',
    table: null,
    status: 'READY',
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    waiter: null,
    notes: 'Pack cutlery separately',
    priority: 'Medium',
    estimatedPrepTime: 20,
    customerType: 'Takeaway',
    items: [
      { id: 'koi-13', quantity: 1, status: 'READY', menuItem: { name: 'Chili Paneer', price: 220 }, cookingTime: '12m' },
      { id: 'koi-14', quantity: 1, status: 'READY', menuItem: { name: 'Hakka Noodles', price: 180 }, cookingTime: '10m' }
    ]
  }
];

const getDishEmoji = (name: string): string => {
  const lower = name.toLowerCase();
  if (lower.includes('paneer')) return '🍛';
  if (lower.includes('naan') || lower.includes('roti') || lower.includes('bread')) return '🫓';
  if (lower.includes('rice') || lower.includes('biryani')) return '🍚';
  if (lower.includes('dal') || lower.includes('curry') || lower.includes('chicken')) return '🍲';
  if (lower.includes('manchurian') || lower.includes('noodles') || lower.includes('noodle')) return '🍜';
  if (lower.includes('coffee') || lower.includes('soda') || lower.includes('coke') || lower.includes('lime') || lower.includes('drink')) return '🥤';
  return '🍛';
};

const getTimingDetails = (order: KitchenOrder, nowTime: number) => {
  const start = new Date(order.createdAt).getTime();
  const diffMs = nowTime - start;
  const totalSecs = Math.max(0, Math.floor(diffMs / 1000));
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  const elapsedStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  const limitMs = order.estimatedPrepTime * 60 * 1000;
  const completionTime = new Date(start + limitMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const isLate = mins > order.estimatedPrepTime;

  return {
    elapsedStr,
    completionTime,
    isLate,
    minsElapsed: mins
  };
};

export const KitchenDisplay: React.FC = () => {
  const navigate = useNavigate();

  // Attendance management logic (Dynamic Rollover)
  const getAttendanceDate = (): string => {
    let date = new Date();
    while (true) {
      const dateStr = date.toISOString().split('T')[0];
      const status = localStorage.getItem(`pos_kitchen_team_attendance_status_${dateStr}`);
      if (status !== 'CHECKED_OUT') {
        return dateStr;
      }
      date.setDate(date.getDate() + 1);
    }
  };

  const getStoredAttendanceStatus = (dateStr: string): 'CHECKED_IN' | 'CHECKED_OUT' | null => {
    return localStorage.getItem(`pos_kitchen_team_attendance_status_${dateStr}`) as 'CHECKED_IN' | 'CHECKED_OUT' | null;
  };

  const getStoredCheckInTime = (dateStr: string): string | null => {
    return localStorage.getItem(`pos_kitchen_team_attendance_checkin_${dateStr}`);
  };

  const getStoredCheckOutTime = (dateStr: string): string | null => {
    return localStorage.getItem(`pos_kitchen_team_attendance_checkout_${dateStr}`);
  };

  const [activeDate, setActiveDate] = useState<string>(() => getAttendanceDate());
  const [attendanceStatus, setAttendanceStatus] = useState<'CHECKED_IN' | 'CHECKED_OUT' | null>(() => getStoredAttendanceStatus(getAttendanceDate()));
  const [checkInTime, setCheckInTime] = useState<string | null>(() => getStoredCheckInTime(getAttendanceDate()));
  const [checkOutTime, setCheckOutTime] = useState<string | null>(() => getStoredCheckOutTime(getAttendanceDate()));

  // Orders State
  const [orders, setOrders] = useState<KitchenOrder[]>(() => {
    const raw = localStorage.getItem('pos_kds_orders_list');
    return raw ? JSON.parse(raw) : INITIAL_MOCK_ORDERS;
  });

  const [nowTime, setNowTime] = useState(Date.now());
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<'newest' | 'oldest' | 'priority' | 'waiting'>('newest');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Notifications
  const [notificationQueue, setNotificationQueue] = useState<any[]>([]);
  const [activeNotification, setActiveNotification] = useState<any | null>(null);
  const [notificationHistory, setNotificationHistory] = useState<any[]>([]);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);

  // View details modal
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<KitchenOrder | null>(null);
  const notifiedReadyOrderIds = useRef<Set<string>>(new Set());

  // Auto-timers updates
  useEffect(() => {
    const timer = setInterval(() => setNowTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const saveOrders = (updated: KitchenOrder[]) => {
    setOrders(updated);
    localStorage.setItem('pos_kds_orders_list', JSON.stringify(updated));
  };

  // Sound Engine
  const playAlertSound = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.1);

      setTimeout(() => {
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        gain2.gain.setValueAtTime(0.2, audioCtx.currentTime);
        osc2.start();
        osc2.stop(audioCtx.currentTime + 0.2);
      }, 120);
    } catch (e) {
      console.warn('Audio context blocked.');
    }
  };

  // Attendance handlers
  const handleCheckIn = () => {
    const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    localStorage.setItem(`pos_kitchen_team_attendance_status_${activeDate}`, 'CHECKED_IN');
    localStorage.setItem(`pos_kitchen_team_attendance_checkin_${activeDate}`, timeStr);

    setAttendanceStatus('CHECKED_IN');
    setCheckInTime(timeStr);
  };

  const handleCheckOut = () => {
    const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    localStorage.setItem(`pos_kitchen_team_attendance_status_${activeDate}`, 'CHECKED_OUT');
    localStorage.setItem(`pos_kitchen_team_attendance_checkout_${activeDate}`, timeStr);

    setAttendanceStatus('CHECKED_OUT');
    setCheckOutTime(timeStr);

    // Roll to next shift day dynamically
    const nextDate = getAttendanceDate();
    setActiveDate(nextDate);
    setAttendanceStatus(null);
    setCheckInTime(null);
    setCheckOutTime(null);
  };

  // KOT Actions
  const handleAcceptOrder = (orderId: string) => {
    const updated = orders.map(o => {
      if (o.id === orderId) {
        const updatedItems = o.items.map(it => {
          if (it.status === 'PENDING') {
            return { ...it, status: 'PREPARING' as const };
          }
          return it;
        });
        return {
          ...o,
          status: 'PREPARING' as const,
          acceptedAt: new Date().toISOString(),
          items: updatedItems
        };
      }
      return o;
    });
    saveOrders(updated);
    if (selectedOrderDetails?.id === orderId) {
      const match = updated.find(o => o.id === orderId);
      if (match) setSelectedOrderDetails(match);
    }
  };

  const handleStartPreparingOrder = (orderId: string) => {
    const updated = orders.map(o => {
      if (o.id === orderId) {
        const updatedItems = o.items.map(it => {
          if (it.status === 'PENDING') {
            return { ...it, status: 'PREPARING' as const };
          }
          return it;
        });
        return {
          ...o,
          status: 'PREPARING' as const,
          preparingAt: new Date().toISOString(),
          items: updatedItems
        };
      }
      return o;
    });
    saveOrders(updated);
    if (selectedOrderDetails?.id === orderId) {
      const match = updated.find(o => o.id === orderId);
      if (match) setSelectedOrderDetails(match);
    }
  };

  const handleMarkOrderReady = (orderId: string) => {
    const updated = orders.map(o => {
      if (o.id === orderId) {
        const updatedItems = o.items.map(it => ({ ...it, status: 'READY' as const }));
        const updatedOrd: KitchenOrder = {
          ...o,
          status: 'READY' as const,
          readyAt: new Date().toISOString(),
          items: updatedItems
        };
        triggerReadyNotification(updatedOrd);
        return updatedOrd;
      }
      return o;
    });
    saveOrders(updated);
    if (selectedOrderDetails?.id === orderId) {
      const match = updated.find(o => o.id === orderId);
      if (match) setSelectedOrderDetails(match);
    }
  };

  const handleServeOrder = (orderId: string) => {
    const updated = orders.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          status: 'COMPLETED' as const
        };
      }
      return o;
    });
    saveOrders(updated);
    setSelectedOrderDetails(null);
  };

  const handleToggleItemStatus = (orderId: string, itemId: string, currentStatus: string) => {
    const nextItemStatus = currentStatus === 'READY' ? 'PREPARING' : 'READY';
    const updated = orders.map(o => {
      if (o.id === orderId) {
        const updatedItems = o.items.map(it => {
          if (it.id === itemId) {
            return { ...it, status: nextItemStatus as any };
          }
          return it;
        });

        // Compute aggregate order status
        const allReady = updatedItems.every(it => it.status === 'READY');
        const hasPreparing = updatedItems.some(it => it.status === 'PREPARING');
        let newStatus = o.status;

        if (allReady) {
          newStatus = 'READY';
        } else if (hasPreparing) {
          newStatus = 'PREPARING';
        } else {
          newStatus = 'PARTIALLY_READY';
        }

        const updatedOrd: KitchenOrder = {
          ...o,
          items: updatedItems,
          status: newStatus,
          readyAt: newStatus === 'READY' ? new Date().toISOString() : o.readyAt
        };

        if (newStatus === 'READY') {
          triggerReadyNotification(updatedOrd);
        } else {
          notifiedReadyOrderIds.current.delete(orderId);
        }

        return updatedOrd;
      }
      return o;
    });
    saveOrders(updated);
    if (selectedOrderDetails?.id === orderId) {
      const match = updated.find(o => o.id === orderId);
      if (match) setSelectedOrderDetails(match);
    }
  };

  // Notification engine
  const triggerReadyNotification = (order: KitchenOrder) => {
    if (notifiedReadyOrderIds.current.has(order.id)) return;
    notifiedReadyOrderIds.current.add(order.id);

    playAlertSound();
    const tableStr = order.table?.tableNumber || 'Takeaway';
    const kotShort = order.orderNo;
    const waiterName = order.waiter?.name || 'Staff';

    const notif = {
      id: Date.now().toString() + Math.random().toString(),
      title: `Order ${kotShort} Ready`,
      message: `${tableStr} order is ready for pickup. Waiter: ${waiterName}`,
      tableNumber: tableStr,
      waiterName,
      kotNumber: kotShort,
      timestamp: new Date()
    };

    setNotificationQueue(prev => [...prev, notif]);
    setNotificationHistory(prev => [notif, ...prev]);
  };

  const dismissNotification = () => {
    setActiveNotification(null);
  };

  useEffect(() => {
    if (!activeNotification && notificationQueue.length > 0) {
      const next = notificationQueue[0];
      setActiveNotification(next);
      setNotificationQueue(prev => prev.slice(1));
    }
  }, [activeNotification, notificationQueue]);

  useEffect(() => {
    if (activeNotification) {
      const timer = setTimeout(() => {
        setActiveNotification(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [activeNotification]);

  // Searching & Sorting
  const matchesSearch = (order: KitchenOrder) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const matchesKot = order.orderNo.toLowerCase().includes(q);
    const matchesTable = (order.table?.tableNumber || '').toLowerCase().includes(q);
    const matchesWaiter = (order.waiter?.name || '').toLowerCase().includes(q);
    const matchesItems = order.items.some(it => it.menuItem?.name.toLowerCase().includes(q));
    return matchesKot || matchesTable || matchesWaiter || matchesItems;
  };

  const sortOrders = (a: KitchenOrder, b: KitchenOrder) => {
    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();
    if (sortOption === 'oldest') return aTime - bTime;
    if (sortOption === 'newest') return bTime - aTime;
    if (sortOption === 'waiting') return aTime - bTime; // oldest first for waiting
    if (sortOption === 'priority') {
      const pWeight = (p: string) => (p === 'High' ? 3 : p === 'Medium' ? 2 : 1);
      return pWeight(b.priority) - pWeight(a.priority);
    }
    return 0;
  };

  // KOT Workspace Columns Filtering
  const activeOrders = orders.filter(o => o.status !== 'COMPLETED' && o.status !== 'SERVED' && o.status !== 'CANCELLED');
  const filteredOrders = activeOrders.filter(matchesSearch).sort(sortOrders);

  const columnNew = filteredOrders.filter(o => o.status === 'NEW' || o.status === 'ACCEPTED');
  const columnPreparing = filteredOrders.filter(o => o.status === 'PREPARING' || o.status === 'PARTIALLY_READY');
  const columnReady = filteredOrders.filter(o => o.status === 'READY');

  // Stats Calculations
  const waitingOrdersCount = activeOrders.filter(o => o.status === 'NEW' || o.status === 'ACCEPTED').length;
  const preparingOrdersCount = activeOrders.filter(o => o.status === 'PREPARING' || o.status === 'PARTIALLY_READY').length;
  const readyOrdersCount = activeOrders.filter(o => o.status === 'READY').length;
  const completedTodayCount = orders.filter(o => o.status === 'COMPLETED' || o.status === 'SERVED').length;
  
  // Delayed count
  const delayedCount = activeOrders.filter(o => getTimingDetails(o, nowTime).isLate).length;

  return (
    <div className="space-y-6 text-slate-900 max-w-7xl mx-auto p-4 select-none min-h-screen pb-16" style={{ fontFamily: "'Inter', sans-serif" }}>
      
      {/* Toast alert */}
      {activeNotification && (
        <div className="fixed top-6 right-6 z-[100] pointer-events-auto transition-all duration-300 animate-slide-in">
          <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-emerald-500/40 flex items-start gap-3 w-80 relative">
            <button
              onClick={dismissNotification}
              className="absolute top-2 right-2 text-slate-400 hover:text-white transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0 text-left pr-4">
              <div className="font-extrabold text-[10px] text-emerald-400 tracking-wider uppercase">Order Ready Alert</div>
              <div className="font-bold text-sm mt-0.5 text-white truncate">{activeNotification.tableNumber}</div>
              <div className="text-[11px] text-slate-350 font-semibold mt-0.5">KOT {activeNotification.kotNumber}</div>
              <div className="text-[11px] text-slate-400 mt-1 font-medium">Waiter: {activeNotification.waiterName}</div>
            </div>
          </div>
        </div>
      )}

      {/* 1. BRAND-ACCENTED KITCHEN BANNER HEADER */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-1 text-left">
            <h1 className="text-3xl font-semibold tracking-tight">
              Good Morning, Kitchen Team 👨‍🍳
            </h1>
            <p className="text-slate-300 font-medium text-sm mt-1">
              Today you have <span className="font-semibold text-white">{activeOrders.length} active orders</span>, <span className="font-semibold text-white">{preparingOrdersCount} preparing</span>, and <span className="font-semibold text-white">{readyOrdersCount} ready for pickup</span>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-stretch lg:self-auto justify-between lg:justify-end">
            <div className="bg-slate-800/80 border border-slate-700/60 px-3.5 py-1.5 rounded-xl text-left flex items-center gap-2 shadow-sm text-slate-200">
              <CalendarIcon className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-medium">
                {new Date(nowTime).toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
              </span>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/60 px-3.5 py-1.5 rounded-xl text-left flex items-center gap-2 shadow-sm text-slate-200">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-medium font-mono">
                {new Date(nowTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* TODAY'S ATTENDANCE STANDARDIZED CARD */}
      <AttendanceWidget
        status={attendanceStatus}
        checkInTime={checkInTime}
        checkOutTime={checkOutTime}
        workingHours="--"
        shiftName="Morning Shift (09:00 AM – 06:00 PM)"
        nowTime={nowTime}
        onCheckIn={handleCheckIn}
        onCheckOut={handleCheckOut}
      />

      {/* 3. REDESIGNED KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { 
            label: 'Active Orders', 
            val: `${activeOrders.length} Tickets`, 
            desc: 'Awaiting / Cooking KOTs', 
            icon: ChefHat, 
            iconColor: 'text-blue-500', 
            trend: 'Live', 
            trendColor: 'text-blue-600 bg-blue-50/60 border-blue-100' 
          },
          { 
            label: 'Preparing', 
            val: `${preparingOrdersCount} KOTs`, 
            desc: 'Items active on stove', 
            icon: Clock, 
            iconColor: 'text-amber-500', 
            trend: 'Cooking', 
            trendColor: 'text-amber-600 bg-amber-50/60 border-amber-100' 
          },
          { 
            label: 'Ready Orders', 
            val: `${readyOrdersCount} Orders`, 
            desc: 'Awaiting waiter pickup', 
            icon: CheckCircle2, 
            iconColor: 'text-emerald-500', 
            trend: 'Ready', 
            trendColor: 'text-emerald-600 bg-emerald-50/60 border-emerald-100' 
          },
          { 
            label: 'Delayed Orders', 
            val: `${delayedCount} Tickets`, 
            desc: 'Exceeded target preparation limit', 
            icon: AlertTriangle, 
            iconColor: 'text-rose-500', 
            trend: 'Delayed', 
            trendColor: delayedCount > 0 ? 'text-rose-600 bg-rose-50/60 border-rose-100' : 'text-slate-500 bg-slate-50 border-slate-200/60' 
          },
          { 
            label: 'Completed Today', 
            val: `${completedTodayCount} KOTs`, 
            desc: 'Cleared from workspace', 
            icon: CheckCircle, 
            iconColor: 'text-emerald-500', 
            trend: 'Served', 
            trendColor: 'text-emerald-600 bg-emerald-50/60 border-emerald-100' 
          }
        ].map((card, idx) => (
          <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 text-left shadow-xs flex flex-col justify-between hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 min-h-[120px]">
            <div className="flex justify-between items-start">
              <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                <card.icon className={`w-4 h-4 ${card.iconColor}`} />
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${card.trendColor}`}>
                {card.trend}
              </span>
            </div>
            <div className="mt-3.5 space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">{card.label}</span>
              <h4 className="text-lg font-black text-slate-900 leading-none tracking-tight">{card.val}</h4>
              <p className="text-[10px] text-slate-500 font-semibold leading-tight">{card.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 4. COMPACT KITCHEN STATUS PANEL */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs grid grid-cols-2 md:grid-cols-5 gap-4 text-left">
        {[
          { label: 'Active Chefs', val: '4 On Duty', desc: 'Curry & tandoor stations' },
          { label: 'Available Stations', val: '6 Ready', desc: 'All kitchen ranges active' },
          { label: 'Busy Stations', val: '4 Cooking', desc: 'Peak workload duty' },
          { label: 'Orders Waiting', val: `${waitingOrdersCount} Tickets`, desc: 'Pending initial accept' },
          { label: 'Average Preparation Time', val: '13.5 mins', desc: 'Target: 15.0 mins limit' }
        ].map((item, idx) => (
          <div key={idx} className="border-r border-slate-150 last:border-r-0 pr-4 last:pr-0">
            <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">{item.label}</span>
            <strong className="text-xs font-black text-slate-850 block mt-0.5">{item.val}</strong>
            <span className="text-[9.5px] text-slate-500 font-semibold block mt-0.5 leading-snug">{item.desc}</span>
          </div>
        ))}
      </div>

      {/* Filter and Control block */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-left">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search KOT, Table, Waiter, or dish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-8 py-2 rounded-xl border border-slate-200 bg-transparent text-xs focus:outline-none focus:border-emerald-600 font-medium h-9"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as any)}
              className="bg-transparent border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none text-slate-700 cursor-pointer h-9"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="priority">Priority First</option>
              <option value="waiting">Longest Waiting</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
          <button
            onClick={() => navigate('/restaurant/inventory-requests')}
            className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold px-3.5 py-2 rounded-xl text-xs transition cursor-pointer border border-emerald-500 shadow-sm flex items-center gap-1.5 h-9"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Inventory Request</span>
          </button>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`border px-3.5 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer h-9 ${
              soundEnabled 
                ? 'bg-slate-50 border-slate-200 text-slate-700' 
                : 'bg-rose-50 border-rose-200 text-rose-605'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>{soundEnabled ? 'Mute' : 'Unmute'}</span>
          </button>

          <button
            onClick={() => setShowHistoryPanel(true)}
            className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer relative h-9"
          >
            <History className="w-3.5 h-3.5" />
            <span>History</span>
            {notificationHistory.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center">
                {notificationHistory.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 5. REDESIGNED KITCHEN WORKSPACE KANBAN COLUMNS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start text-left">
        
        {/* Column 1: New Orders */}
        <div className="space-y-4">
          <div className="bg-slate-100/70 border border-slate-200 rounded-2xl p-3 flex justify-between items-center">
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span>New Orders</span>
            </h3>
            <span className="bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md text-[10px] font-extrabold">
              {columnNew.length}
            </span>
          </div>

          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1 scrollbar-thin">
            {columnNew.length === 0 ? (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-8 text-center text-slate-400 text-xs italic shadow-2xs">
                No new tickets.
              </div>
            ) : (
              columnNew.map(order => (
                <KdsOrderCard
                  key={order.id}
                  order={order}
                  nowTime={nowTime}
                  onAccept={() => handleAcceptOrder(order.id)}
                  onStartPreparing={() => handleStartPreparingOrder(order.id)}
                  onMarkReady={() => handleMarkOrderReady(order.id)}
                  onToggleItemStatus={(itemId, current) => handleToggleItemStatus(order.id, itemId, current)}
                  onViewDetails={() => setSelectedOrderDetails(order)}
                />
              ))
            )}
          </div>
        </div>

        {/* Column 2: Preparing */}
        <div className="space-y-4">
          <div className="bg-slate-100/70 border border-slate-200 rounded-2xl p-3 flex justify-between items-center">
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              <span>Preparing</span>
            </h3>
            <span className="bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md text-[10px] font-extrabold">
              {columnPreparing.length}
            </span>
          </div>

          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1 scrollbar-thin">
            {columnPreparing.length === 0 ? (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-8 text-center text-slate-400 text-xs italic shadow-2xs">
                No orders preparing.
              </div>
            ) : (
              columnPreparing.map(order => (
                <KdsOrderCard
                  key={order.id}
                  order={order}
                  nowTime={nowTime}
                  onAccept={() => handleAcceptOrder(order.id)}
                  onStartPreparing={() => handleStartPreparingOrder(order.id)}
                  onMarkReady={() => handleMarkOrderReady(order.id)}
                  onToggleItemStatus={(itemId, current) => handleToggleItemStatus(order.id, itemId, current)}
                  onViewDetails={() => setSelectedOrderDetails(order)}
                />
              ))
            )}
          </div>
        </div>

        {/* Column 3: Ready */}
        <div className="space-y-4">
          <div className="bg-slate-100/70 border border-slate-200 rounded-2xl p-3 flex justify-between items-center">
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Ready for Pickup</span>
            </h3>
            <span className="bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md text-[10px] font-extrabold">
              {columnReady.length}
            </span>
          </div>

          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1 scrollbar-thin">
            {columnReady.length === 0 ? (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-8 text-center text-slate-400 text-xs italic shadow-2xs">
                No ready tickets.
              </div>
            ) : (
              columnReady.map(order => (
                <KdsOrderCard
                  key={order.id}
                  order={order}
                  nowTime={nowTime}
                  onAccept={() => handleAcceptOrder(order.id)}
                  onStartPreparing={() => handleStartPreparingOrder(order.id)}
                  onMarkReady={() => handleMarkOrderReady(order.id)}
                  onToggleItemStatus={(itemId, current) => handleToggleItemStatus(order.id, itemId, current)}
                  onViewDetails={() => setSelectedOrderDetails(order)}
                />
              ))
            )}
          </div>
        </div>

      </div>

      {/* VIEW DETAILS DRAWER */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs flex justify-end z-50">
          <div className="bg-white w-full max-w-md h-full shadow-2xl p-6 relative overflow-y-auto flex flex-col justify-between text-left">
            <div>
              <div className="flex justify-between items-start border-b border-slate-150 pb-4 mb-4">
                <div className="space-y-1">
                  <span className="text-[9px] font-extrabold bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-md uppercase tracking-wider">
                    {selectedOrderDetails.customerType}
                  </span>
                  <h3 className="text-base font-extrabold text-slate-905 mt-1 block">Order {selectedOrderDetails.orderNo}</h3>
                  <p className="text-[10px] text-slate-400 font-semibold">Table: {selectedOrderDetails.table?.tableNumber || 'Takeaway'} | Waiter: {selectedOrderDetails.waiter?.name || 'Staff'}</p>
                </div>
                <button
                  onClick={() => setSelectedOrderDetails(null)}
                  className="p-1 rounded-lg hover:bg-slate-50 cursor-pointer h-7 w-7 flex items-center justify-center border border-slate-100"
                  aria-label="Close"
                >
                  <X className="w-4 h-4 text-slate-500 hover:text-slate-800" />
                </button>
              </div>

              {selectedOrderDetails.notes && (
                <div className="bg-amber-50/50 border border-amber-150 rounded-xl p-3 mb-5 text-[11px] text-amber-700 leading-relaxed font-semibold">
                  <span className="text-[9.5px] uppercase font-bold text-amber-600 block mb-0.5 tracking-wider">Kitchen Instruction</span>
                  {selectedOrderDetails.notes}
                </div>
              )}

              <div className="space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ordered Items</span>
                {selectedOrderDetails.items.map(it => (
                  <div key={it.id} className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50 flex justify-between items-center text-xs">
                    <div>
                      <h4 className="font-extrabold text-slate-800 flex items-center gap-1.5">
                        <span>{getDishEmoji(it.menuItem?.name || '')}</span>
                        <span>{it.menuItem?.name}</span>
                        <span className="text-slate-500 font-bold">×{it.quantity}</span>
                      </h4>
                      {it.notes && <span className="text-[10px] text-slate-450 block font-semibold mt-0.5">Notes: {it.notes}</span>}
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                      it.status === 'READY' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                      it.status === 'PREPARING' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                      'bg-blue-50 text-blue-705 border border-blue-200'
                    }`}>
                      {it.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-slate-150 mt-8 shrink-0 flex gap-2">
              {selectedOrderDetails.status !== 'READY' ? (
                <>
                  <button
                    onClick={() => {
                      handleStartPreparingOrder(selectedOrderDetails.id);
                      setSelectedOrderDetails(null);
                    }}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold uppercase py-2.5 rounded-xl text-xs tracking-wider cursor-pointer border border-emerald-500 h-10 shadow-sm"
                  >
                    Cook Whole Order
                  </button>
                  <button
                    onClick={() => {
                      handleMarkOrderReady(selectedOrderDetails.id);
                      setSelectedOrderDetails(null);
                    }}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold uppercase py-2.5 rounded-xl text-xs tracking-wider cursor-pointer border border-emerald-500 h-10 shadow-sm"
                  >
                    Ready Whole Order
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleServeOrder(selectedOrderDetails.id)}
                  className="w-full bg-slate-700 hover:bg-slate-800 text-white font-extrabold uppercase py-2.5 rounded-xl text-xs tracking-wider cursor-pointer border border-slate-650 h-10"
                >
                  Serve & Notify Waiter
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* NOTIFICATION HISTORY DRAWER */}
      {showHistoryPanel && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-2xs flex justify-end">
          <div className="w-full max-w-sm bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col justify-between text-left">
            <div className="p-5 border-b border-slate-150 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-slate-600" />
                <h3 className="font-extrabold text-slate-855 text-base">Notification Logs</h3>
              </div>
              <button
                onClick={() => setShowHistoryPanel(false)}
                className="text-slate-500 hover:text-slate-800 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin">
              {notificationHistory.length === 0 ? (
                <p className="text-xs text-slate-450 italic text-center py-20">No recent logs recorded.</p>
              ) : (
                notificationHistory.map(notif => (
                  <div key={notif.id} className="p-3 bg-slate-50 rounded-xl border border-slate-150 text-xs flex gap-3 hover:shadow-2xs transition">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0 font-bold">✓</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-extrabold text-slate-900">{notif.title}</div>
                      <div className="text-slate-550 mt-0.5 leading-snug">{notif.message}</div>
                      <span className="text-[10px] text-slate-400 block mt-1.5 font-medium font-mono">
                        {new Date(notif.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-slate-150 bg-slate-50/50">
              <button
                disabled={notificationHistory.length === 0}
                onClick={() => setNotificationHistory([])}
                className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50 cursor-pointer border border-rose-150"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear Logs</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Styled Micro-Animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes slide-in-right {
          0% { transform: translateX(120%); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in {
          animation: slide-in-right 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />

    </div>
  );
};

// ==================== KDS COLUMN ORDER CARD COMPONENT ====================

interface KdsOrderCardProps {
  order: KitchenOrder;
  nowTime: number;
  onAccept: () => void;
  onStartPreparing: () => void;
  onMarkReady: () => void;
  onToggleItemStatus: (itemId: string, currentStatus: string) => void;
  onViewDetails: () => void;
}

const KdsOrderCard: React.FC<KdsOrderCardProps> = ({
  order,
  nowTime,
  onAccept,
  onStartPreparing,
  onMarkReady,
  onToggleItemStatus,
  onViewDetails
}) => {
  const { elapsedStr, completionTime, isLate } = getTimingDetails(order, nowTime);
  const totalItemsCount = order.items.length;
  const completedItemsCount = order.items.filter(it => it.status === 'READY').length;
  const progressPercent = totalItemsCount > 0 ? Math.round((completedItemsCount / totalItemsCount) * 100) : 0;



  return (
    <div className="bg-white border border-slate-205 rounded-2xl p-5 shadow-2xs hover:shadow-md transition text-left flex flex-col justify-between relative overflow-hidden min-h-[340px]">
      
      <div>
        {/* Card Header Info */}
        <div className="flex justify-between items-start border-b border-slate-100 pb-3 mb-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <strong className="text-xs font-black text-slate-900 block uppercase leading-none tracking-tight">KOT {order.orderNo}</strong>
              <span className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">
                {order.table?.tableNumber || 'Takeaway'}
              </span>
              <span className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">
                {order.customerType}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-semibold mt-1">Waiter: {order.waiter?.name || 'Staff'} | Priority: <strong className={order.priority === 'High' ? 'text-rose-600' : 'text-slate-655'}>{order.priority}</strong></p>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">KOT Status</span>
            <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase mt-0.5 ${
              order.status === 'NEW' || order.status === 'ACCEPTED' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
              order.status === 'PREPARING' || order.status === 'PARTIALLY_READY' ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse' :
              'bg-emerald-50 text-emerald-700 border border-emerald-250'
            }`}>
              {order.status === 'NEW' || order.status === 'ACCEPTED' ? '🔵 New' : order.status === 'PREPARING' || order.status === 'PARTIALLY_READY' ? '🟠 Preparing' : '🟢 Ready'}
            </span>
          </div>
        </div>

        {/* Timers Bar */}
        <div className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-4 text-[10px] font-bold text-slate-550 uppercase tracking-wider">
          <div className="flex flex-wrap gap-2.5 items-center">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Elapsed: <strong className="text-slate-800 font-mono">{elapsedStr}</strong></span>
            </div>
            <span>•</span>
            <div>
              <span>Est Target: <strong className="text-slate-800 font-mono">{completionTime}</strong></span>
            </div>
          </div>
          {isLate && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-2 py-0.5 rounded-md text-center text-[9px] font-extrabold animate-pulse">
              🔴 Delayed Dispatch
            </div>
          )}
        </div>

        {order.notes && (
          <p className="text-[11px] text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-medium mb-4 leading-relaxed">
            Note: {order.notes}
          </p>
        )}

        {/* Ordered items list */}
        <div className="space-y-2 mb-5">
          {order.items.map(dish => (
            <div key={dish.id} className="flex justify-between items-center text-xs font-semibold border border-slate-150 rounded-xl p-2.5 bg-slate-50/50">
              <div className="flex items-center gap-2 min-w-0">
                {order.status !== 'COMPLETED' && order.status !== 'SERVED' ? (
                  <button
                    onClick={() => onToggleItemStatus(dish.id, dish.status)}
                    className={`shrink-0 transition-colors ${
                      dish.status === 'READY' ? 'text-emerald-600 animate-scale-pop' : 'text-slate-400 hover:text-emerald-500'
                    }`}
                  >
                    {dish.status === 'READY' ? (
                      <CheckSquare className="w-4 h-4" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                ) : (
                  <div className="w-4 h-4 flex items-center justify-center text-emerald-500 shrink-0 font-bold">✓</div>
                )}

                <span className="text-sm shrink-0">{getDishEmoji(dish.menuItem?.name || '')}</span>
                
                <div className="min-w-0 text-left">
                  <span className={`text-slate-900 font-extrabold truncate block ${dish.status === 'READY' ? 'line-through opacity-50' : ''}`}>
                    {dish.menuItem?.name}
                    <span className="text-slate-505 font-bold ml-1.5">×{dish.quantity}</span>
                  </span>
                  {dish.notes && <span className="block text-[9.5px] text-slate-400 font-medium mt-0.5 truncate">Note: {dish.notes}</span>}
                </div>
              </div>

              <div className="flex flex-col items-end shrink-0">
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                  dish.status === 'PENDING' ? 'bg-blue-50 text-blue-700 border border-blue-105' :
                  dish.status === 'PREPARING' ? 'bg-amber-50 text-amber-700 border border-amber-105' :
                  'bg-emerald-50 text-emerald-700 border border-emerald-105'
                }`}>
                  {dish.status === 'PENDING' ? 'Pending' : dish.status === 'PREPARING' ? 'Preparing' : 'Ready'}
                </span>
                <span className="text-[8.5px] text-slate-400 font-bold font-mono mt-0.5">{dish.cookingTime || '10m limit'}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="space-y-1 mb-4">
          <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider">
            <span>Prepared</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1">
            <div className="bg-emerald-600 h-1 rounded-full transition-all duration-300" style={{ width: `${progressPercent}%` }}></div>
          </div>
        </div>
      </div>

      {/* Card Actions Footer - Stay aligned at bottom of card */}
      <div className="pt-3 border-t border-slate-100 flex gap-2 shrink-0">
        {order.status === 'NEW' && (
          <button
            onClick={onAccept}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold uppercase py-2 rounded-xl text-[10px] tracking-wider transition cursor-pointer border border-emerald-500 h-9"
          >
            Accept KOT
          </button>
        )}
        {(order.status === 'ACCEPTED' || order.status === 'PREPARING' || order.status === 'PARTIALLY_READY') && (
          <>
            <button
              onClick={onStartPreparing}
              className="flex-1 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-extrabold uppercase py-2 rounded-xl text-[10px] tracking-wider transition cursor-pointer border border-amber-500 h-9"
            >
              Start Preparing
            </button>
            <button
              onClick={onMarkReady}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold uppercase py-2 rounded-xl text-[10px] tracking-wider transition cursor-pointer border border-emerald-500 h-9"
            >
              Mark Ready
            </button>
          </>
        )}
        {order.status === 'READY' && (
          <button
            onClick={() => onMarkReady()} // Fallback served transition
            className="flex-1 bg-slate-700 hover:bg-slate-800 active:scale-95 text-white font-extrabold uppercase py-2 rounded-xl text-[10px] tracking-wider transition cursor-pointer border border-slate-600 h-9"
          >
            Serve KOT
          </button>
        )}
        <button
          onClick={onViewDetails}
          className="bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 font-extrabold uppercase px-3 py-2 rounded-xl text-[10px] tracking-wider transition cursor-pointer border border-slate-200 h-9 shrink-0"
        >
          Details
        </button>
      </div>

    </div>
  );
};

export default KitchenDisplay;

import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Bell,
  Loader2,
  Navigation,
  Map,
  RefreshCw,
  Trash2
} from 'lucide-react';

interface Waiter {
  id: string;
  name: string;
  mobile: string;
  status: string;
  ordersServed: number;
  salesHandled: number;
  tableAssignments: { tableNumber: string }[];
  employeeCode?: string;
}

interface ServiceTask {
  id: string;
  orderId: string;
  tableNumber: string;
  waiterId: string | null;
  status: string; // ready, picked_up, serving, served
  assignedAt: string;
  pickedUpAt: string | null;
  servedAt: string | null;
  kitchenOrder: {
    id: string;
    notes: string | null;
    totalAmount: number;
    createdAt: string;
    items: {
      id: string;
      quantity: number;
      menuItem: {
        name: string;
        price: number;
      };
    }[];
  };
  waiter?: Waiter;
}

interface WaiterNotification {
  id: string;
  waiterId: string;
  orderId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category?: {
    name: string;
  };
}

export const WaiterDashboard: React.FC = () => {
  const { user, apiRequest } = useAuth();
  const [waiters, setWaiters] = useState<Waiter[]>([]);
  const [selectedWaiter, setSelectedWaiter] = useState<Waiter | null>(null);
  const [tasks, setTasks] = useState<ServiceTask[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [activeTab, setActiveTab] = useState<'assigned_tables' | 'ready_to_serve' | 'serving' | 'completed'>('assigned_tables');
  
  // Table Order placing details
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderModalTable, setOrderModalTable] = useState<any>(null);
  const [cart, setCart] = useState<{ menuItem: MenuItem; quantity: number; notes: string }[]>([]);
  const [selectedMenuItemId, setSelectedMenuItemId] = useState('');
  const [itemQty, setItemQty] = useState(1);
  const [itemNotes, setItemNotes] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);

  // Table History state
  const [tableHistory, setTableHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Notifications
  const [notifications, setNotifications] = useState<WaiterNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [timeTick, setTimeTick] = useState(0);

  // Local toasts
  const [toasts, setToasts] = useState<{ id: string; message: string; table: string; orderId: string }[]>([]);

  const selectedWaiterRef = useRef<Waiter | null>(null);

  // Realtime connection URL
  const API_BASE = window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : `${window.location.protocol}//${window.location.hostname}:5000/api`;

  const playBellSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, audioCtx.currentTime);
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      gain1.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);
      osc1.start();
      osc1.stop(audioCtx.currentTime + 0.65);
    } catch (e) {
      console.warn('Audio blocked');
    }
  };

  const addToast = (message: string, table: string, orderId: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, table, orderId }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 8000);
  };

  const fetchNotifications = async (waiterId: string) => {
    try {
      const data = await apiRequest(`/restaurant/waiter-notifications?waiterId=${waiterId}`);
      if (Array.isArray(data)) {
        setNotifications(data);
        setUnreadCount(data.filter((n: any) => !n.isRead).length);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const handleMarkNotificationRead = async (id: string) => {
    try {
      await apiRequest(`/restaurant/waiter-notifications/${id}/read`, { method: 'PUT' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(c => Math.max(0, c - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    if (!selectedWaiter) return;
    try {
      const unread = notifications.filter(n => !n.isRead);
      await Promise.all(unread.map(n => apiRequest(`/restaurant/waiter-notifications/${n.id}/read`, { method: 'PUT' })));
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const data = await apiRequest('/restaurant/menu/items');
      if (Array.isArray(data)) {
        setMenuItems(data);
      }
    } catch (err) {
      console.warn('Could not fetch menu items for waiter ordering.');
    }
  };

  const fetchTableHistory = async (tableNumber: string) => {
    setLoadingHistory(true);
    try {
      const data = await apiRequest(`/restaurant/table-history/${encodeURIComponent(tableNumber)}`);
      if (Array.isArray(data)) {
        setTableHistory(data);
      }
    } catch (err) {
      console.warn('Failed to fetch table history.');
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchData = async () => {
    try {
      const waiterData = await apiRequest(`/restaurant/waiters?restaurantId=${user?.restaurantId || 'mock-id'}`);
      setWaiters(waiterData);

      const savedWaiterId = localStorage.getItem('active_waiter_id');
      const foundWaiter = waiterData.find((w: Waiter) => w.id === savedWaiterId) || waiterData[0] || null;
      setSelectedWaiter(foundWaiter);
      selectedWaiterRef.current = foundWaiter;

      if (foundWaiter) {
        fetchNotifications(foundWaiter.id);
      }

      try {
        const tablesData = await apiRequest(`/restaurant/tables?restaurantId=${user?.restaurantId || 'mock-id'}`);
        setTables(tablesData);
      } catch (tableErr) {
        setTables(Array.from({ length: 16 }, (_, i) => ({
          id: `t-${i+1}`,
          tableNumber: `Table ${i+1}`,
          capacity: i % 2 === 0 ? 4 : 2,
          status: 'AVAILABLE'
        })));
      }

      const tasksData = await apiRequest(`/restaurant/service-tasks?restaurantId=${user?.restaurantId || 'mock-id'}`);
      setTasks(tasksData);
    } catch (err) {
      console.warn('Using fallback seed data.');
    }
  };

  useEffect(() => {
    fetchData();
    fetchMenuItems();

    const interval = setInterval(() => {
      setTimeTick(t => t + 1);
    }, 10000);

    const sseUrl = `${API_BASE}/restaurant/realtime`;
    const eventSource = new EventSource(sseUrl);

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'NEW_SERVICE_TASK') {
          const newTask: ServiceTask = payload.data.task;
          const assignedId = payload.data.assignedWaiterId;
          
          setTasks(prev => {
            if (prev.some(t => t.id === newTask.id)) return prev;
            return [payload.data.task, ...prev];
          });

          const currentWaiter = selectedWaiterRef.current;
          if (currentWaiter && assignedId === currentWaiter.id) {
            playBellSound();
            addToast(`New Order Ready to serve!`, newTask.tableNumber, newTask.orderId);
            fetchNotifications(currentWaiter.id);
          }
        } else if (payload.type === 'ORDER_STATUS_UPDATE') {
          const { id, status, task } = payload.data;
          setTasks(prev => {
            return prev.map(t => {
              if (t.orderId === id || (task && t.id === task.id)) {
                return {
                  ...t,
                  status: task?.status || (status === 'SERVING' ? 'picked_up' : status === 'SERVED' ? 'served' : t.status),
                  pickedUpAt: task?.pickedUpAt || t.pickedUpAt,
                  servedAt: task?.servedAt || t.servedAt,
                  waiterId: task?.waiterId || t.waiterId
                };
              }
              return t;
            });
          });
          fetchData();
        } else if (payload.type === 'NOTIFICATION') {
          const notif = payload.data;
          const currentWaiter = selectedWaiterRef.current;
          if (currentWaiter && notif.waiterId === currentWaiter.id) {
            playBellSound();
            addToast(`New Ready Alert: ${notif.title}`, notif.tableNumber || 'Table', notif.orderId);
            fetchNotifications(currentWaiter.id);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };

    return () => {
      clearInterval(interval);
      eventSource.close();
    };
  }, []);

  const handleSelectWaiter = (waiter: Waiter) => {
    setSelectedWaiter(waiter);
    selectedWaiterRef.current = waiter;
    localStorage.setItem('active_waiter_id', waiter.id);
    fetchNotifications(waiter.id);
  };

  const handleUpdateTaskStatus = async (taskId: string, nextStatus: 'picked_up' | 'served') => {
    const action = nextStatus === 'picked_up' ? 'pickup' : 'serve';
    try {
      await apiRequest(`/restaurant/service-tasks/${taskId}/${action}`, {
        method: 'PUT',
        body: JSON.stringify({ waiterId: selectedWaiter?.id })
      });
      fetchData();
    } catch (err) {
      console.warn(err);
    }
  };

  const handleAddToCart = () => {
    if (!selectedMenuItemId) return;
    const item = menuItems.find(mi => mi.id === selectedMenuItemId);
    if (!item) return;

    setCart(prev => {
      const existIdx = prev.findIndex(c => c.menuItem.id === item.id);
      if (existIdx > -1) {
        const updated = [...prev];
        updated[existIdx].quantity += itemQty;
        if (itemNotes) updated[existIdx].notes += `, ${itemNotes}`;
        return updated;
      }
      return [...prev, { menuItem: item, quantity: itemQty, notes: itemNotes }];
    });

    setItemQty(1);
    setItemNotes('');
  };

  const handleRemoveFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const handlePlaceWaiterOrder = async () => {
    if (cart.length === 0 || !orderModalTable || !selectedWaiter) return;
    setPlacingOrder(true);
    try {
      const orderPayload = {
        tableId: orderModalTable.id,
        source: 'WAITER',
        waiterId: selectedWaiter.id,
        notes: orderNotes || null,
        items: cart.map(c => ({
          menuItemId: c.menuItem.id,
          quantity: c.quantity,
          notes: c.notes || null,
          unitPrice: c.menuItem.price
        }))
      };

      await apiRequest('/restaurant/orders', {
        method: 'POST',
        body: JSON.stringify(orderPayload)
      });

      setShowOrderModal(false);
      setCart([]);
      setOrderNotes('');
      fetchData();
      alert('Order placed successfully to kitchen!');
    } catch (err) {
      console.error(err);
      alert('Failed to place order.');
    } finally {
      setPlacingOrder(false);
    }
  };

  const isTableAssignedToCurrent = (tableNumber: string): boolean => {
    if (!selectedWaiter) return false;
    const cleanTable = tableNumber.replace(/\s+/g, '').toLowerCase();
    
    return selectedWaiter.tableAssignments.some(assign => {
      const cleanAssign = assign.tableNumber.replace(/\s+/g, '').toLowerCase();
      if (cleanAssign === cleanTable) return true;
      const assignDigits = cleanAssign.match(/\d+/)?.[0];
      const tableDigits = cleanTable.match(/\d+/)?.[0];
      return assignDigits && tableDigits && assignDigits === tableDigits;
    });
  };

  const getAssignedWaiterForTable = (tableNumber: string): string => {
    const cleanTable = tableNumber.replace(/\s+/g, '').toLowerCase();
    const assigned = waiters.find(w =>
      w.tableAssignments.some(assign => {
        const cleanAssign = assign.tableNumber.replace(/\s+/g, '').toLowerCase();
        if (cleanAssign === cleanTable) return true;
        const assignDigits = cleanAssign.match(/\d+/)?.[0];
        const tableDigits = cleanTable.match(/\d+/)?.[0];
        return assignDigits && tableDigits && assignDigits === tableDigits;
      })
    );
    return assigned ? assigned.name : 'Unassigned';
  };

  const readyTasks = tasks.filter(t => t.status === 'ready' || t.status === 'READY');
  const pickedUpTasks = tasks.filter(t => t.status === 'picked_up' || t.status === 'serving' || t.status === 'SERVING');
  const servedTasks = tasks.filter(t => t.status === 'served' || t.status === 'SERVED');

  const getTimerDetails = (startTimeString: string) => {
    const elapsed = Date.now() - new Date(startTimeString).getTime();
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    return {
      minutes,
      seconds,
      text: `${minutes}m ${seconds}s ago`,
      isOverdue: minutes >= 4
    };
  };

  const getTableStatus = (table: any): 'AVAILABLE' | 'OCCUPIED' | 'PREPARING' | 'READY_TO_SERVE' | 'SERVING' | 'COMPLETED' => {
    if (table.status === 'CLEANING') return 'COMPLETED';
    if (tasks.some(t => t.tableNumber === table.tableNumber && (t.status === 'ready' || t.status === 'READY'))) {
      return 'READY_TO_SERVE';
    }
    if (tasks.some(t => t.tableNumber === table.tableNumber && (t.status === 'picked_up' || t.status === 'serving' || t.status === 'SERVING'))) {
      return 'SERVING';
    }
    if (table.kitchenOrders && table.kitchenOrders.length > 0) {
      const activeOrder = table.kitchenOrders[0];
      if (activeOrder.status === 'READY') return 'READY_TO_SERVE';
      if (activeOrder.status === 'SERVING') return 'SERVING';
      if (activeOrder.status === 'PREPARING' || activeOrder.status === 'ACCEPTED' || activeOrder.status === 'NEW') return 'PREPARING';
      return 'OCCUPIED';
    }
    return 'AVAILABLE';
  };

  const getTableActiveOrderDetails = (table: any) => {
    let items: { name: string; quantity: number }[] = [];
    let bill = 0;
    if (table.kitchenOrders && table.kitchenOrders.length > 0) {
      table.kitchenOrders.forEach((o: any) => {
        bill += o.totalAmount;
        o.items?.forEach((it: any) => {
          items.push({ name: it.menuItem?.name || 'Item', quantity: it.quantity });
        });
      });
    }
    return { items, bill };
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 p-6 font-sans">
      <span className="hidden">{timeTick}</span>
      
      {/* Toast Alert Popups */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className="bg-white border border-slate-200 text-slate-800 p-4 rounded-xl shadow-lg flex items-start gap-3 animate-slide-in pointer-events-auto"
          >
            <Bell className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-[10px] text-emerald-600 uppercase tracking-widest">Food Ready Alert!</span>
                <span className="text-[10px] text-slate-400 font-mono">#{toast.orderId.slice(-4).toUpperCase()}</span>
              </div>
              <p className="text-xs font-medium text-slate-800 mt-1">{toast.message}</p>
              <div className="flex items-center gap-1.5 mt-2 bg-slate-50 px-2 py-1 rounded text-[10px] text-slate-500 font-semibold w-fit border border-slate-100">
                <Map className="w-3 h-3" /> {toast.table}
              </div>
            </div>
            <button
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="text-slate-400 hover:text-slate-700 text-xs font-bold font-mono px-1"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* HEADER SECTION */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-black tracking-tight flex items-center gap-2">
            Waiter Console
          </h1>
          <p className="text-xs text-slate-500 font-medium">Real-time table orders, guest requests, and service pickup workflows.</p>
        </div>

        {/* Action Controls & Notifications */}
        <div className="flex items-center gap-4 justify-between md:justify-end">
          {/* Waiter Switcher Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-550 font-medium">Active Waiter:</span>
            <select
              value={selectedWaiter?.id || ''}
              onChange={(e) => {
                const found = waiters.find(w => w.id === e.target.value);
                if (found) handleSelectWaiter(found);
              }}
              className="bg-white text-slate-800 text-xs px-3 py-2 rounded-lg border border-slate-250 focus:outline-none focus:border-slate-400 transition-colors font-medium"
            >
              {waiters.map(w => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.employeeCode || 'WT000'})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 relative">
            <button
              onClick={fetchData}
              title="Refresh Data"
              className="p-2 rounded-lg bg-white border border-slate-250 text-slate-600 hover:text-slate-900 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-lg bg-white border border-slate-250 text-slate-600 hover:text-slate-900 transition-all relative"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center shadow">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Popover */}
            {showNotifications && (
              <div className="absolute right-0 top-12 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-slide-down">
                <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                  <h3 className="text-xs font-bold uppercase text-slate-800 tracking-wider">
                    Notifications
                  </h3>
                  <button
                    onClick={handleMarkAllNotificationsRead}
                    className="text-[9px] font-bold text-emerald-600 hover:text-emerald-700 uppercase tracking-wider"
                  >
                    Mark all read
                  </button>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 scrollbar-thin">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-slate-400">
                      <p className="text-[10px] font-medium">No recent notifications</p>
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <div
                        key={notif.id}
                        onClick={() => handleMarkNotificationRead(notif.id)}
                        className={`p-3 text-left transition-colors cursor-pointer hover:bg-slate-50 flex items-start gap-2.5 ${
                          notif.isRead ? 'opacity-50' : 'bg-slate-50/50 border-l-2 border-emerald-500'
                        }`}
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                        <div className="flex-1">
                          <h4 className="text-xs font-bold text-slate-800">{notif.title}</h4>
                          <p className="text-[10px] text-slate-500 mt-0.5">{notif.message}</p>
                          <span className="text-[8px] text-slate-400 font-mono mt-1 block">
                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SELECTED WAITER SUMMARY CHIPS */}
      {selectedWaiter && (
        <div className="mb-6 flex flex-wrap gap-4 text-xs font-medium text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200/60 justify-start">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Active profile: <strong className="text-slate-800 font-bold">{selectedWaiter.name}</strong>
          </span>
          <span className="text-slate-300">|</span>
          <span>
            Assigned: <strong className="text-slate-800 font-bold">{selectedWaiter.tableAssignments.map(a => a.tableNumber.replace('Table ', '')).join(', ') || 'None'}</strong>
          </span>
          <span className="text-slate-300">|</span>
          <span>
            Orders served today: <strong className="text-slate-800 font-bold">{selectedWaiter.ordersServed}</strong>
          </span>
          <span className="text-slate-300">|</span>
          <span>
            Sales handled: <strong className="text-slate-800 font-bold">₹{selectedWaiter.salesHandled.toLocaleString('en-IN')}</strong>
          </span>
        </div>
      )}

      {/* TABS NAVIGATION */}
      <div className="flex border-b border-slate-200 mb-6 gap-4 overflow-x-auto pb-1 scrollbar-none text-xs font-bold uppercase tracking-wider">
        <button
          onClick={() => setActiveTab('assigned_tables')}
          className={`pb-3 transition-all border-b-2 ${
            activeTab === 'assigned_tables'
              ? 'border-slate-800 text-slate-800'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Tables Map ({tables.length})
        </button>

        <button
          onClick={() => setActiveTab('ready_to_serve')}
          className={`pb-3 transition-all border-b-2 flex items-center gap-1.5 ${
            activeTab === 'ready_to_serve'
              ? 'border-slate-800 text-slate-800'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Ready to Serve
          {readyTasks.length > 0 && (
            <span className="bg-sky-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {readyTasks.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('serving')}
          className={`pb-3 transition-all border-b-2 flex items-center gap-1.5 ${
            activeTab === 'serving'
              ? 'border-slate-800 text-slate-800'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Serving (On Way)
          {pickedUpTasks.length > 0 && (
            <span className="bg-amber-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {pickedUpTasks.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`pb-3 transition-all border-b-2 ${
            activeTab === 'completed'
              ? 'border-slate-800 text-slate-800'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Service Logs ({servedTasks.length})
        </button>
      </div>

      {/* WORKSPACE CONTENT AREA */}
      <div className="min-h-[450px]">
        {/* 1. TABLES MAP */}
        {activeTab === 'assigned_tables' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {tables.map(table => {
                const status = getTableStatus(table);
                const isAssigned = isTableAssignedToCurrent(table.tableNumber);
                const assignedWaiterName = getAssignedWaiterForTable(table.tableNumber);
                const orderMeta = getTableActiveOrderDetails(table);

                let statusChipClass = 'bg-slate-100 text-slate-600';
                if (status === 'READY_TO_SERVE') statusChipClass = 'bg-sky-100 text-sky-800 font-bold';
                else if (status === 'SERVING') statusChipClass = 'bg-amber-100 text-amber-800 font-bold';
                else if (status === 'PREPARING') statusChipClass = 'bg-purple-100 text-purple-800 font-bold';
                else if (status === 'OCCUPIED') statusChipClass = 'bg-rose-100 text-rose-800 font-bold';
                else if (status === 'COMPLETED') statusChipClass = 'bg-slate-200 text-slate-700 font-bold';
                else statusChipClass = 'bg-emerald-100 text-emerald-800 font-bold';

                return (
                  <div
                    key={table.id}
                    className={`border border-slate-200 p-4 rounded-xl bg-white text-left flex flex-col justify-between hover:border-slate-350 transition-all ${
                      isAssigned ? 'shadow-sm ring-1 ring-slate-100' : 'opacity-80'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2.5">
                        <div>
                          <h3 className="text-base font-bold text-black">{table.tableNumber}</h3>
                          <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">Capacity: {table.capacity} Guests</span>
                        </div>
                        <span className={`text-[9px] uppercase px-2 py-0.5 rounded-md font-bold ${statusChipClass}`}>
                          {status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      {orderMeta.bill > 0 && (
                        <div className="flex justify-between text-[11px] font-medium text-slate-500 py-1.5 border-b border-slate-100 mb-2">
                          <span>Running Bill:</span>
                          <span className="text-black font-bold">₹{orderMeta.bill.toLocaleString('en-IN')}</span>
                        </div>
                      )}

                      <div className="text-[10px] text-slate-500 font-semibold space-y-0.5 mt-2">
                        <div className="flex justify-between">
                          <span>Assigned Waiter:</span>
                          <span className="text-slate-800 font-bold">{assignedWaiterName}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
                      <button
                        onClick={() => {
                          setOrderModalTable(table);
                          setCart([]);
                          fetchTableHistory(table.tableNumber);
                          setShowOrderModal(true);
                        }}
                        className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-[10px] font-bold uppercase py-2 rounded-lg transition text-center cursor-pointer"
                      >
                        Manage & Order
                      </button>

                      {status === 'READY_TO_SERVE' && (
                        isAssigned ? (
                          <button
                            onClick={() => {
                              const relatedTask = readyTasks.find(t => t.tableNumber === table.tableNumber);
                              if (relatedTask) {
                                handleUpdateTaskStatus(relatedTask.id, 'picked_up');
                              }
                            }}
                            className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-[10px] uppercase py-2 px-3 rounded-lg transition cursor-pointer flex items-center gap-1"
                          >
                            <Navigation className="w-3 h-3" />
                            <span>Pickup</span>
                          </button>
                        ) : (
                          <span className="text-[9px] font-bold text-rose-500 bg-rose-50 border border-rose-100 px-2.5 py-2 rounded-lg text-center flex items-center justify-center shrink-0">
                            Locked
                          </span>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. READY TO SERVE QUEUE */}
        {activeTab === 'ready_to_serve' && (
          <div className="space-y-4 text-left">
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
              <table className="w-full text-xs text-left text-slate-800 table-fixed">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-bold text-black text-[11px] uppercase tracking-wider">
                    <th className="px-4 py-3 w-[15%]">Table</th>
                    <th className="px-4 py-3 w-[15%]">Order #</th>
                    <th className="px-4 py-3 w-[20%]">Ready Time</th>
                    <th className="px-4 py-3 w-[35%]">Ordered Items</th>
                    <th className="px-4 py-3 text-right w-[15%]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {readyTasks.map(task => {
                    const isAssigned = isTableAssignedToCurrent(task.tableNumber);
                    const assignedWaiterName = getAssignedWaiterForTable(task.tableNumber);
                    const timer = getTimerDetails(task.assignedAt);

                    return (
                      <tr key={task.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-4 py-3.5 font-bold text-black">{task.tableNumber}</td>
                        <td className="px-4 py-3.5 font-mono text-slate-500">#{task.orderId.slice(-4).toUpperCase()}</td>
                        <td className="px-4 py-3.5 text-slate-500">
                          <span className={timer.isOverdue ? 'text-red-600 font-bold' : ''}>
                            Ready {timer.text}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 font-medium truncate">
                          {task.kitchenOrder?.items?.map(it => `${it.menuItem?.name} (Qty ${it.quantity})`).join(', ')}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          {isAssigned ? (
                            <button
                              onClick={() => handleUpdateTaskStatus(task.id, 'picked_up')}
                              className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-1.5 px-3 rounded-lg text-[10px] uppercase tracking-wider transition cursor-pointer"
                            >
                              Pick Up
                            </button>
                          ) : (
                            <span className="text-[10px] font-bold text-rose-500 bg-rose-50 border border-rose-100 px-2 py-1 rounded-md">
                              {assignedWaiterName} Lock
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {readyTasks.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-16 text-slate-400 font-medium italic">
                        No orders waiting for pickup
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. SERVING TAB */}
        {activeTab === 'serving' && (
          <div className="space-y-4 text-left">
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
              <table className="w-full text-xs text-left text-slate-800 table-fixed">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-bold text-black text-[11px] uppercase tracking-wider">
                    <th className="px-4 py-3 w-[15%]">Table</th>
                    <th className="px-4 py-3 w-[15%]">Order #</th>
                    <th className="px-4 py-3 w-[20%]">Status</th>
                    <th className="px-4 py-3 w-[35%]">Ordered Items</th>
                    <th className="px-4 py-3 text-right w-[15%]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pickedUpTasks.map(task => {
                    const isMyTask = task.waiterId === selectedWaiter?.id;
                    const delivererName = waiters.find(w => w.id === task.waiterId)?.name || 'Unknown';

                    return (
                      <tr key={task.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-4 py-3.5 font-bold text-black">{task.tableNumber}</td>
                        <td className="px-4 py-3.5 font-mono text-slate-500">#{task.orderId.slice(-4).toUpperCase()}</td>
                        <td className="px-4 py-3.5 text-slate-500">
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                            Serving
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 font-medium truncate">
                          {task.kitchenOrder?.items?.map(it => `${it.menuItem?.name} (Qty ${it.quantity})`).join(', ')}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          {isMyTask ? (
                            <button
                              onClick={() => handleUpdateTaskStatus(task.id, 'served')}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3 rounded-lg text-[10px] uppercase tracking-wider transition cursor-pointer"
                            >
                              Served
                            </button>
                          ) : (
                            <span className="text-[10px] font-medium text-slate-400">
                              By {delivererName}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {pickedUpTasks.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-16 text-slate-400 font-medium italic">
                        No orders currently being served
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. COMPLETED HISTORY TAB */}
        {activeTab === 'completed' && (
          <div className="space-y-4 text-left">
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
              <table className="w-full text-xs text-left text-slate-800 table-fixed">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-bold text-black text-[11px] uppercase tracking-wider">
                    <th className="px-4 py-3 w-[15%]">Table</th>
                    <th className="px-4 py-3 w-[15%]">Order #</th>
                    <th className="px-4 py-3 w-[20%]">Delivered By</th>
                    <th className="px-4 py-3 w-[35%]">Items</th>
                    <th className="px-4 py-3 text-right w-[15%]">Total Bill</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {servedTasks.map(task => {
                    const waiterName = waiters.find(w => w.id === task.waiterId)?.name || 'Unknown';
                    return (
                      <tr key={task.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-4 py-3.5 font-bold text-black">{task.tableNumber}</td>
                        <td className="px-4 py-3.5 font-mono text-slate-500">#{task.orderId.slice(-4).toUpperCase()}</td>
                        <td className="px-4 py-3.5 text-slate-500">{waiterName}</td>
                        <td className="px-4 py-3.5 text-slate-500 font-medium truncate">
                          {task.kitchenOrder?.items?.map(it => `${it.menuItem?.name} (Qty ${it.quantity})`).join(', ')}
                        </td>
                        <td className="px-4 py-3.5 text-right font-bold text-slate-800">
                          ₹{task.kitchenOrder?.totalAmount?.toLocaleString('en-IN') || '0'}
                        </td>
                      </tr>
                    );
                  })}
                  {servedTasks.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-16 text-slate-400 font-medium italic">
                        No orders completed in this session
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* --- ORDER & MANAGE MODAL --- */}
      {showOrderModal && orderModalTable && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-4xl w-full shadow-2xl space-y-6 text-left flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b pb-3 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-black uppercase">{orderModalTable.tableNumber} Operations Center</h3>
                <span className="text-xs text-slate-400 font-medium">Assigned Waiter: {getAssignedWaiterForTable(orderModalTable.tableNumber)}</span>
              </div>
              <button
                onClick={() => setShowOrderModal(false)}
                className="text-slate-400 hover:text-slate-800 transition p-1 hover:bg-slate-100 rounded-lg cursor-pointer text-xl font-bold font-mono"
              >
                ×
              </button>
            </div>

            {/* Split Modal Content */}
            <div className="flex-grow overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6 pr-1 no-scrollbar">
              
              {/* Left Column: Create Order Form */}
              <div className="space-y-4 border-r border-slate-200/80 pr-4">
                <h4 className="text-sm font-bold text-black uppercase tracking-wider border-b pb-1">Place Waiter Offline Order</h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">Select Menu Item</label>
                    <select
                      value={selectedMenuItemId}
                      onChange={(e) => setSelectedMenuItemId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-250 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:border-slate-400 text-slate-800"
                    >
                      <option value="">-- Select Item --</option>
                      {menuItems.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.name} - ₹{item.price}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">Quantity</label>
                      <input
                        type="number"
                        min={1}
                        value={itemQty}
                        onChange={(e) => setItemQty(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full bg-slate-50 border border-slate-250 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:border-slate-400 text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">Item Notes</label>
                      <input
                        type="text"
                        placeholder="e.g. Less spicy"
                        value={itemNotes}
                        onChange={(e) => setItemNotes(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-250 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:border-slate-400 text-slate-800"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={!selectedMenuItemId}
                    className="w-full bg-slate-900 hover:bg-black disabled:opacity-50 text-white font-bold text-xs py-2 rounded-lg transition uppercase tracking-wider cursor-pointer"
                  >
                    Add to Cart
                  </button>
                </div>

                {/* Cart Preview */}
                <div className="space-y-2 pt-2">
                  <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Cart Items</span>
                  <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100 max-h-40 overflow-y-auto">
                    {cart.length === 0 ? (
                      <p className="text-[10px] text-slate-400 italic py-4 text-center">Cart is empty</p>
                    ) : (
                      cart.map((c, idx) => (
                        <div key={idx} className="p-2.5 flex justify-between items-center text-xs bg-slate-50/40">
                          <div>
                            <p className="font-bold text-slate-800">{c.menuItem.name}</p>
                            <p className="text-[9px] text-slate-400">Qty {c.quantity} × ₹{c.menuItem.price} {c.notes && `(${c.notes})`}</p>
                          </div>
                          <button
                            onClick={() => handleRemoveFromCart(idx)}
                            className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {cart.length > 0 && (
                    <div className="space-y-3.5 pt-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block mb-1">Order Notes (General)</label>
                        <input
                          type="text"
                          placeholder="General kitchen notes..."
                          value={orderNotes}
                          onChange={(e) => setOrderNotes(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-250 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none"
                        />
                      </div>
                      <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <span className="text-xs font-bold text-slate-500 uppercase">Est. Total:</span>
                        <span className="text-sm font-bold text-black">
                          ₹{cart.reduce((sum, c) => sum + (c.menuItem.price * c.quantity), 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handlePlaceWaiterOrder}
                        disabled={placingOrder}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-lg transition uppercase tracking-wider cursor-pointer"
                      >
                        {placingOrder ? 'Submitting Order...' : 'Send Order to Kitchen'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Table History */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-black uppercase tracking-wider border-b pb-1 flex justify-between items-center">
                  <span>Table History & Previous Bills</span>
                  <span className="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">Permanent logs</span>
                </h4>

                {loadingHistory ? (
                  <div className="py-12 flex justify-center items-center">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
                    {tableHistory.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-12 text-center">No previous bills found for this table.</p>
                    ) : (
                      tableHistory.map((bill) => (
                        <div key={bill.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1.5">
                          <div className="flex justify-between items-center font-bold">
                            <span className="text-slate-800">{bill.invoiceNumber}</span>
                            <span className="text-emerald-700">₹{bill.totalAmount.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="text-[10px] text-slate-550 font-semibold space-y-0.5">
                            <p>Items: {bill.items}</p>
                            <p>Method: <strong className="text-slate-700 uppercase">{bill.paymentMode}</strong> | Date: {bill.date} {bill.time}</p>
                            <p>Waiter: {bill.waiterName}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

            </div>

            {/* Modal Actions */}
            <div className="flex gap-2 pt-3 border-t border-slate-150 text-xs font-bold shrink-0">
              <button
                type="button"
                onClick={() => setShowOrderModal(false)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-250 py-2.5 rounded-lg transition text-center cursor-pointer uppercase tracking-wider"
              >
                Close Panel
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default WaiterDashboard;

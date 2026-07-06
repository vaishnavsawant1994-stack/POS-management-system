import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AttendanceWidget } from '../components/AttendanceWidget';
import {
  Utensils,
  ChefHat,
  Clock,
  User,
  Calendar as CalendarIcon,
  FileText,
  MessageSquare,
  TrendingUp,
  History,
  LogOut,
  Send,
  Inbox,
  CheckCircle2,
  AlertTriangle,
  Activity,
  CheckCircle,
  ShoppingBag,
  X
} from 'lucide-react';

// ==================== DATA SCHEMAS & INTERFACES ====================

interface ChefAccount {
  id: string;
  employeeId: string;
  username: string;
  name: string;
  mobile: string;
  email: string;
  shift: string;
  shiftTiming: string;
  status: 'ON_DUTY' | 'OFF_DUTY' | 'CHECKED_OUT';
  joiningDate: string;
  department: string;
  designation: string;
  assignedKitchen: string;
  todayWorkingHours: string;
  attendancePercent: number;
  performanceRating: number;
  experience: string;
}

interface KitchenDishItem {
  id: string;
  name: string;
  quantity: number;
  status: 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'READY';
  notes: string | null;
  cookingTime: string;
  progress: number;
  specialInstructions: string | null;
}

interface KitchenOrder {
  id: string;
  orderNo: string;
  tableNo: string;
  customerType: 'Dine-In' | 'Takeaway' | 'Delivery';
  orderReceivedTime: number; // timestamp
  waiterName: string;
  priority: 'High' | 'Medium' | 'Low';
  estimatedPrepTime: number; // in minutes
  kitchenNotes: string | null;
  status: 'PENDING' | 'PREPARING' | 'READY' | 'SERVED';
  items: KitchenDishItem[];
}

interface LeaveRequest {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedAt: string;
  rejectReason?: string;
}

interface ChatMessage {
  id: string;
  sender: 'chef' | 'manager' | 'admin' | 'supervisor';
  senderName: string;
  recipient: string;
  text: string;
  timestamp: string;
}

interface InventoryRequest {
  id: string;
  ingredient: string;
  level: 'Low' | 'Very Low' | 'Out of Stock';
  quantity: string;
  notes: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedAt: string;
  rejectReason?: string;
}

interface WorkHistoryItem {
  id: string;
  date: string;
  checkIn: string;
  checkOut: string;
  workingHours: string;
  ordersCompleted: number;
  avgCookingTime: string;
  performance: number;
}

// ==================== MASTER DEFAULT VALUES ====================

const DEFAULT_CHEF: ChefAccount = {
  id: 'ks-1032',
  employeeId: 'KS-1032',
  username: 'amit',
  name: 'Amit Jadhav',
  mobile: '9876543210',
  email: 'amit.jadhav@restaurant.com',
  shift: 'Morning Shift',
  shiftTiming: '09:00 AM – 06:00 PM',
  status: 'OFF_DUTY',
  joiningDate: '15 Mar 2023',
  department: 'Kitchen Department',
  designation: 'Kitchen Staff',
  assignedKitchen: 'Main Kitchen',
  todayWorkingHours: '5h 40m',
  attendancePercent: 98.2,
  performanceRating: 4.9,
  experience: '4 Years'
};

const INITIAL_KITCHEN_ORDERS: KitchenOrder[] = [
  {
    id: 'ord-1052',
    orderNo: '#1052',
    tableNo: 'Table 8',
    customerType: 'Dine-In',
    orderReceivedTime: Date.now() - 15 * 60 * 1000,
    waiterName: 'Rahul Patil',
    priority: 'High',
    estimatedPrepTime: 20,
    kitchenNotes: 'Naan should be buttered and crispy',
    status: 'PREPARING',
    items: [
      { id: 'dish-1', name: 'Butter Paneer', quantity: 1, status: 'PREPARING', notes: 'Medium spicy', cookingTime: '12m', progress: 65, specialInstructions: 'Extra butter on top' },
      { id: 'dish-2', name: 'Naan', quantity: 4, status: 'READY', notes: 'Crispy', cookingTime: '8m', progress: 100, specialInstructions: 'Well buttered' },
      { id: 'dish-3', name: 'Jeera Rice', quantity: 1, status: 'PENDING', notes: null, cookingTime: '10m', progress: 0, specialInstructions: null }
    ]
  },
  {
    id: 'ord-1053',
    orderNo: '#1053',
    tableNo: 'Table 12',
    customerType: 'Dine-In',
    orderReceivedTime: Date.now() - 8 * 60 * 1000,
    waiterName: 'Akshay Kumar',
    priority: 'Medium',
    estimatedPrepTime: 15,
    kitchenNotes: 'No onions in salad side',
    status: 'PREPARING',
    items: [
      { id: 'dish-4', name: 'Dal Makhani', quantity: 1, status: 'ACCEPTED', notes: null, cookingTime: '15m', progress: 20, specialInstructions: 'Slow cooked style' },
      { id: 'dish-5', name: 'Roti', quantity: 2, status: 'ACCEPTED', notes: 'Tandoori style', cookingTime: '6m', progress: 15, specialInstructions: 'No butter' }
    ]
  },
  {
    id: 'ord-1054',
    orderNo: '#1054',
    tableNo: 'Table 5',
    customerType: 'Takeaway',
    orderReceivedTime: Date.now() - 3 * 60 * 1000,
    waiterName: 'Rahul Patil',
    priority: 'High',
    estimatedPrepTime: 18,
    kitchenNotes: 'Make chicken extra spicy',
    status: 'PENDING',
    items: [
      { id: 'dish-6', name: 'Chicken Biryani', quantity: 1, status: 'PENDING', notes: 'Spicy level 5', cookingTime: '18m', progress: 0, specialInstructions: 'Include extra raita pack' }
    ]
  },
  {
    id: 'ord-1055',
    orderNo: '#1055',
    tableNo: 'Table 3',
    customerType: 'Dine-In',
    orderReceivedTime: Date.now() - 25 * 60 * 1000,
    waiterName: 'Priya Singh',
    priority: 'Low',
    estimatedPrepTime: 25,
    kitchenNotes: 'Serve dessert after mains',
    status: 'READY',
    items: [
      { id: 'dish-7', name: 'Veg Manchurian', quantity: 1, status: 'READY', notes: 'Gravy version', cookingTime: '15m', progress: 100, specialInstructions: 'Hot' },
      { id: 'dish-8', name: 'Fried Rice', quantity: 1, status: 'READY', notes: null, cookingTime: '12m', progress: 100, specialInstructions: null },
      { id: 'dish-9', name: 'Brownie with Ice Cream', quantity: 1, status: 'READY', notes: null, cookingTime: '5m', progress: 100, specialInstructions: 'Warm brownie' }
    ]
  }
];

const INITIAL_LEAVE_REQUESTS: LeaveRequest[] = [
  {
    id: 'LV-101',
    leaveType: 'Sick Leave',
    startDate: '2026-04-12',
    endDate: '2026-04-13',
    reason: 'High fever and cold',
    status: 'APPROVED',
    requestedAt: '2026-04-11T10:30:00Z'
  },
  {
    id: 'LV-102',
    leaveType: 'Casual Leave',
    startDate: '2026-05-24',
    endDate: '2026-05-25',
    reason: 'Attending family marriage',
    status: 'REJECTED',
    requestedAt: '2026-05-20T08:15:00Z',
    rejectReason: 'Staff shortage in main tandoor section.'
  },
  {
    id: 'LV-103',
    leaveType: 'Paid Leave',
    startDate: '2026-07-08',
    endDate: '2026-07-10',
    reason: 'Out of town trip with parents',
    status: 'PENDING',
    requestedAt: '2026-07-02T14:20:00Z'
  }
];

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    sender: 'chef',
    senderName: 'Rahul Shinde',
    recipient: 'Kitchen Supervisor',
    text: 'Need Tomatoes urgently in Main Kitchen tandoor area',
    timestamp: '10:15 AM'
  },
  {
    id: 'msg-2',
    sender: 'supervisor',
    senderName: 'Kitchen Supervisor',
    recipient: 'Rahul Shinde',
    text: 'Sending a crate right away from stores.',
    timestamp: '10:16 AM'
  },
  {
    id: 'msg-3',
    sender: 'chef',
    senderName: 'Rahul Shinde',
    recipient: 'Manager',
    text: 'Equipment issue: Tandoor burner #2 gas line pressure is fluctuating',
    timestamp: '11:20 AM'
  },
  {
    id: 'msg-4',
    sender: 'manager',
    senderName: 'Manager',
    recipient: 'Rahul Shinde',
    text: 'Noted, kitchen maintenance team is scheduled to inspect in 15 minutes.',
    timestamp: '11:22 AM'
  }
];

const INITIAL_INVENTORY_REQUESTS: InventoryRequest[] = [
  {
    id: 'inv-1',
    ingredient: 'Tomatoes',
    level: 'Low',
    quantity: '15 Kg',
    notes: 'Urgent required for gravy base prep',
    status: 'APPROVED',
    requestedAt: '2026-07-02T09:15:00Z'
  },
  {
    id: 'inv-2',
    ingredient: 'Paneer Block',
    level: 'Very Low',
    quantity: '8 Kg',
    notes: 'To cover evening booking shifts',
    status: 'PENDING',
    requestedAt: '2026-07-03T11:40:00Z'
  },
  {
    id: 'inv-3',
    ingredient: 'Cooking Oil',
    level: 'Low',
    quantity: '20 Liters',
    notes: 'Regular replenishment',
    status: 'APPROVED',
    requestedAt: '2026-07-01T08:30:00Z'
  },
  {
    id: 'inv-4',
    ingredient: 'Amul Butter',
    level: 'Out of Stock',
    quantity: '5 Kg',
    notes: 'Critical for naan & dal makhani',
    status: 'REJECTED',
    requestedAt: '2026-07-02T16:10:00Z',
    rejectReason: 'Sufficient stock available in dry stores, check rack B4.'
  }
];

const INITIAL_WORK_HISTORY: WorkHistoryItem[] = [
  {
    id: 'wh-1',
    date: '2026-07-02',
    checkIn: '08:55 AM',
    checkOut: '06:05 PM',
    workingHours: '9h 10m',
    ordersCompleted: 28,
    avgCookingTime: '12.8 mins',
    performance: 4.9
  },
  {
    id: 'wh-2',
    date: '2026-07-01',
    checkIn: '09:02 AM',
    checkOut: '06:10 PM',
    workingHours: '9h 8m',
    ordersCompleted: 24,
    avgCookingTime: '13.5 mins',
    performance: 4.8
  },
  {
    id: 'wh-3',
    date: '2026-06-30',
    checkIn: '08:50 AM',
    checkOut: '06:00 PM',
    workingHours: '9h 10m',
    ordersCompleted: 32,
    avgCookingTime: '11.2 mins',
    performance: 5.0
  },
  {
    id: 'wh-4',
    date: '2026-06-29',
    checkIn: '08:58 AM',
    checkOut: '06:12 PM',
    workingHours: '9h 14m',
    ordersCompleted: 25,
    avgCookingTime: '14.1 mins',
    performance: 4.7
  }
];

const getDishEmoji = (name: string): string => {
  const lower = name.toLowerCase();
  if (lower.includes('paneer')) return '🍛';
  if (lower.includes('naan')) return '🫓';
  if (lower.includes('roti') || lower.includes('bread')) return '🫓';
  if (lower.includes('rice') || lower.includes('biryani')) return '🍚';
  if (lower.includes('dal') || lower.includes('curry')) return '🍲';
  if (lower.includes('manchurian') || lower.includes('noodle')) return '🍜';
  if (lower.includes('lassi') || lower.includes('mojito') || lower.includes('water') || lower.includes('drink') || lower.includes('beverage')) return '🥤';
  if (lower.includes('brownie') || lower.includes('ice cream') || lower.includes('cake') || lower.includes('dessert')) return '🍨';
  return '🍛';
};

export const KitchenDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Dynamic state helpers for auto-advancing attendance date
  const getAttendanceDate = (chefId: string): string => {
    let date = new Date();
    while (true) {
      const dateStr = date.toISOString().split('T')[0];
      const status = localStorage.getItem(`pos_chef_attendance_status_${chefId}_${dateStr}`);
      if (status !== 'CHECKED_OUT') {
        return dateStr;
      }
      date.setDate(date.getDate() + 1);
    }
  };

  const getStoredAttendanceStatus = (chefId: string, dateStr: string): 'CHECKED_IN' | 'CHECKED_OUT' | null => {
    return localStorage.getItem(`pos_chef_attendance_status_${chefId}_${dateStr}`) as 'CHECKED_IN' | 'CHECKED_OUT' | null;
  };

  const getStoredCheckInTime = (chefId: string, dateStr: string): string | null => {
    return localStorage.getItem(`pos_chef_attendance_checkin_${chefId}_${dateStr}`);
  };

  const getStoredCheckOutTime = (chefId: string, dateStr: string): string | null => {
    return localStorage.getItem(`pos_chef_attendance_checkout_${chefId}_${dateStr}`);
  };

  const getStoredWorkingHours = (chefId: string, dateStr: string): string => {
    return localStorage.getItem(`pos_chef_attendance_hours_${chefId}_${dateStr}`) || '';
  };

  // State Declarations
  const [loggedChef, setLoggedChef] = useState<ChefAccount>(() => {
    const raw = localStorage.getItem('pos_chef_logged_account');
    return raw ? JSON.parse(raw) : DEFAULT_CHEF;
  });

  const chefId = loggedChef.employeeId;
  const [nowTime, setNowTime] = useState(Date.now());
  const [activeTab, setActiveTab] = useState<'dashboard' | 'queue' | 'inventory' | 'leave' | 'messages' | 'profile' | 'performance' | 'history'>('dashboard');
  const [queueFilter, setQueueFilter] = useState<'ALL' | 'PENDING' | 'PREPARING' | 'READY' | 'DELAYED'>('ALL');

  // Attendance states
  const [activeDate, setActiveDate] = useState<string>(() => getAttendanceDate(chefId));
  const [attendanceStatus, setAttendanceStatus] = useState<'CHECKED_IN' | 'CHECKED_OUT' | null>(() => getStoredAttendanceStatus(chefId, getAttendanceDate(chefId)));
  const [checkInTime, setCheckInTime] = useState<string | null>(() => getStoredCheckInTime(chefId, getAttendanceDate(chefId)));
  const [checkOutTime, setCheckOutTime] = useState<string | null>(() => getStoredCheckOutTime(chefId, getAttendanceDate(chefId)));
  const [workingHoursToday, setWorkingHoursToday] = useState<string>(() => getStoredWorkingHours(chefId, getAttendanceDate(chefId)));

  // Interactive Lists
  const [kitchenOrders, setKitchenOrders] = useState<KitchenOrder[]>(() => {
    const raw = localStorage.getItem('pos_kitchen_orders_list');
    return raw ? JSON.parse(raw) : INITIAL_KITCHEN_ORDERS;
  });

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() => {
    const raw = localStorage.getItem('pos_chef_leave_requests');
    return raw ? JSON.parse(raw) : INITIAL_LEAVE_REQUESTS;
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const raw = localStorage.getItem('pos_chef_messages');
    return raw ? JSON.parse(raw) : INITIAL_MESSAGES;
  });

  const [inventoryRequests, setInventoryRequests] = useState<InventoryRequest[]>(() => {
    const raw = localStorage.getItem('pos_chef_inventory_requests');
    return raw ? JSON.parse(raw) : INITIAL_INVENTORY_REQUESTS;
  });

  const [workHistory, setWorkHistory] = useState<WorkHistoryItem[]>(() => {
    const raw = localStorage.getItem('pos_chef_work_history');
    return raw ? JSON.parse(raw) : INITIAL_WORK_HISTORY;
  });

  // Compose forms & detail models
  const [selectedRecipient, setSelectedRecipient] = useState('Kitchen Supervisor');
  const [msgText, setMsgText] = useState('');
  const [isTypingReply, setIsTypingReply] = useState(false);

  // Leave Form
  const [leaveType, setLeaveType] = useState('Paid Leave');
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [leaveReason, setLeaveReason] = useState('');

  // Inventory Request Form
  const [invIngredient, setInvIngredient] = useState('Tomatoes');
  const [invLevel, setInvLevel] = useState<'Low' | 'Very Low' | 'Out of Stock'>('Low');
  const [invQty, setInvQty] = useState('');
  const [invNotes, setInvNotes] = useState('');

  // Order Details Modal
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<KitchenOrder | null>(null);

  // Sound and Live Timer Sync
  useEffect(() => {
    const timer = setInterval(() => setNowTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync logged chef to user context if user info is available
  useEffect(() => {
    if (user) {
      const empName = user.employee?.name || user.name || 'Rahul Shinde';
      const updated = {
        ...loggedChef,
        name: empName,
        email: user.email || 'rahul.shinde@restaurant.com',
        employeeId: user.employee?.employeeId || 'CH-1045',
        designation: user.role === 'ADMIN' ? 'Chef Executive' : 'Sous Chef'
      };
      setLoggedChef(updated);
      localStorage.setItem('pos_chef_logged_account', JSON.stringify(updated));
    }
  }, [user]);

  // Persistent updates helper
  const saveOrders = (updated: KitchenOrder[]) => {
    setKitchenOrders(updated);
    localStorage.setItem('pos_kitchen_orders_list', JSON.stringify(updated));
  };

  const saveLeaveRequests = (updated: LeaveRequest[]) => {
    setLeaveRequests(updated);
    localStorage.setItem('pos_chef_leave_requests', JSON.stringify(updated));
  };

  const saveMessages = (updated: ChatMessage[]) => {
    setMessages(updated);
    localStorage.setItem('pos_chef_messages', JSON.stringify(updated));
  };

  const saveInventoryRequests = (updated: InventoryRequest[]) => {
    setInventoryRequests(updated);
    localStorage.setItem('pos_chef_inventory_requests', JSON.stringify(updated));
  };

  // ==================== WORKFLOWS: ATTENDANCE ====================

  const handleCheckIn = () => {
    const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    
    const keyStatus = `pos_chef_attendance_status_${chefId}_${activeDate}`;
    const keyIn = `pos_chef_attendance_checkin_${chefId}_${activeDate}`;
    const keyHours = `pos_chef_attendance_hours_${chefId}_${activeDate}`;

    localStorage.setItem(keyStatus, 'CHECKED_IN');
    localStorage.setItem(keyIn, timeStr);
    localStorage.setItem(keyHours, '0h 0m');

    setAttendanceStatus('CHECKED_IN');
    setCheckInTime(timeStr);
    setWorkingHoursToday('0h 0m');

    const updated: ChefAccount = { ...loggedChef, status: 'ON_DUTY' };
    setLoggedChef(updated);
    localStorage.setItem('pos_chef_logged_account', JSON.stringify(updated));
  };

  const handleCheckOut = () => {
    const timeOutStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    
    let hoursFormatted = '8h 0m';
    if (checkInTime) {
      try {
        const [inHourMin, inAmPm] = checkInTime.split(' ');
        const [inH, inM] = inHourMin.split(':').map(Number);
        let checkInHours = inAmPm === 'PM' && inH !== 12 ? inH + 12 : inH;
        if (inAmPm === 'AM' && inH === 12) checkInHours = 0;

        const dateNow = new Date();
        const checkInDate = new Date();
        checkInDate.setHours(checkInHours, inM, 0, 0);

        const diffMs = dateNow.getTime() - checkInDate.getTime();
        const totalMinutes = Math.max(10, Math.floor(diffMs / 60000));
        const hrs = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        hoursFormatted = `${hrs}h ${mins}m`;
      } catch (err) {
        hoursFormatted = '8h 20m';
      }
    }

    const keyStatus = `pos_chef_attendance_status_${chefId}_${activeDate}`;
    const keyOut = `pos_chef_attendance_checkout_${chefId}_${activeDate}`;
    const keyHours = `pos_chef_attendance_hours_${chefId}_${activeDate}`;

    localStorage.setItem(keyStatus, 'CHECKED_OUT');
    localStorage.setItem(keyOut, timeOutStr);
    localStorage.setItem(keyHours, hoursFormatted);

    const completedCount = kitchenOrders.filter(o => o.status === 'READY' || o.status === 'SERVED').length;
    const historyRecord: WorkHistoryItem = {
      id: `wh-${Date.now()}`,
      date: activeDate,
      checkIn: checkInTime || '09:00 AM',
      checkOut: timeOutStr,
      workingHours: hoursFormatted,
      ordersCompleted: completedCount || 22,
      avgCookingTime: '12.5 mins',
      performance: 4.9
    };

    const newHistory = [historyRecord, ...workHistory];
    setWorkHistory(newHistory);
    localStorage.setItem('pos_chef_work_history', JSON.stringify(newHistory));

    const updated: ChefAccount = { ...loggedChef, status: 'CHECKED_OUT' };
    setLoggedChef(updated);
    localStorage.setItem('pos_chef_logged_account', JSON.stringify(updated));

    const nextDate = getAttendanceDate(chefId);
    setActiveDate(nextDate);
    setAttendanceStatus(null);
    setCheckInTime(null);
    setCheckOutTime(null);
    setWorkingHoursToday('0h 0m');
  };

  // ==================== WORKFLOWS: KITCHEN OPERATIONS ====================

  const handleStartCookingItem = (orderId: string, dishId: string) => {
    const updated = kitchenOrders.map(order => {
      if (order.id === orderId) {
        const updatedItems = order.items.map(dish => {
          if (dish.id === dishId) {
            return {
              ...dish,
              status: 'PREPARING' as const,
              progress: 50
            };
          }
          return dish;
        });

        let newOrderStatus = order.status;
        if (order.status === 'PENDING') {
          newOrderStatus = 'PREPARING';
        }

        return {
          ...order,
          status: newOrderStatus,
          items: updatedItems
        };
      }
      return order;
    });

    saveOrders(updated);
    if (selectedOrderDetails?.id === orderId) {
      const match = updated.find(o => o.id === orderId);
      if (match) setSelectedOrderDetails(match);
    }
  };

  const handleMarkItemReady = (orderId: string, dishId: string) => {
    const updated = kitchenOrders.map(order => {
      if (order.id === orderId) {
        const updatedItems = order.items.map(dish => {
          if (dish.id === dishId) {
            return {
              ...dish,
              status: 'READY' as const,
              progress: 100
            };
          }
          return dish;
        });

        const allReady = updatedItems.every(dish => dish.status === 'READY');
        const newOrderStatus = allReady ? ('READY' as const) : order.status;

        return {
          ...order,
          status: newOrderStatus,
          items: updatedItems
        };
      }
      return order;
    });

    saveOrders(updated);
    if (selectedOrderDetails?.id === orderId) {
      const match = updated.find(o => o.id === orderId);
      if (match) setSelectedOrderDetails(match);
    }
  };

  const handleStartCookingOrder = (orderId: string) => {
    const updated = kitchenOrders.map(order => {
      if (order.id === orderId) {
        const updatedItems = order.items.map(dish => {
          if (dish.status === 'PENDING' || dish.status === 'ACCEPTED') {
            return {
              ...dish,
              status: 'PREPARING' as const,
              progress: 50
            };
          }
          return dish;
        });

        return {
          ...order,
          status: 'PREPARING' as const,
          items: updatedItems
        };
      }
      return order;
    });

    saveOrders(updated);
    if (selectedOrderDetails?.id === orderId) {
      const match = updated.find(o => o.id === orderId);
      if (match) setSelectedOrderDetails(match);
    }
  };

  const handleMarkOrderReady = (orderId: string) => {
    const updated = kitchenOrders.map(order => {
      if (order.id === orderId) {
        const updatedItems = order.items.map(dish => ({
          ...dish,
          status: 'READY' as const,
          progress: 100
        }));

        return {
          ...order,
          status: 'READY' as const,
          items: updatedItems
        };
      }
      return order;
    });

    saveOrders(updated);
    if (selectedOrderDetails?.id === orderId) {
      const match = updated.find(o => o.id === orderId);
      if (match) setSelectedOrderDetails(match);
    }
  };

  const handleAcceptOrder = (orderId: string) => {
    const updated = kitchenOrders.map(order => {
      if (order.id === orderId) {
        const updatedItems = order.items.map(dish => {
          if (dish.status === 'PENDING') {
            return { ...dish, status: 'ACCEPTED' as const, progress: 20 };
          }
          return dish;
        });

        return {
          ...order,
          status: 'PREPARING' as const,
          items: updatedItems
        };
      }
      return order;
    });

    saveOrders(updated);
    if (selectedOrderDetails?.id === orderId) {
      const match = updated.find(o => o.id === orderId);
      if (match) setSelectedOrderDetails(match);
    }
  };

  const handleClearOrderFromQueue = (orderId: string) => {
    const updated = kitchenOrders.map(order => {
      if (order.id === orderId) {
        return {
          ...order,
          status: 'SERVED' as const
        };
      }
      return order;
    });
    saveOrders(updated);
    setSelectedOrderDetails(null);
  };

  // ==================== WORKFLOWS: LEAVE & MESSAGES & INVENTORY ====================

  const handleApplyLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveStart || !leaveEnd || !leaveReason.trim()) {
      alert('Please fill out all leave fields.');
      return;
    }

    const newRequest: LeaveRequest = {
      id: `LV-${Math.floor(100 + Math.random() * 900)}`,
      leaveType,
      startDate: leaveStart,
      endDate: leaveEnd,
      reason: leaveReason,
      status: 'PENDING',
      requestedAt: new Date().toISOString()
    };

    const updated = [newRequest, ...leaveRequests];
    saveLeaveRequests(updated);

    setLeaveStart('');
    setLeaveEnd('');
    setLeaveReason('');
    alert('Leave request submitted to Manager/Admin.');
  };

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgText.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'chef',
      senderName: loggedChef.name,
      recipient: selectedRecipient,
      text: msgText,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    };

    const updated = [...messages, userMsg];
    saveMessages(updated);
    setMsgText('');

    setIsTypingReply(true);
    setTimeout(() => {
      const supervisorReplies = [
        "On it, checking the dry store rack for ingredient shortage.",
        "Yes, the request is received. Will fetch it in a few minutes.",
        "Please submit an inventory request form so I can approve it on the ledger.",
        "Understood, dispatching staff to assist."
      ];
      const managerReplies = [
        "Technician is alerted, they are on their way to examine the burner gas lines.",
        "Leave requests will be evaluated by tonight's shift end.",
        "I will assign additional staff support to Indian section shortly.",
        "Good work in completing peak hours order load."
      ];

      const repliesPool = selectedRecipient === 'Manager' ? managerReplies : supervisorReplies;
      const textReply = repliesPool[Math.floor(Math.random() * repliesPool.length)];

      const systemReply: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: selectedRecipient === 'Manager' ? 'manager' : 'supervisor',
        senderName: selectedRecipient,
        recipient: loggedChef.name,
        text: textReply,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
      };

      saveMessages([...updated, systemReply]);
      setIsTypingReply(false);
    }, 1500);
  };

  const handleSelectQuickMessage = (text: string) => {
    setMsgText(text);
  };

  const handleSubmitInventoryRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invQty.trim()) {
      alert('Please specify the required quantity.');
      return;
    }

    const unit = invIngredient === 'Cooking Oil' || invIngredient === 'Milk' ? 'Liters' : 'Kg';
    const newRequest: InventoryRequest = {
      id: `inv-${Date.now()}`,
      ingredient: invIngredient,
      level: invLevel,
      quantity: `${invQty} ${unit}`,
      notes: invNotes.trim() ? invNotes : null,
      status: 'PENDING',
      requestedAt: new Date().toISOString()
    };

    const updated = [newRequest, ...inventoryRequests];
    saveInventoryRequests(updated);

    setInvQty('');
    setInvNotes('');
    alert(`Inventory request for ${invIngredient} successfully submitted.`);
  };

  // ==================== ANALYTICS & INSIGHT CALCULATIONS ====================

  const activeOrders = kitchenOrders.filter(o => o.status !== 'SERVED');
  
  const columnNew = activeOrders.filter(o => o.status === 'PENDING');
  const columnPreparing = activeOrders.filter(o => o.status === 'PREPARING');
  const columnReady = activeOrders.filter(o => o.status === 'READY');

  const preparingOrdersCount = columnPreparing.length;
  const readyOrdersCount = columnReady.length;
  const completedOrdersCount = kitchenOrders.filter(o => o.status === 'SERVED').length;

  const delayedOrdersCount = activeOrders.filter(order => {
    const elapsedMinutes = Math.floor((nowTime - order.orderReceivedTime) / 60000);
    return elapsedMinutes > order.estimatedPrepTime;
  }).length;

  const filteredQueueOrders = activeOrders.filter(order => {
    if (queueFilter === 'PENDING') return order.status === 'PENDING';
    if (queueFilter === 'PREPARING') return order.status === 'PREPARING';
    if (queueFilter === 'READY') return order.status === 'READY';
    if (queueFilter === 'DELAYED') {
      const elapsedMinutes = Math.floor((nowTime - order.orderReceivedTime) / 60000);
      return elapsedMinutes > order.estimatedPrepTime;
    }
    return true;
  });

  return (
    <div className="space-y-6 text-slate-900 max-w-7xl mx-auto p-4 select-none min-h-screen pb-16" style={{ fontFamily: "'Inter', sans-serif" }}>
      
      {/* 1. KITCHEN BANNER HEADER */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 text-slate-900 shadow-xs relative overflow-hidden text-left">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1 text-left">
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-slate-900">
              Good Morning, Kitchen Team 👨‍🍳
            </h1>
            <p className="text-slate-500 font-normal text-xs mt-1">
              Today's Kitchen Summary: <span className="font-semibold text-slate-700">{activeOrders.length} Active Orders</span> • <span className="font-semibold text-slate-700">{preparingOrdersCount} Preparing</span> • <span className="font-semibold text-slate-700">{readyOrdersCount} Ready</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-stretch md:self-auto justify-between md:justify-end">
            {/* System Date */}
            <div className="bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-xl text-left flex items-center gap-2 shadow-xs text-slate-700">
              <CalendarIcon className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-semibold">
                {new Date(nowTime).toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
              </span>
            </div>

            {/* System Time */}
            <div className="bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-xl text-left flex items-center gap-2 shadow-xs text-slate-700">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-semibold font-mono">
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
        workingHours={workingHoursToday}
        shiftName={loggedChef.shiftTiming}
        nowTime={nowTime}
        onCheckIn={handleCheckIn}
        onCheckOut={handleCheckOut}
      />

      {/* 2. COMPACT CHEF INFORMATION GRID */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Card 1: Employee ID */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs text-left relative overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between min-h-[105px]">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-400"></div>
          <div className="flex justify-between items-start gap-1">
            <span className="text-[10px] uppercase font-normal text-slate-550 tracking-wider">Employee ID</span>
            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </div>
          <span className="text-xs font-normal text-slate-900 mt-2 font-mono">{loggedChef.employeeId}</span>
        </div>

        {/* Card 2: Shift Timing */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs text-left relative overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between min-h-[105px]">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
          <div className="flex justify-between items-start gap-1">
            <span className="text-[10px] uppercase font-normal text-slate-550 tracking-wider">Shift Timing</span>
            <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          </div>
          <span className="text-xs font-normal text-slate-900 mt-2">{loggedChef.shiftTiming}</span>
        </div>

        {/* Card 3: Kitchen Assignment */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs text-left relative overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between min-h-[105px]">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500"></div>
          <div className="flex justify-between items-start gap-1">
            <span className="text-[10px] uppercase font-normal text-slate-550 tracking-wider">Kitchen Assignment</span>
            <Utensils className="w-3.5 h-3.5 text-purple-500 shrink-0" />
          </div>
          <span className="text-xs font-normal text-slate-900 mt-2 leading-tight">{loggedChef.assignedKitchen}</span>
        </div>

        {/* Card 4: Working Hours */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs text-left relative overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between min-h-[105px]">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500"></div>
          <div className="flex justify-between items-start gap-1">
            <span className="text-[10px] uppercase font-normal text-slate-550 tracking-wider">Working Hours</span>
            <TrendingUp className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          </div>
          <span className="text-xs font-normal text-slate-900 mt-2">
            {attendanceStatus === 'CHECKED_IN' ? workingHoursToday || '5h 40m' : (attendanceStatus as any) === 'CHECKED_OUT' ? workingHoursToday : '5h 40m'}
          </span>
        </div>

        {/* Card 5: Attendance Rating */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs text-left relative overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between min-h-[105px]">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-pink-500"></div>
          <div className="flex justify-between items-start gap-1">
            <span className="text-[10px] uppercase font-normal text-slate-555 tracking-wider">Attendance</span>
            <CalendarIcon className="w-3.5 h-3.5 text-pink-500 shrink-0" />
          </div>
          <span className="text-xs font-normal text-slate-900 mt-2">
            {loggedChef.attendancePercent}% Rating
          </span>
        </div>

        {/* Card 6: Performance Score */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs text-left relative overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between min-h-[105px]">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>
          <div className="flex justify-between items-start gap-1">
            <span className="text-[10px] uppercase font-normal text-slate-555 tracking-wider">Performance Score</span>
            <ChefHat className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          </div>
          <span className="text-xs font-normal text-slate-900 mt-2 flex items-center gap-1">
            <span>{loggedChef.performanceRating} / 5.0 ★</span>
          </span>
        </div>
      </div>

      {/* NAVIGATION TABS SECTION */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* Left Navigation Sidebar - Exact layout from WaiterDashboard */}
        <div className="w-full lg:w-60 bg-white rounded-2xl border border-slate-200 p-4 shrink-0 space-y-1 shadow-xs">
          <div className="text-[10px] font-normal text-slate-500 uppercase tracking-wider px-3 mb-2.5 block text-left">Navigation</div>
          
          <div className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible gap-1 pb-2 lg:pb-0 scrollbar-none">
            {[
              { id: 'dashboard', label: 'Overview Dashboard', icon: Utensils },
              { id: 'queue', label: 'My Kitchen Queue', icon: ChefHat, badge: activeOrders.length },
              { id: 'inventory', label: 'Inventory Requests', icon: ShoppingBag, badge: inventoryRequests.filter(r => r.status === 'PENDING').length },
              { id: 'leave', label: 'Leave Requests', icon: FileText, badge: leaveRequests.filter(l => l.status === 'PENDING').length },
              { id: 'messages', label: 'Message Center', icon: MessageSquare },
              { id: 'profile', label: 'Staff Profile', icon: User },
              { id: 'performance', label: 'Performance Analytics', icon: TrendingUp },
              { id: 'history', label: 'Work History', icon: History }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full py-2.5 px-3 rounded-xl flex items-center justify-between font-semibold text-xs cursor-pointer transition text-left shrink-0 lg:shrink-1 ${
                  activeTab === tab.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'hover:bg-slate-50 text-slate-650 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <tab.icon className="w-4 h-4" />
                  <span className="whitespace-nowrap">{tab.label}</span>
                </div>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                    activeTab === tab.id ? 'bg-white text-emerald-600' : 'bg-slate-105 text-slate-700'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}

            <div className="pt-2 border-t border-slate-100 mt-2 hidden lg:block">
              {attendanceStatus === 'CHECKED_IN' ? (
                <button
                  onClick={handleCheckOut}
                  className="w-full py-2.5 px-3 rounded-xl flex items-center gap-2 font-semibold text-xs text-rose-600 hover:bg-rose-50 cursor-pointer transition text-left"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Shift Check-Out</span>
                </button>
              ) : (attendanceStatus as any) === 'CHECKED_OUT' ? (
                <div className="w-full py-2.5 px-3 rounded-xl flex items-center gap-2 font-semibold text-xs text-slate-400 bg-slate-50 border border-slate-200/60">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                  <span>Shift Completed</span>
                </div>
              ) : (
                <div className="w-full py-2.5 px-3 rounded-xl flex items-center gap-2 font-semibold text-xs text-amber-600 bg-amber-50/50 border border-amber-100/50">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
                  <span>Awaiting Check-In</span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 mt-2 w-full">
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="w-full py-2.5 px-3 rounded-xl flex items-center gap-2 font-semibold text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 cursor-pointer transition text-left"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout Session</span>
              </button>
            </div>
          </div>
        </div>

        {/* MAIN VIEWPORT PANELS */}
        <div className="flex-1 w-full space-y-6">

          {/* TAB 1: OVERVIEW DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
              
              {/* Main Content Area (Left 3 Columns) */}
              <div className="xl:col-span-3 space-y-6">
                
                {/* Compact Premium KPI Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  {[
                    { 
                      label: 'Active Orders', 
                      val: `${activeOrders.length} KOTs`, 
                      desc: 'Total active tickets', 
                      icon: ChefHat, 
                      iconColor: 'text-slate-500', 
                      tab: 'queue',
                      filter: 'ALL'
                    },
                    { 
                      label: 'Preparing', 
                      val: `${preparingOrdersCount} Orders`, 
                      desc: 'Currently cooking', 
                      icon: Clock, 
                      iconColor: 'text-slate-500', 
                      tab: 'queue',
                      filter: 'PREPARING'
                    },
                    { 
                      label: 'Ready', 
                      val: `${readyOrdersCount} Orders`, 
                      desc: 'Awaiting pickup', 
                      icon: CheckCircle2, 
                      iconColor: 'text-slate-500', 
                      tab: 'queue',
                      filter: 'READY'
                    },
                    { 
                      label: 'Completed Today', 
                      val: `${completedOrdersCount} KOTs`, 
                      desc: 'Served this shift', 
                      icon: CheckCircle, 
                      iconColor: 'text-slate-500', 
                      tab: 'history',
                      filter: 'ALL'
                    },
                    { 
                      label: 'Delayed Orders', 
                      val: `${delayedOrdersCount} KOTs`, 
                      desc: 'Over limit target', 
                      icon: AlertTriangle, 
                      iconColor: 'text-slate-555', 
                      tab: 'queue',
                      filter: 'DELAYED'
                    }
                  ].map((card, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => {
                        setActiveTab(card.tab as any);
                        if (card.tab === 'queue') {
                          setQueueFilter(card.filter as any);
                        }
                      }}
                      className="bg-white p-4 rounded-2xl border border-slate-200 text-left shadow-xs flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition-all duration-200 hover:-translate-y-0.5 min-h-[110px] cursor-pointer group w-full"
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] uppercase font-semibold text-slate-450 block tracking-wider">{card.label}</span>
                        <div className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-slate-100 transition-colors">
                          <card.icon className={`w-3.5 h-3.5 ${card.iconColor}`} />
                        </div>
                      </div>
                      <div className="mt-2 space-y-0.5">
                        <h4 className="text-base font-semibold text-slate-900 leading-none tracking-tight">{card.val}</h4>
                        <p className="text-[9px] text-slate-400 font-normal">{card.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Professional Kitchen Board (Kanban workspace) */}
                <div className="space-y-4">
                  <div className="border-b border-slate-200 pb-3 text-left">
                    <h3 className="text-xs font-semibold text-slate-555 uppercase tracking-wider">Kitchen Workspace</h3>
                    <p className="text-[11px] text-slate-450 font-normal mt-0.5">Real-time commercial kitchen KOT flow board.</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                    
                    {/* Column 1: New Orders */}
                    <div className="bg-slate-50/40 border border-slate-200 rounded-2xl p-4 flex flex-col h-[720px] text-left">
                      <div className="flex justify-between items-center pb-3 border-b border-slate-200 mb-4 shrink-0">
                        <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                          <span>New Orders</span>
                        </h3>
                        <span className="bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md text-[10px] font-semibold">
                          {columnNew.length}
                        </span>
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-slate-200">
                        {columnNew.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs italic py-12">
                            No new tickets.
                          </div>
                        ) : (
                          columnNew.map(order => (
                            <KitchenOrderCard
                              key={order.id}
                              order={order}
                              nowTime={nowTime}
                              onAccept={() => handleAcceptOrder(order.id)}
                              onStartCooking={() => handleStartCookingOrder(order.id)}
                              onMarkReady={() => handleMarkOrderReady(order.id)}
                              onStartCookingItem={(dishId) => handleStartCookingItem(order.id, dishId)}
                              onMarkItemReady={(dishId) => handleMarkItemReady(order.id, dishId)}
                              onViewDetails={() => setSelectedOrderDetails(order)}
                            />
                          ))
                        )}
                      </div>
                    </div>

                    {/* Column 2: Preparing */}
                    <div className="bg-slate-50/40 border border-slate-200 rounded-2xl p-4 flex flex-col h-[720px] text-left">
                      <div className="flex justify-between items-center pb-3 border-b border-slate-200 mb-4 shrink-0">
                        <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                          <span>Preparing</span>
                        </h3>
                        <span className="bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md text-[10px] font-semibold">
                          {columnPreparing.length}
                        </span>
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-slate-200">
                        {columnPreparing.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs italic py-12">
                            No orders preparing.
                          </div>
                        ) : (
                          columnPreparing.map(order => (
                            <KitchenOrderCard
                              key={order.id}
                              order={order}
                              nowTime={nowTime}
                              onAccept={() => handleAcceptOrder(order.id)}
                              onStartCooking={() => handleStartCookingOrder(order.id)}
                              onMarkReady={() => handleMarkOrderReady(order.id)}
                              onStartCookingItem={(dishId) => handleStartCookingItem(order.id, dishId)}
                              onMarkItemReady={(dishId) => handleMarkItemReady(order.id, dishId)}
                              onViewDetails={() => setSelectedOrderDetails(order)}
                            />
                          ))
                        )}
                      </div>
                    </div>

                    {/* Column 3: Ready for Pickup */}
                    <div className="bg-slate-50/40 border border-slate-200 rounded-2xl p-4 flex flex-col h-[720px] text-left">
                      <div className="flex justify-between items-center pb-3 border-b border-slate-200 mb-4 shrink-0">
                        <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                          <span>Ready for Pickup</span>
                        </h3>
                        <span className="bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md text-[10px] font-semibold">
                          {columnReady.length}
                        </span>
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-slate-200">
                        {columnReady.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs italic py-12">
                            No ready tickets.
                          </div>
                        ) : (
                          columnReady.map(order => (
                            <KitchenOrderCard
                              key={order.id}
                              order={order}
                              nowTime={nowTime}
                              onAccept={() => handleAcceptOrder(order.id)}
                              onStartCooking={() => handleStartCookingOrder(order.id)}
                              onMarkReady={() => handleMarkOrderReady(order.id)}
                              onStartCookingItem={(dishId) => handleStartCookingItem(order.id, dishId)}
                              onMarkItemReady={(dishId) => handleMarkItemReady(order.id, dishId)}
                              onViewDetails={() => setSelectedOrderDetails(order)}
                            />
                          ))
                        )}
                      </div>
                    </div>

                  </div>
                </div>

                {/* Redesigned Quick Actions Section */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs text-left space-y-4">
                  <h3 className="text-xs font-semibold text-slate-555 uppercase tracking-wider">Quick Actions</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
                    {[
                      { label: 'Kitchen Queue', desc: 'Order ticket line', tab: 'queue', icon: ChefHat },
                      { label: 'Inventory Request', desc: 'Store room request', tab: 'inventory', icon: ShoppingBag },
                      { label: 'Messages', desc: 'Staff chat logs', tab: 'messages', icon: MessageSquare },
                      { label: 'Leave Request', desc: 'Apply time-off', tab: 'leave', icon: FileText },
                      { label: 'Attendance Log', desc: 'Clock-in & history', tab: 'history', icon: CalendarIcon },
                      { label: 'Staff Profile', desc: 'Staff account details', tab: 'profile', icon: User },
                      { label: 'Work History', desc: 'Shift & work logs', tab: 'history', icon: History }
                    ].map((act, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setActiveTab(act.tab as any);
                          if (act.label === 'Kitchen Queue') {
                            setQueueFilter('ALL');
                          }
                        }}
                        className="h-20 p-3 border border-slate-200 rounded-xl flex flex-col items-center justify-center gap-1.5 transition text-center cursor-pointer bg-white hover:bg-slate-50 hover:border-slate-350 hover:shadow-xs group w-full"
                      >
                        <act.icon className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                        <span className="text-[10px] font-semibold text-slate-700 block truncate max-w-full leading-tight">{act.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Professional Side Panel (Right Sidebar) */}
              <div className="xl:col-span-1 space-y-6">
                
                {/* 1. Kitchen Staff On Duty */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs text-left space-y-3">
                  <h4 className="text-[10px] font-semibold text-slate-555 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Kitchen Staff On Duty</span>
                  </h4>
                  <div className="space-y-2">
                    {[
                      { name: 'Amit Jadhav', role: 'Kitchen Staff', status: 'ON_DUTY' },
                      { name: 'Rahul Shinde', role: 'Chef de Partie', status: 'ON_DUTY' },
                      { name: 'Priya Sharma', role: 'Commis Chef', status: 'ON_DUTY' },
                      { name: 'Vikas Kumar', role: 'Prep Assistant', status: 'ON_DUTY' }
                    ].map((staff, sIdx) => (
                      <button
                        key={sIdx}
                        onClick={() => setActiveTab('profile')}
                        className="w-full flex items-center justify-between text-left hover:bg-slate-50 p-1.5 rounded-lg transition cursor-pointer"
                      >
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-slate-805 block truncate">{staff.name}</span>
                          <span className="text-[9px] text-slate-400 block font-normal">{staff.role}</span>
                        </div>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Active Stations */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs text-left space-y-3">
                  <h4 className="text-[10px] font-semibold text-slate-555 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    <Activity className="w-3.5 h-3.5 text-slate-400" />
                    <span>Active Stations</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { name: 'Tandoor Oven', load: 'High Load', color: 'border-amber-200 bg-amber-50/30 text-amber-700' },
                      { name: 'Main Range', load: 'Medium Load', color: 'border-blue-200 bg-blue-50/30 text-blue-700' },
                      { name: 'Dessert Bar', load: 'Idle', color: 'border-slate-150 bg-slate-50/40 text-slate-500' },
                      { name: 'Pantry Prep', load: 'Idle', color: 'border-slate-150 bg-slate-50/40 text-slate-500' }
                    ].map((station, stIdx) => (
                      <div key={stIdx} className={`p-2 border rounded-xl space-y-0.5 text-left ${station.color}`}>
                        <span className="text-[10px] font-semibold block truncate leading-tight">{station.name}</span>
                        <span className="text-[9px] block font-normal opacity-90">{station.load}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Ingredient Alerts */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs text-left space-y-3">
                  <h4 className="text-[10px] font-semibold text-slate-555 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-slate-400" />
                    <span>Ingredient Alerts</span>
                  </h4>
                  <div className="space-y-2">
                    {[
                      { name: 'Tomatoes', status: 'Out of Stock', level: 'Out of Stock', color: 'text-rose-600 bg-rose-50 border-rose-100' },
                      { name: 'Paneer', status: 'Very Low (2kg)', level: 'Very Low', color: 'text-amber-600 bg-amber-50 border-amber-100' },
                      { name: 'Heavy Cream', status: 'Low (1.5L)', level: 'Low', color: 'text-blue-600 bg-blue-50 border-blue-105' }
                    ].map((item, iIdx) => (
                      <button
                        key={iIdx}
                        onClick={() => {
                          setActiveTab('inventory');
                          setInvIngredient(item.name);
                          setInvLevel(item.level as any);
                        }}
                        className={`w-full flex items-center justify-between text-left hover:opacity-90 p-2 border rounded-xl transition cursor-pointer ${item.color}`}
                      >
                        <span className="text-xs font-semibold">{item.name}</span>
                        <span className="text-[8px] font-semibold uppercase px-1.5 py-0.5 rounded-full bg-white/80 border shrink-0">{item.status}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Today's Performance */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs text-left space-y-3">
                  <h4 className="text-[10px] font-semibold text-slate-555 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
                    <span>Today's Performance</span>
                  </h4>
                  <button
                    onClick={() => setActiveTab('performance')}
                    className="w-full flex gap-3 items-center p-2.5 hover:bg-slate-50 border border-slate-200 rounded-xl transition text-left cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                      <ChefHat className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-semibold text-slate-805 block">Amit Jadhav</span>
                      <span className="text-[9px] text-slate-450 block font-normal mt-0.5">Rating: {loggedChef.performanceRating} / 5.0 ★ • {completedOrdersCount} tickets closed</span>
                    </div>
                  </button>
                </div>

                {/* 5. Pending Requests */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs text-left space-y-3">
                  <h4 className="text-[10px] font-semibold text-slate-555 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>Pending Requests</span>
                  </h4>
                  <div className="space-y-2">
                    {inventoryRequests.slice(0, 2).map((req) => (
                      <button
                        key={req.id}
                        onClick={() => setActiveTab('inventory')}
                        className="w-full text-left p-2.5 hover:bg-slate-50 border border-slate-200 rounded-xl transition cursor-pointer block"
                      >
                        <div className="flex justify-between items-start gap-1">
                          <span className="text-xs font-semibold text-slate-800 block truncate">{req.ingredient}</span>
                          <span className="bg-slate-100 text-slate-655 px-1.5 py-0.2 rounded-md text-[8px] font-semibold shrink-0 uppercase tracking-wider">{req.status}</span>
                        </div>
                        <span className="text-[9px] text-slate-400 block font-normal mt-1">Requested Qty: {req.quantity}</span>
                      </button>
                    ))}
                    {inventoryRequests.filter(r => r.status === 'PENDING').length === 0 && (
                      <div className="text-[10px] text-slate-400 italic text-center py-2">No pending requests</div>
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: FULL KITCHEN QUEUE */}
          {activeTab === 'queue' && (
            <div className="space-y-4 text-left">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h2 className="text-xs font-semibold text-slate-555 uppercase tracking-wider">My Kitchen Queue</h2>
                  <p className="text-[11px] text-slate-450 font-normal mt-0.5">Real-time orders currently being prepared in the kitchen.</p>
                </div>
                <span className="text-[10px] font-normal px-3 py-1 bg-white border border-slate-200 rounded-lg text-slate-700">
                  Active KOTs: {activeOrders.length}
                </span>
              </div>

              {/* Queue Filter Bar */}
              <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-3">
                {[
                  { id: 'ALL', label: 'All Orders', count: activeOrders.length },
                  { id: 'PENDING', label: 'New', count: columnNew.length },
                  { id: 'PREPARING', label: 'Preparing', count: columnPreparing.length },
                  { id: 'READY', label: 'Ready', count: columnReady.length },
                  { id: 'DELAYED', label: 'Delayed', count: delayedOrdersCount }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setQueueFilter(f.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
                      queueFilter === f.id
                        ? 'bg-emerald-600 border-emerald-500 text-white shadow-xs'
                        : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50'
                    }`}
                  >
                    <span>{f.label}</span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-full ${
                      queueFilter === f.id ? 'bg-emerald-700/60 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {f.count}
                    </span>
                  </button>
                ))}
              </div>

              {filteredQueueOrders.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3 shadow-xs">
                  <ChefHat className="w-10 h-10 text-slate-300 mx-auto animate-bounce" />
                  <h3 className="text-xs font-normal text-slate-850">No Orders matching filter</h3>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto">There are no orders in the queue with this status filter.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredQueueOrders.map(order => (
                    <KitchenOrderCard
                      key={order.id}
                      order={order}
                      nowTime={nowTime}
                      onAccept={() => handleAcceptOrder(order.id)}
                      onStartCooking={() => handleStartCookingOrder(order.id)}
                      onMarkReady={() => handleMarkOrderReady(order.id)}
                      onStartCookingItem={(dishId) => handleStartCookingItem(order.id, dishId)}
                      onMarkItemReady={(dishId) => handleMarkItemReady(order.id, dishId)}
                      onViewDetails={() => setSelectedOrderDetails(order)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: INVENTORY REQUESTS */}
          {activeTab === 'inventory' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
              
              {/* Request Form */}
              <div className="lg:col-span-1 space-y-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                  <h3 className="text-xs font-semibold text-slate-555 uppercase tracking-wider block">Request Ingredients</h3>
                  
                  <form onSubmit={handleSubmitInventoryRequest} className="space-y-4 text-xs font-normal">
                    <div>
                      <label className="text-[10px] font-normal text-slate-500 uppercase block mb-1">Select Ingredient *</label>
                      <select
                        value={invIngredient}
                        onChange={(e) => setInvIngredient(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-normal focus:outline-none focus:border-emerald-600 cursor-pointer h-10"
                      >
                        {['Tomatoes', 'Onions', 'Cheddar Cheese', 'Paneer Block', 'Cooking Oil', 'Cow Milk', 'Amul Butter', 'Basmati Rice'].map((ing, idx) => (
                          <option key={idx} value={ing}>{ing}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-normal text-slate-500 uppercase block mb-1">Current Store Level</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['Low', 'Very Low', 'Out of Stock'].map((level) => (
                          <button
                            key={level}
                            type="button"
                            onClick={() => setInvLevel(level as any)}
                            className={`py-1.5 px-2 border rounded-xl text-[10px] font-semibold transition-all cursor-pointer h-9 ${
                              invLevel === level
                                ? 'bg-emerald-600 text-white border-emerald-500'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-normal text-slate-500 uppercase block mb-1">Request Quantity *</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          required
                          min="1"
                          placeholder="e.g. 10"
                          value={invQty}
                          onChange={(e) => setInvQty(e.target.value)}
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-normal focus:outline-none focus:border-emerald-600 h-10"
                        />
                        <span className="bg-slate-100 border border-slate-200 px-4 py-2 rounded-xl text-slate-550 font-semibold flex items-center shrink-0 h-10">
                          {invIngredient === 'Cooking Oil' || invIngredient === 'Milk' ? 'Liters' : 'Kg'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-normal text-slate-500 uppercase block mb-1">Special Notes</label>
                      <textarea
                        placeholder="Urgency detail..."
                        value={invNotes}
                        onChange={(e) => setInvNotes(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-normal focus:outline-none focus:border-emerald-600 h-20 resize-none"
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold uppercase rounded-xl tracking-wider cursor-pointer active:scale-95 transition border border-emerald-500 h-10 shadow-sm shadow-emerald-600/10"
                    >
                      Submit Request
                    </button>
                  </form>
                </div>
              </div>

              {/* Request History */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                  <h3 className="text-xs font-semibold text-slate-555 uppercase tracking-wider mb-4 block">Request History Ledger</h3>

                  {inventoryRequests.length === 0 ? (
                    <p className="text-xs text-slate-450 italic text-center py-8">No requests logged yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-slate-600 border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-450 uppercase font-semibold text-[9px] tracking-wider text-left">
                            <th className="pb-2.5 font-semibold">Date</th>
                            <th className="pb-2.5 font-semibold">Ingredient</th>
                            <th className="pb-2.5 font-semibold">Store Level</th>
                            <th className="pb-2.5 font-semibold">Quantity</th>
                            <th className="pb-2.5 text-right font-semibold">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-normal">
                          {inventoryRequests.map(req => (
                            <tr key={req.id} className="hover:bg-slate-50/50">
                              <td className="py-3 text-[10px] font-mono text-slate-400">
                                {new Date(req.requestedAt).toLocaleDateString()}
                              </td>
                              <td className="py-3 text-slate-800 font-semibold">{req.ingredient}</td>
                              <td className="py-3">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider ${
                                  req.level === 'Out of Stock' ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                                }`}>
                                  {req.level}
                                </span>
                              </td>
                              <td className="py-3 text-slate-800">{req.quantity}</td>
                              <td className="py-3 text-right">
                                <span className={`px-2.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider ${
                                  req.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                  req.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                  'bg-rose-50 text-rose-700 border border-rose-100'
                                }`}>
                                  {req.status}
                                </span>
                                {req.rejectReason && (
                                  <span className="block text-[9.5px] text-rose-500 font-normal mt-1 max-w-xs text-right">{req.rejectReason}</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: LEAVE REQUESTS */}
          {activeTab === 'leave' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
              
              {/* Balance & Application Form */}
              <div className="lg:col-span-1 space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { type: 'Paid Leave', bal: '12 Days' },
                    { type: 'Sick Leave', bal: '5 Days' },
                    { type: 'Casual Leave', bal: '4 Days' }
                  ].map((bal, idx) => (
                    <div key={idx} className="p-3 border border-slate-200 rounded-2xl text-center bg-white shadow-2xs">
                      <span className="text-[8.5px] uppercase font-normal tracking-wider block text-slate-400">{bal.type}</span>
                      <strong className="text-xs font-semibold block mt-1 text-slate-800">{bal.bal}</strong>
                    </div>
                  ))}
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                  <h3 className="text-xs font-semibold text-slate-555 uppercase tracking-wider block">Apply for Leave</h3>
                  
                  <form onSubmit={handleApplyLeave} className="space-y-4 text-xs font-normal">
                    <div>
                      <label className="text-[10px] font-normal text-slate-500 uppercase block mb-1">Leave Type *</label>
                      <select
                        value={leaveType}
                        onChange={(e) => setLeaveType(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-normal focus:outline-none focus:border-emerald-600 cursor-pointer h-10"
                      >
                        <option value="Paid Leave">Paid Leave</option>
                        <option value="Sick Leave">Sick Leave</option>
                        <option value="Casual Leave">Casual Leave</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-normal text-slate-500 uppercase block mb-1">Start Date *</label>
                        <input
                          type="date"
                          required
                          value={leaveStart}
                          onChange={(e) => setLeaveStart(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-normal focus:outline-none h-10"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-normal text-slate-500 uppercase block mb-1">End Date *</label>
                        <input
                          type="date"
                          required
                          value={leaveEnd}
                          onChange={(e) => setLeaveEnd(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-normal focus:outline-none h-10"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-normal text-slate-500 uppercase block mb-1">Reason for Leave *</label>
                      <textarea
                        required
                        placeholder="Reason..."
                        value={leaveReason}
                        onChange={(e) => setLeaveReason(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-normal focus:outline-none focus:border-emerald-600 h-24 resize-none"
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold uppercase rounded-xl tracking-wider cursor-pointer active:scale-95 transition border border-emerald-500 h-10 shadow-sm shadow-emerald-600/10"
                    >
                      Apply Now
                    </button>
                  </form>
                </div>
              </div>

              {/* History */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                  <h3 className="text-xs font-semibold text-slate-555 uppercase tracking-wider mb-4 block">Leave History Logs</h3>
                  
                  {leaveRequests.length === 0 ? (
                    <p className="text-xs text-slate-450 italic text-center py-8">No leaves requested yet.</p>
                  ) : (
                    <div className="space-y-3.5">
                      {leaveRequests.map(req => (
                        <div key={req.id} className="p-4 border border-slate-100 rounded-xl space-y-2 hover:bg-slate-50/40 transition">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-semibold text-slate-800">{req.leaveType}</span>
                            <span className={`px-2.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider ${
                              req.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                              req.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                              'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {req.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-[11px] text-slate-450 font-normal">
                            <div>Duration: <strong className="text-slate-700 font-semibold">{new Date(req.startDate).toLocaleDateString()} – {new Date(req.endDate).toLocaleDateString()}</strong></div>
                            <div>Requested: <strong className="text-slate-700 font-semibold">{new Date(req.requestedAt).toLocaleString()}</strong></div>
                          </div>
                          <p className="text-[11px] text-slate-650 bg-slate-50/50 p-2.5 rounded border border-slate-100 font-normal">Reason: {req.reason}</p>
                          {req.rejectReason && (
                            <div className="text-[10px] text-rose-650 bg-rose-50/30 p-2.5 rounded border border-rose-100 font-normal">
                              Reject Reason: {req.rejectReason}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 5: MESSAGE CENTER */}
          {activeTab === 'messages' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
              
              {/* Compose Message */}
              <div className="lg:col-span-1 space-y-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                  <h3 className="text-xs font-semibold text-slate-555 uppercase tracking-wider block">Compose Message</h3>
                  
                  <form onSubmit={handleSendChatMessage} className="space-y-4 text-xs font-normal">
                    <div>
                      <label className="text-[10px] font-normal text-slate-500 uppercase block mb-1">To Contact *</label>
                      <select
                        value={selectedRecipient}
                        onChange={(e) => setSelectedRecipient(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-normal focus:outline-none focus:border-emerald-600 cursor-pointer h-10"
                      >
                        <option value="Manager">Manager</option>
                        <option value="Admin">Admin</option>
                        <option value="Kitchen Supervisor">Kitchen Supervisor</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[10px] font-normal text-slate-500 uppercase block">Quick Kitchen Alerts</span>
                      <div className="flex flex-col gap-1.5">
                        {[
                          'Need Tomatoes urgently in Main Kitchen',
                          'Equipment issue: Tandoor burner malfunctioning',
                          'Request extra staff support for evening shift',
                          'Urgent kitchen support required'
                        ].map((txt, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSelectQuickMessage(txt)}
                            className="w-full p-2 bg-slate-50 border border-slate-100 hover:bg-slate-100 rounded-lg text-left text-[10px] text-slate-600 font-normal truncate transition cursor-pointer"
                          >
                            {txt}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-normal text-slate-500 uppercase block mb-1">Message Text *</label>
                      <textarea
                        placeholder="Type message..."
                        required
                        value={msgText}
                        onChange={(e) => setMsgText(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-normal focus:outline-none focus:border-emerald-600 h-28 resize-none"
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold uppercase rounded-xl tracking-wider cursor-pointer active:scale-95 transition flex items-center justify-center gap-2 border border-emerald-500 h-10 shadow-sm shadow-emerald-600/10"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Message</span>
                    </button>
                  </form>
                </div>
              </div>

              {/* Chat Inbox */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col h-[500px]">
                  <h3 className="text-xs font-semibold text-slate-555 uppercase tracking-wider mb-4 block border-b border-slate-150 pb-2.5 shrink-0 flex items-center gap-2">
                    <Inbox className="w-4 h-4 text-slate-450" />
                    <span>Kitchen Communication Inbox</span>
                  </h3>

                  <div className="flex-1 overflow-y-auto pr-1 space-y-4 scrollbar-thin">
                    {messages.map(msg => {
                      const isSelf = msg.sender === 'chef';
                      return (
                        <div key={msg.id} className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}>
                          <div className="flex items-center gap-1.5 text-[9px] font-normal text-slate-400 uppercase tracking-wider mb-1">
                            <span>{isSelf ? 'You (Chef)' : msg.senderName}</span>
                            <span>•</span>
                            <span>{msg.timestamp}</span>
                          </div>
                          <div className={`p-3 rounded-2xl max-w-sm text-xs font-normal leading-relaxed ${
                            isSelf
                              ? 'bg-emerald-600 text-white rounded-tr-none shadow-xs border border-emerald-500'
                              : 'bg-slate-50 text-slate-800 rounded-tl-none border border-slate-200'
                          }`}>
                            {msg.text}
                          </div>
                        </div>
                      );
                    })}
                    {isTypingReply && (
                      <div className="flex flex-col items-start">
                        <div className="text-[9px] font-normal text-slate-400 uppercase tracking-wider mb-1">Typing...</div>
                        <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl rounded-tl-none max-w-sm text-slate-450 text-xs flex gap-1 items-center font-normal italic">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"></span>
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]"></span>
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]"></span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 6: CHEF PROFILE */}
          {activeTab === 'profile' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs text-left space-y-6">
              
              <div className="flex flex-col sm:flex-row items-center gap-5 border-b border-slate-100 pb-6">
                <div className="w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center text-white text-xl font-semibold shadow-md shadow-emerald-600/25 shrink-0 border border-emerald-500">
                  {loggedChef.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="text-center sm:text-left space-y-1">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                    <h2 className="text-lg font-semibold text-slate-900 leading-none">{loggedChef.name}</h2>
                    <span className="bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full text-[9px] font-normal text-emerald-600 uppercase tracking-wider">
                      {loggedChef.designation}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-normal">Employee ID: <strong className="text-slate-800 font-semibold">{loggedChef.employeeId}</strong> | Department: <strong className="text-slate-800 font-semibold">{loggedChef.department}</strong></p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs text-slate-500 font-normal">
                {[
                  { label: 'Mobile Number', val: loggedChef.mobile },
                  { label: 'Email Address', val: loggedChef.email },
                  { label: 'Date of Joining', val: loggedChef.joiningDate },
                  { label: 'Assigned Kitchen', val: loggedChef.assignedKitchen },
                  { label: 'Total Experience', val: loggedChef.experience },
                  { label: 'Current Status', val: attendanceStatus === 'CHECKED_IN' ? 'On Duty' : 'Off Duty' },
                  { label: 'Today working Hours', val: workingHoursToday || loggedChef.todayWorkingHours },
                  { label: 'Attendance Average', val: `${loggedChef.attendancePercent}%` },
                  { label: 'Performance Rating', val: `${loggedChef.performanceRating} / 5.0 ★` }
                ].map((field, idx) => (
                  <div key={idx} className="p-4 bg-slate-50/50 border border-slate-150 rounded-xl space-y-1">
                    <span className="text-[9px] uppercase font-normal text-slate-400 block tracking-wider">{field.label}</span>
                    <strong className="text-xs text-slate-800 block font-semibold">{field.val}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}

            {/* TAB 7: PERFORMANCE ANALYTICS */}
          {activeTab === 'performance' && (
            <div className="space-y-6 text-left">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'Orders Completed Today', val: `${completedOrdersCount} KOTs`, desc: 'Prepared within time', icon: CheckCircle2, progress: 95 },
                  { label: 'Average Cooking Speed', val: '11.8 mins', desc: 'Target limit: 15 mins', icon: Clock, progress: 85 },
                  { label: 'Delayed Orders', val: '1 KOT', desc: 'Identified late tickets', icon: AlertTriangle, progress: 10 }
                ].map((perf, idx) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <span className="text-[10px] font-normal text-slate-500 uppercase tracking-wider block">{perf.label}</span>
                        <strong className="text-base font-semibold text-slate-900 block">{perf.val}</strong>
                        <span className="text-[10px] text-slate-450 font-normal block">{perf.desc}</span>
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 border border-slate-100 flex items-center justify-center shrink-0">
                        <perf.icon className="w-4 h-4" />
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="w-full bg-slate-100 rounded-full h-1">
                        <div
                          className="bg-emerald-600 h-1 rounded-full"
                          style={{ width: `${perf.progress}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-[9px] font-normal text-slate-450 uppercase tracking-wider">
                        <span>Progress Score</span>
                        <span>{perf.progress}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                <h3 className="text-xs font-semibold text-slate-555 uppercase tracking-wider block">Historical Kitchen Accuracy</h3>
                <div className="space-y-4">
                  {[
                    { metric: 'Kitchen Recipe Accuracy', rate: '99.1%', desc: 'Correct recipes prepared with exact customized notes.' },
                    { metric: 'Hygiene & Cleanliness Score', rate: '98%', desc: 'Inspection grade from weekly internal health audits.' },
                    { metric: 'Preparation Consistency', rate: '96.5%', desc: 'Consistency of taste & portion scale sizing.' }
                  ].map((row, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3.5 last:border-0 last:pb-0">
                      <div className="space-y-1">
                        <h4 className="text-xs font-semibold text-slate-800">{row.metric}</h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed font-normal">{row.desc}</p>
                      </div>
                      <strong className="text-sm font-semibold text-emerald-600 shrink-0">{row.rate}</strong>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 8: WORK HISTORY */}
          {activeTab === 'history' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs text-left">
              <h3 className="text-xs font-semibold text-slate-555 uppercase tracking-wider mb-4 block">Work History Logs</h3>
              
              {workHistory.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-8">No historical logs found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-slate-600 border-collapse">
                    <thead>
                      <tr className="border-b border-slate-150 text-slate-450 uppercase font-semibold text-[9px] tracking-wider text-left">
                        <th className="pb-3 font-semibold">Shift Date</th>
                        <th className="pb-3 font-semibold">Check-In</th>
                        <th className="pb-3 font-semibold">Check-Out</th>
                        <th className="pb-3 font-semibold">Working Hours</th>
                        <th className="pb-3 text-center font-semibold">Orders Completed</th>
                        <th className="pb-3 font-semibold">Avg Prep Speed</th>
                        <th className="pb-3 text-right font-semibold">Rating Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
                      {workHistory.map(row => (
                        <tr key={row.id} className="hover:bg-slate-50/50">
                          <td className="py-3 text-[10px] font-mono text-slate-450">{row.date}</td>
                          <td className="py-3 text-slate-850">{row.checkIn}</td>
                          <td className="py-3 text-slate-850">{row.checkOut}</td>
                          <td className="py-3 text-slate-850 font-semibold">{row.workingHours}</td>
                          <td className="py-3 text-center text-slate-850">{row.ordersCompleted}</td>
                          <td className="py-3 text-slate-850">{row.avgCookingTime}</td>
                          <td className="py-3 text-emerald-600 font-semibold text-right">{row.performance} ★</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* MODAL: ORDER DETAILS SIDE DRAWER */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs flex justify-end z-50">
          <div className="bg-white w-full max-w-md h-full shadow-2xl p-6 relative overflow-y-auto flex flex-col justify-between text-left">
            
            <div>
              <div className="flex justify-between items-start border-b border-slate-150 pb-4 mb-4">
                <div className="space-y-1">
                  <span className="text-[9px] font-semibold bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-md uppercase tracking-wider">
                    {selectedOrderDetails.customerType}
                  </span>
                  <h3 className="text-base font-semibold text-slate-900 mt-1 block">Order {selectedOrderDetails.orderNo}</h3>
                  <p className="text-[10px] text-slate-400 font-normal">Table: {selectedOrderDetails.tableNo} | Waiter: {selectedOrderDetails.waiterName}</p>
                </div>
                <button
                  onClick={() => setSelectedOrderDetails(null)}
                  className="p-1 rounded-lg hover:bg-slate-50 cursor-pointer h-7 w-7 flex items-center justify-center border border-slate-100"
                  aria-label="Close"
                >
                  <X className="w-4 h-4 text-slate-500 hover:text-slate-800" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[11px] text-slate-550 border-b border-slate-100 pb-4 mb-4 font-normal">
                <div>Elapsed Time: <strong className="text-slate-850 font-semibold">{Math.floor((nowTime - selectedOrderDetails.orderReceivedTime) / 60000)}m ago</strong></div>
                <div>Est prep limit: <strong className="text-slate-850 font-semibold">{selectedOrderDetails.estimatedPrepTime} mins</strong></div>
              </div>

              {selectedOrderDetails.kitchenNotes && (
                <div className="bg-amber-50/50 border border-amber-150 rounded-xl p-3 mb-5 text-[11px] text-amber-750 leading-relaxed font-normal">
                  <span className="text-[9.5px] uppercase font-semibold text-amber-600 block mb-0.5 tracking-wider">Kitchen Notes</span>
                  {selectedOrderDetails.kitchenNotes}
                </div>
              )}

              {/* Dishes list inside details */}
              <div className="space-y-3">
                <span className="text-[10px] font-normal text-slate-450 uppercase tracking-wider block">Ordered Items</span>
                
                {selectedOrderDetails.items.map(dish => (
                  <div key={dish.id} className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                          <span>{getDishEmoji(dish.name)}</span>
                          <span>{dish.name}</span>
                          <span className="text-slate-500 font-normal">×{dish.quantity}</span>
                        </h4>
                        {dish.notes && <span className="text-[10px] text-slate-400 block font-normal mt-0.5">Notes: {dish.notes}</span>}
                      </div>

                      <span className={`px-2 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider ${
                        dish.status === 'PENDING' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        dish.status === 'ACCEPTED' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        dish.status === 'PREPARING' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-emerald-50 text-emerald-700 border border-emerald-250'
                      }`}>
                        {dish.status}
                      </span>
                    </div>

                    {dish.specialInstructions && (
                      <p className="text-[10px] text-slate-500 font-normal italic">Instructions: {dish.specialInstructions}</p>
                    )}

                    <div className="flex items-center justify-between gap-4 pt-1">
                      <div className="flex-1">
                        <div className="w-full bg-slate-200 rounded-full h-1">
                          <div className="bg-emerald-600 h-1 rounded-full" style={{ width: `${dish.progress}%` }}></div>
                        </div>
                      </div>

                      <div className="shrink-0 flex gap-1.5">
                        {dish.status !== 'READY' && dish.status !== 'PREPARING' && (
                          <button
                            onClick={() => handleStartCookingItem(selectedOrderDetails.id, dish.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-2.5 py-1 rounded-lg text-[10px] cursor-pointer border border-emerald-500 h-7"
                          >
                            Cook
                          </button>
                        )}
                        {dish.status === 'PREPARING' && (
                          <button
                            onClick={() => handleMarkItemReady(selectedOrderDetails.id, dish.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-2.5 py-1 rounded-lg text-[10px] cursor-pointer border border-emerald-500 h-7"
                          >
                            Ready
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions Footer */}
            <div className="pt-6 border-t border-slate-150 mt-8 shrink-0 flex gap-2">
              {selectedOrderDetails.status !== 'READY' ? (
                <>
                  <button
                    onClick={() => {
                      handleStartCookingOrder(selectedOrderDetails.id);
                      setSelectedOrderDetails(null);
                    }}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold uppercase py-2.5 rounded-xl text-xs tracking-wider cursor-pointer border border-emerald-500 h-10 shadow-sm"
                  >
                    Cook Whole Order
                  </button>
                  <button
                    onClick={() => {
                      handleMarkOrderReady(selectedOrderDetails.id);
                      setSelectedOrderDetails(null);
                    }}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold uppercase py-2.5 rounded-xl text-xs tracking-wider cursor-pointer border border-emerald-500 h-10 shadow-sm"
                  >
                    Ready Whole Order
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleClearOrderFromQueue(selectedOrderDetails.id)}
                  className="w-full bg-slate-700 hover:bg-slate-800 text-white font-semibold uppercase py-2.5 rounded-xl text-xs tracking-wider cursor-pointer border border-slate-650 h-10"
                >
                  Clear/Notify Served
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

// ==================== KITCHEN ORDER CARD COMPONENT ====================

interface KitchenOrderCardProps {
  order: KitchenOrder;
  nowTime: number;
  onAccept: () => void;
  onStartCooking: () => void;
  onMarkReady: () => void;
  onStartCookingItem: (dishId: string) => void;
  onMarkItemReady: (dishId: string) => void;
  onViewDetails: () => void;
}

const KitchenOrderCard: React.FC<KitchenOrderCardProps> = ({
  order,
  nowTime,
  onAccept,
  onStartCooking,
  onMarkReady,
  onStartCookingItem,
  onMarkItemReady,
  onViewDetails
}) => {
  const elapsedMinutes = Math.floor((nowTime - order.orderReceivedTime) / 60000);
  const isLate = elapsedMinutes > order.estimatedPrepTime;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition text-left flex flex-col justify-between relative overflow-hidden min-h-[300px]">
      
      <div>
        {/* Card Header Info */}
        <div className="flex justify-between items-start border-b border-slate-100 pb-3 mb-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <strong className="text-xs font-semibold text-slate-900 block uppercase leading-none tracking-tight">Order {order.orderNo}</strong>
              <span className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md text-[9px] font-semibold text-slate-500 uppercase tracking-wider">
                {order.tableNo}
              </span>
              <span className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md text-[9px] font-semibold text-slate-500 uppercase tracking-wider">
                {order.customerType}
              </span>
            </div>
            <p className="text-[10px] text-slate-405 font-normal mt-1">Waiter: {order.waiterName} | Priority: <strong className={order.priority === 'High' ? 'text-rose-600 font-semibold' : 'text-slate-600 font-semibold'}>{order.priority}</strong></p>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-[9px] text-slate-400 font-normal uppercase tracking-wider">Status</span>
            <span className={`px-2 py-0.5 rounded text-[9px] font-semibold uppercase mt-0.5 ${
              order.status === 'PENDING' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
              order.status === 'PREPARING' ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse' :
              'bg-emerald-50 text-emerald-700 border border-emerald-250'
            }`}>
              {order.status === 'PENDING' ? '🔵 Pending' : order.status === 'PREPARING' ? '🟠 Preparing' : '🟢 Ready'}
            </span>
          </div>
        </div>

        {/* Timers Bar */}
        <div className="flex flex-wrap gap-2.5 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-4 text-[10px] font-normal text-slate-500 uppercase tracking-wider">
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Elapsed: <strong className="text-slate-800 font-semibold">{elapsedMinutes}m</strong></span>
          </div>
          <span>•</span>
          <div>
            <span>Est Limit: <strong className="text-slate-800 font-semibold">{order.estimatedPrepTime}m</strong></span>
          </div>
          {isLate && (
            <span className="ml-auto bg-rose-50 border border-rose-200 text-rose-700 px-2 py-0.5 rounded-md animate-bounce shrink-0 font-semibold">
              🔴 Late Dispatch
            </span>
          )}
        </div>

        {order.kitchenNotes && (
          <p className="text-[11px] text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-normal mb-4 leading-relaxed">
            Note: {order.kitchenNotes}
          </p>
        )}

        {/* Ordered items compact bordered list */}
        <div className="space-y-2 mb-5">
          {order.items.map(dish => (
            <div key={dish.id} className="flex justify-between items-center text-xs font-normal border border-slate-150 rounded-xl p-2.5 bg-slate-50/50">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm shrink-0">{getDishEmoji(dish.name)}</span>
                <div className="min-w-0 text-left">
                  <span className="text-slate-900 font-semibold truncate block">
                    {dish.name}
                    <span className="text-slate-500 font-normal ml-1.5">×{dish.quantity}</span>
                  </span>
                  {dish.notes && <span className="block text-[9.5px] text-slate-450 font-normal mt-0.5 truncate">Note: {dish.notes}</span>}
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <div className="flex flex-col items-end">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider ${
                    dish.status === 'PENDING' ? 'bg-blue-50 text-blue-700 border border-blue-105' :
                    dish.status === 'ACCEPTED' ? 'bg-blue-50 text-blue-700 border border-blue-105' :
                    dish.status === 'PREPARING' ? 'bg-amber-50 text-amber-700 border border-amber-105' :
                    'bg-emerald-50 text-emerald-700 border border-emerald-105'
                  }`}>
                    {dish.status === 'PENDING' ? 'Pending' : dish.status === 'ACCEPTED' ? 'Accepted' : dish.status === 'PREPARING' ? 'Preparing' : 'Ready'}
                  </span>
                  <span className="text-[8.5px] text-slate-400 font-normal font-mono mt-0.5">{dish.cookingTime}</span>
                </div>

                {dish.status !== 'READY' && (
                  <div className="flex gap-1.5">
                    {dish.status === 'PENDING' && (
                      <button
                        onClick={() => onStartCookingItem(dish.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-2 py-1 rounded-lg text-[9px] cursor-pointer border border-emerald-500 transition active:scale-95 h-7"
                      >
                        Accept
                      </button>
                    )}
                    {dish.status === 'ACCEPTED' && (
                      <button
                        onClick={() => onStartCookingItem(dish.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-2 py-1 rounded-lg text-[9px] cursor-pointer border border-emerald-500 transition active:scale-95 h-7"
                      >
                        Prepare
                      </button>
                    )}
                    {dish.status === 'PREPARING' && (
                      <button
                        onClick={() => onMarkItemReady(dish.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-2 py-1 rounded-lg text-[9px] cursor-pointer border border-emerald-500 transition active:scale-95 h-7"
                      >
                        Ready
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Card Actions Footer - Always visible */}
      <div className="pt-3 border-t border-slate-100 grid grid-cols-4 gap-1.5 shrink-0">
        <button
          onClick={onAccept}
          disabled={order.status !== 'PENDING'}
          className={`py-2 rounded-xl text-[9px] font-semibold uppercase tracking-wider transition cursor-pointer text-center h-9 ${
            order.status === 'PENDING'
              ? 'bg-blue-600 hover:bg-blue-750 text-white border border-blue-500 active:scale-95'
              : 'bg-slate-50 text-slate-300 border border-slate-105 cursor-not-allowed'
          }`}
        >
          Accept
        </button>
        <button
          onClick={onStartCooking}
          disabled={order.status !== 'PENDING' && order.status !== 'PREPARING'}
          className={`py-2 rounded-xl text-[9px] font-semibold uppercase tracking-wider transition cursor-pointer text-center h-9 ${
            order.status === 'PENDING' || order.status === 'PREPARING'
              ? 'bg-amber-600 hover:bg-amber-700 text-white border border-amber-500 active:scale-95'
              : 'bg-slate-50 text-slate-300 border border-slate-105 cursor-not-allowed'
          }`}
        >
          Cook All
        </button>
        <button
          onClick={onMarkReady}
          disabled={order.status !== 'PREPARING'}
          className={`py-2 rounded-xl text-[9px] font-semibold uppercase tracking-wider transition cursor-pointer text-center h-9 ${
            order.status === 'PREPARING'
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500 active:scale-95'
              : 'bg-slate-50 text-slate-300 border border-slate-105 cursor-not-allowed'
          }`}
        >
          Ready All
        </button>
        <button
          onClick={onViewDetails}
          className="bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 font-semibold uppercase py-2 rounded-xl text-[9px] tracking-wider transition cursor-pointer border border-slate-200 h-9 text-center"
        >
          Details
        </button>
      </div>

    </div>
  );
};

export default KitchenDashboard;

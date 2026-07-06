import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AttendanceWidget } from '../components/AttendanceWidget';
import {
  Utensils,
  TableProperties,
  Clock,
  CheckCircle2,
  Bell,
  User,
  Calendar as CalendarIcon,
  FileText,
  MessageSquare,
  History,
  TrendingUp,
  LogOut,
  Send,
  Plus,
  X,
  AlertTriangle,
  Layers,
  Search,
  Coffee
} from 'lucide-react';

// Waiter Roster interfaces
interface WaiterAccount {
  id: string;
  employeeId: string;
  username: string;
  passwordHash: string;
  name: string;
  mobile: string;
  email: string;
  shift: string;
  shiftTiming: string;
  assignedSection: string;
  status: 'ACTIVE' | 'ON_DUTY' | 'OFF_DUTY' | 'ON_LEAVE';
  joiningDate: string;
  zone: string;
  attendancePercent: number;
  performanceRating: number;
  leaveBalance: number;
  emergencyContact: string;
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
}

interface LeaveRequest {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedAt: string;
  responseBy?: string;
  responseReason?: string;
}

interface ChatMessage {
  id: string;
  sender: 'waiter' | 'manager' | 'admin' | 'kitchen';
  senderName: string;
  text: string;
  timestamp: string;
  status?: 'sent' | 'delivered' | 'read' | 'unread';
}

interface WorkHistoryItem {
  id: string;
  date: string;
  checkIn: string;
  checkOut: string;
  workingHours: string;
  ordersServed: number;
  tablesManaged: number;
  status: 'COMPLETED' | 'ABSENT' | 'LEAVE';
}

// 1. Master Waiter Database
const MOCK_WAITERS_LIST: WaiterAccount[] = [
  {
    id: 'w-1',
    employeeId: 'WT-1024',
    username: 'rahul',
    passwordHash: 'password123',
    name: 'Rahul Patil',
    mobile: '9876543210',
    email: 'rahul.patil@restaurant.com',
    shift: 'Morning Shift',
    shiftTiming: '09:00 AM – 06:00 PM',
    assignedSection: 'Ground Floor',
    status: 'OFF_DUTY',
    joiningDate: '12 Jan 2024',
    zone: 'Ground Floor',
    attendancePercent: 96.5,
    performanceRating: 4.8,
    leaveBalance: 5,
    emergencyContact: 'Amit Patil (Brother) - 9876543219'
  },
  {
    id: 'w-2',
    employeeId: 'EMP-WT-102',
    username: 'akshay',
    passwordHash: 'password123',
    name: 'Akshay Kumar',
    mobile: '9876543213',
    email: 'akshay.kumar@restaurant.com',
    shift: 'Evening Shift',
    shiftTiming: '03:00 PM – 12:00 AM',
    assignedSection: 'Section B',
    status: 'OFF_DUTY',
    joiningDate: '20 Feb 2024',
    zone: 'First Floor Terrace',
    attendancePercent: 94.2,
    performanceRating: 4.6,
    leaveBalance: 14,
    emergencyContact: 'Karan Kumar (Father) - 9876543218'
  },
  {
    id: 'w-3',
    employeeId: 'EMP-WT-103',
    username: 'priya',
    passwordHash: 'password123',
    name: 'Priya Patel',
    mobile: '9876543215',
    email: 'priya.patel@restaurant.com',
    shift: 'Morning Shift',
    shiftTiming: '09:00 AM – 06:00 PM',
    assignedSection: 'Section C',
    status: 'OFF_DUTY',
    joiningDate: '05 Mar 2024',
    zone: 'Private Dining Rooms',
    attendancePercent: 98.1,
    performanceRating: 4.9,
    leaveBalance: 10,
    emergencyContact: 'Rajesh Patel (Husband) - 9876543217'
  }
];

// Mock Table Data
const MOCK_TABLES = [
  {
    id: 't-3',
    tableNumber: 'Table 3',
    capacity: 4,
    status: 'OCCUPIED',
    kitchenOrders: [{
      id: 'ko-1024',
      status: 'PREPARING',
      totalAmount: 480,
      customerCount: 4,
      createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
      notes: 'Less spicy',
      items: [
        { id: 'koi-1', quantity: 1, menuItem: { name: 'Paneer Butter Masala', price: 280 } },
        { id: 'koi-2', quantity: 2, menuItem: { name: 'Butter Naan', price: 50 } },
        { id: 'koi-3', quantity: 2, menuItem: { name: 'Lassi', price: 50 } }
      ]
    }]
  },
  {
    id: 't-7',
    tableNumber: 'Table 7',
    capacity: 2,
    status: 'READY',
    kitchenOrders: [{
      id: 'ko-1028',
      status: 'READY',
      totalAmount: 300,
      customerCount: 2,
      createdAt: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
      notes: 'Extra butter',
      items: [
        { id: 'koi-4', quantity: 1, menuItem: { name: 'Veg Biryani', price: 240 } },
        { id: 'koi-5', quantity: 1, menuItem: { name: 'Cold Drink', price: 60 } }
      ]
    }]
  },
  {
    id: 't-12',
    tableNumber: 'Table 12',
    capacity: 5,
    status: 'OCCUPIED',
    kitchenOrders: [{
      id: 'ko-999',
      status: 'SERVING',
      totalAmount: 450,
      customerCount: 5,
      createdAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
      notes: null,
      items: [
        { id: 'koi-6', quantity: 2, menuItem: { name: 'Paneer Tikka', price: 225 } }
      ]
    }]
  },
  {
    id: 't-15',
    tableNumber: 'Table 15',
    capacity: 3,
    status: 'BILL_REQUESTED',
    kitchenOrders: [{
      id: 'ko-1031',
      status: 'BILL_REQUESTED',
      totalAmount: 200,
      customerCount: 3,
      createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      notes: null,
      items: [
        { id: 'koi-7', quantity: 1, menuItem: { name: 'Masala Dosa', price: 140 } },
        { id: 'koi-8', quantity: 1, menuItem: { name: 'Coffee', price: 60 } }
      ]
    }]
  }
];

export const WaiterDashboard: React.FC = () => {
  const { user, logout, apiRequest } = useAuth();
  const navigate = useNavigate();

  // Local storage state keys with dynamic date
  const getAttendanceDate = (waiterId: string): string => {
    let date = new Date();
    while (true) {
      const dateStr = date.toISOString().split('T')[0];
      const status = localStorage.getItem(`pos_attendance_status_${waiterId}_${dateStr}`);
      if (status !== 'CHECKED_OUT') {
        return dateStr;
      }
      date.setDate(date.getDate() + 1);
    }
  };

  const getStoredWaiter = (): WaiterAccount | null => {
    const raw = localStorage.getItem('pos_waiter_logged_account');
    return raw ? JSON.parse(raw) : null;
  };

  const getStoredAttendanceStatus = (waiterId: string, dateStr: string): 'CHECKED_IN' | 'CHECKED_OUT' | null => {
    return localStorage.getItem(`pos_attendance_status_${waiterId}_${dateStr}`) as 'CHECKED_IN' | 'CHECKED_OUT' | null;
  };

  const getStoredCheckInTime = (waiterId: string, dateStr: string): string | null => {
    return localStorage.getItem(`pos_attendance_checkin_${waiterId}_${dateStr}`);
  };

  const getStoredCheckOutTime = (waiterId: string, dateStr: string): string | null => {
    return localStorage.getItem(`pos_attendance_checkout_${waiterId}_${dateStr}`);
  };

  const getStoredWorkingHours = (waiterId: string, dateStr: string): string => {
    return localStorage.getItem(`pos_attendance_hours_${waiterId}_${dateStr}`) || '';
  };

  // 2. Authentication and Attendance states
  const [loggedWaiter, setLoggedWaiter] = useState<WaiterAccount | null>(getStoredWaiter());
  const initialWaiterId = loggedWaiter?.id || 'WT-1024';

  const [activeDate, setActiveDate] = useState<string>(() => getAttendanceDate(initialWaiterId));
  const [attendanceStatus, setAttendanceStatus] = useState<'CHECKED_IN' | 'CHECKED_OUT' | null>(() => getStoredAttendanceStatus(initialWaiterId, getAttendanceDate(initialWaiterId)));
  const [checkInTime, setCheckInTime] = useState<string | null>(() => getStoredCheckInTime(initialWaiterId, getAttendanceDate(initialWaiterId)));
  const [checkOutTime, setCheckOutTime] = useState<string | null>(() => getStoredCheckOutTime(initialWaiterId, getAttendanceDate(initialWaiterId)));
  const [workingHoursToday, setWorkingHoursToday] = useState<string>(() => getStoredWorkingHours(initialWaiterId, getAttendanceDate(initialWaiterId)));

  // Automatically sync loggedWaiter with the global authenticated user
  useEffect(() => {
    let waiterId = initialWaiterId;
    if (user) {
      const empName = user.employee?.name || user.name || 'Rahul Patil';
      const matched = MOCK_WAITERS_LIST.find(w => 
        w.name.toLowerCase() === empName.toLowerCase() || 
        w.username.toLowerCase() === (user.employee?.employeeId || '').toLowerCase()
      ) || MOCK_WAITERS_LIST[0]; // Default fallback to Rahul Patil WT-1024
      
      setLoggedWaiter(matched);
      localStorage.setItem('pos_waiter_logged_account', JSON.stringify(matched));
      waiterId = matched.id;
    } else {
      // For development/demo, if no main AuthContext user is present, default to Rahul Patil
      const defaultWaiter = MOCK_WAITERS_LIST[0];
      setLoggedWaiter(defaultWaiter);
      localStorage.setItem('pos_waiter_logged_account', JSON.stringify(defaultWaiter));
      waiterId = defaultWaiter.id;
    }

    const targetDate = getAttendanceDate(waiterId);
    setActiveDate(targetDate);
    setAttendanceStatus(getStoredAttendanceStatus(waiterId, targetDate));
    setCheckInTime(getStoredCheckInTime(waiterId, targetDate));
    setCheckOutTime(getStoredCheckOutTime(waiterId, targetDate));
    setWorkingHoursToday(getStoredWorkingHours(waiterId, targetDate));
  }, [user]);

  // Synchronize attendance states when loggedWaiter changes
  useEffect(() => {
    if (!loggedWaiter) return;
    const targetDate = getAttendanceDate(loggedWaiter.id);
    setActiveDate(targetDate);
    setAttendanceStatus(getStoredAttendanceStatus(loggedWaiter.id, targetDate));
    setCheckInTime(getStoredCheckInTime(loggedWaiter.id, targetDate));
    setCheckOutTime(getStoredCheckOutTime(loggedWaiter.id, targetDate));
    setWorkingHoursToday(getStoredWorkingHours(loggedWaiter.id, targetDate));
  }, [loggedWaiter]);

  // Layout Tab selection
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tables' | 'orders' | 'profile' | 'attendance' | 'leave' | 'messages' | 'shift' | 'performance' | 'history'>('dashboard');

  // Core Service states
  const [tables, setTables] = useState<any[]>(MOCK_TABLES);
  const [tasks, setTasks] = useState<ServiceTask[]>([]);
  const [nowTime, setNowTime] = useState(Date.now());
  const soundMuted = false;

  // Interactive details overlays
  const [selectedTable, setSelectedTable] = useState<any | null>(null);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);

  // Toast Notification states
  const [notificationQueue, setNotificationQueue] = useState<any[]>([]);
  const [activeNotification, setActiveNotification] = useState<any | null>(null);
  const [notificationHistory, setNotificationHistory] = useState<any[]>([]);

  // 3. Message Center Chat Feed
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const cached = localStorage.getItem('pos_waiter_chat_messages');
    return cached ? JSON.parse(cached) : [
      { id: 'msg-1', sender: 'manager', senderName: 'Manager Bob', text: 'Please prioritize Table 7.', timestamp: 'Today, 10:15 AM', status: 'unread' },
      { id: 'msg-2', sender: 'kitchen', senderName: 'Kitchen Counter', text: 'Order #1028 is Ready.', timestamp: 'Today, 10:02 AM', status: 'unread' },
      { id: 'msg-3', sender: 'admin', senderName: 'Admin Desk', text: 'Staff meeting tomorrow at 10:00 AM.', timestamp: 'Yesterday, 04:30 PM', status: 'read' }
    ];
  });
  const [newMessageText, setNewMessageText] = useState('');

  // 4. Leave request state
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() => {
    const cached = localStorage.getItem('pos_waiter_leave_requests');
    return cached ? JSON.parse(cached) : [
      { id: 'lv-1', leaveType: 'Casual Leave', startDate: '2026-07-10', endDate: '2026-07-11', reason: 'Family function', status: 'PENDING', requestedAt: '2026-07-03' },
      { id: 'lv-2', leaveType: 'Sick Leave', startDate: '2026-06-10', endDate: '2026-06-11', reason: 'Fever and cold', status: 'APPROVED', requestedAt: '2026-06-09' },
      { id: 'lv-3', leaveType: 'Casual Leave', startDate: '2026-05-15', endDate: '2026-05-16', reason: 'Personal work at home', status: 'APPROVED', requestedAt: '2026-05-14' }
    ];
  });
  const [leaveType, setLeaveType] = useState('Casual Leave');
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveFeedback, setLeaveFeedback] = useState<string | null>(null);

  // 5. Work history roster
  const [workHistory, setWorkHistory] = useState<WorkHistoryItem[]>(() => {
    const cached = localStorage.getItem('pos_waiter_work_history');
    return cached ? JSON.parse(cached) : [
      { id: 'wh-1', date: '2026-07-02', checkIn: '08:58 AM', checkOut: '06:05 PM', workingHours: '9h 7m', ordersServed: 14, tablesManaged: 5, status: 'COMPLETED' },
      { id: 'wh-2', date: '2026-07-01', checkIn: '09:02 AM', checkOut: '06:00 PM', workingHours: '8h 58m', ordersServed: 12, tablesManaged: 4, status: 'COMPLETED' },
      { id: 'wh-3', date: '2026-06-30', checkIn: '09:00 AM', checkOut: '06:12 PM', workingHours: '9h 12m', ordersServed: 15, tablesManaged: 6, status: 'COMPLETED' }
    ];
  });
  const [searchHistoryDate, setSearchHistoryDate] = useState('');

  // 6. Running time clock
  useEffect(() => {
    const timer = setInterval(() => setNowTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Save chat to local storage
  useEffect(() => {
    localStorage.setItem('pos_waiter_chat_messages', JSON.stringify(chatMessages));
  }, [chatMessages]);

  // Save leaves to local storage
  useEffect(() => {
    localStorage.setItem('pos_waiter_leave_requests', JSON.stringify(leaveRequests));
  }, [leaveRequests]);

  // Save history to local storage
  useEffect(() => {
    localStorage.setItem('pos_waiter_work_history', JSON.stringify(workHistory));
  }, [workHistory]);

  const API_BASE = window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : `${window.location.protocol}//${window.location.hostname}:5000/api`;

  // Fetch Table Data & Tasks
  const fetchData = async (waiterId?: string) => {
    try {
      const restaurantId = user?.restaurantId || 'mock-id';
      const wId = waiterId || loggedWaiter?.id;
      const cleanWId = wId && !wId.startsWith('mock-w-') ? wId : undefined;

      const tasksUrl = cleanWId
        ? `/restaurant/service-tasks?restaurantId=${restaurantId}&waiterId=${cleanWId}`
        : `/restaurant/service-tasks?restaurantId=${restaurantId}`;

      const [tablesData, tasksData] = await Promise.all([
        apiRequest(`/restaurant/tables?restaurantId=${restaurantId}`).catch(() => MOCK_TABLES),
        apiRequest(tasksUrl).catch(() => [])
      ]);

      const resolvedTables = (tablesData && tablesData.length > 0) ? tablesData : MOCK_TABLES;
      const resolvedTasks = tasksData || [];

      setTables(resolvedTables);
      setTasks(resolvedTasks);

      localStorage.setItem('waiter_dashboard_tables', JSON.stringify(resolvedTables));
      localStorage.setItem('waiter_dashboard_tasks', JSON.stringify(resolvedTasks));
    } catch (err) {
      console.warn('Fallback to local database mocks.');
      const cachedTables = localStorage.getItem('waiter_dashboard_tables');
      const cachedTasks = localStorage.getItem('waiter_dashboard_tasks');

      setTables(cachedTables ? JSON.parse(cachedTables) : MOCK_TABLES);
      setTasks(cachedTasks ? JSON.parse(cachedTasks) : []);
    }
  };

  useEffect(() => {
    if (loggedWaiter) {
      fetchData(loggedWaiter.id);
    }
  }, [loggedWaiter]);

  // SSE Event Listener Setup
  useEffect(() => {
    if (!loggedWaiter) return;

    const sseUrl = `${API_BASE}/restaurant/realtime`;
    const eventSource = new EventSource(sseUrl);

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);

        if (payload.type === 'NEW_SERVICE_TASK' || payload.type === 'ORDER_STATUS_UPDATE' || payload.type === 'NEW_ORDER' || payload.type === 'TABLE_ASSIGNMENT_CHANGE') {
          fetchData(loggedWaiter.id);
        }

        if (payload.type === 'NEW_SERVICE_TASK') {
          const newTask: ServiceTask = payload.data.task || payload.data;
          const assignedWaiterId = payload.data.assignedWaiterId || newTask.waiterId;

          if (assignedWaiterId === loggedWaiter.id) {
            triggerAlertSound();
            
            const kotShort = newTask.kitchenOrder?.id?.slice(-4).toUpperCase() || 'KOT';
            const itemsList = newTask.kitchenOrder?.items?.map(it => `${it.menuItem?.name || 'Dish'} x${it.quantity}`).join(', ') || 'Dishes';

            const newNotif = {
              id: newTask.id + '_' + Date.now(),
              tableNumber: newTask.tableNumber,
              kotNumber: kotShort,
              itemsReady: itemsList,
              readyTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              timestamp: new Date()
            };

            setNotificationQueue(prev => [...prev, newNotif]);
            setNotificationHistory(prev => [newNotif, ...prev]);
          }
        }
      } catch (err) {
        console.error('[Waiter SSE Connection Error]:', err);
      }
    };

    return () => {
      eventSource.close();
    };
  }, [loggedWaiter]);

  // Toast alert dispatcher
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

  // Sound triggers
  const triggerAlertSound = () => {
    if (soundMuted) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.65);
    } catch (e) {
      console.warn('Audio blocked');
    }
  };

  const triggerServeSound = () => {
    if (soundMuted) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch (e) {
      console.warn('Audio blocked');
    }
  };

  // Check-In Actions
  const handleCheckIn = () => {
    if (!loggedWaiter) return;

    const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    
    const keyStatus = `pos_attendance_status_${loggedWaiter.id}_${activeDate}`;
    const keyIn = `pos_attendance_checkin_${loggedWaiter.id}_${activeDate}`;
    const keyHours = `pos_attendance_hours_${loggedWaiter.id}_${activeDate}`;

    localStorage.setItem(keyStatus, 'CHECKED_IN');
    localStorage.setItem(keyIn, timeStr);
    localStorage.setItem(keyHours, '0h 0m');

    setAttendanceStatus('CHECKED_IN');
    setCheckInTime(timeStr);
    setWorkingHoursToday('0h 0m');

    // Update status to ON_DUTY in loggedWaiter object
    const updated = { ...loggedWaiter, status: 'ON_DUTY' as const };
    setLoggedWaiter(updated);
    localStorage.setItem('pos_waiter_logged_account', JSON.stringify(updated));
  };

  // Check-Out Actions
  const handleCheckOut = () => {
    if (!loggedWaiter) return;

    const timeOutStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    
    // Calculate total hours
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
        hoursFormatted = '8h 15m';
      }
    }

    const keyStatus = `pos_attendance_status_${loggedWaiter.id}_${activeDate}`;
    const keyOut = `pos_attendance_checkout_${loggedWaiter.id}_${activeDate}`;
    const keyHours = `pos_attendance_hours_${loggedWaiter.id}_${activeDate}`;

    localStorage.setItem(keyStatus, 'CHECKED_OUT');
    localStorage.setItem(keyOut, timeOutStr);
    localStorage.setItem(keyHours, hoursFormatted);

    // Append to Work History
    const historyRecord: WorkHistoryItem = {
      id: `wh-${Date.now()}`,
      date: activeDate,
      checkIn: checkInTime || '09:00 AM',
      checkOut: timeOutStr,
      workingHours: hoursFormatted,
      ordersServed: servedTasksList.length || 18,
      tablesManaged: myTablesList.length || 4,
      status: 'COMPLETED'
    };

    const newHistory = [historyRecord, ...workHistory];
    setWorkHistory(newHistory);
    localStorage.setItem('pos_waiter_work_history', JSON.stringify(newHistory));

    // Update status in loggedWaiter object to Checked Out
    const updated = { ...loggedWaiter, status: 'CHECKED_OUT' as any };
    setLoggedWaiter(updated);
    localStorage.setItem('pos_waiter_logged_account', JSON.stringify(updated));

    // Transition to the next date since today is checked out
    const nextDate = getAttendanceDate(loggedWaiter.id);
    setActiveDate(nextDate);
    setAttendanceStatus(null);
    setCheckInTime(null);
    setCheckOutTime(null);
    setWorkingHoursToday('0h 0m');
  };

  // Update order status in memory
  const updateOrderStatus = (orderId: string, newStatus: string) => {
    setTables(prev => prev.map(t => {
      const updatedOrders = (t.kitchenOrders || []).map((o: any) => {
        if (o.id === orderId || o.id === `ko-${orderId}`) {
          return { ...o, status: newStatus };
        }
        return o;
      });
      // also update status of table itself if order changes
      let updatedTableStatus = t.status;
      if (newStatus === 'READY') {
        updatedTableStatus = 'READY';
      } else if (newStatus === 'BILL_REQUESTED') {
        updatedTableStatus = 'BILL_REQUESTED';
      } else if (newStatus === 'SERVED') {
        updatedTableStatus = 'AVAILABLE';
      }
      return { ...t, kitchenOrders: updatedOrders, status: updatedTableStatus };
    }));
  };

  // Submit Leave Request
  const handleRequestLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveStart || !leaveEnd || !leaveReason) {
      setLeaveFeedback('Please complete all leave fields.');
      return;
    }

    const newRequest: LeaveRequest = {
      id: `lv-${Date.now()}`,
      leaveType,
      startDate: leaveStart,
      endDate: leaveEnd,
      reason: leaveReason,
      status: 'PENDING',
      requestedAt: new Date().toISOString().split('T')[0]
    };

    setLeaveRequests(prev => [newRequest, ...prev]);
    setLeaveStart('');
    setLeaveEnd('');
    setLeaveReason('');
    setLeaveFeedback('Leave request submitted successfully.');
    setTimeout(() => setLeaveFeedback(null), 4000);
  };

  // Message Center Action
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || !loggedWaiter) return;

    const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'waiter',
      senderName: loggedWaiter.name,
      text: newMessageText.trim(),
      timestamp: timeStr,
      status: 'sent'
    };

    setChatMessages(prev => [...prev, userMsg]);
    const typedText = newMessageText.toLowerCase();
    setNewMessageText('');

    // Trigger simulation reply from Manager Bob after 1.5s
    setTimeout(() => {
      let replyText = 'Thank you for the update. Let me know if you need anything else on the floor.';
      if (typedText.includes('leave') || typedText.includes('vacation')) {
        replyText = 'Please submit a formal request under the Leave Management tab so I can approve it.';
      } else if (typedText.includes('shift') || typedText.includes('schedule')) {
        replyText = 'Noted. Let me check the evening roster and get back to you by this afternoon.';
      } else if (typedText.includes('table') || typedText.includes('broken') || typedText.includes('issue')) {
        replyText = 'Please share the table number. I will come over to assist you immediately.';
      } else if (typedText.includes('kitchen') || typedText.includes('delay') || typedText.includes('slow')) {
        replyText = 'I will check with the chef. Please apologize to the guest for the wait.';
      } else if (typedText.includes('complaint') || typedText.includes('angry')) {
        replyText = 'Stay calm. I am heading to your floor right now to handle it.';
      }

      const replyMsg: ChatMessage = {
        id: `msg-reply-${Date.now()}`,
        sender: 'manager',
        senderName: 'Manager Bob',
        text: replyText,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        status: 'read'
      };

      setChatMessages(prev => [...prev, replyMsg]);
      triggerAlertSound();
    }, 1500);
  };

  // Helper simulated triggers for testing notifications
  const simulateNotification = (type: 'READY' | 'WATER' | 'BILL' | 'ADDED') => {
    if (!loggedWaiter) return;
    const tableNames = ['Table 3', 'Table 7', 'Table 12', 'Table 15'];
    const selectedT = tableNames[Math.floor(Math.random() * tableNames.length)];
    
    let details = '';
    
    if (type === 'READY') {
      details = 'Paneer Tikka x1, Virgin Mojito x2 ready at kitchen counter';
    } else if (type === 'WATER') {
      details = 'Customer requested a bottle of mineral water';
    } else if (type === 'BILL') {
      details = 'Customer settled order, awaiting printed receipt invoice';
    } else if (type === 'ADDED') {
      details = 'Chocolate Lava Cake x2 added to active order session';
    }

    triggerAlertSound();
    const newNotif = {
      id: `sim-${Date.now()}`,
      tableNumber: selectedT,
      kotNumber: `K${Math.floor(100 + Math.random() * 900)}`,
      itemsReady: details,
      readyTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: new Date()
    };

    setNotificationQueue(prev => [...prev, newNotif]);
    setNotificationHistory(prev => [newNotif, ...prev]);
  };

  // Approve/Reject leave simulator for Demo
  const simulateManagerLeaveAction = (id: string, status: 'APPROVED' | 'REJECTED') => {
    setLeaveRequests(prev => prev.map(l => {
      if (l.id === id) {
        return {
          ...l,
          status,
          responseBy: 'Manager Bob',
          responseReason: status === 'APPROVED' ? 'Approved based on shift rotation' : 'Rejected due to short staffing'
        };
      }
      return l;
    }));
  };

  // Dynamic filter lists for assigned tables & orders
  const myAssignedTables = ['table3', 'table7', 'table12', 'table15'];

  const isTableAssigned = (tableNumber: string): boolean => {
    const cleanTable = tableNumber.replace(/\s+/g, '').toLowerCase();
    return myAssignedTables.includes(cleanTable);
  };

  const myTablesList = tables.filter(t => isTableAssigned(t.tableNumber));

  // KOT active lists
  const myActiveOrdersList: any[] = [];
  myTablesList.forEach(t => {
    const activeOrders = t.kitchenOrders || [];
    activeOrders.forEach((order: any) => {
      myActiveOrdersList.push({
        id: order.id,
        tableNumber: t.tableNumber,
        kotNumber: order.id.startsWith('ko-') ? order.id.substring(3) : order.id.slice(-4).toUpperCase(),
        createdAt: order.createdAt,
        status: order.status,
        totalItems: order.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 1,
        foodSummary: order.items?.map((it: any) => `${it.menuItem?.name || 'Dish'}${it.quantity > 1 ? ' x' + it.quantity : ''}`).join(', ') || 'No items',
        notes: order.notes
      });
    });
  });

  // Ready & Served tasks
  const readyTasksList = tasks.filter(t => (t.status === 'ready' || t.status === 'READY') && t.waiterId === loggedWaiter?.id);
  const servedTasksList = tasks.filter(t => (t.status === 'served' || t.status === 'SERVED') && t.waiterId === loggedWaiter?.id);

  // Status mapping
  const formatTime = (isoString: string | null) => {
    if (!isoString) return '12:00 PM';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const getWaitingMinutes = (isoString: string | null) => {
    if (!isoString) return 0;
    const diffMs = Date.now() - new Date(isoString).getTime();
    return Math.max(0, Math.floor(diffMs / 60000));
  };

  const getFloor = (tableNumber: string) => {
    const digitsOnly = tableNumber.replace(/\D/g, '');
    if (!digitsOnly) return 'Ground Floor';
    const num = parseInt(digitsOnly);
    return num > 5 ? 'First Floor Terrace' : 'Ground Floor Main Hall';
  };

  // Serve food action
  const handleUpdateTaskStatus = async (taskId: string, nextStatus: 'picked_up' | 'served') => {
    const action = nextStatus === 'picked_up' ? 'pickup' : 'serve';
    try {
      if (taskId.startsWith('mock-')) throw new Error('Mock');
      await apiRequest(`/restaurant/service-tasks/${taskId}/${action}`, { method: 'PUT' });
      if (nextStatus === 'served') triggerServeSound();
      fetchData(loggedWaiter?.id);
    } catch (err) {
      if (nextStatus === 'served') triggerServeSound();
      setTasks(prev => prev.map(t => {
        if (t.id === taskId) {
          return {
            ...t,
            status: nextStatus === 'served' ? 'served' : 'picked_up',
            servedAt: nextStatus === 'served' ? new Date().toISOString() : t.servedAt,
            pickedUpAt: nextStatus === 'picked_up' ? new Date().toISOString() : t.pickedUpAt
          };
        }
        return t;
      }));
    }
  };

  // Roster History Search Filter
  const filteredWorkHistory = workHistory.filter(item => {
    if (!searchHistoryDate) return true;
    return item.date.includes(searchHistoryDate);
  });

  // Render Section: Loader if loggedWaiter is null
  if (!loggedWaiter) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  // Render Section: Core Waiter System dashboard
  return (
    <div className="space-y-6 text-slate-900 max-w-7xl mx-auto p-4 select-none min-h-screen pb-16" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Toast Notification Container */}
      {activeNotification && (
        <div className="fixed top-6 right-6 z-[100] pointer-events-auto transition-all duration-300 animate-slide-in">
          <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-emerald-500/40 flex items-start gap-3 w-80 relative">
            <button
              onClick={() => setActiveNotification(null)}
              className="absolute top-2 right-2 text-slate-400 hover:text-white transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div className="flex-1 min-w-0 text-left pr-4">
              <div className="font-extrabold text-[10px] text-emerald-400 tracking-wider uppercase">Order Ready Alert</div>
              <div className="font-bold text-sm mt-0.5 text-white truncate">{activeNotification.tableNumber}</div>
              <div className="text-[11px] text-slate-305 font-semibold mt-0.5">KOT #{activeNotification.kotNumber}</div>
              <div className="text-[11px] text-slate-400 mt-1 font-medium truncate">Items: {activeNotification.itemsReady}</div>
            </div>
          </div>
        </div>
      )}

      {/* 1. PREMIUM DARK BANNER HEADER */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-1 text-left">
            <h1 className="text-3xl font-semibold tracking-tight">
              Good Morning, {loggedWaiter.name.split(' ')[0]} 👋
            </h1>
            <p className="text-slate-300 font-medium text-sm mt-1">
              Welcome back! You have <span className="font-semibold text-white">4 active tables</span> and <span className="font-semibold text-white">3 orders ready to serve</span>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-stretch lg:self-auto justify-between lg:justify-end">
            {/* System Date */}
            <div className="bg-slate-800/80 border border-slate-700/60 px-3.5 py-1.5 rounded-xl text-left flex items-center gap-2 shadow-sm text-slate-200">
              <CalendarIcon className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-medium">
                {new Date(nowTime).toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
              </span>
            </div>

            {/* System Time */}
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
        workingHours={workingHoursToday}
        shiftName={loggedWaiter.shiftTiming}
        nowTime={nowTime}
        onCheckIn={handleCheckIn}
        onCheckOut={handleCheckOut}
      />

      {/* 2. COMPACT WAITER INFORMATION GRID */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Card 1: Employee ID */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs text-left relative overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between min-h-[90px]">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-400"></div>
          <div className="flex justify-between items-start gap-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Employee ID</span>
            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </div>
          <span className="text-xs font-bold text-slate-900 mt-2 font-mono truncate">{loggedWaiter.employeeId}</span>
        </div>

        {/* Card 2: Shift */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs text-left relative overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between min-h-[90px]">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
          <div className="flex justify-between items-start gap-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Shift Timing</span>
            <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          </div>
          <span className="text-xs font-bold text-slate-900 mt-2 truncate">{loggedWaiter.shiftTiming}</span>
        </div>

        {/* Card 3: Assigned Zone */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs text-left relative overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between min-h-[90px]">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500"></div>
          <div className="flex justify-between items-start gap-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Floor Zone</span>
            <TableProperties className="w-3.5 h-3.5 text-purple-500 shrink-0" />
          </div>
          <span className="text-xs font-bold text-slate-900 mt-2 truncate">{loggedWaiter.assignedSection}</span>
        </div>

        {/* Card 4: Working Hours */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs text-left relative overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between min-h-[90px]">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500"></div>
          <div className="flex justify-between items-start gap-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Work Hours</span>
            <TrendingUp className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          </div>
          <span className="text-xs font-bold text-slate-900 mt-2 truncate">
            {attendanceStatus === 'CHECKED_IN' ? workingHoursToday || '0h 0m' : attendanceStatus === 'CHECKED_OUT' ? workingHoursToday : 'Shift Pending'}
          </span>
        </div>

        {/* Card 5: Attendance */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs text-left relative overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between min-h-[90px]">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-pink-500"></div>
          <div className="flex justify-between items-start gap-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Attendance</span>
            <CalendarIcon className="w-3.5 h-3.5 text-pink-500 shrink-0" />
          </div>
          <span className="text-xs font-bold text-slate-900 mt-2 truncate">
            {attendanceStatus === 'CHECKED_IN' ? `In: ${checkInTime}` : attendanceStatus === 'CHECKED_OUT' ? `Out: ${checkOutTime}` : 'Not Checked In'}
          </span>
        </div>

        {/* Card 6: Current Status */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs text-left relative overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between min-h-[90px]">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>
          <div className="flex justify-between items-start gap-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Status</span>
            <Coffee className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          </div>
          <span className="text-xs font-bold text-slate-900 mt-2 flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${attendanceStatus === 'CHECKED_IN' ? 'bg-emerald-500 animate-pulse' : attendanceStatus === 'CHECKED_OUT' ? 'bg-slate-400' : 'bg-amber-500'}`}></span>
            <span className="truncate">
              {attendanceStatus === 'CHECKED_IN' ? 'On Duty' : attendanceStatus === 'CHECKED_OUT' ? 'Shift Ended' : 'Off Duty'}
            </span>
          </span>
        </div>
      </div>

      {/* DASHBOARD TAB BADGES - Left-Sidebar pattern on desktop, top-scrollable strip on mobile */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className="w-full lg:w-60 bg-white rounded-2xl border border-slate-100 p-4 shrink-0 space-y-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2.5 block text-left">Navigation</div>
          
          <div className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible gap-1 pb-2 lg:pb-0 scrollbar-none">
            {[
              { id: 'dashboard', label: 'Overview Dashboard', icon: Utensils },
              { id: 'tables', label: 'Assigned Tables', icon: TableProperties, badge: myTablesList.length },
              { id: 'orders', label: 'Active Orders', icon: Clock, badge: myActiveOrdersList.length },
              { id: 'profile', label: 'My Profile', icon: User },
              { id: 'attendance', label: 'Attendance Calendar', icon: CalendarIcon },
              { id: 'leave', label: 'Leave Requests', icon: FileText, badge: leaveRequests.filter(l => l.status === 'PENDING').length },
              { id: 'messages', label: 'Message Center', icon: MessageSquare },
              { id: 'shift', label: 'Shift Information', icon: Layers },
              { id: 'performance', label: 'Performance Analytics', icon: TrendingUp },
              { id: 'history', label: 'Work History', icon: History }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full py-2.5 px-3 rounded-xl flex items-center justify-between font-semibold text-xs cursor-pointer transition text-left shrink-0 lg:shrink-1 ${
                  activeTab === tab.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <tab.icon className="w-4 h-4" />
                  <span className="whitespace-nowrap">{tab.label}</span>
                </div>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    activeTab === tab.id ? 'bg-white text-emerald-600' : 'bg-slate-100 text-slate-700'
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
                  className="w-full py-2.5 px-3 rounded-xl flex items-center gap-2 font-bold text-xs text-rose-600 hover:bg-rose-50 cursor-pointer transition text-left"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Shift Check-Out</span>
                </button>
              ) : (attendanceStatus as any) === 'CHECKED_OUT' ? (
                <div className="w-full py-2.5 px-3 rounded-xl flex items-center gap-2 font-bold text-xs text-slate-400 bg-slate-50 border border-slate-200/60">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                  <span>Shift Completed</span>
                </div>
              ) : (
                <div className="w-full py-2.5 px-3 rounded-xl flex items-center gap-2 font-bold text-xs text-amber-605 bg-amber-50/50 border border-amber-100/50">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
                  <span>Awaiting Check-In</span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 mt-2 w-full">
              <button
                onClick={() => logout()}
                className="w-full py-2.5 px-3 rounded-xl flex items-center gap-2 font-bold text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 cursor-pointer transition text-left"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout Session</span>
              </button>
            </div>
          </div>
        </div>

        {/* MAIN TAB CONTENT */}
        <div className="flex-1 w-full space-y-6">
          
          {/* TAB 1: OVERVIEW DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* KPI metrics row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { 
                    label: 'Shift Timings', 
                    val: '09:00 AM – 06:00 PM', 
                    desc: 'Active shift duty', 
                    icon: Clock, 
                    iconColor: 'text-blue-500', 
                    trend: 'On Time', 
                    trendColor: 'text-blue-600 bg-blue-50/60 border-blue-100' 
                  },
                  { 
                    label: 'Work Hours Today', 
                    val: attendanceStatus === 'CHECKED_IN' ? workingHoursToday || '0h 0m' : (attendanceStatus as any) === 'CHECKED_OUT' ? workingHoursToday : 'Shift Pending', 
                    desc: attendanceStatus === 'CHECKED_IN' ? `Checked in at ${checkInTime}` : (attendanceStatus as any) === 'CHECKED_OUT' ? `Ended at ${checkOutTime}` : 'Attendance Pending', 
                    icon: Coffee, 
                    iconColor: 'text-amber-500', 
                    trend: attendanceStatus === 'CHECKED_IN' ? 'Active' : (attendanceStatus as any) === 'CHECKED_OUT' ? 'Completed' : 'Pending', 
                    trendColor: attendanceStatus === 'CHECKED_IN' ? 'text-amber-600 bg-amber-50/60 border-amber-100' : (attendanceStatus as any) === 'CHECKED_OUT' ? 'text-emerald-600 bg-emerald-50/60 border-emerald-100' : 'text-slate-500 bg-slate-50 border-slate-200/60' 
                  },
                  { 
                    label: 'Orders Served Today', 
                    val: `${servedTasksList.length || 18} Orders`, 
                    desc: 'Target: 25 orders', 
                    icon: CheckCircle2, 
                    iconColor: 'text-emerald-500', 
                    trend: '+12%', 
                    trendColor: 'text-emerald-600 bg-emerald-50/60 border-emerald-100' 
                  },
                  { 
                    label: 'Customers Served', 
                    val: '42 Guests', 
                    desc: `Average rating ${loggedWaiter.performanceRating}★`, 
                    icon: User, 
                    iconColor: 'text-indigo-500', 
                    trend: '94% sat', 
                    trendColor: 'text-emerald-600 bg-emerald-50/60 border-emerald-100' 
                  }
                ].map((card, idx) => (
                  <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200/80 text-left shadow-xs flex flex-col justify-between hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 min-h-[120px]">
                    <div className="flex justify-between items-start">
                      <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                        <card.icon className={`w-4 h-4 ${card.iconColor}`} />
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${card.trendColor}`}>
                        {card.trend}
                      </span>
                    </div>
                    
                    <div className="mt-4">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">{card.label}</span>
                      <span className="text-lg font-extrabold text-slate-900 mt-1 block tracking-tight">{card.val}</span>
                      <span className="text-[10px] text-slate-400 font-medium mt-0.5 block truncate">{card.desc}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Actions Panel */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 text-left space-y-4 shadow-xs relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-600"></div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Quick Actions Console</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3.5">
                  {[
                    { label: 'Assigned Tables', desc: 'View floor seating', tab: 'tables', icon: TableProperties, hoverBg: 'hover:bg-blue-50/50 hover:border-blue-200 text-slate-700 hover:text-blue-700', iconColor: 'text-blue-600' },
                    { label: 'Kitchen Orders', desc: 'Monitor active KOTs', tab: 'orders', icon: Utensils, hoverBg: 'hover:bg-orange-50/50 hover:border-orange-200 text-slate-700 hover:text-orange-700', iconColor: 'text-orange-600' },
                    { label: 'Attendance', desc: 'Check duty status', tab: 'attendance', icon: Clock, hoverBg: 'hover:bg-emerald-50/50 hover:border-emerald-200 text-slate-700 hover:text-emerald-700', iconColor: 'text-emerald-600' },
                    { label: 'Leave Request', desc: 'Apply for leaves', tab: 'leave', icon: CalendarIcon, hoverBg: 'hover:bg-rose-50/50 hover:border-rose-200 text-slate-700 hover:text-rose-700', iconColor: 'text-rose-600' },
                    { label: 'Messages', desc: 'View staff inbox', tab: 'messages', icon: MessageSquare, hoverBg: 'hover:bg-indigo-50/50 hover:border-indigo-200 text-slate-700 hover:text-indigo-700', iconColor: 'text-indigo-600' },
                    { label: 'Profile', desc: 'Account setting', tab: 'profile', icon: User, hoverBg: 'hover:bg-slate-55 hover:border-slate-300 text-slate-700 hover:text-slate-900', iconColor: 'text-slate-600' },
                    { label: 'History', desc: 'Shift roster logs', tab: 'history', icon: History, hoverBg: 'hover:bg-teal-50/50 hover:border-teal-200 text-slate-700 hover:text-teal-700', iconColor: 'text-teal-600' }
                  ].map((act, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveTab(act.tab as any)}
                      className={`p-3.5 rounded-xl border border-slate-200/80 bg-white text-left cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs active:scale-95 flex flex-col justify-between min-h-[110px] relative overflow-hidden ${act.hoverBg}`}
                    >
                      <div className="absolute top-0 right-0 w-8 h-8 bg-slate-50 rounded-bl-xl flex items-center justify-center border-l border-b border-slate-100">
                        <act.icon className={`w-3.5 h-3.5 ${act.iconColor}`} />
                      </div>
                      <div className="mt-8">
                        <div className="font-semibold text-xs text-slate-900 mt-2">{act.label}</div>
                        <div className="text-[9px] text-slate-500 mt-0.5 leading-tight">{act.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tables & Orders Quick Glances split */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Tables summary */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 text-left space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-semibold text-slate-900">Your Floor Tables</h3>
                    <button onClick={() => setActiveTab('tables')} className="text-xs font-bold text-slate-600 hover:underline">View All</button>
                  </div>

                  <div className="space-y-2.5">
                    {myTablesList.map(table => {
                      const hasOrder = (table.kitchenOrders || []).length > 0;
                      return (
                        <div key={table.id} className="flex justify-between items-center py-2.5 px-3 bg-slate-50 rounded-xl text-xs border border-slate-100">
                          <div className="font-semibold text-slate-800">{table.tableNumber} ({getFloor(table.tableNumber)})</div>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                            hasOrder ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {hasOrder ? 'Active Orders' : 'Available'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Orders ready summary */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 text-left space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-semibold text-slate-900">Ready to Serve</h3>
                    <button onClick={() => setActiveTab('orders')} className="text-xs font-bold text-slate-600 hover:underline">View All</button>
                  </div>

                  <div className="space-y-2.5">
                    {readyTasksList.length > 0 ? (
                      readyTasksList.map(task => (
                        <div key={task.id} className="flex justify-between items-center py-2.5 px-3 bg-emerald-50/40 rounded-xl text-xs border border-emerald-100">
                          <div className="font-semibold text-slate-800">{task.tableNumber} • KOT #{task.kitchenOrder?.id?.slice(-4).toUpperCase()}</div>
                          <button
                            onClick={() => handleUpdateTaskStatus(task.id, 'served')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1 px-2.5 rounded-lg text-[10px] cursor-pointer"
                          >
                            Serve Food
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center text-slate-400 font-bold text-xs uppercase">No orders ready to serve</div>
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: MY TABLES */}
          {activeTab === 'tables' && (
            <div className="space-y-4 text-left">
              <h3 className="text-sm font-semibold text-slate-900">Assigned Floor Seating</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {myTablesList.map(table => {
                  const activeOrders = table.kitchenOrders || [];
                  const hasOrder = activeOrders.length > 0;
                  const guests = hasOrder ? Math.max(...activeOrders.map((o: any) => o.customerCount || 2)) : 0;
                  const total = hasOrder ? activeOrders.reduce((sum: number, o: any) => sum + o.totalAmount, 0) : 0;
                  
                  let elapsedStr = '--';
                  if (hasOrder) {
                    const minTime = Math.min(...activeOrders.map((o: any) => new Date(o.createdAt).getTime()));
                    elapsedStr = `${Math.floor((nowTime - minTime) / 60000)}m elapsed`;
                  }

                  let accentColor = 'bg-slate-350';
                  if (hasOrder) {
                    const status = activeOrders[0]?.status;
                    if (status === 'PREPARING') accentColor = 'bg-amber-500';
                    else if (status === 'READY') accentColor = 'bg-emerald-500';
                    else if (status === 'BILL_REQUESTED') accentColor = 'bg-rose-500';
                    else accentColor = 'bg-blue-500';
                  } else {
                    accentColor = 'bg-slate-200';
                  }

                  return (
                    <div key={table.id} className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-4 flex flex-col justify-between min-h-[210px] hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 relative overflow-hidden text-left">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-300">
                        <div className={`w-full h-full ${accentColor}`}></div>
                      </div>
                      <div className="pl-1 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-mono font-bold text-sm text-slate-900">{table.tableNumber}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                            !hasOrder ? 'bg-slate-100 text-slate-500 border-slate-200' :
                            activeOrders[0]?.status === 'PREPARING' ? 'bg-amber-50 text-amber-700 border-amber-250' :
                            activeOrders[0]?.status === 'READY' ? 'bg-emerald-50 text-emerald-700 border-emerald-250 animate-pulse' :
                            activeOrders[0]?.status === 'BILL_REQUESTED' ? 'bg-rose-50 text-rose-700 border-rose-250' :
                            'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                            {!hasOrder ? 'Vacant' :
                             activeOrders[0]?.status === 'PREPARING' ? 'Preparing Food' :
                             activeOrders[0]?.status === 'READY' ? 'Ready to Serve' :
                             activeOrders[0]?.status === 'BILL_REQUESTED' ? 'Bill Requested' :
                             'Dining'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{getFloor(table.tableNumber)}</p>
                      </div>

                      <div className="pl-1 space-y-1.5 text-xs text-slate-700">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Guest Count</span>
                          <span className="font-bold">{guests} Pax</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Total Amount</span>
                          <span className="font-bold">₹{total.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Active Timer</span>
                          <span className="font-semibold text-slate-600">{elapsedStr}</span>
                        </div>
                      </div>

                      <div className="pl-1 flex gap-2 shrink-0">
                        {hasOrder ? (
                          <>
                            <button
                              onClick={() => setSelectedTable(table)}
                              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-xl text-[10px] cursor-pointer text-center transition"
                            >
                              View Details
                            </button>
                            <button
                              onClick={() => simulateNotification('BILL')}
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-[10px] cursor-pointer text-center transition shadow-sm"
                            >
                              Request Bill
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => navigate(`/restaurant/take-order?tableId=${table.id}`)}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-xl text-[10px] cursor-pointer text-center flex items-center justify-center gap-1 transition"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Take Order</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: ACTIVE ORDERS */}
          {activeTab === 'orders' && (
            <div className="space-y-4 text-left">
              <h3 className="text-sm font-semibold text-slate-900">Active Kitchen Orders</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {myActiveOrdersList.map((order, idx) => {
                  let statusBadgeColor = 'bg-slate-100 text-slate-650 border-slate-205';
                  let displayStatus = order.status;
                  
                  if (order.status === 'PREPARING') {
                    statusBadgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
                    displayStatus = 'Preparing Food';
                  } else if (order.status === 'READY') {
                    statusBadgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-250 animate-pulse';
                    displayStatus = 'Ready to Serve';
                  } else if (order.status === 'BILL_REQUESTED') {
                    statusBadgeColor = 'bg-rose-50 text-rose-700 border-rose-250';
                    displayStatus = 'Bill Requested';
                  } else {
                    statusBadgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
                    displayStatus = 'Dining';
                  }

                  let accentColor = 'bg-slate-350';
                  if (order.status === 'PREPARING') accentColor = 'bg-amber-500';
                  else if (order.status === 'READY') accentColor = 'bg-emerald-500';
                  else if (order.status === 'BILL_REQUESTED') accentColor = 'bg-rose-500';
                  else accentColor = 'bg-blue-500';

                  return (
                    <div key={idx} className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-4 flex flex-col justify-between min-h-[190px] hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 relative overflow-hidden text-left">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-300">
                        <div className={`w-full h-full ${accentColor}`}></div>
                      </div>
                      <div className="pl-1 flex justify-between items-start">
                        <div>
                          <span className="font-mono font-bold text-sm text-slate-900">{order.tableNumber}</span>
                          <p className="text-[10px] text-slate-400 mt-0.5">{getFloor(order.tableNumber)}</p>
                        </div>
                        <span className={`text-[9px] font-extrabold px-2 py-0.5 border rounded-full ${statusBadgeColor}`}>
                          KOT #{order.kotNumber} • {displayStatus}
                        </span>
                      </div>

                      <div className="pl-1 text-xs space-y-1 text-slate-700 font-semibold">
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-medium">Order Placed At</span>
                          <span className="text-slate-900 font-mono">{formatTime(order.createdAt)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-medium">Elapsed Cooking Time</span>
                          <span className={`font-bold ${order.status === 'PREPARING' ? 'text-amber-600' : 'text-slate-500'}`}>
                            {getWaitingMinutes(order.createdAt)} Mins
                          </span>
                        </div>
                        <div className="pt-1.5 border-t border-slate-100 mt-1">
                          <span className="text-slate-400 font-medium block mb-0.5">Ordered Items:</span>
                          <span className="text-slate-800 text-[11px] font-medium leading-relaxed block">{order.foodSummary}</span>
                        </div>
                        {order.notes && (
                          <div className="text-[10px] text-amber-700 font-medium bg-amber-50/50 p-1.5 rounded-lg border border-amber-100/50 mt-1">
                            ⚠️ Note: {order.notes}
                          </div>
                        )}
                      </div>

                      <div className="pl-1 flex gap-2 pt-2 border-t border-slate-100">
                        {order.status === 'PREPARING' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'READY')}
                            className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 rounded-xl text-[10px] cursor-pointer text-center transition"
                          >
                            Simulate Food Ready
                          </button>
                        )}
                        {order.status === 'READY' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'SERVED')}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-[10px] cursor-pointer text-center transition animate-pulse"
                          >
                            Mark Served
                          </button>
                        )}
                        {order.status !== 'PREPARING' && order.status !== 'READY' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'BILL_REQUESTED')}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-[10px] cursor-pointer text-center transition shadow-sm"
                          >
                            Request Settlement
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {myActiveOrdersList.length === 0 && (
                  <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-100 shadow-xs">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">No active orders cooking in KDS</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: MY PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-6 text-left">
              {/* Profile Header Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-4 relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-600"></div>
                <div className="w-16 h-16 bg-slate-100 text-slate-800 border border-slate-200/60 rounded-2xl flex items-center justify-center font-bold text-xl uppercase shrink-0">
                  {loggedWaiter.name.split(' ').map(n => n[0]).join('') || 'WT'}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">{loggedWaiter.name}</h3>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">Captain / Floor Waiter • Food & Beverage Dept</p>
                </div>
              </div>

              {/* Redesigned 5-Section Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 1. Personal Information */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Personal Information</h4>
                    <div className="space-y-2 text-xs font-semibold text-slate-700">
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-400 font-medium">Employee ID</span>
                        <span className="text-slate-900 font-mono">{loggedWaiter.employeeId}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-400 font-medium">Full Name</span>
                        <span className="text-slate-900">{loggedWaiter.name}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-400 font-medium">Phone</span>
                        <span className="text-slate-900">{loggedWaiter.mobile}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-400 font-medium">Email</span>
                        <span className="text-slate-900">{loggedWaiter.email}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-400 font-medium">Joining Date</span>
                        <span className="text-slate-900">{loggedWaiter.joiningDate}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-400 font-medium">Designation</span>
                        <span className="text-slate-900">Floor Captain / Waiter</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Today's Shift */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500"></div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Today's Shift</h4>
                    <div className="space-y-2 text-xs font-semibold text-slate-700">
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-400 font-medium">Shift Time</span>
                        <span className="text-slate-900">{loggedWaiter.shiftTiming}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-400 font-medium">Assigned Zone</span>
                        <span className="text-slate-900">{loggedWaiter.zone}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-400 font-medium">Assigned Tables</span>
                        <span className="text-slate-900">{myTablesList.map(t => t.tableNumber).join(', ') || 'None'}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-400 font-medium">Current Status</span>
                        <span className={`font-bold ${attendanceStatus === 'CHECKED_IN' ? 'text-emerald-600' : attendanceStatus === 'CHECKED_OUT' ? 'text-slate-500' : 'text-amber-500'}`}>
                          {attendanceStatus === 'CHECKED_IN' ? '🟢 On Duty' : attendanceStatus === 'CHECKED_OUT' ? '🔴 Checked Out' : '⚠️ Attendance Pending'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Attendance */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Attendance Summary</h4>
                    <div className="space-y-2 text-xs font-semibold text-slate-700">
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-400 font-medium">Check-In</span>
                        <span className="text-slate-900 font-mono">{checkInTime || 'Pending'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-400 font-medium">Check-Out</span>
                        <span className="text-slate-900 font-mono">{checkOutTime || 'Pending'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-400 font-medium">Working Hours</span>
                        <span className="text-slate-900 font-mono">{workingHoursToday || '0h 0m'}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-400 font-medium">Attendance Rate</span>
                        <span className="text-emerald-600 font-bold">{loggedWaiter.attendancePercent}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Leave Summary */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500"></div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Leave Summary</h4>
                    <div className="space-y-2 text-xs font-semibold text-slate-700">
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-400 font-medium">Available Leave Balance</span>
                        <span className="text-slate-900">{loggedWaiter.leaveBalance} Days</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-400 font-medium">Pending Requests</span>
                        <span className="text-amber-600">{leaveRequests.filter(r => r.status === 'PENDING').length} Requests</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-400 font-medium">Approved Requests</span>
                        <span className="text-emerald-600">{leaveRequests.filter(r => r.status === 'APPROVED').length} Requests</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-400 font-medium">Rejected Requests</span>
                        <span className="text-rose-600">{leaveRequests.filter(r => r.status === 'REJECTED').length} Requests</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5. Performance */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 relative overflow-hidden flex flex-col justify-between md:col-span-2">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Performance & Metrics</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                        <span className="text-[10px] text-slate-400 block mb-0.5">Orders Served</span>
                        <span className="text-sm font-bold text-slate-900">18 Orders</span>
                      </div>
                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                        <span className="text-[10px] text-slate-400 block mb-0.5">Customers Served</span>
                        <span className="text-sm font-bold text-slate-900">42 Guests</span>
                      </div>
                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                        <span className="text-[10px] text-slate-400 block mb-0.5">Avg Service Time</span>
                        <span className="text-sm font-bold text-slate-900">14 Mins</span>
                      </div>
                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                        <span className="text-[10px] text-slate-400 block mb-0.5">Performance Rating</span>
                        <span className="text-sm font-bold text-emerald-650">★ {loggedWaiter.performanceRating} / 5.0</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 5: ATTENDANCE CALENDAR */}
          {activeTab === 'attendance' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 text-left space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-semibold text-slate-900">Monthly Roster: July 2026</h3>
                <div className="flex gap-3 text-[10px] font-bold">
                  <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500"></span> <span>Present</span></div>
                  <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-500"></span> <span>Late</span></div>
                  <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-rose-500"></span> <span>Absent</span></div>
                  <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-orange-400"></span> <span>Leave</span></div>
                  <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-slate-300"></span> <span>Weekly Off</span></div>
                </div>
              </div>

              {/* Monthly calendar visual layout (July 2026 starts on Wed) */}
              <div className="grid grid-cols-7 gap-2.5 text-center text-xs">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                  <span key={d} className="font-bold text-slate-400 py-1.5">{d}</span>
                ))}
                
                {/* Pad 2 empty boxes since Wed is 1st day */}
                <div className="py-3 bg-slate-50/20"></div>
                <div className="py-3 bg-slate-50/20"></div>

                {/* June attendance status map */}
                {Array.from({ length: 31 }).map((_, idx) => {
                  const day = idx + 1;
                  // Wednesday (day 1, 8, 15, 22, 29) etc. Let's color-code based on status:
                  let colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100';
                  if ([3, 11, 19, 26].includes(day)) {
                    // Weekly off (Sundays)
                    colorClass = 'bg-slate-100 text-slate-600 border-slate-200';
                  } else if (day === 10) {
                    // Late Arrival
                    colorClass = 'bg-amber-50 text-amber-700 border-amber-200';
                  } else if (day === 22) {
                    // Sick Leave
                    colorClass = 'bg-orange-50 text-orange-700 border-orange-200';
                  } else if (day === 24) {
                    // Absent
                    colorClass = 'bg-rose-50 text-rose-700 border-rose-250';
                  }

                  return (
                    <div
                      key={day}
                      className={`py-3.5 border rounded-xl font-bold transition flex flex-col items-center justify-center ${colorClass}`}
                    >
                      <span>{day}</span>
                    </div>
                  );
                })}
              </div>

              {/* Roster stats summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100 text-xs font-semibold text-slate-700">
                <div className="p-3 bg-slate-50 rounded-xl text-center">
                  <span className="text-slate-400 block mb-0.5">Present Days</span>
                  <span className="text-base font-bold text-slate-900">24 / 27 Days</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl text-center">
                  <span className="text-slate-400 block mb-0.5">Late Arrivals</span>
                  <span className="text-base font-bold text-amber-600">1 Day</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl text-center">
                  <span className="text-slate-400 block mb-0.5">Leaves Approved</span>
                  <span className="text-base font-bold text-orange-600">1 Day</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl text-center">
                  <span className="text-slate-400 block mb-0.5">Absent Count</span>
                  <span className="text-base font-bold text-rose-600">1 Day</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: LEAVE MANAGEMENT */}
          {activeTab === 'leave' && (
            <div className="space-y-6 text-left">
              {/* Leave balances row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Casual Leave</span>
                    <span className="text-xl font-bold text-slate-900 mt-1 block font-mono">4 Days</span>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">Remaining balance</span>
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                    CL
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sick Leave</span>
                    <span className="text-xl font-bold text-slate-900 mt-1 block font-mono">6 Days</span>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">Remaining balance</span>
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs">
                    SL
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Earned Leave</span>
                    <span className="text-xl font-bold text-slate-900 mt-1 block font-mono">10 Days</span>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">Remaining balance</span>
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                    EL
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Request Form */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 space-y-4 lg:col-span-1 h-fit">
                <h3 className="text-sm font-semibold text-slate-909">Request Shift Leave</h3>
                
                {leaveFeedback && (
                  <div className="p-3 bg-blue-50 border border-blue-100 text-blue-600 rounded-xl text-xs font-semibold">
                    {leaveFeedback}
                  </div>
                )}

                <form onSubmit={handleRequestLeave} className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Leave Category</label>
                    <select
                      value={leaveType}
                      onChange={(e) => setLeaveType(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    >
                      <option>Sick Leave</option>
                      <option>Casual Leave</option>
                      <option>Earned Leave</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Start Date</label>
                    <input
                      type="date"
                      required
                      value={leaveStart}
                      onChange={(e) => setLeaveStart(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-202 rounded-lg focus:outline-none text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">End Date</label>
                    <input
                      type="date"
                      required
                      value={leaveEnd}
                      onChange={(e) => setLeaveEnd(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-202 rounded-lg focus:outline-none text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Reason for request</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="e.g. Dental checkup appointment"
                      value={leaveReason}
                      onChange={(e) => setLeaveReason(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-202 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer transition text-center shadow-sm"
                  >
                    Submit Request
                  </button>
                </form>
              </div>

              {/* Request Ledger */}
              <div className="bg-white p-5 rounded-2xl border border-slate-100 space-y-4 lg:col-span-2">
                <h3 className="text-sm font-semibold text-slate-909">Requests Log History</h3>
                
                <div className="space-y-3.5">
                  {leaveRequests.map(req => {
                    let badgeColor = 'bg-amber-50 text-amber-700 border-amber-100';
                    if (req.status === 'APPROVED') badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-100';
                    if (req.status === 'REJECTED') badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';

                    return (
                      <div key={req.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs flex flex-col sm:flex-row justify-between gap-3">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900 text-sm">{req.leaveType}</span>
                            <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold ${badgeColor}`}>
                              {req.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium">Requested: {req.startDate} to {req.endDate} ({req.reason})</p>
                          {req.responseBy && (
                            <p className="text-[10px] text-slate-400 font-semibold italic">Reviewed by {req.responseBy}: "{req.responseReason}"</p>
                          )}
                        </div>

                        {req.status === 'PENDING' && (
                          <div className="flex gap-1.5 items-center shrink-0 self-end sm:self-center">
                            <span className="text-[9px] font-bold text-slate-400 uppercase mr-1">Demo Simulator:</span>
                            <button
                              onClick={() => simulateManagerLeaveAction(req.id, 'APPROVED')}
                              className="py-1 px-2 bg-emerald-600 text-white rounded font-bold text-[9px] cursor-pointer hover:bg-emerald-700"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => simulateManagerLeaveAction(req.id, 'REJECTED')}
                              className="py-1 px-2 bg-rose-600 text-white rounded font-bold text-[9px] cursor-pointer hover:bg-rose-700"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              </div>
            </div>
          )}

          {/* TAB 7: MESSAGE CENTER */}
          {activeTab === 'messages' && (
            <div className="bg-white rounded-2xl border border-slate-100 text-left shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[500px]">
              {/* Sidebar filter list */}
              <div className="w-full md:w-56 bg-slate-50/50 border-r border-slate-100 p-4 shrink-0 space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Inbox Categories</span>
                  <p className="text-[10px] text-slate-500 font-medium">Official communication log</p>
                </div>
                <div className="space-y-1">
                  {['All Messages', 'Unread Updates', 'Starred'].map((cat, idx) => (
                    <button
                      key={idx}
                      className={`w-full py-2 px-3 text-left font-semibold text-xs rounded-lg transition-colors ${
                        idx === 0 ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-650 hover:bg-slate-100'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message List and compose form */}
              <div className="flex-1 flex flex-col justify-between">
                <div className="p-4 border-b border-slate-100 bg-slate-50/20 flex justify-between items-center shrink-0">
                  <h3 className="font-semibold text-sm text-slate-900">Notification Inbox</h3>
                  <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full">
                    {chatMessages.filter(m => m.status === 'unread').length} New
                  </span>
                </div>

                {/* Inbox Items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3.5 max-h-[350px] scrollbar-thin">
                  {chatMessages.map((msg) => {
                    const isManager = msg.sender === 'manager';
                    const isKitchen = msg.sender === 'kitchen';
                    const isAdmin = msg.sender === 'admin';
                    const isWaiter = msg.sender === 'waiter';

                    let roleBadgeColor = 'bg-slate-100 text-slate-600';
                    if (isManager) roleBadgeColor = 'bg-purple-50 text-purple-700 border-purple-100';
                    if (isKitchen) roleBadgeColor = 'bg-amber-50 text-amber-700 border-amber-100';
                    if (isAdmin) roleBadgeColor = 'bg-blue-50 text-blue-700 border-blue-100';
                    if (isWaiter) roleBadgeColor = 'bg-emerald-600 text-white border-emerald-600';

                    return (
                      <div
                        key={msg.id}
                        className={`p-4 bg-white rounded-xl border border-slate-100 hover:shadow-xs transition duration-200 flex flex-col gap-2.5 ${
                          msg.status === 'unread' ? 'border-l-4 border-l-emerald-600 bg-slate-50/10' : ''
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-800">{msg.senderName}</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${roleBadgeColor}`}>
                              {msg.sender.toUpperCase()}
                            </span>
                            {msg.status === 'unread' && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium">{msg.timestamp}</span>
                        </div>
                        <p className="text-xs text-slate-650 font-medium leading-relaxed">{msg.text}</p>
                        <div className="flex gap-2 justify-end pt-1">
                          {msg.status === 'unread' && (
                            <button
                              onClick={() => {
                                setChatMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'read' } : m));
                              }}
                              className="text-[10px] font-bold text-slate-550 hover:text-slate-900 cursor-pointer"
                            >
                              Mark Read
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setNewMessageText(`Replying to ${msg.senderName}: `);
                            }}
                            className="text-[10px] font-bold text-emerald-600 hover:underline cursor-pointer"
                          >
                            Reply
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Reply Form */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 bg-slate-50/50 flex gap-2 shrink-0">
                  <input
                    type="text"
                    placeholder="Type a professional update or reply..."
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                    className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600 font-medium text-slate-905"
                  />
                  <button
                    type="submit"
                    className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer transition flex items-center gap-1.5 shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Update</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 8: SHIFT INFORMATION */}
          {activeTab === 'shift' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 text-left space-y-6">
              <h3 className="text-sm font-semibold text-slate-909">Today's Shift Roster Details</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Supervisor</span>
                    <p className="text-sm font-semibold text-slate-800">Manager Bob (Ground Floor)</p>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Assigned Section</span>
                    <p className="text-sm font-semibold text-slate-800">{loggedWaiter.assignedSection} ({loggedWaiter.zone})</p>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Break timings</span>
                    <p className="text-sm font-semibold text-slate-800">01:00 PM – 01:45 PM</p>
                  </div>
                </div>

                <div className="p-5 border border-slate-150 rounded-2xl space-y-3.5">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Duties & Protocols</h4>
                  <ul className="text-xs text-slate-600 font-semibold space-y-2 list-disc pl-4">
                    <li>Arrive 10 minutes prior to shift clock-in for daily briefing notes.</li>
                    <li>Ensure tables in Section A are sanitized and cleared of clutter.</li>
                    <li>Always check for "Order Ready" notifications instantly to prevent food serving delays.</li>
                    <li>Ensure bill settlement request signals are relayed to the billing counter promptly.</li>
                    <li>Clock shift checkout attendance record upon completion of duty rotation.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: PERFORMANCE */}
          {activeTab === 'performance' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 text-left space-y-6">
              <h3 className="text-sm font-semibold text-slate-909">Performance Analytics Profile</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Avg Serving Time', val: '12 Mins', change: 'Top 10%', isPositive: true },
                  { label: 'Weekly Rating', val: '4.8 / 5.0', change: 'Consistent', isPositive: true },
                  { label: 'Table Turn Rate', val: '42 Mins', change: 'Fast turnaround', isPositive: true },
                  { label: 'Orders Handled', val: '320 Bills', change: 'This month', isPositive: true }
                ].map((card, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">{card.label}</span>
                    <span className="text-base font-bold text-slate-900 mt-1 block">{card.val}</span>
                    <span className="text-[10px] text-emerald-650 font-bold mt-1 block">✓ {card.change}</span>
                  </div>
                ))}
              </div>

              {/* Progress Bars visualizer */}
              <div className="space-y-4 pt-4 border-t border-slate-100 text-xs font-semibold text-slate-700">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Service Competency Scores</h4>
                
                <div className="space-y-3">
                  {[
                    { label: 'Order Processing Speed', score: 92 },
                    { label: 'Guest Feedback Rating', score: 96 },
                    { label: 'Attendance Compliance', score: 98 },
                    { label: 'Side Work & Grooming', score: 90 }
                  ].map((prog, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between font-bold">
                        <span>{prog.label}</span>
                        <span>{prog.score}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${prog.score}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 10: WORK HISTORY */}
          {activeTab === 'history' && (
            <div className="bg-white p-5 rounded-2xl border border-slate-100 text-left space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <h3 className="text-sm font-semibold text-slate-909">Shift Log History Roster</h3>
                
                <div className="relative w-full sm:w-48 shrink-0">
                  <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400">
                    <Search className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search by date (YYYY-MM-DD)..."
                    value={searchHistoryDate}
                    onChange={(e) => setSearchHistoryDate(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600 font-medium text-slate-900"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Check-In</th>
                      <th className="py-2.5 px-3">Check-Out</th>
                      <th className="py-2.5 px-3">Working Hours</th>
                      <th className="py-2.5 px-3">Orders Served</th>
                      <th className="py-2.5 px-3">Tables Managed</th>
                      <th className="py-2.5 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWorkHistory.map(item => (
                      <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 text-slate-705 font-medium">
                        <td className="py-3 px-3 font-semibold text-slate-900">{item.date}</td>
                        <td className="py-3 px-3">{item.checkIn}</td>
                        <td className="py-3 px-3">{item.checkOut}</td>
                        <td className="py-3 px-3">{item.workingHours}</td>
                        <td className="py-3 px-3">{item.ordersServed} Orders</td>
                        <td className="py-3 px-3">{item.tablesManaged} Tables</td>
                        <td className="py-3 px-3 text-right">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-150">
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filteredWorkHistory.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400 font-bold uppercase">No shift logs found matching filter date</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* TABLE SESSION OVERLAY MODAL */}
      {selectedTable && (() => {
        const activeOrders = selectedTable.kitchenOrders || [];
        const total = activeOrders.reduce((sum: number, o: any) => sum + o.totalAmount, 0);

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 p-6 relative flex flex-col text-left">
              
              <button
                onClick={() => setSelectedTable(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex justify-between items-center mb-3 pr-6">
                <h3 className="font-semibold text-slate-909 text-base">
                  Session Detail - {selectedTable.tableNumber}
                </h3>
                <span className="text-[9px] font-extrabold px-2 py-0.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-full">
                  OCCUPIED
                </span>
              </div>

              <div className="space-y-4 my-4 flex-grow overflow-y-auto max-h-[60vh] pr-1">
                {/* Table details grid */}
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs font-semibold text-slate-700">
                  <div>
                    <span className="text-slate-400 block">Table Number</span>
                    <span className="text-slate-900 font-bold">{selectedTable.tableNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Zone Floor</span>
                    <span className="text-slate-900 font-bold">{getFloor(selectedTable.tableNumber)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Current Bill</span>
                    <span className="text-slate-900 font-bold">₹{total.toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Active KOTs</span>
                    <span className="text-slate-900 font-bold">{activeOrders.length} KOT sessions</span>
                  </div>
                </div>

                {/* Items preparing or ready */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">KOT Order Details</span>
                  <div className="border border-slate-100 rounded-2xl p-3 bg-slate-50/20 text-xs">
                    {activeOrders.map((o: any, idx: number) => (
                      <div key={idx} className="py-2.5 border-b border-slate-100 last:border-0">
                        <div className="flex justify-between font-bold mb-1.5">
                          <span className="text-slate-800">KOT #{o.id.slice(-4).toUpperCase()}</span>
                          <span className="text-orange-600">{o.status}</span>
                        </div>
                        <div className="space-y-1 pl-2.5 border-l-2 border-slate-200 text-slate-600">
                          {o.items?.map((it: any, itIdx: number) => (
                            <div key={itIdx} className="flex justify-between">
                              <span>{it.menuItem?.name}</span>
                              <span className="font-mono font-bold">x{it.quantity}</span>
                            </div>
                          ))}
                        </div>
                        {o.notes && (
                          <div className="mt-2 bg-amber-50/50 p-2 rounded-lg text-[10px] text-amber-700 font-medium italic flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Kitchen Note: "{o.notes}"</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer action links */}
              <div className="flex gap-2.5 pt-4 border-t border-slate-100 shrink-0">
                <button
                  onClick={() => {
                    setSelectedTable(null);
                    navigate(`/restaurant/take-order?tableId=${selectedTable.id}`);
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs cursor-pointer flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add More Items</span>
                </button>
                <button
                  onClick={() => setSelectedTable(null)}
                  className="w-1/3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs cursor-pointer text-center"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* NOTIFICATION DRAWER VIEW */}
      {showHistoryPanel && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-md bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col justify-between animate-slide-in">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-slate-700" />
                <h3 className="font-bold text-sm text-slate-900">Notifications Log</h3>
              </div>
              <button
                onClick={() => setShowHistoryPanel(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin">
              {notificationHistory.length === 0 ? (
                <div className="text-center py-20 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                    <Bell className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-slate-400 font-bold">No active notifications today.</p>
                </div>
              ) : (
                notificationHistory.map(notif => (
                  <div
                    key={notif.id}
                    className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs text-left flex gap-3 hover:shadow-xs transition"
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 shrink-0 font-bold">
                      ✓
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900 text-xs">{notif.tableNumber} - Order Alert</div>
                      <div className="text-slate-600 mt-1 leading-snug">{notif.itemsReady}</div>
                      <span className="text-[10px] text-slate-400 block mt-2 font-medium">
                        KOT #{notif.kotNumber} • {notif.readyTime}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50">
              <button
                disabled={notificationHistory.length === 0}
                onClick={() => setNotificationHistory([])}
                className="w-full bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
              >
                Clear History Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Styled Micro-Animations Injection */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes slide-in-right {
          0% { transform: translateX(120%); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in {
          animation: slide-in-right 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />
    </div>
  );
};

export default WaiterDashboard;

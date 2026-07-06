import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AttendanceWidget, AttendanceStatusType } from '../components/AttendanceWidget';
import {
  Receipt,
  ClipboardList,
  BadgeCheck,
  IndianRupee,
  CreditCard,
  Wallet,
  Smartphone,
  FileText,
  Printer,
  User,
  UtensilsCrossed,
  ShoppingBag,
  History as HistoryIcon,
  Clock,
  X,
  Loader2,
  Check,
  AlertCircle,
  TrendingUp,
  Volume2,
  VolumeX,
  Calendar,
  Search,
  Coins
} from 'lucide-react';

interface Waiter {
  id: string;
  name: string;
}

interface KitchenOrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  menuItem: {
    name: string;
    price: number;
  };
}

interface KitchenOrder {
  id: string;
  notes: string | null;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  status?: string;
  source?: 'DINE_IN' | 'TAKEAWAY' | 'ONLINE' | 'QR_MENU';
  paymentStatus?: 'PENDING' | 'PAID';
  items: KitchenOrderItem[];
  waiter?: Waiter;
}

interface Table {
  id: string;
  tableNumber: string;
  capacity: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'COOKING' | 'READY' | 'SERVED' | 'BILLING_PENDING' | 'CLEANING' | 'RESERVED';
  activeOrderId: string | null;
  kitchenOrders?: KitchenOrder[];
}

interface BillingHistoryRecord {
  id: string;
  invoiceNumber: string;
  tableNumber: string;
  orderSource: string;
  paymentMode: string;
  items: string;
  totalAmount: number;
  gst: number;
  waiterName: string;
  date: string;
  time: string;
  createdAt: string;
  amountReceived?: number | null;
  changeReturned?: number | null;
  cashierName?: string;
  discount?: number;
  subtotal?: number;
}

interface CashierNotification {
  id: string;
  type: 'info' | 'success' | 'error';
  message: string;
  timestamp: Date;
}

interface CashierAccount {
  id: string;
  employeeId: string;
  username: string;
  name: string;
  mobile: string;
  email: string;
  shiftTiming: string;
  joiningDate: string;
  performanceRating: number;
}

interface LeaveRequest {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedAt: string;
}

interface StaffMessage {
  id: string;
  sender: 'manager' | 'cashier';
  senderName: string;
  text: string;
  timestamp: string;
}

const MOCK_CASHIERS_LIST: CashierAccount[] = [
  {
    id: 'c-1',
    employeeId: 'EMP-CAS-1045',
    username: 'amit',
    name: 'Amit Patil',
    mobile: '+91 98765 43210',
    email: 'amit.patil@gourmetbistro.com',
    shiftTiming: 'Morning Shift (09:00 AM – 06:00 PM)',
    joiningDate: '12 Jan 2024',
    performanceRating: 4.9
  },
  {
    id: 'c-2',
    employeeId: 'EMP-CAS-1046',
    username: 'sunita',
    name: 'Sunita Sharma',
    mobile: '+91 98765 43211',
    email: 'sunita.sharma@gourmetbistro.com',
    shiftTiming: 'Evening Shift (03:00 PM – 12:00 AM)',
    joiningDate: '15 Feb 2024',
    performanceRating: 4.8
  }
];

export const CashierDashboard: React.FC = () => {
  const { user, apiRequest } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryTableId = searchParams.get('tableId');

  const [tables, setTables] = useState<Table[]>([]);
  const [billingHistory, setBillingHistory] = useState<BillingHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'queue' | 'history' | 'profile'>('queue');
  const [profileSubTab, setProfileSubTab] = useState<'personal' | 'attendance' | 'leave' | 'messages' | 'documents'>('personal');
  const [queueSubTab, setQueueSubTab] = useState<'ready' | 'pending'>('ready');
  const [soundMuted, setSoundMuted] = useState(false);
  const [notifications, setNotifications] = useState<CashierNotification[]>([]);
  
  // Real-time Clock
  const [currentTime, setCurrentTime] = useState(new Date());

  // Search filter
  const [historySearch, setHistorySearch] = useState('');
  
  // Selection states
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Table | null>(null);
  const [viewingHistoryRecord, setViewingHistoryRecord] = useState<BillingHistoryRecord | null>(null);
  
  // Shop Settings configuration
  const [settings, setSettings] = useState<any>({
    shopName: 'Gourmet Bistro',
    shopAddress: '123 Main St, Connaught Place, New Delhi',
    gstNumber: '07AAAAA1111A1Z1',
    mobileNumber: '+91 99999 88888',
    logo: '',
    upiId: 'merchant@okaxis',
  });

  // Transaction checkout screens
  const [showSuccessScreen, setShowSuccessScreen] = useState<boolean>(false);
  const [settledInvoice, setSettledInvoice] = useState<any | null>(null);
  
  // Settle inputs
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [useDiscountPercent, setUseDiscountPercent] = useState<boolean>(true);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'UPI' | 'SPLIT'>('UPI');
  
  // Payment methods calculation inputs
  const [cashReceived, setCashReceived] = useState<string>('');
  const [isWaitingPayment, setIsWaitingPayment] = useState<boolean>(false);
  const [paymentCountdown, setPaymentCountdown] = useState<number | null>(null);
  const [splitCash, setSplitCash] = useState<string>('');
  const [splitCard, setSplitCard] = useState<string>('');
  const [splitUpi, setSplitUpi] = useState<string>('');
  
  // Card terminal simulation states
  const [cardState, setCardState] = useState<'IDLE' | 'SWIPING' | 'AUTHORIZING' | 'APPROVED' | 'SUCCESS'>('IDLE');
  const [cardDetails, setCardDetails] = useState<{ number: string; type: string; txId: string; refNo: string } | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);

  const API_BASE = 'http://localhost:5000/api';
  const soundMutedRef = useRef(soundMuted);

  // Sync Logged Cashier Profile based on active auth user or default selection
  const [loggedCashier, setLoggedCashier] = useState<CashierAccount>(MOCK_CASHIERS_LIST[0]);
  
  // Dynamic Attendance Dates
  const getAttendanceDate = (): string => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const activeDate = getAttendanceDate();

  // Load attendance details dynamically from LocalStorage for current loggedCashier
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatusType>(null);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [checkOutTime, setCheckOutTime] = useState<string | null>(null);
  const [workingHoursToday, setWorkingHoursToday] = useState<string>('0h 0m');

  // Cashier Leave requests local state
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [newLeaveType, setNewLeaveType] = useState('Sick Leave');
  const [newLeaveStart, setNewLeaveStart] = useState('');
  const [newLeaveEnd, setNewLeaveEnd] = useState('');
  const [newLeaveReason, setNewLeaveReason] = useState('');

  // Cashier chat messages local state
  const [messages, setMessages] = useState<StaffMessage[]>([]);
  const [newMessageText, setNewMessageText] = useState('');

  // Sync credentials on auth updates
  useEffect(() => {
    if (user) {
      const empName = user.employee?.name || user.name || 'Amit Patil';
      const matched = MOCK_CASHIERS_LIST.find(c => 
        c.name.toLowerCase() === empName.toLowerCase() ||
        c.username.toLowerCase() === (user.employee?.employeeId || '').toLowerCase()
      ) || MOCK_CASHIERS_LIST[0];
      setLoggedCashier(matched);
    }
  }, [user]);

  // Reload local cashier data when loggedCashier changes
  useEffect(() => {
    const statusKey = `pos_cashier_attendance_status_${loggedCashier.id}_${activeDate}`;
    const checkinKey = `pos_cashier_attendance_checkin_${loggedCashier.id}_${activeDate}`;
    const checkoutKey = `pos_cashier_attendance_checkout_${loggedCashier.id}_${activeDate}`;
    const hoursKey = `pos_cashier_attendance_hours_${loggedCashier.id}_${activeDate}`;

    setAttendanceStatus((localStorage.getItem(statusKey) || null) as AttendanceStatusType);
    setCheckInTime(localStorage.getItem(checkinKey));
    setCheckOutTime(localStorage.getItem(checkoutKey));
    setWorkingHoursToday(localStorage.getItem(hoursKey) || '0h 0m');

    // Reload leaves
    const leavesKey = `pos_cashier_leaves_${loggedCashier.id}`;
    const cachedLeaves = localStorage.getItem(leavesKey);
    if (cachedLeaves) {
      setLeaveRequests(JSON.parse(cachedLeaves));
    } else {
      const initialLeaves: LeaveRequest[] = [
        { id: 'l-1', leaveType: 'Sick Leave', startDate: '2026-06-12', endDate: '2026-06-13', reason: 'Flu recovery', status: 'APPROVED', requestedAt: '2026-06-11' },
        { id: 'l-2', leaveType: 'Casual Leave', startDate: '2026-07-20', endDate: '2026-07-22', reason: 'Family gathering', status: 'PENDING', requestedAt: '2026-07-05' }
      ];
      setLeaveRequests(initialLeaves);
      localStorage.setItem(leavesKey, JSON.stringify(initialLeaves));
    }

    // Reload chat messages
    const messagesKey = `pos_cashier_messages_${loggedCashier.id}`;
    const cachedMessages = localStorage.getItem(messagesKey);
    if (cachedMessages) {
      setMessages(JSON.parse(cachedMessages));
    } else {
      const initialMessages: StaffMessage[] = [
        { id: 'm-1', sender: 'manager', senderName: 'Manager Bob', text: 'Hi, please make sure to reconcile the cash drawer before shift checkout today.', timestamp: '09:15 AM' },
        { id: 'm-2', sender: 'cashier', senderName: loggedCashier.name, text: 'Sure, I will double check the cash totals.', timestamp: '09:20 AM' },
        { id: 'm-3', sender: 'manager', senderName: 'Manager Bob', text: 'Awesome. Thanks for the quick response!', timestamp: '09:22 AM' }
      ];
      setMessages(initialMessages);
      localStorage.setItem(messagesKey, JSON.stringify(initialMessages));
    }
  }, [loggedCashier, activeDate]);

  useEffect(() => {
    soundMutedRef.current = soundMuted;
  }, [soundMuted]);

  // Realtime Clock Updater
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Audio synths for alerts
  const playBellSound = () => {
    if (soundMutedRef.current) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(660, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch (e) {
      console.warn('Audio blocked by browser policy');
    }
  };

  const playSuccessSound = () => {
    if (soundMutedRef.current) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, audioCtx.currentTime);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1);
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(audioCtx.destination);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.45);
      osc1.start();
      osc2.start(audioCtx.currentTime + 0.1);
      osc1.stop(audioCtx.currentTime + 0.5);
      osc2.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.warn('Audio blocked by browser policy');
    }
  };

  const handleCardSwipeSimulate = () => {
    setCardState('SWIPING');
    playBellSound();
    
    setTimeout(() => {
      setCardState('AUTHORIZING');
      playBellSound();
      
      setTimeout(() => {
        const randTx = 'TXN' + Math.floor(10000000 + Math.random() * 90000000);
        const randRef = 'REF' + Math.floor(10000000 + Math.random() * 90000000);
        setCardDetails({
          number: '**** **** **** 4589',
          type: ['Visa', 'MasterCard', 'RuPay'][Math.floor(Math.random() * 3)],
          txId: randTx,
          refNo: randRef
        });
        setCardState('APPROVED');
        playSuccessSound();
        
        setTimeout(() => {
          setCardState('SUCCESS');
          handleConfirmSettle();
        }, 1200);
      }, 1200);
    }, 1200);
  };

  const addNotification = (type: 'info' | 'success' | 'error', message: string) => {
    const id = Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9);
    setNotifications(prev => {
      if (prev.some(n => n.message === message)) return prev;
      return [...prev, { id, type, message, timestamp: new Date() }];
    });
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

  const handleCheckIn = () => {
    const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const statusKey = `pos_cashier_attendance_status_${loggedCashier.id}_${activeDate}`;
    const checkinKey = `pos_cashier_attendance_checkin_${loggedCashier.id}_${activeDate}`;
    const hoursKey = `pos_cashier_attendance_hours_${loggedCashier.id}_${activeDate}`;

    localStorage.setItem(statusKey, 'CHECKED_IN');
    localStorage.setItem(checkinKey, timeStr);
    localStorage.setItem(hoursKey, '0h 0m');

    setAttendanceStatus('CHECKED_IN');
    setCheckInTime(timeStr);
    setWorkingHoursToday('0h 0m');
    addNotification('success', `Check-in successful for cashier ${loggedCashier.name}.`);
  };

  const handleCheckOut = () => {
    const timeOutStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const statusKey = `pos_cashier_attendance_status_${loggedCashier.id}_${activeDate}`;
    const checkoutKey = `pos_cashier_attendance_checkout_${loggedCashier.id}_${activeDate}`;
    const hoursKey = `pos_cashier_attendance_hours_${loggedCashier.id}_${activeDate}`;

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
        hoursFormatted = '8h 0m';
      }
    }

    localStorage.setItem(statusKey, 'CHECKED_OUT');
    localStorage.setItem(checkoutKey, timeOutStr);
    localStorage.setItem(hoursKey, hoursFormatted);

    setAttendanceStatus('CHECKED_OUT');
    setCheckOutTime(timeOutStr);
    setWorkingHoursToday(hoursFormatted);
    addNotification('success', `Check-out successful for cashier ${loggedCashier.name}.`);
  };

  // Submit leave locally
  const handleApplyLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeaveStart || !newLeaveEnd || !newLeaveReason.trim()) {
      addNotification('error', 'Please fill all leave fields.');
      return;
    }
    const request: LeaveRequest = {
      id: 'l-' + Date.now(),
      leaveType: newLeaveType,
      startDate: newLeaveStart,
      endDate: newLeaveEnd,
      reason: newLeaveReason,
      status: 'PENDING',
      requestedAt: new Date().toISOString().split('T')[0]
    };
    const updated = [request, ...leaveRequests];
    setLeaveRequests(updated);
    localStorage.setItem(`pos_cashier_leaves_${loggedCashier.id}`, JSON.stringify(updated));
    setNewLeaveStart('');
    setNewLeaveEnd('');
    setNewLeaveReason('');
    addNotification('success', 'Leave request submitted to Manager.');
  };

  // Send message locally
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim()) return;

    const newMsg: StaffMessage = {
      id: 'm-' + Date.now(),
      sender: 'cashier',
      senderName: loggedCashier.name,
      text: newMessageText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    const updated = [...messages, newMsg];
    setMessages(updated);
    localStorage.setItem(`pos_cashier_messages_${loggedCashier.id}`, JSON.stringify(updated));
    setNewMessageText('');

    setTimeout(() => {
      const replyMsg: StaffMessage = {
        id: 'mr-' + Date.now(),
        sender: 'manager',
        senderName: 'Manager Bob',
        text: 'Message received. I will check the billing logs accordingly.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => {
        const next = [...prev, replyMsg];
        localStorage.setItem(`pos_cashier_messages_${loggedCashier.id}`, JSON.stringify(next));
        return next;
      });
      playBellSound();
    }, 1500);
  };

  // Fetch billing operations data
  const fetchData = async () => {
    try {
      setLoading(true);
      const tablesList = await apiRequest(`/restaurant/tables`);
      const sortedTables = (tablesList || []).sort((a: any, b: any) => {
        const numA = parseInt(a.tableNumber.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.tableNumber.replace(/\D/g, '')) || 0;
        return numA - numB;
      });

      const currentBillingPendingIds = tables.filter(t => t.status === 'BILLING_PENDING').map(t => t.id);
      const newBillingPendingTables = sortedTables.filter((t: any) => t.status === 'BILLING_PENDING' && !currentBillingPendingIds.includes(t.id));

      if (newBillingPendingTables.length > 0) {
        newBillingPendingTables.forEach((t: any) => {
          addNotification('info', `Billing request received for ${t.tableNumber}`);
        });
        playBellSound();
      }

      setTables(sortedTables);

      try {
        const dbSettings = await apiRequest('/settings');
        if (dbSettings) {
          setSettings({
            shopName: dbSettings.shopName || 'Gourmet Bistro',
            shopAddress: dbSettings.shopAddress || '123 Main St, Connaught Place, New Delhi',
            gstNumber: dbSettings.gstNumber || '07AAAAA1111A1Z1',
            mobileNumber: dbSettings.mobile || '+91 99999 88888',
            logo: dbSettings.logo || '',
            upiId: dbSettings.upiId || 'merchant@okaxis'
          });
        }
      } catch (errSettings) {
        console.warn('System settings not loaded, using local presets.');
      }

      const historyData = await apiRequest(`/restaurant/billing-history`);
      setBillingHistory(historyData || []);
    } catch (err) {
      console.warn('API connection offline. Seeding 100% complete dummy datasets.');
      
      const mockTables: Table[] = [
        {
          id: 't-1',
          tableNumber: 'T-08',
          capacity: 4,
          status: 'BILLING_PENDING',
          activeOrderId: 'o-101',
          kitchenOrders: [
            {
              id: 'o-101',
              notes: 'No spicy curry, extra naan',
              totalAmount: 1250,
              createdAt: new Date(Date.now() - 3600000).toISOString(),
              updatedAt: new Date(Date.now() - 600000).toISOString(),
              status: 'READY',
              source: 'DINE_IN',
              items: [
                { id: 'i-101', quantity: 2, unitPrice: 380, menuItem: { name: 'Chicken Biryani', price: 380 } },
                { id: 'i-102', quantity: 4, unitPrice: 50, menuItem: { name: 'Garlic Naan', price: 50 } },
                { id: 'i-103', quantity: 1, unitPrice: 210, menuItem: { name: 'Dal Makhani', price: 210 } },
                { id: 'i-104', quantity: 2, unitPrice: 40, menuItem: { name: 'Fresh Lime Soda', price: 40 } }
              ],
              waiter: { id: 'w-1', name: 'Amit Patil' }
            }
          ]
        },
        {
          id: 't-2',
          tableNumber: 'T-03',
          capacity: 4,
          status: 'BILLING_PENDING',
          activeOrderId: 'o-102',
          kitchenOrders: [
            {
              id: 'o-102',
              notes: 'Make noodles extra hot',
              totalAmount: 980,
              createdAt: new Date(Date.now() - 2400000).toISOString(),
              updatedAt: new Date(Date.now() - 400000).toISOString(),
              status: 'READY',
              source: 'DINE_IN',
              items: [
                { id: 'i-201', quantity: 2, unitPrice: 290, menuItem: { name: 'Veg Hakka Noodles', price: 290 } },
                { id: 'i-202', quantity: 1, unitPrice: 320, menuItem: { name: 'Chilli Paneer Dry', price: 320 } },
                { id: 'i-203', quantity: 1, unitPrice: 80, menuItem: { name: 'Iced Peach Tea', price: 80 } }
              ],
              waiter: { id: 'w-2', name: 'Amit Patil' }
            }
          ]
        },
        {
          id: 't-3',
          tableNumber: 'T-12',
          capacity: 2,
          status: 'BILLING_PENDING',
          activeOrderId: 'o-103',
          kitchenOrders: [
            {
              id: 'o-103',
              notes: 'Pre-paid QR Order',
              totalAmount: 760,
              createdAt: new Date(Date.now() - 1200000).toISOString(),
              updatedAt: new Date(Date.now() - 100000).toISOString(),
              status: 'READY',
              source: 'QR_MENU',
              paymentStatus: 'PAID',
              items: [
                { id: 'i-301', quantity: 1, unitPrice: 380, menuItem: { name: 'Paneer Butter Masala', price: 380 } },
                { id: 'i-302', quantity: 3, unitPrice: 60, menuItem: { name: 'Butter Naan', price: 60 } },
                { id: 'i-303', quantity: 2, unitPrice: 100, menuItem: { name: 'Iced Peach Tea', price: 100 } }
              ],
              waiter: { id: 'w-0', name: 'Self Service' }
            }
          ]
        },
        {
          id: 't-4',
          tableNumber: 'T-05',
          capacity: 6,
          status: 'SERVED',
          activeOrderId: 'o-104',
          kitchenOrders: [
            {
              id: 'o-104',
              notes: 'Celebrate Bday',
              totalAmount: 2890,
              createdAt: new Date(Date.now() - 7200000).toISOString(),
              updatedAt: new Date(Date.now() - 1800000).toISOString(),
              status: 'SERVED',
              source: 'DINE_IN',
              items: [
                { id: 'i-401', quantity: 2, unitPrice: 850, menuItem: { name: 'Family Veg Platter', price: 850 } },
                { id: 'i-402', quantity: 2, unitPrice: 380, menuItem: { name: 'Veg Dum Biryani', price: 380 } },
                { id: 'i-403', quantity: 3, unitPrice: 110, menuItem: { name: 'Virgin Mojito', price: 110 } }
              ],
              waiter: { id: 'w-1', name: 'Vikram Singh' }
            }
          ]
        },
        {
          id: 't-5',
          tableNumber: 'T-01',
          capacity: 2,
          status: 'COOKING',
          activeOrderId: 'o-105',
          kitchenOrders: [
            {
              id: 'o-105',
              notes: null,
              totalAmount: 510,
              createdAt: new Date(Date.now() - 1800000).toISOString(),
              updatedAt: new Date(Date.now() - 900000).toISOString(),
              status: 'PREPARING',
              source: 'DINE_IN',
              items: [
                { id: 'i-501', quantity: 1, unitPrice: 390, menuItem: { name: 'Kadhai Paneer', price: 390 } },
                { id: 'i-502', quantity: 2, unitPrice: 60, menuItem: { name: 'Lachha Paratha', price: 60 } }
              ],
              waiter: { id: 'w-3', name: 'Kabir Dev' }
            }
          ]
        }
      ];

      const mockHistory: BillingHistoryRecord[] = [
        {
          id: 'h-1001',
          invoiceNumber: 'INV-2026-1045',
          tableNumber: 'T-08',
          orderSource: 'Dine-In',
          paymentMode: 'UPI',
          items: 'Chicken Biryani x2, Garlic Naan x4, Dal Makhani x1, Fresh Lime Soda x2',
          totalAmount: 1375.00,
          gst: 225.00,
          discount: 100.00,
          subtotal: 1250.00,
          waiterName: 'Amit Patil',
          cashierName: 'Amit Patil',
          date: new Date().toLocaleDateString('en-GB'),
          time: '12:42 PM',
          createdAt: new Date().toISOString()
        },
        {
          id: 'h-1002',
          invoiceNumber: 'INV-2026-1044',
          tableNumber: 'T-02',
          orderSource: 'Dine-In',
          paymentMode: 'CASH',
          items: 'Paneer Makhani x1, Butter Roti x3, Coke Can x2',
          totalAmount: 640.00,
          gst: 29.10,
          discount: 0.00,
          subtotal: 610.90,
          waiterName: 'Amit Patil',
          cashierName: 'Amit Patil',
          date: new Date().toLocaleDateString('en-GB'),
          time: '11:15 AM',
          createdAt: new Date().toISOString(),
          amountReceived: 1000.00,
          changeReturned: 360.00
        },
        {
          id: 'h-1003',
          invoiceNumber: 'INV-2026-1043',
          tableNumber: 'T-05',
          orderSource: 'QR_MENU',
          paymentMode: 'UPI',
          items: 'Veg Hakka Noodles x1, Spring Rolls x1',
          totalAmount: 510.00,
          gst: 23.20,
          discount: 0.00,
          subtotal: 486.80,
          waiterName: 'Self Service',
          cashierName: 'Sunita Sharma',
          date: new Date().toLocaleDateString('en-GB'),
          time: '09:30 AM',
          createdAt: new Date().toISOString()
        }
      ];

      setTables(mockTables);
      setBillingHistory(mockHistory);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const cachedTables = localStorage.getItem('cashier_tables');
    const cachedHistory = localStorage.getItem('cashier_history');
    if (cachedTables) setTables(JSON.parse(cachedTables));
    if (cachedHistory) setBillingHistory(JSON.parse(cachedHistory));

    const sseUrl = `${API_BASE}/restaurant/realtime`;
    const eventSource = new EventSource(sseUrl);

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (
          payload.type === 'TABLE_STATUS_CHANGE' ||
          payload.type === 'NEW_ORDER' ||
          payload.type === 'ORDER_STATUS_UPDATE' ||
          payload.type === 'NOTIFICATION'
        ) {
          fetchData();
        }
      } catch (err) {
        console.error('[SSE synchronization error]:', err);
      }
    };

    return () => {
      eventSource.close();
    };
  }, []);

  useEffect(() => {
    if (queryTableId && tables.length > 0) {
      const matched = tables.find(t => t.id === queryTableId);
      if (matched) {
        setSelectedTable(matched);
        setDiscountPercent(0);
        setDiscountAmount(0);
        setPaymentMethod('UPI');
        setCashReceived('');
        setCardState('IDLE');
        setCardDetails(null);
        searchParams.delete('tableId');
        setSearchParams(searchParams, { replace: true });
      }
    }
  }, [queryTableId, tables, searchParams, setSearchParams]);

  useEffect(() => {
    if (tables.length > 0) localStorage.setItem('cashier_tables', JSON.stringify(tables));
  }, [tables]);

  useEffect(() => {
    if (billingHistory.length > 0) localStorage.setItem('cashier_history', JSON.stringify(billingHistory));
  }, [billingHistory]);

  useEffect(() => {
    if (isWaitingPayment && paymentCountdown !== null) {
      if (paymentCountdown > 0) {
        const timer = setTimeout(() => {
          setPaymentCountdown(paymentCountdown - 1);
        }, 1000);
        return () => clearTimeout(timer);
      } else {
        handleConfirmSettle();
        setIsWaitingPayment(false);
        setPaymentCountdown(null);
      }
    }
  }, [isWaitingPayment, paymentCountdown]);

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const getBillDetails = (table: Table | null) => {
    if (!table || !table.kitchenOrders || table.kitchenOrders.length === 0) {
      return {
        subtotal: 0,
        taxAmount: 0,
        serviceChargeAmount: 0,
        discountValue: 0,
        grandTotal: 0,
        items: [] as KitchenOrderItem[],
        waiterName: 'Self Service',
        sessionStartTime: '--:--',
        billingRequestedTime: '--:--',
        customerName: 'Rahul Sharma',
        orderType: 'Dine-In',
        isPaidOnline: false,
        guestCount: table?.capacity || 2
      };
    }

    const consolidatedItemsMap = new Map<string, any>();
    let isPaid = false;
    let orderSrc: 'DINE_IN' | 'TAKEAWAY' | 'ONLINE' | 'QR_MENU' = 'DINE_IN';
    
    for (const order of table.kitchenOrders) {
      if (order.source) {
        orderSrc = order.source;
      }
      if (order.paymentStatus === 'PAID') {
        isPaid = true;
      }
      if (order.items) {
        for (const item of order.items) {
          const key = item.menuItem?.name || 'Dish';
          const price = item.unitPrice || item.menuItem?.price || 0;
          if (consolidatedItemsMap.has(key)) {
            const existing = consolidatedItemsMap.get(key)!;
            existing.quantity += item.quantity;
          } else {
            consolidatedItemsMap.set(key, {
              id: item.id,
              quantity: item.quantity,
              unitPrice: price,
              menuItem: {
                name: key,
                price: price
              }
            });
          }
        }
      }
    }

    const consolidatedItemsList = Array.from(consolidatedItemsMap.values());
    const subtotal = consolidatedItemsList.reduce((sum, it) => sum + (it.quantity * it.unitPrice), 0);
    
    let discountValue = 0;
    if (useDiscountPercent) {
      discountValue = subtotal * (discountPercent / 100);
    } else {
      discountValue = Math.min(subtotal, discountAmount);
    }

    const taxableAmount = Math.max(0, subtotal - discountValue);
    const taxAmount = taxableAmount * 0.18; // 18% GST matches user's request (Subtotal 1250 -> GST 225)
    const grandTotal = Math.max(0, taxableAmount + taxAmount);

    const firstOrder = table.kitchenOrders[0];
    const latestOrder = table.kitchenOrders[table.kitchenOrders.length - 1];
    
    const uniqueWaiters = Array.from(new Set(table.kitchenOrders.map(o => o.waiter?.name).filter(Boolean)));
    const waiterName = uniqueWaiters.length > 0 ? uniqueWaiters.join(', ') : 'Amit Patil';

    let orderTypeLabel = 'Dine-In';
    if (orderSrc === 'ONLINE') orderTypeLabel = 'Online';
    else if (orderSrc === 'QR_MENU') orderTypeLabel = 'QR Menu';
    else if (orderSrc === 'TAKEAWAY') orderTypeLabel = 'Takeaway';

    return {
      subtotal,
      taxAmount,
      serviceChargeAmount: 0,
      discountValue,
      grandTotal,
      items: consolidatedItemsList,
      waiterName,
      sessionStartTime: new Date(firstOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      billingRequestedTime: new Date(latestOrder.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      customerName: latestOrder.notes ? latestOrder.notes : 'Rahul Sharma',
      orderType: orderTypeLabel,
      isPaidOnline: isPaid,
      guestCount: table.capacity || 2
    };
  };

  const currentBill = getBillDetails(selectedTable);
  const changeReturned = Math.max(0, (parseFloat(cashReceived) || 0) - currentBill.grandTotal);
  const splitTotalPaid = (parseFloat(splitCash) || 0) + (parseFloat(splitCard) || 0) + (parseFloat(splitUpi) || 0);
  const splitRemaining = Math.max(0, currentBill.grandTotal - splitTotalPaid);

  const handleConfirmSettle = async () => {
    if (!selectedTable) return;
    try {
      setIsProcessing(true);
      
      let selectedMethod = paymentMethod;
      if (paymentMethod === 'SPLIT') {
        if (Math.abs(splitRemaining) > 0.01) {
          addNotification('error', `Split payment incomplete. ₹${splitRemaining.toFixed(2)} remaining.`);
          setIsProcessing(false);
          return;
        }
        selectedMethod = 'SPLIT';
      }

      const payload = {
        tableId: selectedTable.id,
        paymentMethod: selectedMethod,
        discount: currentBill.discountValue,
        serviceCharge: 0,
        tax: currentBill.taxAmount,
        customerId: null,
        cashierName: loggedCashier.name,
        customerMobile: '0000000000',
        amountReceived: paymentMethod === 'CASH' ? parseFloat(cashReceived) || currentBill.grandTotal : null,
        changeReturned: paymentMethod === 'CASH' ? Math.max(0, (parseFloat(cashReceived) || 0) - currentBill.grandTotal) : null
      };

      try {
        const res = await apiRequest('/restaurant/tables/settle', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        setSettledInvoice(res.invoice);
      } catch (err) {
        console.warn('API settlement offline. Building local invoice log.');
        const mockInvoice = {
          id: 'inv-' + Math.floor(1000 + Math.random() * 9000),
          invoiceNumber: 'INV-2026-' + Math.floor(1000 + Math.random() * 9000),
          tableNumber: selectedTable.tableNumber,
          totalAmount: currentBill.grandTotal,
          paymentMode: selectedMethod,
          waiterName: currentBill.waiterName,
          date: new Date().toLocaleDateString('en-GB'),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          pdfUrl: '#'
        };
        setSettledInvoice(mockInvoice);
      }

      playSuccessSound();
      addNotification('success', `${selectedTable.tableNumber} billing check finalized.`);
      
      // Save settled bill in cashier's logs
      const savedHistoryRecord: BillingHistoryRecord = {
        id: 'h-' + Date.now(),
        invoiceNumber: settledInvoice?.invoiceNumber || ('INV-2026-' + Math.floor(1000 + Math.random() * 9000)),
        tableNumber: selectedTable.tableNumber,
        orderSource: currentBill.orderType,
        paymentMode: selectedMethod,
        items: currentBill.items.map(it => `${it.menuItem?.name} x${it.quantity}`).join(', '),
        totalAmount: currentBill.grandTotal,
        gst: currentBill.taxAmount,
        discount: currentBill.discountValue,
        subtotal: currentBill.subtotal,
        waiterName: currentBill.waiterName,
        cashierName: loggedCashier.name,
        date: new Date().toLocaleDateString('en-GB'),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: new Date().toISOString()
      };

      setBillingHistory(prev => [savedHistoryRecord, ...prev]);
      setShowSuccessScreen(true);
      setCashReceived('');
      setSplitCash('');
      setSplitCard('');
      setSplitUpi('');
      setDiscountAmount(0);
      setDiscountPercent(0);

      fetchData();
    } catch (err: any) {
      addNotification('error', err.message || 'Settle operation failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDone = () => {
    setShowSuccessScreen(false);
    setSettledInvoice(null);
    setSelectedTable(null);
    setCardState('IDLE');
    setCardDetails(null);
    fetchData();
  };

  // Filter bills strictly by currently logged Cashier
  const todayDateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const cashierTodayBills = billingHistory.filter(h => h.date === todayDateStr && (h.cashierName === loggedCashier.name || h.cashierName === undefined));
  
  // Isolated Statistics calculations per cashier
  const todayTotalPayments = cashierTodayBills.reduce((sum, h) => sum + h.totalAmount, 0);
  const processedBillsCount = cashierTodayBills.length;
  const averageBillValue = processedBillsCount > 0 ? (todayTotalPayments / processedBillsCount) : 0;
  
  const todayCashCollection = cashierTodayBills
    .filter(h => h.paymentMode === 'CASH')
    .reduce((sum, h) => sum + h.totalAmount, 0);

  const todayUpiCollection = cashierTodayBills
    .filter(h => h.paymentMode === 'UPI')
    .reduce((sum, h) => sum + h.totalAmount, 0);

  const todayCardCollection = cashierTodayBills
    .filter(h => h.paymentMode === 'CARD')
    .reduce((sum, h) => sum + h.totalAmount, 0);

  // Queue tables
  const tablesWaitingBilling = tables.filter(t => t.status === 'BILLING_PENDING');
  const pendingPaymentsTables = tables.filter(t => ['OCCUPIED', 'COOKING', 'READY', 'SERVED'].includes(t.status));
  const currentTabTables = queueSubTab === 'ready' ? tablesWaitingBilling : pendingPaymentsTables;

  const filteredHistory = billingHistory.filter(h => {
    const q = historySearch.toLowerCase();
    return (
      h.invoiceNumber.toLowerCase().includes(q) ||
      h.tableNumber.toLowerCase().includes(q) ||
      h.waiterName.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          <span className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Loading Billing Terminal...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-slate-900 max-w-7xl mx-auto p-4 select-none min-h-screen pb-16 text-left" style={{ fontFamily: "'Inter', sans-serif" }}>
      
      {/* Alert toast notifications */}
      <div className="fixed top-5 right-5 z-[60] space-y-2 max-w-sm w-full pointer-events-none">
        {notifications.map(notif => (
          <div
            key={notif.id}
            className={`pointer-events-auto p-4 rounded-xl border shadow-xl flex items-start gap-3 bg-white ${
              notif.type === 'success'
                ? 'border-emerald-250 text-emerald-850 bg-emerald-50/50'
                : notif.type === 'error'
                ? 'border-rose-250 text-rose-850 bg-rose-50/50'
                : 'border-blue-250 text-blue-850 bg-blue-50/50'
            }`}
          >
            <AlertCircle className={`w-5 h-5 shrink-0 mt-0.5 ${notif.type === 'success' ? 'text-emerald-500' : notif.type === 'error' ? 'text-rose-500' : 'text-blue-500'}`} />
            <div className="flex-1 text-sm font-semibold leading-normal">{notif.message}</div>
            <button
              onClick={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
              className="text-slate-405 hover:text-slate-650 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Settle background blocker */}
      {isProcessing && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-[99] flex items-center justify-center p-4">
          <div className="bg-white border border-slate-150 rounded-2xl p-6 text-center space-y-4 shadow-xl max-w-xs w-full">
            <Loader2 className="w-9 h-9 text-emerald-600 animate-spin mx-auto" />
            <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Processing Check Settle...</p>
          </div>
        </div>
      )}

      {/* 1. PREMIUM DARK BANNER HEADER (Matches wait/chef staff style) */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden text-left">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-1 text-left">
            <h1 className="text-3xl font-semibold tracking-tight text-white">
              Good Morning, {loggedCashier.name.split(' ')[0]} 👋
            </h1>
            <p className="text-slate-300 font-medium text-sm mt-1">
              Manage today's billing, customer payments, and invoices efficiently.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-stretch lg:self-auto justify-between lg:justify-end">
            
            {/* Cashier profile swap switcher (testing & multiple cashiers) */}
            <div className="bg-slate-800/80 border border-slate-700/60 px-3.5 py-1.5 rounded-xl text-left flex items-center gap-2 shadow-sm text-slate-200">
              <User className="w-4 h-4 text-slate-400" />
              <select
                value={loggedCashier.id}
                onChange={(e) => {
                  const matched = MOCK_CASHIERS_LIST.find(c => c.id === e.target.value);
                  if (matched) setLoggedCashier(matched);
                }}
                className="bg-transparent border-none p-0 text-xs font-bold text-slate-200 focus:ring-0 focus:outline-none cursor-pointer"
              >
                {MOCK_CASHIERS_LIST.map(c => (
                  <option key={c.id} value={c.id} className="text-slate-900">{c.name}</option>
                ))}
              </select>
            </div>

            {/* System Date */}
            <div className="bg-slate-800/80 border border-slate-700/60 px-3.5 py-1.5 rounded-xl text-left flex items-center gap-2 shadow-sm text-slate-200">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-medium">
                {currentTime.toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
              </span>
            </div>

            {/* System Time */}
            <div className="bg-slate-800/80 border border-slate-700/60 px-3.5 py-1.5 rounded-xl text-left flex items-center gap-2 shadow-sm text-slate-200">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-medium font-mono">
                {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
              </span>
            </div>
            
            {/* Shift Timing info */}
            <div className="bg-slate-800/80 border border-slate-700/60 px-3.5 py-1.5 rounded-xl text-left flex items-center gap-2 shadow-sm text-slate-200">
              <span className="text-xs font-medium">
                Shift: {loggedCashier.shiftTiming.split('(')[0].trim()}
              </span>
            </div>

            <button
              onClick={() => setSoundMuted(!soundMuted)}
              className="p-2 bg-slate-800/80 border border-slate-700/60 rounded-xl hover:bg-slate-750 transition-colors flex items-center justify-center cursor-pointer text-slate-200"
            >
              {soundMuted ? <VolumeX className="w-4 h-4 text-rose-455" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
          </div>
        </div>
      </div>

      {/* 2. NAVIGATION BAR */}
      <div className="bg-white border border-slate-205 rounded-2xl p-2.5 flex items-center justify-between shadow-xs">
        <div className="flex gap-2">
          {[
            { id: 'queue', label: 'Billing Operations', icon: Receipt },
            { id: 'history', label: 'Completed Invoices', icon: HistoryIcon },
            { id: 'profile', label: 'Cashier Profile Page', icon: User }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-550 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. ACTIVE TAB VIEWER */}
      <div className="transition-all duration-200">
        
        {/* TAB 1: OPERATIONAL BILLING OPERATIONS */}
        {activeTab === 'queue' && (
          <div className="space-y-8">
            
            {/* Attendance Widget */}
            <AttendanceWidget
              status={attendanceStatus}
              checkInTime={checkInTime}
              checkOutTime={checkOutTime}
              workingHours={workingHoursToday}
              shiftName={loggedCashier.shiftTiming}
              nowTime={currentTime}
              onCheckIn={handleCheckIn}
              onCheckOut={handleCheckOut}
            />

            {/* KPI Metrics */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              {[
                {
                  title: "Today's Bills",
                  value: cashierTodayBills.length.toString(),
                  desc: "Processed checks log",
                  icon: <Receipt className="w-5 h-5" />,
                  colorClass: "bg-blue-50 border-blue-100 text-blue-600",
                  trend: "Stable",
                  trendColor: "text-slate-400 bg-slate-50",
                  action: () => { setQueueSubTab('ready'); }
                },
                {
                  title: "Pending Bills",
                  value: tablesWaitingBilling.length.toString(),
                  desc: "Awaiting final checkout",
                  icon: <ClipboardList className="w-5 h-5" />,
                  colorClass: "bg-orange-50 border-orange-100 text-orange-655",
                  trend: "↑ 4%",
                  trendColor: "text-emerald-600 bg-emerald-50/70",
                  action: () => { setQueueSubTab('ready'); }
                },
                {
                  title: "Completed Bills",
                  value: processedBillsCount.toString(),
                  desc: "Settled check log entries",
                  icon: <BadgeCheck className="w-5 h-5" />,
                  colorClass: "bg-purple-50 border-purple-100 text-purple-600",
                  trend: "↑ 12%",
                  trendColor: "text-emerald-600 bg-emerald-50/70",
                  action: () => { setActiveTab('history'); }
                },
                {
                  title: "Today's Collection",
                  value: `₹${todayTotalPayments.toLocaleString('en-IN', { minimumFractionDigits: 0 })}`,
                  desc: "Total cashier revenue",
                  icon: <IndianRupee className="w-5 h-5" />,
                  colorClass: "bg-emerald-50 border-emerald-100 text-emerald-600",
                  trend: "↑ 12%",
                  trendColor: "text-emerald-600 bg-emerald-50/70",
                  action: () => { setActiveTab('history'); }
                },
                {
                  title: "Average Bill Value",
                  value: `₹${averageBillValue.toLocaleString('en-IN', { minimumFractionDigits: 0 })}`,
                  desc: "Average check size today",
                  icon: <TrendingUp className="w-5 h-5" />,
                  colorClass: "bg-indigo-50 border-indigo-100 text-indigo-600",
                  trend: "Stable",
                  trendColor: "text-slate-400 bg-slate-50",
                  action: () => { setActiveTab('history'); }
                }
              ].map((kpi, idx) => (
                <div
                  key={idx}
                  onClick={kpi.action}
                  className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs flex flex-col justify-between min-h-[160px] w-full transition-all duration-200 cursor-pointer hover:shadow-md hover:-translate-y-0.5"
                >
                  <div className="flex justify-between items-center w-full">
                    <div className={`p-2.5 rounded-xl border ${kpi.colorClass} flex items-center justify-center`}>
                      {kpi.icon}
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${kpi.trendColor}`}>
                      {kpi.trend}
                    </span>
                  </div>
                  <div className="mt-4 text-left">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">{kpi.title}</span>
                    <span className="text-2xl font-bold text-slate-800 mt-1 block leading-tight">{kpi.value}</span>
                    <span className="text-xs text-slate-500 mt-1.5 block leading-tight font-semibold">{kpi.desc}</span>
                  </div>
                </div>
              ))}
            </section>

            {/* Billing Queue List */}
            <div className="space-y-6">
              
              <div className="flex border-b border-slate-200 gap-6">
                {[
                  { id: 'ready', label: 'Ready for Payment', count: tablesWaitingBilling.length, color: 'border-emerald-500 text-emerald-650' },
                  { id: 'pending', label: 'Pending Billing', count: pendingPaymentsTables.length, color: 'border-amber-500 text-amber-650' }
                ].map(subTab => (
                  <button
                    key={subTab.id}
                    onClick={() => setQueueSubTab(subTab.id as any)}
                    className={`pb-3 text-sm font-bold uppercase tracking-wider relative cursor-pointer flex items-center gap-2 transition-colors ${
                      queueSubTab === subTab.id
                        ? `${subTab.color} border-b-2 font-extrabold`
                        : 'text-slate-450 hover:text-slate-700'
                    }`}
                  >
                    <span>{subTab.label}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      queueSubTab === subTab.id
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-655'
                    }`}>
                      {subTab.count}
                    </span>
                  </button>
                ))}
              </div>

              {currentTabTables.length === 0 ? (
                <div className="bg-white border border-slate-200 p-16 rounded-2xl text-center space-y-4 shadow-xs">
                  <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                    <UtensilsCrossed className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-750 uppercase tracking-widest">Queue Empty</h3>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto leading-normal">
                      All orders at this status are fully processed.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs text-left">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-650">
                      <thead className="bg-slate-50 text-xs text-slate-455 uppercase tracking-widest font-bold border-b border-slate-202">
                        <tr>
                          <th className="py-4 px-5">Invoice # / Table</th>
                          <th className="py-4 px-5">Customer</th>
                          <th className="py-4 px-5">Waiter</th>
                          <th className="py-4 px-5">Order Time</th>
                          <th className="py-4 px-5">Items count</th>
                          <th className="py-4 px-5 text-right">Grand Total</th>
                          <th className="py-4 px-5 text-center">Status</th>
                          <th className="py-4 px-5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                        {currentTabTables.map((table) => {
                          const bill = getBillDetails(table);
                          return (
                            <tr key={table.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-4 px-5 font-mono">
                                <div className="font-bold text-slate-900 text-sm">{table.tableNumber}</div>
                                <div className="text-xs text-slate-400 font-medium">INV-2026-{(1046 + parseInt(table.tableNumber.replace(/\D/g, '')) || 1046)}</div>
                              </td>
                              <td className="py-4 px-5">
                                <div className="flex items-center gap-1.5">
                                  <User className="w-4 h-4 text-slate-400" />
                                  <span className="text-slate-800">{bill.customerName}</span>
                                </div>
                              </td>
                              <td className="py-4 px-5 text-slate-500 font-medium text-xs">
                                {bill.waiterName}
                              </td>
                              <td className="py-4 px-5 font-mono text-slate-400 text-xs">
                                {bill.sessionStartTime}
                              </td>
                              <td className="py-4 px-5 font-mono">
                                <div className="flex items-center gap-1">
                                  <ShoppingBag className="w-4 h-4 text-slate-400" />
                                  <span>{bill.items.reduce((s, i) => s + i.quantity, 0)} Items</span>
                                </div>
                              </td>
                              <td className="py-4 px-5 text-right font-mono font-bold text-slate-900 text-sm">
                                ₹{bill.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="py-4 px-5 text-center">
                                {bill.isPaidOnline ? (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 uppercase tracking-widest">
                                    Paid Online
                                  </span>
                                ) : table.status === 'BILLING_PENDING' ? (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-200 bg-rose-50 text-rose-700 uppercase tracking-widest">
                                    Awaiting Paid
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200 bg-slate-50 text-slate-500 uppercase tracking-widest">
                                    Dining
                                  </span>
                                )}
                              </td>
                              <td className="py-4 px-5 text-right">
                                <div className="flex justify-end gap-2.5">
                                  <button
                                    onClick={() => setSelectedOrderDetails(table)}
                                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer transition-colors"
                                  >
                                    View Order
                                  </button>
                                  
                                  {bill.isPaidOnline ? (
                                    <button
                                      onClick={() => {
                                        setSelectedTable(table);
                                        setSettledInvoice(null);
                                        setShowSuccessScreen(true);
                                      }}
                                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors flex items-center gap-1 shadow-xs"
                                    >
                                      <Printer className="w-4 h-4" />
                                      <span>Print Invoice</span>
                                    </button>
                                  ) : table.status === 'BILLING_PENDING' ? (
                                    <button
                                      onClick={() => {
                                        setSelectedTable(table);
                                        setDiscountPercent(0);
                                        setDiscountAmount(0);
                                        setPaymentMethod('UPI');
                                        setCashReceived('');
                                        setCardState('IDLE');
                                        setCardDetails(null);
                                      }}
                                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
                                    >
                                      Collect Payment
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        setSelectedTable(table);
                                        setDiscountPercent(0);
                                        setDiscountAmount(0);
                                        setPaymentMethod('UPI');
                                        setCashReceived('');
                                        setCardState('IDLE');
                                        setCardDetails(null);
                                      }}
                                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
                                    >
                                      Generate Bill
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Today's Collections & Payment Breakdown Summary */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Collection summary sources */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs text-left hover:shadow-md transition-all duration-200">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-805 pb-3.5 border-b border-slate-100 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-indigo-500" />
                  <span>Today's Billing Source Summary</span>
                </h3>
                <div className="grid grid-cols-2 gap-4 mt-5">
                  <div className="border border-slate-100 p-4 rounded-xl text-left bg-slate-50/50">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Dine-In Bills</span>
                    <span className="text-sm font-bold text-slate-850 block mt-1.5">
                      {cashierTodayBills.filter(b => b.orderSource?.toLowerCase().includes('dine') || b.orderSource === 'DINE_IN').length} Bills
                    </span>
                  </div>
                  <div className="border border-slate-100 p-4 rounded-xl text-left bg-slate-50/50">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Takeaway Bills</span>
                    <span className="text-sm font-bold text-slate-855 block mt-1.5">
                      {cashierTodayBills.filter(b => b.orderSource?.toLowerCase().includes('takeaway') || b.orderSource === 'TAKEAWAY').length} Bills
                    </span>
                  </div>
                  <div className="border border-slate-100 p-4 rounded-xl text-left bg-slate-50/50">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Online Orders</span>
                    <span className="text-sm font-bold text-slate-855 block mt-1.5">
                      {cashierTodayBills.filter(b => b.orderSource?.toLowerCase().includes('online') || b.orderSource === 'ONLINE').length} Bills
                    </span>
                  </div>
                  <div className="border border-slate-100 p-4 rounded-xl text-left bg-slate-50/50">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Average Bill Amount</span>
                    <span className="text-sm font-bold text-emerald-600 block mt-1.5">
                      ₹{averageBillValue.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment channel breakdown */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs text-left hover:shadow-md transition-all duration-200">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-805 pb-3.5 border-b border-slate-100 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-500" />
                  <span>Payment Method Distribution</span>
                </h3>
                <div className="space-y-4 mt-5">
                  {[
                    { label: 'UPI Payments', value: todayUpiCollection, color: 'bg-emerald-500' },
                    { label: 'Cash Payments', value: todayCashCollection, color: 'bg-indigo-500' },
                    { label: 'Card Payments', value: todayCardCollection, color: 'bg-blue-500' }
                  ].map((pm, idx) => {
                    const percentage = todayTotalPayments > 0 ? (pm.value / todayTotalPayments) * 100 : 0;
                    return (
                      <div key={idx} className="space-y-2 text-xs font-semibold text-slate-655">
                        <div className="flex justify-between items-center">
                          <span>{pm.label}</span>
                          <span className="font-bold text-slate-800">
                            ₹{pm.value.toLocaleString('en-IN', { minimumFractionDigits: 0 })} ({percentage.toFixed(0)}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                          <div className={`h-full ${pm.color} transition-all duration-500`} style={{ width: `${percentage}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </section>

            {/* Quick action buttons console */}
            <section className="space-y-4 text-left">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-450">Terminal Operations</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {[
                  {
                    label: 'Generate Bill',
                    desc: 'Checkout tables session',
                    icon: Receipt,
                    bgColor: 'bg-indigo-50 border-indigo-100',
                    textColor: 'text-indigo-600',
                    action: () => { setQueueSubTab('ready'); }
                  },
                  {
                    label: 'Pending Bills',
                    desc: 'Unpaid checks queue',
                    icon: ClipboardList,
                    bgColor: 'bg-orange-50 border-orange-100',
                    textColor: 'text-orange-655',
                    action: () => { setQueueSubTab('ready'); }
                  },
                  {
                    label: 'Completed Bills',
                    desc: 'Today\'s settled check list',
                    icon: BadgeCheck,
                    bgColor: 'bg-blue-50 border-blue-100',
                    textColor: 'text-blue-600',
                    action: () => { setActiveTab('history'); }
                  },
                  {
                    label: 'Invoice History',
                    desc: 'Counter invoice center',
                    icon: FileText,
                    bgColor: 'bg-purple-50 border-purple-100',
                    textColor: 'text-purple-600',
                    action: () => { setActiveTab('history'); }
                  },
                  {
                    label: 'Payment History',
                    desc: 'Completed transaction logs',
                    icon: HistoryIcon,
                    bgColor: 'bg-emerald-50 border-emerald-100',
                    textColor: 'text-emerald-600',
                    action: () => { setActiveTab('history'); }
                  },
                  {
                    label: 'Attendance History',
                    desc: 'Duty check calendar logs',
                    icon: Calendar,
                    bgColor: 'bg-rose-50 border-rose-100',
                    textColor: 'text-rose-600',
                    action: () => { setActiveTab('profile'); setProfileSubTab('attendance'); }
                  }
                ].map((act, idx) => (
                  <button
                    key={idx}
                    onClick={act.action}
                    className="p-5 bg-white border border-slate-205 rounded-2xl hover:border-emerald-600 hover:shadow-md hover:-translate-y-0.5 text-left flex flex-col justify-between min-h-[140px] w-full transition-all cursor-pointer"
                  >
                    <div className={`p-2.5 rounded-xl border w-fit ${act.bgColor} ${act.textColor} flex items-center justify-center`}>
                      <act.icon className="w-5 h-5" />
                    </div>
                    <div className="mt-3">
                      <span className="text-xs font-bold text-slate-800 block leading-tight">{act.label}</span>
                      <span className="text-xs text-slate-400 block mt-1.5 leading-normal font-medium">{act.desc}</span>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* TAB 2: COMPLETED INVOICES LOGBOOK */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-left space-y-1">
                <h2 className="text-sm font-bold uppercase tracking-widest text-slate-805">
                  Transaction History Logbook
                </h2>
                <p className="text-xs text-slate-500 font-semibold">
                  Today's settled counter invoices.
                </p>
              </div>

              <div className="relative max-w-sm w-full">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-450">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Search by invoice, table, cashier..."
                  className="w-full pl-9 pr-4 py-2 text-sm font-semibold rounded-lg bg-white border border-slate-205 focus:outline-none focus:border-emerald-600 text-slate-800"
                />
              </div>
            </div>

            {filteredHistory.length === 0 ? (
              <div className="bg-white border border-slate-200 p-16 rounded-2xl text-center space-y-3">
                <p className="text-sm text-slate-405 italic font-semibold">
                  No transactions matches current logbook search.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs text-left">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-slate-655">
                    <thead className="bg-slate-50 text-xs text-slate-450 uppercase tracking-widest font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-3.5 px-4">Invoice #</th>
                        <th className="py-3.5 px-4">Table</th>
                        <th className="py-3.5 px-4">Method</th>
                        <th className="py-3.5 px-4 text-right">Amount</th>
                        <th className="py-3.5 px-4">Waiter</th>
                        <th className="py-3.5 px-4">Cashier</th>
                        <th className="py-3.5 px-4">Time</th>
                        <th className="py-3.5 px-4 text-center">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {filteredHistory.map((h, i) => (
                        <tr
                          key={h.id || i}
                          onClick={() => setViewingHistoryRecord(h)}
                          className="hover:bg-slate-50/50 cursor-pointer transition-colors"
                        >
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-sm">
                            {h.invoiceNumber}
                          </td>
                          <td className="py-3.5 px-4 font-mono">{h.tableNumber}</td>
                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase bg-slate-50 border-slate-200 text-slate-605">
                              {h.paymentMode}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-slate-900 font-mono text-sm">
                            ₹{h.totalAmount.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500">{h.waiterName}</td>
                          <td className="py-3.5 px-4 text-slate-500">{h.cashierName || 'Amit Patil'}</td>
                          <td className="py-3.5 px-4 font-mono text-slate-400">{h.time || h.date}</td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewingHistoryRecord(h);
                                setSettledInvoice(null);
                                setTimeout(() => {
                                  window.print();
                                }, 100);
                              }}
                              className="text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer font-bold"
                            >
                              Print
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: DEDICATED CASHIER PROFILE PAGE */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 text-left items-start">
            
            {/* Left Column Navigation sub-tabs (Matches waiter console navigation block style) */}
            <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 p-4 space-y-1 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-3 block">
                Profile Navigation
              </span>
              {[
                { id: 'personal', label: 'Personal & Shift Info', icon: User },
                { id: 'attendance', label: 'Attendance Roster', icon: Calendar },
                { id: 'leave', label: 'Leave Center', icon: ClipboardList, badge: leaveRequests.filter(l => l.status === 'PENDING').length },
                { id: 'messages', label: 'Message Center', icon: Smartphone },
                { id: 'documents', label: 'Documents Vault', icon: FileText }
              ].map(subTab => (
                <button
                  key={subTab.id}
                  onClick={() => setProfileSubTab(subTab.id as any)}
                  className={`w-full py-2.5 px-3 rounded-xl flex items-center justify-between font-semibold text-xs cursor-pointer transition text-left ${
                    profileSubTab === subTab.id
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'hover:bg-slate-50 text-slate-650 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <subTab.icon className="w-4 h-4" />
                    <span>{subTab.label}</span>
                  </div>
                  {subTab.badge !== undefined && subTab.badge > 0 && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      profileSubTab === subTab.id ? 'bg-white text-emerald-600' : 'bg-slate-100 text-slate-705'
                    }`}>
                      {subTab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Right Column Content Pane */}
            <div className="lg:col-span-3 space-y-6">
              
              {/* Profile Top Banner Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex items-center gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                <div className="w-16 h-16 bg-slate-100 text-slate-700 rounded-full flex items-center justify-center font-bold text-xl border border-slate-202 shadow-xs shrink-0">
                  {loggedCashier.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-900 leading-tight">
                    {loggedCashier.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                    Senior Billing Agent ({loggedCashier.employeeId})
                  </p>
                </div>
              </div>

              {/* Sub-tab 1: Personal & Shift Details */}
              {profileSubTab === 'personal' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Personal info card */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-805 pb-2.5 border-b border-slate-100">
                      Personal Information
                    </h4>
                    <div className="space-y-3.5 text-xs font-semibold text-slate-600">
                      <div>
                        <span className="text-slate-400 block uppercase font-bold text-[9px] tracking-wider">Full Name</span>
                        <span className="text-slate-800 text-sm font-bold mt-0.5 block">{loggedCashier.name}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block uppercase font-bold text-[9px] tracking-wider">Employee ID</span>
                        <span className="text-slate-800 font-mono mt-0.5 block">{loggedCashier.employeeId}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block uppercase font-bold text-[9px] tracking-wider">Mobile Number</span>
                        <span className="text-slate-800 mt-0.5 block">{loggedCashier.mobile}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block uppercase font-bold text-[9px] tracking-wider">Email Address</span>
                        <span className="text-slate-800 mt-0.5 block">{loggedCashier.email}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block uppercase font-bold text-[9px] tracking-wider">Joining Date</span>
                        <span className="text-slate-800 mt-0.5 block">{loggedCashier.joiningDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Shift details card */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-805 pb-2.5 border-b border-slate-100">
                      Shift Information
                    </h4>
                    <div className="space-y-3.5 text-xs font-semibold text-slate-600">
                      <div>
                        <span className="text-slate-400 block uppercase font-bold text-[9px] tracking-wider">Assigned Shift</span>
                        <span className="text-slate-800 text-sm font-bold mt-0.5 block">{loggedCashier.shiftTiming.split('(')[0].trim()}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block uppercase font-bold text-[9px] tracking-wider">Shift Timings</span>
                        <span className="text-slate-855 mt-0.5 block">{loggedCashier.shiftTiming}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block uppercase font-bold text-[9px] tracking-wider">Today's Check-In</span>
                        <span className="text-slate-800 font-mono mt-0.5 block">{checkInTime || '--:--'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block uppercase font-bold text-[9px] tracking-wider">Today's Check-Out</span>
                        <span className="text-slate-800 font-mono mt-0.5 block">{checkOutTime || '--:--'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block uppercase font-bold text-[9px] tracking-wider">Working Hours Today</span>
                        <span className="text-slate-800 mt-0.5 block">{attendanceStatus === 'CHECKED_IN' ? workingHoursToday : 'Shift Pending'}</span>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* Sub-tab 2: Attendance & Performance Logs */}
              {profileSubTab === 'attendance' && (
                <div className="space-y-6">
                  
                  {/* Attendance ring card */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-805 pb-2.5 border-b border-slate-100">
                      Monthly Attendance Roster Summary
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-2">
                      <div className="border border-slate-100 p-4 rounded-xl text-left bg-slate-50/50">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Present Days</span>
                        <span className="text-sm font-bold text-slate-855 block mt-1.5">24 Days</span>
                      </div>
                      <div className="border border-slate-100 p-4 rounded-xl text-left bg-slate-50/50">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Absent Days</span>
                        <span className="text-sm font-bold text-slate-855 block mt-1.5">0 Days</span>
                      </div>
                      <div className="border border-slate-100 p-4 rounded-xl text-left bg-slate-50/50">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Leave Days</span>
                        <span className="text-sm font-bold text-slate-855 block mt-1.5">2 Days</span>
                      </div>
                      <div className="border border-slate-100 p-4 rounded-xl text-left bg-slate-50/50">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Late Check-Ins</span>
                        <span className="text-sm font-bold text-slate-855 block mt-1.5">1 Day</span>
                      </div>
                      <div className="border border-slate-100 p-4 rounded-xl text-left bg-slate-50/50">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Attendance Rate</span>
                        <span className="text-sm font-bold text-emerald-600 block mt-1.5">96.5%</span>
                      </div>
                    </div>
                  </div>

                  {/* Performance stats cards */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-805 pb-2.5 border-b border-slate-100">
                      Performance Summary
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-2">
                      <div className="border border-slate-100 p-4 rounded-xl text-left bg-slate-50/50">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Bills Processed</span>
                        <span className="text-sm font-bold text-slate-855 block mt-1.5">{processedBillsCount} Bills</span>
                      </div>
                      <div className="border border-slate-100 p-4 rounded-xl text-left bg-slate-50/50">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Avg Billing Time</span>
                        <span className="text-sm font-bold text-slate-855 block mt-1.5">1.8 Mins</span>
                      </div>
                      <div className="border border-slate-100 p-4 rounded-xl text-left bg-slate-50/50">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Customer Rating</span>
                        <span className="text-sm font-bold text-slate-855 block mt-1.5">{loggedCashier.performanceRating} ★</span>
                      </div>
                      <div className="border border-slate-100 p-4 rounded-xl text-left bg-slate-50/50">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Accuracy</span>
                        <span className="text-sm font-bold text-slate-855 block mt-1.5">100%</span>
                      </div>
                      <div className="border border-slate-100 p-4 rounded-xl text-left bg-slate-50/50">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Review Level</span>
                        <span className="text-sm font-bold text-emerald-600 block mt-1.5">Outstanding</span>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* Sub-tab 3: Leave Management */}
              {profileSubTab === 'leave' && (
                <div className="space-y-6">
                  
                  {/* Leave stats grid */}
                  <div className="grid grid-cols-3 gap-6">
                    <div className="bg-white border border-slate-200 p-4 rounded-xl text-left shadow-xs">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Leave Balance</span>
                      <span className="text-lg font-bold text-slate-900 block mt-1">8 Days</span>
                    </div>
                    <div className="bg-white border border-slate-200 p-4 rounded-xl text-left shadow-xs">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Sick Leaves</span>
                      <span className="text-lg font-bold text-slate-900 block mt-1">3 / 6 Used</span>
                    </div>
                    <div className="bg-white border border-slate-200 p-4 rounded-xl text-left shadow-xs">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Casual Leaves</span>
                      <span className="text-lg font-bold text-slate-900 block mt-1">4 / 8 Used</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Leave Form */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-805 pb-2 border-b border-slate-100">
                        Apply Leave Request
                      </h4>
                      <form onSubmit={handleApplyLeave} className="space-y-4 text-left text-xs">
                        <div className="space-y-1">
                          <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Leave Type</label>
                          <select
                            value={newLeaveType}
                            onChange={(e) => setNewLeaveType(e.target.value)}
                            className="w-full p-2 bg-slate-50 border border-slate-202 rounded-lg font-semibold text-slate-800 focus:outline-none"
                          >
                            <option>Sick Leave</option>
                            <option>Casual Leave</option>
                            <option>Earned Leave</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Start Date</label>
                            <input
                              type="date"
                              value={newLeaveStart}
                              onChange={(e) => setNewLeaveStart(e.target.value)}
                              className="w-full p-2 bg-slate-50 border border-slate-202 rounded-lg font-semibold text-slate-800 focus:outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">End Date</label>
                            <input
                              type="date"
                              value={newLeaveEnd}
                              onChange={(e) => setNewLeaveEnd(e.target.value)}
                              className="w-full p-2 bg-slate-50 border border-slate-202 rounded-lg font-semibold text-slate-800 focus:outline-none"
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Reason</label>
                          <textarea
                            value={newLeaveReason}
                            onChange={(e) => setNewLeaveReason(e.target.value)}
                            rows={3}
                            placeholder="State reason here..."
                            className="w-full p-2 bg-slate-50 border border-slate-202 rounded-lg font-semibold text-slate-800 focus:outline-none"
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-705 text-white font-bold rounded-lg uppercase tracking-wider text-[10px] cursor-pointer"
                        >
                          Submit Application
                        </button>
                      </form>
                    </div>

                    {/* Leave History logs */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-850 pb-2 border-b border-slate-100">
                        Leave History Logs
                      </h4>
                      <div className="space-y-3.5 max-h-[260px] overflow-y-auto pr-1">
                        {leaveRequests.map((l) => (
                          <div key={l.id} className="border border-slate-100 p-3 rounded-xl bg-slate-50/50 flex justify-between items-center text-xs">
                            <div className="space-y-0.5 text-left">
                              <span className="font-bold text-slate-800">{l.leaveType}</span>
                              <span className="text-[10px] text-slate-400 block font-semibold">{l.startDate} to {l.endDate}</span>
                              <p className="text-[10px] text-slate-500 font-medium italic mt-1 font-sans">{l.reason}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                              l.status === 'APPROVED'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                : l.status === 'REJECTED'
                                ? 'bg-rose-50 border-rose-200 text-rose-705'
                                : 'bg-amber-50 border-amber-200 text-amber-705'
                            }`}>
                              {l.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                </div>
              )}

              {/* Sub-tab 4: Message Center */}
              {profileSubTab === 'messages' && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4 flex flex-col h-[500px]">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-805 pb-2 border-b border-slate-100 shrink-0">
                    Internal Communications Center
                  </h4>
                  
                  {/* Chat pane */}
                  <div className="flex-grow overflow-y-auto space-y-3.5 pr-1 py-2 text-xs">
                    {messages.map((m) => {
                      const isMe = m.sender === 'cashier';
                      return (
                        <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          <div className={`p-3 rounded-2xl max-w-sm font-semibold border ${
                            isMe
                              ? 'bg-emerald-600 text-white border-emerald-500 rounded-tr-none'
                              : 'bg-slate-50 text-slate-800 border-slate-200 rounded-tl-none'
                          }`}>
                            <p className="leading-relaxed">{m.text}</p>
                          </div>
                          <span className="text-[9px] text-slate-400 font-bold mt-1 tracking-wider uppercase">
                            {m.senderName} • {m.timestamp}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Input form */}
                  <form onSubmit={handleSendMessage} className="flex gap-2 shrink-0 border-t border-slate-100 pt-3">
                    <input
                      type="text"
                      value={newMessageText}
                      onChange={(e) => setNewMessageText(e.target.value)}
                      placeholder="Type reply to Manager..."
                      className="flex-grow p-2.5 bg-slate-50 border border-slate-202 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-705 text-white font-bold rounded-xl text-xs uppercase tracking-widest cursor-pointer"
                    >
                      Send
                    </button>
                  </form>
                </div>
              )}

              {/* Sub-tab 5: Documents Center */}
              {profileSubTab === 'documents' && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-805 pb-2.5 border-b border-slate-100">
                    Employee Credentials & Documents
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    {[
                      { name: 'Employee Identity Card', size: '1.2 MB', ext: 'PDF' },
                      { name: 'Appointment & Offer Letter', size: '2.4 MB', ext: 'PDF' },
                      { name: 'Salary Pay Slip - June 2026', size: '480 KB', ext: 'PDF' },
                      { name: 'Company Policy Handbook', size: '3.8 MB', ext: 'PDF' }
                    ].map((doc, i) => (
                      <div key={i} className="border border-slate-150 p-4 rounded-xl bg-slate-50/50 flex justify-between items-center text-xs hover:shadow-xs transition-shadow">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white border border-slate-200 rounded-lg text-rose-500 font-bold text-xs uppercase">
                            {doc.ext}
                          </div>
                          <div className="text-left font-semibold">
                            <span className="text-slate-800 font-bold block">{doc.name}</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">{doc.size}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => addNotification('info', `Downloading ${doc.name}...`)}
                          className="text-emerald-600 hover:text-emerald-750 font-bold cursor-pointer hover:underline"
                        >
                          Download
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

      </div>

      {/* DETAIL MODAL: VIEW ORDER ITEMS */}
      {selectedOrderDetails && (() => {
        const orderDetailsBill = getBillDetails(selectedOrderDetails);
        return (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 text-left flex flex-col max-h-[80vh] animate-[zoomIn_0.12s_ease-out]">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <UtensilsCrossed className="w-4 h-4 text-emerald-600" />
                    <span>Table Session: {selectedOrderDetails.tableNumber}</span>
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">
                    Served by: <span className="font-bold text-slate-600">{orderDetailsBill.waiterName}</span>
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrderDetails(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-655 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto pr-1 space-y-4 text-xs font-semibold text-slate-600">
                
                {/* Summary bar */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center">
                  <div>
                    <span className="text-slate-405 block uppercase font-bold text-[10px] tracking-wider">Session Started</span>
                    <span className="font-bold text-slate-800">{orderDetailsBill.sessionStartTime}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-405 block uppercase font-bold text-[10px] tracking-wider">Subtotal</span>
                    <span className="font-black text-emerald-600 text-sm">₹{orderDetailsBill.grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Items table */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Order Items</h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-200">
                          <th className="py-2.5 px-3 text-left">Menu Item</th>
                          <th className="py-2.5 px-3 text-center w-16">Qty</th>
                          <th className="py-2.5 px-3 text-right w-20">Price</th>
                          <th className="py-2.5 px-3 text-right w-20">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
                        {orderDetailsBill.items.map((item, idx) => (
                          <tr key={item.id || idx}>
                            <td className="py-2.5 px-3 text-slate-900 font-bold">{item.menuItem?.name}</td>
                            <td className="py-2.5 px-3 text-center">{item.quantity}</td>
                            <td className="py-2.5 px-3 text-right">₹{item.unitPrice.toFixed(2)}</td>
                            <td className="py-2.5 px-3 text-right font-bold text-slate-900 font-mono">₹{(item.unitPrice * item.quantity).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* KOT Timelines */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">KOT Timeline History</h4>
                  <div className="space-y-4 pl-3 border-l border-slate-200">
                    {selectedOrderDetails.kitchenOrders?.map((kot) => {
                      const timeStr = new Date(kot.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      return (
                        <div key={kot.id} className="relative pl-4 space-y-1">
                          <div className="absolute -left-[18.5px] top-1.5 w-2 h-2 rounded-full bg-slate-400 border border-white" />
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-mono font-bold text-xs text-slate-800">KOT #{kot.id.slice(-4).toUpperCase()}</span>
                              <span className="text-[10px] text-slate-400 ml-2 font-normal">{timeStr}</span>
                            </div>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-lg uppercase tracking-wider ${
                              kot.status === 'SERVED' ? 'bg-emerald-50 text-emerald-705' : 'bg-amber-50 text-amber-705'
                            }`}>
                              {kot.status}
                            </span>
                          </div>
                          <div className="text-xs text-slate-555 font-normal mt-1">
                            {kot.items.map(it => `${it.menuItem?.name} (x${it.quantity})`).join(', ')}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 flex justify-end">
                <button
                  onClick={() => setSelectedOrderDetails(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
                >
                  Close Detail
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* DUAL-PANE CHECKOUT & SETTLEMENT MODAL */}
      {selectedTable && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-hidden">
          <div className="bg-white border border-slate-200 rounded-2xl w-[95vw] max-w-5xl h-[88vh] shadow-2xl flex flex-col text-left relative overflow-hidden animate-[zoomIn_0.12s_ease-out]">
            
            {/* Modal Close */}
            {!showSuccessScreen && (
              <button
                onClick={() => {
                  setSelectedTable(null);
                  setIsWaitingPayment(false);
                  setPaymentCountdown(null);
                  setCardState('IDLE');
                  setCardDetails(null);
                }}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-750 cursor-pointer z-10 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {showSuccessScreen ? (
              <div className="flex-grow flex flex-col items-center justify-center p-8 text-center space-y-6 bg-slate-50/50 w-full h-full">
                <div className="w-14 h-14 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-lg animate-bounce shrink-0">
                  <Check className="w-7 h-7 stroke-[3.5]" />
                </div>
                <div className="space-y-4 max-w-md w-full">
                  <h2 className="text-base font-bold text-slate-800 uppercase tracking-widest">
                    Payment Successful
                  </h2>
                  
                  <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs space-y-3 text-xs font-semibold text-slate-600">
                    <p className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Invoice Number</span>
                      <span className="font-mono font-bold text-slate-900">{settledInvoice?.invoiceNumber || 'INV-2026-1045'}</span>
                    </p>
                    <p className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Total Settled</span>
                      <span className="font-mono font-bold text-emerald-600 text-sm">₹{(settledInvoice?.totalAmount || currentBill.grandTotal).toFixed(2)}</span>
                    </p>
                    <p className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Payment Method</span>
                      <span className="font-bold text-slate-800 uppercase">{settledInvoice?.paymentMode || paymentMethod}</span>
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-2 w-full max-w-md shrink-0">
                  <button
                    onClick={() => window.print()}
                    className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-755 text-white text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 uppercase tracking-widest h-11"
                  >
                    <Printer className="w-4 h-4" /> Print Invoice
                  </button>
                  <button
                    onClick={handleDone}
                    className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-755 text-white text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center uppercase tracking-widest h-11"
                  >
                    Release Table
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-grow flex flex-col md:flex-row h-full overflow-hidden">
                
                {/* LEFT DUAL PANEL: Bill Invoice Preview */}
                <div className="w-full md:w-[45%] border-r border-slate-200 flex flex-col h-1/2 md:h-full overflow-hidden p-6 bg-slate-50/50 text-left">
                  
                  {/* Bill Preview Header */}
                  <div className="shrink-0 pb-4 border-b border-slate-200 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="text-left">
                        <h4 className="text-sm font-bold text-slate-800 leading-tight">
                          {settings.shopName}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-1">Bill Invoice Preview</span>
                      </div>
                      <span className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold font-mono">
                        {selectedTable.tableNumber}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs text-slate-505 font-semibold text-left">
                      <div>
                        <span className="text-slate-400 block font-bold uppercase tracking-wider text-[9px]">Customer Name</span>
                        <span className="text-slate-800 font-bold">{currentBill.customerName}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-bold uppercase tracking-wider text-[9px]">Date & Time</span>
                        <span className="text-slate-800 font-bold">{todayDateStr} {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Food items list */}
                  <div className="flex-grow overflow-y-auto my-4 pr-1 scrollbar-thin text-left text-sm font-semibold">
                    <table className="w-full text-left border-collapse">
                      <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10 text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                        <tr>
                          <th className="py-2 px-3 text-left">Item Name</th>
                          <th className="py-2 px-3 text-center w-16">Qty</th>
                          <th className="py-2 px-3 text-right w-20">Rate</th>
                          <th className="py-2 px-3 text-right w-20">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {currentBill.items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-100/30">
                            <td className="py-2.5 px-3 text-slate-900 font-bold truncate max-w-[140px]">
                              {item.menuItem?.name || 'Dish'}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {item.quantity}
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-500 font-mono">
                              ₹{item.unitPrice.toFixed(2)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                              ₹{(item.unitPrice * item.quantity).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pricing summary totals */}
                  <div className="shrink-0 bg-white p-4 rounded-xl border border-slate-200 space-y-2 text-xs font-semibold text-slate-650 text-left">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Subtotal</span>
                      <span className="font-mono text-slate-900">₹{currentBill.subtotal.toFixed(2)}</span>
                    </div>
                    {currentBill.discountValue > 0 && (
                      <div className="flex justify-between items-center text-rose-600">
                        <span className="font-bold uppercase tracking-wider text-[10px]">Discount</span>
                        <span className="font-mono font-bold">-₹{currentBill.discountValue.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">GST (18%)</span>
                      <span className="font-mono text-slate-900">₹{currentBill.taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-100 pt-2.5 mt-1">
                      <span className="font-bold uppercase tracking-wider text-xs text-slate-800">Grand Total</span>
                      <span className="text-sm font-mono font-bold text-emerald-600">₹{currentBill.grandTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* RIGHT DUAL PANEL: Settle controls */}
                <div className="w-full md:w-[55%] flex flex-col h-full overflow-hidden p-6 bg-white text-left">
                  
                  {isWaitingPayment ? (
                    <div className="flex-grow flex flex-col items-center justify-center text-center space-y-4 py-6 h-full overflow-y-auto animate-[fadeIn_0.12s_ease-out] shrink-0">
                      <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center animate-pulse shrink-0">
                        <Loader2 className="w-6 h-6 animate-spin" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-slate-850 text-xs uppercase tracking-widest">Waiting for UPI payment...</h4>
                        <p className="text-xs text-slate-400 font-semibold">Please scan QR on counter customer screen</p>
                        {paymentCountdown !== null && (
                          <div className="text-xl font-mono font-bold text-amber-600 mt-1">
                            {formatCountdown(paymentCountdown)}
                          </div>
                        )}
                      </div>

                      {/* QR generator */}
                      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center gap-1.5 shrink-0">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                            `upi://pay?pa=${settings.upiId}&pn=${encodeURIComponent(settings.shopName)}&am=${currentBill.grandTotal.toFixed(2)}&cu=INR`
                          )}`}
                          alt="UPI QR Code"
                          className="w-32 h-32"
                        />
                        <span className="text-[10px] font-bold text-slate-700">Scan via Any UPI App</span>
                        <span className="text-[9px] font-mono text-slate-400">{settings.upiId}</span>
                      </div>

                      <div className="flex gap-3 w-full max-w-xs pt-2 shrink-0">
                        <button
                          onClick={handleConfirmSettle}
                          className="flex-grow bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg text-xs uppercase tracking-widest transition-all cursor-pointer shadow-xs"
                        >
                          Confirm Paid
                        </button>
                        <button
                          onClick={() => {
                            setIsWaitingPayment(false);
                            setPaymentCountdown(null);
                          }}
                          className="flex-grow bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-lg text-xs uppercase tracking-widest transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 pb-3 border-b border-slate-100 flex items-center gap-2 shrink-0">
                        <CreditCard className="w-4 h-4 text-slate-500" />
                        <span>Checkout settlement</span>
                      </h3>

                      <div className="flex-grow overflow-y-auto space-y-4 my-3 pr-1 text-left scrollbar-thin text-xs">
                        
                        {/* Discount params */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 shrink-0 text-left">
                          <label className="text-[10px] text-slate-455 font-bold block uppercase tracking-wider">
                            Apply bill discount
                          </label>
                          <div className="flex items-center gap-3">
                            <div className="flex border border-slate-200 rounded-lg overflow-hidden shrink-0 bg-white">
                              <button
                                onClick={() => setUseDiscountPercent(true)}
                                className={`px-3 py-1.5 font-bold cursor-pointer transition-colors ${
                                  useDiscountPercent
                                    ? 'bg-slate-100 text-slate-800'
                                    : 'text-slate-400 hover:text-slate-650'
                                }`}
                              >
                                %
                              </button>
                              <button
                                onClick={() => setUseDiscountPercent(false)}
                                className={`px-3 py-1.5 font-bold cursor-pointer transition-colors ${
                                  !useDiscountPercent
                                    ? 'bg-slate-100 text-slate-800'
                                    : 'text-slate-400 hover:text-slate-650'
                                }`}
                              >
                                ₹
                              </button>
                            </div>
                            <input
                              type="number"
                              value={useDiscountPercent ? discountPercent : discountAmount}
                              onChange={(e) => {
                                  const val = Math.max(0, parseFloat(e.target.value) || 0);
                                  if (useDiscountPercent) {
                                    setDiscountPercent(Math.min(100, val));
                                  } else {
                                    setDiscountAmount(Math.min(currentBill.subtotal, val));
                                  }
                              }}
                              placeholder={useDiscountPercent ? 'Enter %' : 'Enter amount'}
                              className="flex-grow px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800 font-bold focus:outline-none focus:border-slate-400 text-sm"
                            />
                          </div>
                        </div>

                        {/* Payment Cards Grid */}
                        <div className="space-y-2 text-left">
                          <label className="text-[10px] text-slate-455 font-bold block uppercase tracking-wider">
                            Choose Payment Method
                          </label>
                          <div className="grid grid-cols-2 gap-3 shrink-0">
                            {[
                              { id: 'CASH', title: '💵 Cash', desc: 'Physical cash counter', icon: Wallet },
                              { id: 'UPI', title: '📱 UPI', desc: 'Razorpay QR Scanner', icon: Smartphone },
                              { id: 'CARD', title: '💳 Card', desc: 'Chip terminal swipe', icon: CreditCard },
                              { id: 'SPLIT', title: '💰 Split Payment', desc: 'Multiple sub channels', icon: Coins }
                            ].map((method) => {
                              const isSelected = paymentMethod === method.id;
                              return (
                                <button
                                  key={method.id}
                                  type="button"
                                  onClick={() => {
                                    setPaymentMethod(method.id as any);
                                    if (method.id === 'CASH') setCashReceived('');
                                    if (method.id === 'CARD') {
                                      setCardState('IDLE');
                                      setCardDetails(null);
                                    }
                                  }}
                                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer select-none h-20 ${
                                    isSelected
                                      ? 'border-emerald-600 bg-emerald-50/5 ring-1 ring-emerald-600/10'
                                      : 'border-slate-200 bg-white hover:border-slate-300'
                                  }`}
                                >
                                  <div className="flex justify-between items-start w-full">
                                    <span className="text-xs font-bold text-slate-800">{method.title}</span>
                                    <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                      isSelected ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'
                                    }`}>
                                      {isSelected && <Check className="w-1.5 h-1.5 text-white stroke-[4]" />}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-slate-400 leading-tight block font-semibold">{method.desc}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Split details input views */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 min-h-[120px] flex flex-col justify-center shrink-0 text-left">
                          {paymentMethod === 'CASH' && (
                            <div className="space-y-3 animate-[fadeIn_0.12s_ease-out] text-left">
                              <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white border border-slate-200 p-2.5 rounded-lg text-left">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Grand Total</span>
                                  <span className="text-sm font-bold text-slate-900 block mt-0.5">
                                    ₹{currentBill.grandTotal.toFixed(2)}
                                  </span>
                                </div>
                                <div className="bg-white border border-slate-200 p-2.5 rounded-lg text-left">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Received Cash</span>
                                  <input
                                    type="text"
                                    value={cashReceived}
                                    onChange={(e) => setCashReceived(e.target.value.replace(/[^0-9.]/g, ''))}
                                    placeholder="0.00"
                                    className="w-full bg-transparent border-none p-0 text-sm font-bold text-slate-900 focus:outline-none focus:ring-0 mt-0.5 text-left font-mono"
                                  />
                                </div>
                              </div>
                              <div className="bg-emerald-50/50 border border-emerald-200 p-3 rounded-lg flex justify-between items-center text-xs">
                                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Balance change</span>
                                <span className="text-sm font-bold text-emerald-600 font-mono">
                                  ₹{changeReturned.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          )}

                          {paymentMethod === 'UPI' && (
                            <div className="flex flex-col items-center justify-center text-center space-y-2 py-1 animate-[fadeIn_0.12s_ease-out]">
                              <button
                                type="button"
                                onClick={() => {
                                  setIsWaitingPayment(true);
                                  setPaymentCountdown(120);
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-lg text-xs uppercase tracking-widest transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                              >
                                <Smartphone className="w-4 h-4" />
                                Generate Razorpay QR
                              </button>
                              <p className="text-[10px] text-slate-400 font-semibold">Generates UPI payment code for ₹{currentBill.grandTotal.toFixed(2)}</p>
                            </div>
                          )}

                          {paymentMethod === 'CARD' && (
                            <div className="space-y-3 animate-[fadeIn_0.12s_ease-out] text-left">
                              <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col items-center justify-center text-center py-4">
                                {cardState === 'IDLE' && (
                                  <div className="space-y-2">
                                    <p className="text-xs text-slate-500 font-semibold">
                                      Insert or swipe card in counter POS terminal.
                                    </p>
                                    <button
                                      type="button"
                                      onClick={handleCardSwipeSimulate}
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg cursor-pointer"
                                    >
                                      Simulate Terminal Swipe
                                    </button>
                                  </div>
                                )}

                                {(cardState === 'SWIPING' || cardState === 'AUTHORIZING') && (
                                  <div className="flex flex-col items-center gap-2 py-2">
                                    <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                      {cardState === 'SWIPING' ? 'Reading Chip...' : 'Authorizing Bank Check...'}
                                    </p>
                                  </div>
                                )}

                                {cardState === 'APPROVED' && cardDetails && (
                                  <div className="space-y-2 w-full text-xs">
                                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg uppercase tracking-wider block mx-auto w-fit border border-emerald-200">
                                      ✓ Transaction Approved
                                    </span>
                                    <div className="grid grid-cols-2 gap-2 text-left pt-1 text-[10px] font-semibold text-slate-450">
                                      <div>Card: <span className="text-slate-700 font-bold">{cardDetails.type} ({cardDetails.number})</span></div>
                                      <div>Tx ID: <span className="text-slate-700 font-mono font-bold">{cardDetails.txId}</span></div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {paymentMethod === 'SPLIT' && (
                            <div className="space-y-3 animate-[fadeIn_0.12s_ease-out] text-left">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Split Mode Breakdown</span>
                              <div className="grid grid-cols-3 gap-2 text-xs">
                                <div className="bg-white border border-slate-200 p-2 rounded-lg text-left">
                                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Cash</span>
                                  <input
                                    type="text"
                                    value={splitCash}
                                    onChange={(e) => setSplitCash(e.target.value.replace(/[^0-9.]/g, ''))}
                                    placeholder="0.00"
                                    className="w-full bg-transparent border-none p-0 text-xs font-bold text-slate-900 focus:outline-none focus:ring-0 mt-0.5 font-mono"
                                  />
                                </div>
                                <div className="bg-white border border-slate-200 p-2 rounded-lg text-left">
                                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Card</span>
                                  <input
                                    type="text"
                                    value={splitCard}
                                    onChange={(e) => setSplitCard(e.target.value.replace(/[^0-9.]/g, ''))}
                                    placeholder="0.00"
                                    className="w-full bg-transparent border-none p-0 text-xs font-bold text-slate-900 focus:outline-none focus:ring-0 mt-0.5 font-mono"
                                  />
                                </div>
                                <div className="bg-white border border-slate-200 p-2 rounded-lg text-left">
                                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">UPI</span>
                                  <input
                                    type="text"
                                    value={splitUpi}
                                    onChange={(e) => setSplitUpi(e.target.value.replace(/[^0-9.]/g, ''))}
                                    placeholder="0.00"
                                    className="w-full bg-transparent border-none p-0 text-xs font-bold text-slate-900 focus:outline-none focus:ring-0 mt-0.5 font-mono"
                                  />
                                </div>
                              </div>
                              <div className="flex justify-between items-center text-[10px] pt-1 font-semibold text-slate-400 border-t border-slate-100 mt-1">
                                <span>Paid: <span className="font-bold text-slate-850">₹{splitTotalPaid.toFixed(2)}</span></span>
                                <span>Remaining: <span className="font-bold text-slate-850">₹{splitRemaining.toFixed(2)}</span></span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Settle button */}
                      <button
                        type="button"
                        onClick={handleConfirmSettle}
                        disabled={isProcessing || (paymentMethod === 'SPLIT' && splitRemaining > 0.01) || paymentMethod === 'UPI' || (paymentMethod === 'CARD' && cardState !== 'APPROVED')}
                        className={`w-full text-white font-bold py-3 px-4 rounded-lg cursor-pointer transition-all uppercase tracking-widest text-xs text-center shrink-0 ${
                          isProcessing || (paymentMethod === 'SPLIT' && splitRemaining > 0.01) || paymentMethod === 'UPI' || (paymentMethod === 'CARD' && cardState !== 'APPROVED')
                            ? 'bg-slate-105 text-slate-400 cursor-not-allowed border-none shadow-none font-bold h-11'
                            : 'bg-emerald-600 hover:bg-emerald-705 h-11'
                        }`}
                      >
                        {isProcessing ? 'Processing...' : paymentMethod === 'CASH' ? 'Collect Cash & Settle' : paymentMethod === 'CARD' ? 'Finalize Card Payment' : 'Finalize Settle'}
                      </button>
                    </>
                  )}
                </div>

              </div>
            )}

          </div>
        </div>
      )}

      {/* DETAIL MODAL: VIEW HISTORICAL RECORD INVOICE */}
      {viewingHistoryRecord && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-left my-8 flex flex-col max-h-[85vh] animate-[zoomIn_0.12s_ease-out]">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 shrink-0">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-emerald-600" />
                  <span>Invoice detail logs</span>
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                  Finalized checks
                </p>
              </div>
              <button
                onClick={() => setViewingHistoryRecord(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-655 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Receipt details */}
            <div className="flex-grow flex flex-col min-h-0 border border-dashed border-slate-250 bg-slate-50/50 rounded-xl p-4 my-2 select-all font-mono text-xs leading-relaxed text-slate-700">
              <div className="shrink-0 text-center font-bold">
                <h4 className="text-sm font-black uppercase tracking-wider text-slate-900">{settings.shopName}</h4>
                <p className="text-[10px] font-normal">{settings.shopAddress}</p>
                <p className="text-[10px] font-normal">GSTIN: {settings.gstNumber}</p>
                <div className="border-t border-dashed border-slate-300 my-2" />
                
                <div className="space-y-0.5 text-left text-[10px] font-semibold text-slate-500">
                  <div className="flex justify-between">
                    <span>Invoice Number:</span>
                    <span className="font-bold text-slate-900">{viewingHistoryRecord.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Table Number:</span>
                    <span className="font-bold text-slate-900">{viewingHistoryRecord.tableNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Customer Name:</span>
                    <span className="font-bold text-slate-855">{viewingHistoryRecord.invoiceNumber === 'INV-2026-1045' ? 'Rahul Sharma' : 'Walk-in Guest'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Served By:</span>
                    <span>{viewingHistoryRecord.waiterName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cashier Name:</span>
                    <span>{viewingHistoryRecord.cashierName || 'Amit Patil'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date & Time:</span>
                    <span>{viewingHistoryRecord.date} {viewingHistoryRecord.time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Order Source:</span>
                    <span className="uppercase">{viewingHistoryRecord.orderSource}</span>
                  </div>
                </div>
                <div className="border-t border-dashed border-slate-300 my-2" />
              </div>

              {/* Items Table */}
              <div className="flex-grow overflow-y-auto my-1 max-h-[160px] pr-1 space-y-2 text-left">
                {viewingHistoryRecord.items.split(', ').map((itm, idx) => {
                  const match = itm.match(/^(.*)\s+x\s+(\d+)$/i) || itm.match(/^(.*)\s+x(\d+)$/i) || itm.match(/^(.*)\s*-\s*x\s*(\d+)$/i);
                  const name = match ? match[1].trim() : itm;
                  const qty = match ? match[2].trim() : '1';
                  return (
                    <div key={idx} className="border-b border-dashed border-slate-200 pb-1.5 pt-0.5">
                      <div className="font-bold text-slate-800 text-xs">{name}</div>
                      <div className="flex justify-between items-center text-[10px] text-slate-400 mt-0.5 font-semibold">
                        <span>Qty: {qty}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Totals Summary */}
              <div className="shrink-0 border-t border-dashed border-slate-300 pt-2 mt-1">
                <div className="space-y-1 text-right text-[10px] font-semibold text-slate-500">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹{(viewingHistoryRecord.subtotal || (viewingHistoryRecord.totalAmount - viewingHistoryRecord.gst)).toFixed(2)}</span>
                  </div>
                  {viewingHistoryRecord.discount && (
                    <div className="flex justify-between">
                      <span>Discount:</span>
                      <span>-₹{viewingHistoryRecord.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>GST:</span>
                    <span>₹{viewingHistoryRecord.gst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-black text-slate-900 border-t border-dashed border-slate-300 pt-1.5 mt-1">
                    <span>Grand Total:</span>
                    <span className="text-emerald-600 font-bold">₹{viewingHistoryRecord.totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span>Payment Mode:</span>
                    <span className="font-bold uppercase text-slate-900">{viewingHistoryRecord.paymentMode}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 shrink-0 flex justify-end gap-2.5">
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-705 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" /> Print Receipt
              </button>
              <button
                onClick={() => setViewingHistoryRecord(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-202 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINT TICKET IN THERMAL 80MM STYLE */}
      <div id="printable-receipt" className="hidden print:block bg-white text-black p-4 font-mono text-[10px] w-[80mm] mx-auto leading-tight">
        <div className="text-center space-y-1">
          <div className="text-xs font-bold uppercase tracking-wider border-2 border-black py-0.5 px-2 inline-block mb-1">
            [ GOURMET BISTRO ]
          </div>
          <h2 className="text-xs font-extrabold uppercase">{settings.shopName}</h2>
          <p className="text-[9px]">{settings.shopAddress}</p>
          <p className="text-[9px]">Contact: {settings.mobileNumber || '+91 99999 88888'}</p>
          <p className="text-[9px]">GSTIN: {settings.gstNumber}</p>
        </div>
        
        <div className="border-t border-dashed border-black my-2" />
        
        <div className="space-y-0.5 text-left text-[9px]">
          <div className="flex justify-between">
            <span>Invoice No:</span>
            <span className="font-bold">{settledInvoice?.invoiceNumber || viewingHistoryRecord?.invoiceNumber || 'INV-DRAFT'}</span>
          </div>
          <div className="flex justify-between">
            <span>Date & Time:</span>
            <span>
              {settledInvoice 
                ? `${todayDateStr} ${currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : viewingHistoryRecord 
                  ? `${viewingHistoryRecord.date} ${viewingHistoryRecord.time || ''}`
                  : `${todayDateStr} ${currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              }
            </span>
          </div>
          <div className="flex justify-between">
            <span>Table Number:</span>
            <span className="font-bold">{selectedTable?.tableNumber || viewingHistoryRecord?.tableNumber || '--'}</span>
          </div>
          <div className="flex justify-between">
            <span>Customer Name:</span>
            <span className="font-bold">{currentBill.customerName || (viewingHistoryRecord?.invoiceNumber === 'INV-2026-1045' ? 'Rahul Sharma' : 'Walk-in Guest')}</span>
          </div>
          <div className="flex justify-between">
            <span>Served By:</span>
            <span>{currentBill.waiterName || viewingHistoryRecord?.waiterName || '--'}</span>
          </div>
          <div className="flex justify-between">
            <span>Cashier Name:</span>
            <span>{loggedCashier.name}</span>
          </div>
        </div>

        <div className="border-t border-dashed border-black my-2" />

        <div className="grid grid-cols-12 font-bold text-[9px] pb-1 border-b border-dashed border-black">
          <span className="col-span-6 text-left">Item Name</span>
          <span className="col-span-2 text-center">Qty</span>
          <span className="col-span-2 text-right">Rate</span>
          <span className="col-span-2 text-right">Amount</span>
        </div>

        <div className="space-y-1 py-1.5 text-[9px]">
          {selectedTable && currentBill.items.map((item, idx) => (
            <div key={idx} className="grid grid-cols-12 leading-tight">
              <span className="col-span-6 text-left truncate">{item.menuItem?.name || 'Dish'}</span>
              <span className="col-span-2 text-center">{item.quantity}</span>
              <span className="col-span-2 text-right">₹{item.unitPrice}</span>
              <span className="col-span-2 text-right font-bold">₹{(item.unitPrice * item.quantity).toFixed(2)}</span>
            </div>
          ))}

          {viewingHistoryRecord && !selectedTable && viewingHistoryRecord.items.split(', ').map((itm, idx) => {
            const match = itm.match(/^(.*)\s+x\s+(\d+)$/i) || itm.match(/^(.*)\s+x(\d+)$/i) || itm.match(/^(.*)\s*-\s*x\s*(\d+)$/i);
            const name = match ? match[1].trim() : itm;
            const qty = parseInt(match ? match[2].trim() : '1') || 1;
            return (
              <div key={idx} className="grid grid-cols-12 leading-tight">
                <span className="col-span-6 text-left truncate">{name}</span>
                <span className="col-span-2 text-center">{qty}</span>
                <span className="col-span-2 text-right">--</span>
                <span className="col-span-2 text-right font-bold">--</span>
              </div>
            );
          })}
        </div>

        <div className="border-t border-dashed border-black my-2" />

        <div className="space-y-1 text-right text-[9px]">
          {selectedTable && (
            <>
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{currentBill.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>GST (18%):</span>
                <span>₹{currentBill.taxAmount.toFixed(2)}</span>
              </div>
              {currentBill.discountValue > 0 && (
                <div className="flex justify-between text-black">
                  <span>Discount:</span>
                  <span>-₹{currentBill.discountValue.toFixed(2)}</span>
                </div>
              )}
            </>
          )}

          {viewingHistoryRecord && !selectedTable && (
            <>
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{(viewingHistoryRecord.subtotal || (viewingHistoryRecord.totalAmount - viewingHistoryRecord.gst)).toFixed(2)}</span>
              </div>
              {viewingHistoryRecord.discount && (
                <div className="flex justify-between text-black">
                  <span>Discount:</span>
                  <span>-₹{viewingHistoryRecord.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>GST:</span>
                <span>₹{viewingHistoryRecord.gst.toFixed(2)}</span>
              </div>
            </>
          )}

          <div className="flex justify-between font-bold text-xs border-t border-dashed border-black pt-1.5">
            <span>Grand Total:</span>
            <span>₹{(selectedTable ? currentBill.grandTotal : (viewingHistoryRecord?.totalAmount || 0)).toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-[9px] pt-1">
            <span>Payment Method:</span>
            <span className="font-bold uppercase">{selectedTable ? paymentMethod : (viewingHistoryRecord?.paymentMode || 'CASH')}</span>
          </div>
          <div className="flex justify-between text-[9px]">
            <span>Payment Status:</span>
            <span className="font-bold">PAID / SETTLED</span>
          </div>
        </div>

        <div className="border-t border-dashed border-black my-3" />

        <div className="text-center text-[10px] font-bold space-y-0.5">
          <p>Thank You, Visit Again!</p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-receipt, #printable-receipt * {
            visibility: visible !important;
          }
          #printable-receipt {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 80mm !important;
            margin: 0 !important;
            padding: 10px !important;
            background: white !important;
            color: black !important;
            font-family: monospace !important;
            font-size: 10px !important;
            line-height: 1.3 !important;
          }
        }
      `}} />

    </div>
  );
};

export default CashierDashboard;

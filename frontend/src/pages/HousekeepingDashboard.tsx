import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AttendanceWidget, AttendanceStatusType } from '../components/AttendanceWidget';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  ClipboardList,
  User,
  MessageSquare,
  Calendar,
  FileText,
  CheckCircle,
  Home,
  Plus,
  Send,
  X,
  Info,
  Download,
  Package,
  Layers
} from 'lucide-react';


// Housekeeping Task Interface
interface HousekeepingTask {
  id: string;
  areaName: string;
  taskType: string;
  assignedEmployee: string;
  employeeId: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  assignedTime: string;
  estimatedCompletion: string;
  status: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED';
  notes?: string;
  checklist?: string[];
}

// Cleaning Schedule Interface
interface ScheduleItem {
  time: string;
  area: string;
  task: string;
  status: 'Completed' | 'Pending' | 'Scheduled' | 'In Progress';
}

// Leave Request Interface
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

// Chat Message Interface
interface ChatMessage {
  id: string;
  sender: 'housekeeper' | 'manager';
  senderName: string;
  text: string;
  timestamp: string;
}

export const HousekeepingDashboard: React.FC = () => {
  const { user } = useAuth();


  // Active Main Tabs: 'dashboard' | 'profile'
  const [activeMainTab, setActiveMainTab] = useState<'dashboard' | 'profile'>('dashboard');

  // Active Profile Sub-Tabs: 'personal' | 'attendance' | 'leave' | 'messages' | 'documents'
  const [activeProfileTab, setActiveProfileTab] = useState<'personal' | 'attendance' | 'leave' | 'messages' | 'documents'>('personal');

  // Interactive Area Filters
  const [selectedAreaFilter, setSelectedAreaFilter] = useState<string | null>(null);

  // Time Ticker
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Housekeeping Employee Details (Matching Mock Roster Database)
  const employeeDetails = {
    name: user?.name || 'Neha Patil',
    employeeId: 'HK-1035',
    role: 'Housekeeping Specialist',
    dept: 'Operations & Hygiene',
    shift: 'Morning Shift (07:00 AM – 03:00 PM)',
    assignedArea: 'Dining Hall & Washrooms',
    mobile: '+91 98765 43210',
    email: user?.email || 'neha.patil@restaurant.com',
    joiningDate: '12 Jan 2025',
    attendancePercent: 96,
    performanceRating: 4.8,
    leaveBalance: 12,
    emergencyContact: 'Amit Patil (Spouse) - +91 98765 99999'
  };

  // Local Storage state management for Attendance
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatusType>(() => {
    const cached = localStorage.getItem('hk_attendance_status');
    return cached ? (cached as AttendanceStatusType) : null;
  });
  const [checkInTime, setCheckInTime] = useState<string | null>(() => {
    return localStorage.getItem('hk_check_in_time') || null;
  });
  const [checkOutTime, setCheckOutTime] = useState<string | null>(() => {
    return localStorage.getItem('hk_check_out_time') || null;
  });
  const [workingHours, setWorkingHours] = useState<string>(() => {
    return localStorage.getItem('hk_working_hours') || '0h 0m';
  });

  const handleCheckIn = () => {
    const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    setAttendanceStatus('CHECKED_IN');
    setCheckInTime(timeStr);
    setCheckOutTime(null);
    setWorkingHours('0h 0m');
    localStorage.setItem('hk_attendance_status', 'CHECKED_IN');
    localStorage.setItem('hk_check_in_time', timeStr);
    localStorage.removeItem('hk_check_out_time');
    localStorage.setItem('hk_working_hours', '0h 0m');
  };

  const handleCheckOut = () => {
    const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    setAttendanceStatus('CHECKED_OUT');
    setCheckOutTime(timeStr);
    setWorkingHours('8h 0m');
    localStorage.setItem('hk_attendance_status', 'CHECKED_OUT');
    localStorage.setItem('hk_check_out_time', timeStr);
    localStorage.setItem('hk_working_hours', '8h 0m');
  };

  // Task Board State
  const [tasks, setTasks] = useState<HousekeepingTask[]>(() => {
    const cached = localStorage.getItem('hk_tasks');
    if (cached) return JSON.parse(cached);
    return [
      {
        id: 'HKT-101',
        areaName: 'Dining Area',
        taskType: 'Deep Cleaning',
        assignedEmployee: 'Neha Patil',
        employeeId: 'HK-1035',
        priority: 'HIGH',
        assignedTime: '08:00 AM',
        estimatedCompletion: '09:30 AM',
        status: 'COMPLETED',
        notes: 'Sanitized all high-touch table zones, chairs, and kids high-chairs.',
        checklist: ['Wipe zone A tables', 'Sanitize chair armrests', 'Sweep floor', 'Mop with disinfectant']
      },
      {
        id: 'HKT-102',
        areaName: 'Kitchen',
        taskType: 'Floor Mopping',
        assignedEmployee: 'Neha Patil',
        employeeId: 'HK-1035',
        priority: 'HIGH',
        assignedTime: '09:30 AM',
        estimatedCompletion: '10:30 AM',
        status: 'COMPLETED',
        notes: 'Moped kitchen floors using heavy-duty grease remover after morning food prep.',
        checklist: ['Clear loose debris', 'Apply degreaser agent', 'Hot water mop', 'Place wet floor signs']
      },
      {
        id: 'HKT-103',
        areaName: 'Washroom',
        taskType: 'Sanitization',
        assignedEmployee: 'Neha Patil',
        employeeId: 'HK-1035',
        priority: 'HIGH',
        assignedTime: '10:45 AM',
        estimatedCompletion: '11:30 AM',
        status: 'IN_PROGRESS',
        notes: 'Disinfecting sinks, hand driers, toilets, and replenishing paper towels/soaps.',
        checklist: ['Clean mirrors & taps', 'Sanitize door handles', 'Restock paper towels', 'Refill soap dispensers', 'Empty waste baskets']
      },
      {
        id: 'HKT-104',
        areaName: 'Dining Area',
        taskType: 'Window cleaning',
        assignedEmployee: 'Neha Patil',
        employeeId: 'HK-1035',
        priority: 'MEDIUM',
        assignedTime: '11:30 AM',
        estimatedCompletion: '12:15 PM',
        status: 'ASSIGNED',
        notes: 'Clean glass windows facing street side for maximum transparency.',
        checklist: ['Apply glass cleaner spray', 'Squeegee glass panels', 'Wipe window sills']
      },
      {
        id: 'HKT-105',
        areaName: 'Waiting Area',
        taskType: 'Upholstery cleaning',
        assignedEmployee: 'Neha Patil',
        employeeId: 'HK-1035',
        priority: 'LOW',
        assignedTime: '12:30 PM',
        estimatedCompletion: '01:00 PM',
        status: 'ASSIGNED',
        notes: 'Vacuum dust off waiting room fabric sofas and sanitize tables.',
        checklist: ['Vacuum cushions', 'Sanitize tables', 'Align brochures']
      },
      {
        id: 'HKT-106',
        areaName: 'Reception',
        taskType: 'Disinfection',
        assignedEmployee: 'Neha Patil',
        employeeId: 'HK-1035',
        priority: 'MEDIUM',
        assignedTime: '01:30 PM',
        estimatedCompletion: '02:00 PM',
        status: 'ASSIGNED',
        notes: 'Sanitize reception counter desk and public pens.',
        checklist: ['Wipe counter desk', 'Disinfect payment keypads', 'Clean hand sanitizer station']
      },
      {
        id: 'HKT-107',
        areaName: 'Outdoor Seating',
        taskType: 'Floor Sweeping',
        assignedEmployee: 'Neha Patil',
        employeeId: 'HK-1035',
        priority: 'LOW',
        assignedTime: '02:00 PM',
        estimatedCompletion: '02:30 PM',
        status: 'ASSIGNED',
        notes: 'Clear dry leaves and dust from the patio dining zone.',
        checklist: ['Sweep patio brick path', 'Wipe outdoor umbrella tables', 'Clear outdoor dustbins']
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('hk_tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Area Status State
  const [areaStatuses, setAreaStatuses] = useState<Record<string, 'CLEAN' | 'CLEANING_IN_PROGRESS' | 'NEEDS_CLEANING'>>({
    'Dining Area': 'NEEDS_CLEANING',
    'Kitchen': 'CLEAN',
    'Washroom': 'CLEANING_IN_PROGRESS',
    'Reception': 'NEEDS_CLEANING',
    'Waiting Area': 'CLEAN',
    'Storage': 'CLEAN',
    'Outdoor Seating': 'NEEDS_CLEANING'
  });

  // Daily Schedule state
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([
    { time: '08:00 AM', area: 'Dining Area', task: 'Deep Clean Zone A', status: 'Completed' },
    { time: '09:30 AM', area: 'Kitchen Floor', task: 'Degrease Prep Floor', status: 'Completed' },
    { time: '10:45 AM', area: 'Washroom', task: 'Sanitize Sink & Cabinets', status: 'In Progress' },
    { time: '11:30 AM', area: 'Dining Area', task: 'Window Cleaning', status: 'Pending' },
    { time: '12:30 PM', area: 'Waiting Area', task: 'Vacuum Sofas', status: 'Pending' },
    { time: '01:30 PM', area: 'Reception', task: 'Counter Disinfection', status: 'Scheduled' },
    { time: '02:00 PM', area: 'Outdoor Seating', task: 'Patio Sweeping', status: 'Scheduled' }
  ]);

  // Leave Requests state
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() => {
    const cached = localStorage.getItem('hk_leave_requests');
    if (cached) return JSON.parse(cached);
    return [
      {
        id: 'LV-501',
        leaveType: 'Sick Leave',
        startDate: '2026-06-10',
        endDate: '2026-06-11',
        reason: 'Severe food poisoning & fever.',
        status: 'APPROVED',
        requestedAt: '2026-06-09',
        responseBy: 'Bob (Manager)',
        responseReason: 'Get well soon, health comes first.'
      },
      {
        id: 'LV-502',
        leaveType: 'Casual Leave',
        startDate: '2026-07-15',
        endDate: '2026-07-17',
        reason: 'Family gathering event out of town.',
        status: 'PENDING',
        requestedAt: '2026-07-05'
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('hk_leave_requests', JSON.stringify(leaveRequests));
  }, [leaveRequests]);

  // Message Center State
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const cached = localStorage.getItem('hk_messages');
    if (cached) return JSON.parse(cached);
    return [
      {
        id: 'msg-1',
        sender: 'manager',
        senderName: 'Bob (Manager)',
        text: 'Hi Neha, please ensure the washrooms are thoroughly sanitized before the lunch rush starts at 12:00 PM today.',
        timestamp: '09:00 AM'
      },
      {
        id: 'msg-2',
        sender: 'housekeeper',
        senderName: 'Neha Patil',
        text: 'Understood, Bob. I am currently working on the main washrooms now and will finish by 11:30 AM.',
        timestamp: '10:50 AM'
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('hk_messages', JSON.stringify(messages));
  }, [messages]);

  // Form states
  const [newMessageText, setNewMessageText] = useState('');
  const [leaveType, setLeaveType] = useState('Sick Leave');
  const [leaveStartDate, setLeaveStartDate] = useState('');
  const [leaveEndDate, setLeaveEndDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');

  // Modals state
  const [selectedTaskDetails, setSelectedTaskDetails] = useState<HousekeepingTask | null>(null);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [inventoryRequestItems, setInventoryRequestItems] = useState([
    { name: 'Disinfectant Spray', quantity: 2, unit: 'Bottles' },
    { name: 'Liquid Hand Soap', quantity: 3, unit: 'Litres' },
    { name: 'Paper Towel Rolls', quantity: 10, unit: 'Rolls' },
    { name: 'Trash Garbage Bags (Large)', quantity: 1, unit: 'Box' }
  ]);
  const [isInventorySubmitted, setIsInventorySubmitted] = useState(false);

  // Stats calculation
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
  const pendingTasks = tasks.filter(t => t.status === 'ASSIGNED').length;
  const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS').length;
  const urgentCleaningCount = tasks.filter(t => t.priority === 'HIGH' && t.status !== 'COMPLETED').length;
  const activeAreasCount = Object.keys(areaStatuses).length;

  // Task Transitions
  const startTask = (taskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        // Update corresponding area status
        setAreaStatuses(prevAreas => ({
          ...prevAreas,
          [t.areaName]: 'CLEANING_IN_PROGRESS'
        }));
        // Update timeline schedule status
        setScheduleItems(prevSched => prevSched.map(item => 
          item.area === t.areaName && item.status === 'Pending' 
            ? { ...item, status: 'In Progress' } 
            : item
        ));
        return { ...t, status: 'IN_PROGRESS' };
      }
      return t;
    }));
  };

  const completeTask = (taskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        // Update corresponding area status
        setAreaStatuses(prevAreas => ({
          ...prevAreas,
          [t.areaName]: 'CLEAN'
        }));
        // Update timeline schedule status
        setScheduleItems(prevSched => prevSched.map(item => 
          item.area === t.areaName && (item.status === 'In Progress' || item.status === 'Pending')
            ? { ...item, status: 'Completed' } 
            : item
        ));
        return { ...t, status: 'COMPLETED' };
      }
      return t;
    }));
  };

  // Filter tasks based on selected area
  const filteredTasks = selectedAreaFilter 
    ? tasks.filter(t => t.areaName === selectedAreaFilter)
    : tasks;

  // Apply Leave Handler
  const handleApplyLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveStartDate || !leaveEndDate || !leaveReason) return;
    
    const newRequest: LeaveRequest = {
      id: `LV-${Math.floor(Math.random() * 900) + 500}`,
      leaveType,
      startDate: leaveStartDate,
      endDate: leaveEndDate,
      reason: leaveReason,
      status: 'PENDING',
      requestedAt: new Date().toISOString().split('T')[0]
    };

    setLeaveRequests(prev => [newRequest, ...prev]);
    setLeaveStartDate('');
    setLeaveEndDate('');
    setLeaveReason('');
    alert('Leave request submitted successfully for approval.');
  };

  // Send Message Handler
  const handleSendMessageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim()) return;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'housekeeper',
      senderName: employeeDetails.name,
      text: newMessageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMsg]);
    setNewMessageText('');

    // Simulate Manager auto-reply after 2 seconds
    setTimeout(() => {
      const managerReply: ChatMessage = {
        id: `msg-reply-${Date.now()}`,
        sender: 'manager',
        senderName: 'Bob (Manager)',
        text: 'Thanks for the update. I have reviewed your entry and approved it. Carry on.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, managerReply]);
    }, 2000);
  };

  // Submit Inventory Request
  const handleInventoryRequestSubmit = () => {
    setIsInventorySubmitted(true);
    setTimeout(() => {
      setIsInventoryModalOpen(false);
      setIsInventorySubmitted(false);
      alert('Cleaning inventory request submitted successfully to the Store Keeper.');
    }, 1500);
  };

  return (
    <div className="space-y-6 text-slate-900 w-full select-none min-h-screen pb-16" style={{ fontFamily: "'Inter', sans-serif" }}>
      
      {/* 1. PREMIUM HEADER BANNER */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden border border-slate-800 text-left">
        {/* Background gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 pointer-events-none" />
        <div className="absolute top-[-30%] left-[-20%] w-[80%] h-[150%] rounded-full bg-teal-500/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[120%] rounded-full bg-emerald-500/10 blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Live Operations</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Good Morning, Housekeeping Team 🧹
            </h1>
            <p className="text-slate-400 font-medium text-xs">
              Today's Hygiene focus: Keep the restaurant clean, hygienic, and ready for guests.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold bg-slate-850/60 p-3 rounded-xl border border-slate-700/50 backdrop-blur-md">
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-wider text-slate-500">Current Date</span>
              <span className="text-slate-200 mt-0.5">
                {currentTime.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            </div>
            <div className="w-[1px] h-6 bg-slate-750" />
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-wider text-slate-500">Live Clock</span>
              <span className="text-slate-200 font-mono mt-0.5">
                {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
              </span>
            </div>
            <div className="w-[1px] h-6 bg-slate-750" />
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-wider text-slate-500">Active Shift</span>
              <span className="text-emerald-400 mt-0.5 font-bold">Morning Shift</span>
            </div>
          </div>
        </div>

        {/* Global tab navigator */}
        <div className="relative z-10 flex gap-2 mt-6 border-t border-slate-800 pt-4">
          <button
            onClick={() => setActiveMainTab('dashboard')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer ${
              activeMainTab === 'dashboard'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/20'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            Hygiene Workspace
          </button>
          <button
            onClick={() => {
              setActiveMainTab('profile');
              setActiveProfileTab('personal');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer ${
              activeMainTab === 'profile'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/20'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
            }`}
          >
            <User className="w-4 h-4" />
            Workforce Profile
          </button>
        </div>
      </div>

      {activeMainTab === 'dashboard' ? (
        <>
          {/* 2. ATTENDANCE WIDGET */}
          <div className="text-slate-900">
            <AttendanceWidget
              status={attendanceStatus}
              checkInTime={checkInTime}
              checkOutTime={checkOutTime}
              workingHours={workingHours}
              shiftName={employeeDetails.shift}
              nowTime={currentTime}
              onCheckIn={handleCheckIn}
              onCheckOut={handleCheckOut}
            />
          </div>

          {/* 3. PREMIUM KPI CARDS */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {/* Card 1 */}
            <div className="bg-white border border-slate-250/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between h-[120px] text-left transition hover:shadow-md">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Cleaning Tasks</span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center border border-blue-100">
                  <ClipboardList className="w-4.5 h-4.5" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-slate-800 block">{totalTasks}</span>
                <span className="text-[10px] font-medium text-slate-500">Total assigned today</span>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white border border-slate-250/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between h-[120px] text-left transition hover:shadow-md">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Completed Today</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center border border-emerald-100">
                  <CheckCircle2 className="w-4.5 h-4.5" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-slate-800 block">{completedTasks}</span>
                <span className="text-[10px] font-medium text-slate-500">Tasks checked clean</span>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white border border-slate-250/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between h-[120px] text-left transition hover:shadow-md">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Pending Tasks</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center border border-amber-100">
                  <Clock className="w-4.5 h-4.5" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-slate-800 block">{pendingTasks + inProgressTasks}</span>
                <span className="text-[10px] font-medium text-slate-500">{inProgressTasks} currently in progress</span>
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-white border border-slate-250/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between h-[120px] text-left transition hover:shadow-md">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Urgent Cleaning</span>
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center border border-rose-100">
                  <AlertTriangle className="w-4.5 h-4.5" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-slate-800 block">{urgentCleaningCount}</span>
                <span className="text-[10px] font-medium text-slate-500">High priority pending</span>
              </div>
            </div>

            {/* Card 5 */}
            <div className="bg-white border border-slate-250/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between h-[120px] text-left transition hover:shadow-md">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active Areas</span>
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center border border-purple-100">
                  <Home className="w-4.5 h-4.5" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-slate-800 block">{activeAreasCount}</span>
                <span className="text-[10px] font-medium text-slate-500">Assigned zones online</span>
              </div>
            </div>
          </div>

          {/* 4. RESTAURANT AREA STATUS */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs text-left">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Restaurant Area Hygiene Status</h3>
                <p className="text-[11px] text-slate-500">Live health-status of sections. Click an area below to filter its tasks.</p>
              </div>
              {selectedAreaFilter && (
                <button
                  onClick={() => setSelectedAreaFilter(null)}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" /> Clear Filter
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
              {Object.entries(areaStatuses).map(([area, status]) => {
                let statusColor = 'border-slate-200 text-slate-600 bg-slate-50';
                let statusDot = 'bg-slate-400';
                let label = 'Clean';

                if (status === 'CLEAN') {
                  statusColor = 'border-emerald-250 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-50';
                  statusDot = 'bg-emerald-500';
                  label = 'Clean';
                } else if (status === 'CLEANING_IN_PROGRESS') {
                  statusColor = 'border-amber-250 text-amber-700 bg-amber-50/50 hover:bg-amber-50';
                  statusDot = 'bg-amber-500';
                  label = 'Cleaning...';
                } else if (status === 'NEEDS_CLEANING') {
                  statusColor = 'border-rose-250 text-rose-700 bg-rose-50/50 hover:bg-rose-50';
                  statusDot = 'bg-rose-500';
                  label = 'Needs Clean';
                }

                const isActiveFilter = selectedAreaFilter === area;

                return (
                  <button
                    key={area}
                    onClick={() => setSelectedAreaFilter(isActiveFilter ? null : area)}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center transition cursor-pointer ${statusColor} ${
                      isActiveFilter ? 'ring-2 ring-emerald-500 ring-offset-2 scale-102' : ''
                    }`}
                  >
                    <span className="text-[11px] font-bold truncate w-full">{area}</span>
                    <div className="flex items-center gap-1.5 mt-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
                      <span className="text-[9px] uppercase font-bold tracking-wider">{label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. FULL-WIDTH KANBAN TASK BOARD */}
          <div className="w-full bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col text-left">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Housekeeping Task Board</h3>
                <p className="text-[11px] text-slate-500">
                  {selectedAreaFilter ? `Showing tasks for: ${selectedAreaFilter}` : 'Active daily sanitization tasks roster'}
                </p>
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">नेहा पाटिल • HK-1035</div>
            </div>

            {/* Task board columns grid (Equal width, equal height columns) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch min-h-[600px]">
              
              {/* Column 1: Assigned */}
              <div className="bg-slate-50/50 border border-slate-200/80 rounded-2xl flex flex-col h-[650px] overflow-hidden">
                {/* Sticky Header with top color border */}
                <div className="p-4 bg-white border-b border-slate-200 border-t-4 border-amber-400 sticky top-0 z-10 flex flex-col gap-1 text-left shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-amber-500" />
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Assigned</h4>
                    </div>
                    <span className="text-[10px] font-extrabold bg-amber-50 border border-amber-100 px-2.5 py-0.5 rounded-full text-amber-700">
                      {filteredTasks.filter(t => t.status === 'ASSIGNED').length} Tasks
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    {filteredTasks.filter(t => t.status === 'ASSIGNED').length} Tasks Waiting
                  </span>
                </div>

                {/* Scrollable Cards Container */}
                <div className="p-4 flex-1 overflow-y-auto space-y-4">
                  {filteredTasks.filter(t => t.status === 'ASSIGNED').length === 0 ? (
                    <div className="h-40 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs font-semibold bg-slate-50/50 p-4">
                      <span>No assigned tasks</span>
                    </div>
                  ) : (
                    filteredTasks.filter(t => t.status === 'ASSIGNED').map(task => (
                      <div key={task.id} className="bg-white border border-slate-200/85 rounded-2xl p-5 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between min-h-[240px] text-left">
                        {/* Top: Area Name + Priority Badge */}
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                            📍 {task.areaName}
                          </span>
                          <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                            task.priority === 'HIGH' 
                              ? 'bg-rose-50 text-rose-700 border border-rose-100' 
                              : task.priority === 'MEDIUM' 
                                ? 'bg-amber-50 text-amber-700 border border-amber-100' 
                                : 'bg-slate-50 text-slate-700 border border-slate-100'
                          }`}>
                            ⚡ {task.priority}
                          </span>
                        </div>

                        {/* Middle: Task details, Employee, Scheduled Time, Est. Duration */}
                        <div className="space-y-3 flex-1">
                          <h4 className="text-sm font-bold text-slate-800 leading-snug">
                            📝 {task.taskType}
                          </h4>
                          
                          <div className="space-y-1.5 text-xs text-slate-500 font-medium">
                            <div className="flex items-center gap-2">
                              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>👤 {task.assignedEmployee}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>🕒 Scheduled: {task.assignedTime}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>⏱ Est. Duration: {task.estimatedCompletion}</span>
                            </div>
                          </div>
                        </div>

                        {/* Bottom: Action Buttons */}
                        <div className="flex items-center gap-2 mt-5 pt-3 border-t border-slate-100">
                          <button
                            onClick={() => startTask(task.id)}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white border border-emerald-500 rounded-xl py-2 text-[10px] font-bold uppercase tracking-wider text-center cursor-pointer transition shadow-xs"
                          >
                            Start
                          </button>
                          <button
                            onClick={() => setSelectedTaskDetails(task)}
                            className="bg-slate-50 hover:bg-slate-100 text-slate-650 border border-slate-200 rounded-xl p-2 text-center cursor-pointer transition"
                            title="View Details"
                          >
                            <Info className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Column 2: In Progress */}
              <div className="bg-slate-50/50 border border-slate-200/80 rounded-2xl flex flex-col h-[650px] overflow-hidden">
                {/* Sticky Header with top color border */}
                <div className="p-4 bg-white border-b border-slate-200 border-t-4 border-orange-500 sticky top-0 z-10 flex flex-col gap-1 text-left shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-orange-500" />
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">In Progress</h4>
                    </div>
                    <span className="text-[10px] font-extrabold bg-orange-50 border border-orange-100 px-2.5 py-0.5 rounded-full text-orange-700">
                      {filteredTasks.filter(t => t.status === 'IN_PROGRESS').length} Active
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    {filteredTasks.filter(t => t.status === 'IN_PROGRESS').length} Tasks Active
                  </span>
                </div>

                {/* Scrollable Cards Container */}
                <div className="p-4 flex-1 overflow-y-auto space-y-4">
                  {filteredTasks.filter(t => t.status === 'IN_PROGRESS').length === 0 ? (
                    <div className="h-40 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs font-semibold bg-slate-50/50 p-4">
                      <span>No tasks in progress</span>
                    </div>
                  ) : (
                    filteredTasks.filter(t => t.status === 'IN_PROGRESS').map(task => (
                      <div key={task.id} className="bg-white border border-slate-200/85 rounded-2xl p-5 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between min-h-[240px] text-left">
                        {/* Top: Area Name + Priority Badge */}
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                            📍 {task.areaName}
                          </span>
                          <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                            task.priority === 'HIGH' 
                              ? 'bg-rose-50 text-rose-700 border border-rose-100' 
                              : task.priority === 'MEDIUM' 
                                ? 'bg-amber-50 text-amber-700 border border-amber-100' 
                                : 'bg-slate-50 text-slate-700 border border-slate-100'
                          }`}>
                            ⚡ {task.priority}
                          </span>
                        </div>

                        {/* Middle: Task details, Employee, Started Time, Est. Duration */}
                        <div className="space-y-3 flex-1">
                          <h4 className="text-sm font-bold text-slate-800 leading-snug">
                            📝 {task.taskType}
                          </h4>
                          
                          <div className="space-y-1.5 text-xs text-slate-500 font-medium">
                            <div className="flex items-center gap-2">
                              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>👤 {task.assignedEmployee}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>🕒 Started: {task.assignedTime}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>⏱ Est. Duration: {task.estimatedCompletion}</span>
                            </div>
                          </div>
                        </div>

                        {/* Bottom: Action Buttons */}
                        <div className="flex items-center gap-2 mt-5 pt-3 border-t border-slate-100">
                          <button
                            onClick={() => completeTask(task.id)}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white border border-emerald-500 rounded-xl py-2 text-[10px] font-bold uppercase tracking-wider text-center cursor-pointer transition shadow-xs"
                          >
                            Complete
                          </button>
                          <button
                            onClick={() => setSelectedTaskDetails(task)}
                            className="bg-slate-50 hover:bg-slate-100 text-slate-650 border border-slate-200 rounded-xl p-2 text-center cursor-pointer transition"
                            title="View Details"
                          >
                            <Info className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Column 3: Completed */}
              <div className="bg-slate-50/50 border border-slate-200/80 rounded-2xl flex flex-col h-[650px] overflow-hidden">
                {/* Sticky Header with top color border */}
                <div className="p-4 bg-white border-b border-slate-200 border-t-4 border-emerald-500 sticky top-0 z-10 flex flex-col gap-1 text-left shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Completed</h4>
                    </div>
                    <span className="text-[10px] font-extrabold bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full text-emerald-700">
                      {filteredTasks.filter(t => t.status === 'COMPLETED').length} Done
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    {filteredTasks.filter(t => t.status === 'COMPLETED').length} Tasks Cleaned
                  </span>
                </div>

                {/* Scrollable Cards Container */}
                <div className="p-4 flex-1 overflow-y-auto space-y-4">
                  {filteredTasks.filter(t => t.status === 'COMPLETED').length === 0 ? (
                    <div className="h-40 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs font-semibold bg-slate-50/50 p-4">
                      <span>No completed tasks</span>
                    </div>
                  ) : (
                    filteredTasks.filter(t => t.status === 'COMPLETED').map(task => (
                      <div key={task.id} className="bg-white border border-slate-200/85 rounded-2xl p-5 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between min-h-[240px] text-left opacity-90">
                        {/* Top: Area Name + Priority Badge */}
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                            📍 {task.areaName}
                          </span>
                          <span className="text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase bg-emerald-50 text-emerald-700 border border-emerald-100">
                            ✓ DONE
                          </span>
                        </div>

                        {/* Middle: Task details, Employee, Finished Time */}
                        <div className="space-y-3 flex-1">
                          <h4 className="text-sm font-bold text-slate-400 line-through leading-snug">
                            📝 {task.taskType}
                          </h4>
                          
                          <div className="space-y-1.5 text-xs text-slate-400 font-medium">
                            <div className="flex items-center gap-2">
                              <User className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                              <span>👤 {task.assignedEmployee}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                              <span>🕒 Finished: {task.estimatedCompletion}</span>
                            </div>
                          </div>
                        </div>

                        {/* Bottom: Action Buttons */}
                        <div className="flex items-center gap-2 mt-5 pt-3 border-t border-slate-100">
                          <button
                            onClick={() => setSelectedTaskDetails(task)}
                            className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-650 border border-slate-200 rounded-xl py-2 text-[10px] font-bold uppercase tracking-wider text-center cursor-pointer transition"
                          >
                            Details
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* 6. TIMELINE & QUICK ACTIONS (Balanced layout below the board) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Daily Schedule Timeline */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs text-left">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Daily Cleaning Schedule</h3>
              
              <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-200">
                {scheduleItems.map((item, idx) => {
                  let statusBadgeColor = 'bg-slate-100 text-slate-600';
                  let bulletColor = 'bg-slate-300 ring-slate-100';

                  if (item.status === 'Completed') {
                    statusBadgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-100 border';
                    bulletColor = 'bg-emerald-500 ring-emerald-150';
                  } else if (item.status === 'In Progress') {
                    statusBadgeColor = 'bg-amber-50 text-amber-700 border-amber-100 border';
                    bulletColor = 'bg-amber-500 ring-amber-150';
                  } else if (item.status === 'Scheduled') {
                    statusBadgeColor = 'bg-blue-50 text-blue-700 border-blue-100 border';
                    bulletColor = 'bg-blue-500 ring-blue-150';
                  }

                  return (
                    <div key={idx} className="flex gap-4 items-start relative pl-8">
                      {/* Timeline Bullet */}
                      <div className={`absolute left-1.5 w-3 h-3 rounded-full ring-4 ${bulletColor}`} />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold font-mono text-slate-400">{item.time}</span>
                          <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusBadgeColor}`}>
                            {item.status}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-800 mt-1">{item.area}</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">{item.task}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs text-left">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Operations Quick Actions</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setSelectedAreaFilter(null)}
                  className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex flex-col items-start gap-2 transition cursor-pointer text-left"
                >
                  <ClipboardList className="w-5 h-5 text-blue-600" />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Assigned Tasks</span>
                    <span className="text-[9px] text-slate-500 block leading-tight">View clean list</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setActiveMainTab('profile');
                    setActiveProfileTab('attendance');
                  }}
                  className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex flex-col items-start gap-2 transition cursor-pointer text-left"
                >
                  <Clock className="w-5 h-5 text-emerald-600" />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Attendance</span>
                    <span className="text-[9px] text-slate-500 block leading-tight">Register history</span>
                  </div>
                </button>

                <button
                  onClick={() => setIsInventoryModalOpen(true)}
                  className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex flex-col items-start gap-2 transition cursor-pointer text-left"
                >
                  <Package className="w-5 h-5 text-purple-600" />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Inventory Request</span>
                    <span className="text-[9px] text-slate-500 block leading-tight">Order chemical/mops</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setActiveMainTab('profile');
                    setActiveProfileTab('messages');
                  }}
                  className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex flex-col items-start gap-2 transition cursor-pointer text-left"
                >
                  <MessageSquare className="w-5 h-5 text-amber-600" />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Messages</span>
                    <span className="text-[9px] text-slate-500 block leading-tight">Chat with manager</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setActiveMainTab('profile');
                    setActiveProfileTab('leave');
                  }}
                  className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex flex-col items-start gap-2 transition cursor-pointer text-left"
                >
                  <Calendar className="w-5 h-5 text-rose-600" />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Leave Request</span>
                    <span className="text-[9px] text-slate-500 block leading-tight">Apply off-duty logs</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setActiveMainTab('profile');
                    setActiveProfileTab('personal');
                  }}
                  className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex flex-col items-start gap-2 transition cursor-pointer text-left"
                >
                  <User className="w-5 h-5 text-indigo-600" />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">My Profile</span>
                    <span className="text-[9px] text-slate-500 block leading-tight">View personal files</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* ==================== WORKFORCE PROFILE PAGE ==================== */
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs text-left">
          <div className="flex flex-col md:flex-row gap-6">
            
            {/* Left sidebar sub-navigation */}
            <div className="w-full md:w-64 shrink-0 flex flex-col gap-1 border-r border-slate-150 pr-0 md:pr-4">
              <div className="p-3 bg-slate-50 rounded-xl mb-4 border border-slate-200/80 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500 text-white flex items-center justify-center font-bold text-lg">
                  NP
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-850 leading-tight">Neha Patil</h4>
                  <span className="text-[10px] text-slate-500">Employee ID: HK-1035</span>
                </div>
              </div>

              <button
                onClick={() => setActiveProfileTab('personal')}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition cursor-pointer ${
                  activeProfileTab === 'personal' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <User className="w-4 h-4" /> Personal & Shift Info
              </button>
              
              <button
                onClick={() => setActiveProfileTab('attendance')}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition cursor-pointer ${
                  activeProfileTab === 'attendance' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Clock className="w-4 h-4" /> Attendance Registry
              </button>

              <button
                onClick={() => setActiveProfileTab('leave')}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition cursor-pointer ${
                  activeProfileTab === 'leave' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Calendar className="w-4 h-4" /> Leave Request Center
              </button>

              <button
                onClick={() => setActiveProfileTab('messages')}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition cursor-pointer ${
                  activeProfileTab === 'messages' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <MessageSquare className="w-4 h-4" /> Messaging Inbox
              </button>

              <button
                onClick={() => setActiveProfileTab('documents')}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition cursor-pointer ${
                  activeProfileTab === 'documents' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <FileText className="w-4 h-4" /> Documents Vault
              </button>

              <div className="mt-8 border-t border-slate-150 pt-4">
                <button
                  onClick={() => setActiveMainTab('dashboard')}
                  className="w-full text-center border border-slate-200 hover:bg-slate-50 text-slate-700 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition"
                >
                  <Home className="w-4 h-4" /> Back to Dashboard
                </button>
              </div>
            </div>

            {/* Right content window */}
            <div className="flex-1 min-w-0 pt-4 md:pt-0">
              
              {/* TAB 1: PERSONAL INFO */}
              {activeProfileTab === 'personal' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Employee Personal Profile</h3>
                    <p className="text-[11px] text-slate-500">Official HR register information & credentials.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200/80">
                    <div className="space-y-4">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Full Name</span>
                        <h4 className="text-xs font-bold text-slate-850 mt-0.5">{employeeDetails.name}</h4>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Employee Roster ID</span>
                        <h4 className="text-xs font-mono font-bold text-slate-800 mt-0.5">{employeeDetails.employeeId}</h4>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Assigned Department</span>
                        <h4 className="text-xs font-bold text-slate-850 mt-0.5">{employeeDetails.dept}</h4>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Designated Role</span>
                        <h4 className="text-xs font-bold text-slate-850 mt-0.5">{employeeDetails.role}</h4>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Contact Number</span>
                        <h4 className="text-xs font-bold text-slate-850 mt-0.5">{employeeDetails.mobile}</h4>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Official Email</span>
                        <h4 className="text-xs font-bold text-slate-850 mt-0.5">{employeeDetails.email}</h4>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Emergency Contact</span>
                        <h4 className="text-xs font-bold text-slate-850 mt-0.5">{employeeDetails.emergencyContact}</h4>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Contract Start Date</span>
                        <h4 className="text-xs font-bold text-slate-850 mt-0.5">{employeeDetails.joiningDate}</h4>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border border-slate-200 rounded-xl text-center">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Performance rating</span>
                      <span className="text-lg font-bold text-slate-800 mt-1 block">⭐ {employeeDetails.performanceRating} / 5.0</span>
                    </div>
                    <div className="p-4 border border-slate-200 rounded-xl text-center">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Attendance score</span>
                      <span className="text-lg font-bold text-slate-800 mt-1 block">{employeeDetails.attendancePercent}%</span>
                    </div>
                    <div className="p-4 border border-slate-200 rounded-xl text-center">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Leave Balance</span>
                      <span className="text-lg font-bold text-slate-800 mt-1 block">{employeeDetails.leaveBalance} days remaining</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: ATTENDANCE HISTORY */}
              {activeProfileTab === 'attendance' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Attendance Registry & Roster Logs</h3>
                    <p className="text-[11px] text-slate-500">Overview of check-ins, check-outs, and shift rosters.</p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-[9px] font-bold text-slate-400 block uppercase">Total Present</span>
                      <span className="text-lg font-bold text-slate-800 mt-1 block">24 Days</span>
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-[9px] font-bold text-slate-400 block uppercase">Late Check-in</span>
                      <span className="text-lg font-bold text-slate-800 mt-1 block">1 Day</span>
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-[9px] font-bold text-slate-400 block uppercase">Leave days</span>
                      <span className="text-lg font-bold text-slate-800 mt-1 block">2 Days</span>
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-[9px] font-bold text-slate-400 block uppercase">Working Ratio</span>
                      <span className="text-lg font-bold text-slate-800 mt-1 block">96.2%</span>
                    </div>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[9px] tracking-wider">
                          <th className="p-3.5">Date</th>
                          <th className="p-3.5">Shift</th>
                          <th className="p-3.5">Check In</th>
                          <th className="p-3.5">Check Out</th>
                          <th className="p-3.5">Working Hours</th>
                          <th className="p-3.5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {[
                          { date: '06 Jul 2026', shift: 'Morning Shift', checkIn: '07:02 AM', checkOut: '03:00 PM', hours: '8h 0m', status: 'Present' },
                          { date: '05 Jul 2026', shift: 'Morning Shift', checkIn: '07:05 AM', checkOut: '03:00 PM', hours: '8h 0m', status: 'Present' },
                          { date: '04 Jul 2026', shift: 'Morning Shift', checkIn: '07:12 AM', checkOut: '03:00 PM', hours: '7h 48m', status: 'Present (Late)' },
                          { date: '03 Jul 2026', shift: 'Morning Shift', checkIn: '07:00 AM', checkOut: '03:00 PM', hours: '8h 0m', status: 'Present' },
                          { date: '02 Jul 2026', shift: 'Morning Shift', checkIn: '06:58 AM', checkOut: '03:00 PM', hours: '8h 2m', status: 'Present' },
                          { date: '01 Jul 2026', shift: 'Morning Shift', checkIn: '07:01 AM', checkOut: '03:00 PM', hours: '8h 0m', status: 'Present' }
                        ].map((log, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="p-3.5 text-slate-800 font-bold">{log.date}</td>
                            <td className="p-3.5 text-slate-600">{log.shift}</td>
                            <td className="p-3.5 text-slate-800 font-mono">{log.checkIn}</td>
                            <td className="p-3.5 text-slate-800 font-mono">{log.checkOut}</td>
                            <td className="p-3.5 text-slate-650">{log.hours}</td>
                            <td className="p-3.5">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                log.status.includes('Late') ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                              }`}>
                                {log.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: LEAVE REQUEST CENTER */}
              {activeProfileTab === 'leave' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Leave Requests & Absence logs</h3>
                    <p className="text-[11px] text-slate-500">Apply for casual, sick, or emergency leave and check status.</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Apply Leave Form */}
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1">
                        <Plus className="w-4 h-4 text-emerald-600" /> Apply For Leave
                      </h4>
                      <form onSubmit={handleApplyLeaveSubmit} className="space-y-3.5">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Leave Type</label>
                          <select
                            value={leaveType}
                            onChange={(e) => setLeaveType(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          >
                            <option value="Sick Leave">Sick Leave</option>
                            <option value="Casual Leave">Casual Leave</option>
                            <option value="Unpaid Leave">Unpaid Leave</option>
                            <option value="Emergency Leave">Emergency Leave</option>
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Start Date</label>
                            <input
                              type="date"
                              required
                              value={leaveStartDate}
                              onChange={(e) => setLeaveStartDate(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">End Date</label>
                            <input
                              type="date"
                              required
                              value={leaveEndDate}
                              onChange={(e) => setLeaveEndDate(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Reason for Absence</label>
                          <textarea
                            rows={3}
                            required
                            value={leaveReason}
                            onChange={(e) => setLeaveReason(e.target.value)}
                            placeholder="Provide reason for leave..."
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold py-2 rounded-xl text-xs uppercase tracking-wider transition cursor-pointer"
                        >
                          Submit Leave Request
                        </button>
                      </form>
                    </div>

                    {/* Applied Leave List */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Leave Logs History</h4>
                      
                      <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                        {leaveRequests.map((req) => {
                          let badgeColor = 'bg-slate-100 text-slate-650';
                          if (req.status === 'APPROVED') badgeColor = 'bg-emerald-50 text-emerald-700 border border-emerald-100';
                          else if (req.status === 'REJECTED') badgeColor = 'bg-rose-50 text-rose-700 border border-rose-100';
                          else if (req.status === 'PENDING') badgeColor = 'bg-amber-50 text-amber-700 border border-amber-100';

                          return (
                            <div key={req.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left space-y-2 relative">
                              <span className="text-[9px] font-bold font-mono text-slate-400">{req.id}</span>
                              <div className="flex justify-between items-center">
                                <h5 className="text-xs font-bold text-slate-800">{req.leaveType}</h5>
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${badgeColor}`}>
                                  {req.status}
                                </span>
                              </div>

                              <p className="text-[10px] text-slate-500 leading-tight">
                                <span className="font-bold">Duration:</span> {req.startDate} to {req.endDate}
                              </p>
                              <p className="text-[10px] text-slate-500 italic mt-1 leading-tight">
                                "{req.reason}"
                              </p>

                              {req.responseBy && (
                                <div className="mt-2 pt-2 border-t border-slate-200/60 bg-white/40 p-2 rounded text-[10px]">
                                  <span className="font-bold text-slate-700">{req.responseBy}:</span>
                                  <span className="text-slate-500 ml-1">"{req.responseReason}"</span>
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

              {/* TAB 4: MESSAGE CENTER */}
              {activeProfileTab === 'messages' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Workplace Communications</h3>
                    <p className="text-[11px] text-slate-500">Internal chat messaging with Manager Bob.</p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col h-[400px]">
                    {/* Chat log */}
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-4">
                      {messages.map((msg) => {
                        const isSelf = msg.sender === 'housekeeper';
                        return (
                          <div key={msg.id} className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[75%] p-3 rounded-2xl shadow-xs text-xs relative ${
                              isSelf ? 'bg-emerald-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                            }`}>
                              <span className="text-[9px] font-bold block opacity-70 mb-0.5">{msg.senderName}</span>
                              <p className="leading-relaxed font-medium">{msg.text}</p>
                              <span className="text-[8px] opacity-60 block text-right mt-1.5 font-mono">{msg.timestamp}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Chat Input */}
                    <form onSubmit={handleSendMessageSubmit} className="flex gap-2">
                      <input
                        type="text"
                        required
                        value={newMessageText}
                        onChange={(e) => setNewMessageText(e.target.value)}
                        placeholder="Write a message to your manager..."
                        className="flex-1 bg-white border border-slate-250 rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white p-2.5 rounded-xl transition cursor-pointer flex items-center justify-center shrink-0"
                      >
                        <Send className="w-4.5 h-4.5" />
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* TAB 5: DOCUMENTS VAULT */}
              {activeProfileTab === 'documents' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Employee Documents Vault</h3>
                    <p className="text-[11px] text-slate-500">Official letters, handbook, and monthly salary payslips.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center border border-teal-150">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-slate-800">Appointment Letter.pdf</h5>
                          <span className="text-[10px] text-slate-400">Signed • 1.2 MB</span>
                        </div>
                      </div>
                      <button
                        onClick={() => alert('Downloading: Appointment_Letter.pdf')}
                        className="p-2 hover:bg-slate-200 rounded-lg text-slate-500 transition cursor-pointer"
                        title="Download Document"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center border border-teal-150">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-slate-800">Employee Handbook v4.pdf</h5>
                          <span className="text-[10px] text-slate-400">Public policy • 3.5 MB</span>
                        </div>
                      </div>
                      <button
                        onClick={() => alert('Downloading: Employee_Handbook_v4.pdf')}
                        className="p-2 hover:bg-slate-200 rounded-lg text-slate-500 transition cursor-pointer"
                        title="Download Document"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center border border-teal-150">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-slate-800">Payslip - June 2026.pdf</h5>
                          <span className="text-[10px] text-slate-400">Salary statement • 140 KB</span>
                        </div>
                      </div>
                      <button
                        onClick={() => alert('Downloading: Payslip_June_2026.pdf')}
                        className="p-2 hover:bg-slate-200 rounded-lg text-slate-500 transition cursor-pointer"
                        title="Download Document"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center border border-teal-150">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-slate-800">Payslip - May 2026.pdf</h5>
                          <span className="text-[10px] text-slate-400">Salary statement • 140 KB</span>
                        </div>
                      </div>
                      <button
                        onClick={() => alert('Downloading: Payslip_May_2026.pdf')}
                        className="p-2 hover:bg-slate-200 rounded-lg text-slate-500 transition cursor-pointer"
                        title="Download Document"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ==================== MODALS ==================== */}

      {/* 1. TASK DETAILS MODAL */}
      {selectedTaskDetails && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative animate-scale-up text-left">
            <button
              onClick={() => setSelectedTaskDetails(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold font-mono text-slate-400">{selectedTaskDetails.id}</span>
                <h3 className="text-sm font-bold text-slate-850 uppercase tracking-wider">{selectedTaskDetails.taskType}</h3>
                <p className="text-xs font-bold text-emerald-600 mt-1">{selectedTaskDetails.areaName}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl text-xs">
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Priority</span>
                  <span className={`block font-bold mt-0.5 ${
                    selectedTaskDetails.priority === 'HIGH' ? 'text-rose-600' : selectedTaskDetails.priority === 'MEDIUM' ? 'text-amber-600' : 'text-slate-600'
                  }`}>{selectedTaskDetails.priority}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Status</span>
                  <span className="block font-bold text-slate-700 mt-0.5">{selectedTaskDetails.status}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Assigned time</span>
                  <span className="block font-bold text-slate-700 mt-0.5">{selectedTaskDetails.assignedTime}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Estimated Completion</span>
                  <span className="block font-bold text-slate-700 mt-0.5">{selectedTaskDetails.estimatedCompletion}</span>
                </div>
              </div>

              {selectedTaskDetails.notes && (
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description & Notes</span>
                  <p className="text-xs text-slate-650 mt-1 leading-relaxed">{selectedTaskDetails.notes}</p>
                </div>
              )}

              {selectedTaskDetails.checklist && selectedTaskDetails.checklist.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Checklist & Steps</span>
                  <div className="space-y-1.5">
                    {selectedTaskDetails.checklist.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-slate-750">
                        <div className={`w-3.5 h-3.5 border rounded flex items-center justify-center shrink-0 ${
                          selectedTaskDetails.status === 'COMPLETED' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300'
                        }`}>
                          {selectedTaskDetails.status === 'COMPLETED' && '✓'}
                        </div>
                        <span className={selectedTaskDetails.status === 'COMPLETED' ? 'line-through text-slate-400' : ''}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                {selectedTaskDetails.status === 'ASSIGNED' && (
                  <button
                    onClick={() => {
                      startTask(selectedTaskDetails.id);
                      setSelectedTaskDetails(null);
                    }}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-xs uppercase tracking-wider transition cursor-pointer"
                  >
                    Start Task
                  </button>
                )}
                {selectedTaskDetails.status === 'IN_PROGRESS' && (
                  <button
                    onClick={() => {
                      completeTask(selectedTaskDetails.id);
                      setSelectedTaskDetails(null);
                    }}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-xs uppercase tracking-wider transition cursor-pointer"
                  >
                    Mark Clean & Complete
                  </button>
                )}
                <button
                  onClick={() => setSelectedTaskDetails(null)}
                  className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-650 font-bold py-2 rounded-xl text-xs uppercase tracking-wider transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. INVENTORY REQUEST MODAL */}
      {isInventoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-scale-up text-left">
            <button
              onClick={() => setIsInventoryModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-850 uppercase tracking-wider">Inventory Restock Request</h3>
                <p className="text-[11px] text-slate-500">Request cleaning supplies from the main store keeper.</p>
              </div>

              {isInventorySubmitted ? (
                <div className="py-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-500 border border-emerald-100 flex items-center justify-center mx-auto animate-bounce">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800">Submitting Request...</h4>
                  <p className="text-[10px] text-slate-500">Routing details to store keeper registry.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3.5">
                    {inventoryRequestItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <div>
                          <span className="text-xs font-bold text-slate-800 block">{item.name}</span>
                          <span className="text-[10px] text-slate-400 block">Unit: {item.unit}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setInventoryRequestItems(prev => prev.map((it, i) => i === idx ? { ...it, quantity: Math.max(0, it.quantity - 1) } : it))}
                            className="w-7 h-7 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                          >
                            -
                          </button>
                          <span className="text-xs font-bold w-6 text-center">{item.quantity}</span>
                          <button
                            onClick={() => setInventoryRequestItems(prev => prev.map((it, i) => i === idx ? { ...it, quantity: it.quantity + 1 } : it))}
                            className="w-7 h-7 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-slate-100">
                    <button
                      onClick={handleInventoryRequestSubmit}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider transition cursor-pointer"
                    >
                      Submit Order
                    </button>
                    <button
                      onClick={() => setIsInventoryModalOpen(false)}
                      className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-650 font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

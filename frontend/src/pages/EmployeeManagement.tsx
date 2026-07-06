import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { AttendanceWidget } from '../components/AttendanceWidget';
import {
  Loader2,
  Plus,
  X,
  Search,
  Trash2,
  Edit2,
  User,
  Calendar,
  Clock,
  CreditCard,
  LayoutDashboard,
  FileText,
  Star,
  ShieldAlert,
  MessageSquare,
  Zap
} from 'lucide-react';

export interface Employee {
  id: string;
  employeeId: string;
  name: string;
  phone: string;
  email: string | null;
  department: string;
  role: string;
  joiningDate: string;
  shift: string;
  employmentType: string;
  salary: number | null;
  status: string;
  notes: string | null;
}

export interface Leave {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: string;
  reason: string;
  startDate: string;
  endDate: string;
  status: string;
  createdAt: string;
  numberOfDays?: number;
  emergencyContact?: string;
  attachmentName?: string;
}

export interface Salary {
  id: string;
  employeeId: string;
  employeeName: string;
  role: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  paymentStatus: string;
  paymentDate: string | null;
  paymentMethod: string | null;
  paidBy: string | null;
  notes: string | null;
  month: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  role: string;
  date: string;
  checkIn: string;
  checkOut: string | null;
  workingHours: number | null;
  status: string; // Working, Checked Out, On Leave, Absent, Weekly Off
}

const DEPARTMENT_ROLES_MAP: Record<string, string[]> = {
  Management: ['Manager', 'Supervisor'],
  Service: ['Waiter'],
  Billing: ['Cashier'],
  Kitchen: ['Kitchen Staff', 'Kitchen Helper'],
  Cleaning: ['Cleaner'],
  Security: ['Security']
};

export const EmployeeManagement: React.FC = () => {
  const { user, apiRequest } = useAuth();

  // Navigation tab inside page (Dashboard, Roster, Attendance, Leaves, Salary)
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'roster' | 'attendance' | 'leaves' | 'salary'>('dashboard');

  // Core Data States
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Selected States
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [selectedEmployeeDetail, setSelectedEmployeeDetail] = useState<Employee | null>(null);

  // Salary Payment Modal state
  const [salaryPaymentModalOpen, setSalaryPaymentModalOpen] = useState(false);
  const [payingSalaryRecord, setPayingSalaryRecord] = useState<Salary | null>(null);
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payMethod, setPayMethod] = useState('Cash');
  const [payNotes, setPayNotes] = useState('');

  // Salary slip preview state
  const [viewingSalarySlip, setViewingSalarySlip] = useState<Salary | null>(null);

  // Employee Add/Edit Form states
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formDept, setFormDept] = useState('Service');
  const [formRole, setFormRole] = useState('Waiter');
  const [formJoinDate, setFormJoinDate] = useState(new Date().toISOString().split('T')[0]);
  const [formShift, setFormShift] = useState('Morning');
  const [formEmpType, setFormEmpType] = useState('Full-time');
  const [formSalary, setFormSalary] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Self Service States
  const [isCheckInLoading, setIsCheckInLoading] = useState(false);
  const [leaveType, setLeaveType] = useState('Sick Leave');
  const [leaveFrom, setLeaveFrom] = useState('');
  const [leaveTo, setLeaveTo] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveEmergencyContact, setLeaveEmergencyContact] = useState('');
  const [leaveAttachmentName, setLeaveAttachmentName] = useState('');

  // Identity Simulation Switcher (Dev Mode)
  const [simulatedRole, setSimulatedRole] = useState<'ADMIN' | 'MANAGER' | 'EMPLOYEE'>('EMPLOYEE');
  const [simulatedEmployeeId, setSimulatedEmployeeId] = useState<string>('emp-11'); // Rahul Sharma
  const [selectedSalaryMonth, setSelectedSalaryMonth] = useState<string>('June 2026');

  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' }[]>([]);

  const addToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const getLocalDateString = () => {
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    return new Date(Date.now() - tzoffset).toISOString().split('T')[0];
  };
  const todayStr = getLocalDateString();

  const getEffectiveRoleLocal = (u: any) => {
    if (!u) return 'ADMIN';
    if (u.employee?.role) {
      const r = u.employee.role.toLowerCase();
      if (r.includes('admin')) return 'ADMIN';
      if (r.includes('manager')) return 'MANAGER';
      return 'EMPLOYEE';
    }
    return u.role === 'ADMIN' ? 'ADMIN' : u.role === 'MANAGER' ? 'MANAGER' : 'EMPLOYEE';
  };

  // Sync initial identity simulation with real logged in user context
  useEffect(() => {
    if (user) {
      const realRole = getEffectiveRoleLocal(user);
      setSimulatedRole(realRole);
      setSimulatedEmployeeId(user?.employee?.id || (realRole === 'ADMIN' ? 'emp-1' : realRole === 'MANAGER' ? 'emp-2' : 'emp-11'));
    }
  }, [user]);

  const role = simulatedRole;
  const isAdmin = role === 'ADMIN';
  const isManager = role === 'MANAGER';
  const isManagerOrAdmin = isAdmin || isManager;
  const currentEmployeeId = simulatedEmployeeId;

  const fetchERPData = async () => {
    setLoading(true);
    const restId = user?.restaurantId || 'mock-id';
    try {
      const emps = await apiRequest(`/restaurant/employees?restaurantId=${restId}`);
      setEmployees(emps || []);
      
      const lvs = await apiRequest(`/restaurant/leaves?restaurantId=${restId}`);
      setLeaves(lvs || []);

      const sals = await apiRequest(`/restaurant/salaries?restaurantId=${restId}`);
      setSalaries(sals || []);

      const att = await apiRequest(`/restaurant/attendance?restaurantId=${restId}`);
      setAttendance(att || []);
    } catch (err) {
      console.warn('Backend offline - seeding high contrast, shift-allocated Staff Management database.');
      
      // 12 employees with realistic Indian names & maximum ₹25,000 salary
      // shifts assigned dynamically per user specs
      const seedEmps = [
        { id: 'emp-1', employeeId: 'EMP-1001', name: 'Vikram Malhotra', phone: '9876543210', email: 'vikram.m@diner.com', department: 'Management', role: 'Manager', joiningDate: '2023-01-15', shift: 'Morning', employmentType: 'Full-time', salary: 25000, status: 'Active', notes: 'Overall restaurant operations head.' },
        { id: 'emp-2', employeeId: 'EMP-1002', name: 'Ananya Roy', phone: '9820123456', email: 'ananya.roy@diner.com', department: 'Management', role: 'Supervisor', joiningDate: '2023-04-10', shift: 'Evening', employmentType: 'Full-time', salary: 25000, status: 'Active', notes: 'Floor supervisor.' },
        { id: 'emp-3', employeeId: 'EMP-1003', name: 'Neha Gupta', phone: '9819876543', email: 'neha.g@diner.com', department: 'Billing', role: 'Cashier', joiningDate: '2023-06-01', shift: 'Morning', employmentType: 'Full-time', salary: 22000, status: 'Active', notes: 'Morning cashier.' },
        { id: 'emp-4', employeeId: 'EMP-1004', name: 'Rohan Sharma', phone: '9876223344', email: 'rohan.s@diner.com', department: 'Billing', role: 'Cashier', joiningDate: '2023-05-15', shift: 'Evening', employmentType: 'Full-time', salary: 22000, status: 'Active', notes: 'Evening cashier.' },
        { id: 'emp-5', employeeId: 'EMP-1005', name: 'Rajesh Kumar', phone: '9833445566', email: 'rajesh.k@diner.com', department: 'Kitchen', role: 'Kitchen Staff', joiningDate: '2023-09-20', shift: 'Morning', employmentType: 'Full-time', salary: 20000, status: 'Active', notes: 'Chef 1.' },
        { id: 'emp-6', employeeId: 'EMP-1006', name: 'Suresh Devgan', phone: '9892112233', email: 'suresh.d@diner.com', department: 'Kitchen', role: 'Kitchen Staff', joiningDate: '2023-08-15', shift: 'Evening', employmentType: 'Full-time', salary: 20000, status: 'Active', notes: 'Chef 2.' },
        { id: 'emp-7', employeeId: 'EMP-1007', name: 'Sunita Rao', phone: '9876112233', email: 'sunita.r@diner.com', department: 'Kitchen', role: 'Kitchen Helper', joiningDate: '2023-02-10', shift: 'Night', employmentType: 'Full-time', salary: 17000, status: 'Active', notes: 'Kitchen helper.' },
        { id: 'emp-8', employeeId: 'EMP-1008', name: 'Dinesh Karthik', phone: '9876334455', email: 'dinesh.k@diner.com', department: 'Security', role: 'Security', joiningDate: '2023-03-14', shift: 'Night', employmentType: 'Full-time', salary: 16000, status: 'Active', notes: 'Night security staff.' },
        { id: 'emp-9', employeeId: 'EMP-1009', name: 'Priya Patil', phone: '9820556677', email: 'priya.p@diner.com', department: 'Service', role: 'Waiter', joiningDate: '2023-07-01', shift: 'Morning', employmentType: 'Full-time', salary: 18000, status: 'Active', notes: 'Waiter 1.' },
        { id: 'emp-10', employeeId: 'EMP-1010', name: 'Amit Jadhav', phone: '9819112233', email: 'amit.j@diner.com', department: 'Service', role: 'Waiter', joiningDate: '2023-11-05', shift: 'Evening', employmentType: 'Full-time', salary: 18000, status: 'Active', notes: 'Waiter 2.' },
        { id: 'emp-11', employeeId: 'EMP-1024', name: 'Rahul Sharma', phone: '+91 9876543210', email: 'rahul.sharma@restaurant.com', department: 'Restaurant Service', role: 'Senior Waiter', joiningDate: '12 March 2025', shift: 'Morning (09:00 AM – 06:00 PM)', employmentType: 'Full-Time', salary: 18000, status: 'Active', notes: 'Senior waiter roster.' },
        { id: 'emp-12', employeeId: 'EMP-1012', name: 'Arjun Singh', phone: '9820334455', email: 'arjun.s@diner.com', department: 'Cleaning', role: 'Cleaner', joiningDate: '2024-02-20', shift: 'Night', employmentType: 'Full-time', salary: 15000, status: 'Active', notes: 'Cleaner.' }
      ];
      setEmployees(seedEmps);

      // Seed attendance records
      setAttendance([
        { id: 'att-1', employeeId: 'emp-1', employeeName: 'Vikram Malhotra', role: 'Manager', date: todayStr, checkIn: '08:45 AM', checkOut: null, workingHours: null, status: 'Working' },
        { id: 'att-2', employeeId: 'emp-3', employeeName: 'Neha Gupta', role: 'Cashier', date: todayStr, checkIn: '09:15 AM', checkOut: null, workingHours: null, status: 'Working' },
        { id: 'att-3', employeeId: 'emp-9', employeeName: 'Priya Patil', role: 'Waiter', date: todayStr, checkIn: '07:05 AM', checkOut: '03:10 PM', workingHours: 8.1, status: 'Checked Out' },
        { id: 'att-4', employeeId: 'emp-5', employeeName: 'Rajesh Kumar', role: 'Kitchen Staff', date: todayStr, checkIn: '08:00 AM', checkOut: null, workingHours: null, status: 'Working' },
        { id: 'att-5', employeeId: 'emp-11', employeeName: 'Rahul Sharma', role: 'Senior Waiter', date: todayStr, checkIn: '09:02 AM', checkOut: null, workingHours: 5.25, status: 'Working' },
        { id: 'att-rs1', employeeId: 'emp-11', employeeName: 'Rahul Sharma', role: 'Senior Waiter', date: '05 Jul 2026', checkIn: '09:00 AM', checkOut: '06:03 PM', workingHours: 9.05, status: 'Checked Out' },
        { id: 'att-rs2', employeeId: 'emp-11', employeeName: 'Rahul Sharma', role: 'Senior Waiter', date: '04 Jul 2026', checkIn: '09:08 AM', checkOut: '06:00 PM', workingHours: 8.87, status: 'Checked Out' },
        { id: 'att-rs3', employeeId: 'emp-11', employeeName: 'Rahul Sharma', role: 'Senior Waiter', date: '03 Jul 2026', checkIn: '—', checkOut: '—', workingHours: null, status: 'Absent' },
        { id: 'att-rs4', employeeId: 'emp-11', employeeName: 'Rahul Sharma', role: 'Senior Waiter', date: '02 Jul 2026', checkIn: '09:04 AM', checkOut: '06:01 PM', workingHours: 8.95, status: 'Checked Out' }
      ]);

      // Seed leaves
      setLeaves([
        { id: 'lv-1', employeeId: 'emp-10', employeeName: 'Amit Jadhav', leaveType: 'Casual Leave', reason: 'Personal family emergency', startDate: todayStr, endDate: todayStr, status: 'PENDING', createdAt: todayStr },
        { id: 'lv-2', employeeId: 'emp-12', employeeName: 'Arjun Singh', leaveType: 'Sick Leave', reason: 'Fever and cold', startDate: todayStr, endDate: todayStr, status: 'PENDING', createdAt: todayStr },
        { id: 'lv-rs1', employeeId: 'emp-11', employeeName: 'Rahul Sharma', leaveType: 'Casual Leave', reason: 'Out of station trip', startDate: '2026-06-15', endDate: '2026-06-15', status: 'APPROVED', createdAt: '2026-06-12' },
        { id: 'lv-rs2', employeeId: 'emp-11', employeeName: 'Rahul Sharma', leaveType: 'Sick Leave', reason: 'Viral fever checkup', startDate: '2026-05-03', endDate: '2026-05-04', status: 'APPROVED', createdAt: '2026-05-02' },
        { id: 'lv-rs3', employeeId: 'emp-11', employeeName: 'Rahul Sharma', leaveType: 'Personal Leave', reason: 'Personal work at hometown', startDate: '2026-04-10', endDate: '2026-04-10', status: 'REJECTED', createdAt: '2026-04-08' },
        { id: 'lv-rs4', employeeId: 'emp-11', employeeName: 'Rahul Sharma', leaveType: 'Casual Leave', reason: 'Festival celebration', startDate: '2026-03-18', endDate: '2026-03-18', status: 'APPROVED', createdAt: '2026-03-16' }
      ]);

      // Seed historical salaries
      const generatedSalaries: Salary[] = [];
      const months = ['July 2026', 'June 2026', 'May 2026', 'April 2026', 'March 2026', 'February 2026', 'January 2026'];
      
      seedEmps.forEach(emp => {
        months.forEach((m, idx) => {
          const isCurrentMonth = idx === 0;
          generatedSalaries.push({
            id: `sal-${emp.id}-${m.replace(' ', '-')}`,
            employeeId: emp.id,
            employeeName: emp.name,
            role: emp.role,
            basicSalary: Math.round((emp.salary || 15000) * 0.8),
            allowances: Math.round((emp.salary || 15000) * 0.2),
            deductions: 0,
            netSalary: emp.salary || 15000,
            paymentStatus: isCurrentMonth ? 'UNPAID' : 'PAID',
            paymentDate: isCurrentMonth ? null : '2026-06-30',
            paymentMethod: isCurrentMonth ? null : 'UPI',
            paidBy: isCurrentMonth ? null : 'Vikram Malhotra',
            notes: isCurrentMonth ? null : 'Monthly payroll release',
            month: m
          });
        });
      });
      setSalaries(generatedSalaries);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchERPData();
  }, [user]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab === 'attendance') setCurrentTab('attendance');
    else if (tab === 'leaves') setCurrentTab('leaves');
    else if (tab === 'salary') {
      setCurrentTab('salary');
    } else if (tab === 'roster') {
      setCurrentTab('roster');
    } else {
      setCurrentTab(isManagerOrAdmin ? 'roster' : 'dashboard');
    }
  }, [window.location.search, isManagerOrAdmin, isAdmin]);

  // Handle automatic role transition tab syncing
  useEffect(() => {
    if (isManagerOrAdmin && currentTab === 'dashboard') {
      setCurrentTab('roster');
    } else if (!isManagerOrAdmin && currentTab === 'roster') {
      setCurrentTab('dashboard');
    }
  }, [isManagerOrAdmin]);

  const handleDeptChange = (dept: string) => {
    setFormDept(dept);
    const roles = DEPARTMENT_ROLES_MAP[dept] || [];
    if (roles.length > 0) {
      setFormRole(roles[0]);
    }
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || formPhone.length !== 10) {
      addToast('Please input a valid name and 10-digit phone number.', 'error');
      return;
    }
    const payload = {
      restaurantId: user?.restaurantId || 'mock-id',
      name: formName,
      phone: formPhone,
      email: formEmail || null,
      department: formDept,
      role: formRole,
      joiningDate: formJoinDate,
      shift: formShift,
      employmentType: formEmpType,
      salary: formSalary ? parseFloat(formSalary) : null,
      notes: formNotes || null,
      createLogin: false,
      password: null
    };

    try {
      if (editingEmployee) {
        await apiRequest(`/restaurant/employees/${editingEmployee.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        await apiRequest('/restaurant/employees', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }
      setShowAddModal(false);
      setShowEditModal(false);
      setEditingEmployee(null);
      fetchERPData();
      window.dispatchEvent(new CustomEvent('employee-mutated'));
    } catch (err) {
      // Mock Fallback
      if (editingEmployee) {
        setEmployees(prev => prev.map(emp => emp.id === editingEmployee.id ? { ...emp, ...payload } : emp));
        setSalaries(prev => prev.map(sal => {
          if (sal.employeeId === editingEmployee.id && sal.month === 'July 2026') {
            const updatedSalary = payload.salary || 18000;
            return {
              ...sal,
              employeeName: payload.name,
              role: payload.role,
              basicSalary: Math.round(updatedSalary * 0.8),
              allowances: Math.round(updatedSalary * 0.2),
              netSalary: updatedSalary
            };
          }
          return sal;
        }));
      } else {
        const mockNewId = `emp-${Date.now()}`;
        const newEmp = { ...payload, id: mockNewId, employeeId: `EMP-${Math.floor(1000 + Math.random() * 9000)}`, status: 'Active', createdAt: new Date().toISOString() };
        setEmployees(prev => [...prev, newEmp]);
        
        // Seed Salary for this month
        const newSal: Salary = {
          id: `sal-${mockNewId}-July-2026`,
          employeeId: mockNewId,
          employeeName: payload.name,
          role: payload.role,
          basicSalary: Math.round((payload.salary || 18000) * 0.8),
          allowances: Math.round((payload.salary || 18000) * 0.2),
          deductions: 0,
          netSalary: payload.salary || 18000,
          paymentStatus: 'UNPAID',
          paymentDate: null,
          paymentMethod: null,
          paidBy: null,
          notes: null,
          month: 'July 2026'
        };
        setSalaries(prev => [newSal, ...prev]);
      }
      setShowAddModal(false);
      setShowEditModal(false);
      setEditingEmployee(null);
      window.dispatchEvent(new CustomEvent('employee-mutated'));
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!window.confirm('Remove employee from database?')) return;
    try {
      await apiRequest(`/restaurant/employees/${id}`, { method: 'DELETE' });
      fetchERPData();
      window.dispatchEvent(new CustomEvent('employee-mutated'));
    } catch (err) {
      setEmployees(prev => prev.filter(e => e.id !== id));
      setSalaries(prev => prev.filter(s => s.employeeId !== id));
      window.dispatchEvent(new CustomEvent('employee-mutated'));
    }
  };

  // Automated working hours calculation helper
  const calculateWorkingHours = (inTime: string, outTime: string): number => {
    try {
      const parseTime = (timeStr: string) => {
        const [time, modifier] = timeStr.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        if (modifier === 'PM' && hours < 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0;
        return hours * 60 + minutes;
      };
      const diffMinutes = parseTime(outTime) - parseTime(inTime);
      if (diffMinutes <= 0) return 8.0;
      return parseFloat((diffMinutes / 60).toFixed(1));
    } catch (e) {
      return 8.0;
    }
  };

  // Clock In / Clock Out
  const handleClockAction = async (action: 'IN' | 'OUT') => {
    const empId = currentEmployeeId;
    const empRecord = employees.find(e => e.id === empId);
    const empName = empRecord?.name || 'Staff Member';
    const empRole = empRecord?.role || 'Waiter';
    setIsCheckInLoading(true);
    
    try {
      await apiRequest(`/restaurant/employees/${empId}/attendance`, {
        method: 'POST',
        body: JSON.stringify({ action, date: todayStr, time: new Date().toLocaleTimeString() })
      });
      fetchERPData();
      window.dispatchEvent(new CustomEvent('employee-attendance-mutated', { detail: { employeeId: empId, employeeName: empName, action } }));
    } catch (err) {
      const nowTimeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      if (action === 'IN') {
        const newRecord: AttendanceRecord = {
          id: `att-${Date.now()}`,
          employeeId: empId,
          employeeName: empName,
          role: empRole,
          date: todayStr,
          checkIn: nowTimeStr,
          checkOut: null,
          workingHours: null,
          status: 'Working'
        };
        setAttendance(prev => [newRecord, ...prev]);
      } else {
        setAttendance(prev => prev.map(rec => {
          if (rec.employeeId === empId && rec.date === todayStr && rec.status === 'Working') {
            const calculatedHrs = calculateWorkingHours(rec.checkIn, nowTimeStr);
            return {
              ...rec,
              checkOut: nowTimeStr,
              workingHours: calculatedHrs,
              status: 'Checked Out'
            };
          }
          return rec;
        }));
      }
      window.dispatchEvent(new CustomEvent('employee-attendance-mutated', { detail: { employeeId: empId, employeeName: empName, action } }));
    } finally {
      setIsCheckInLoading(false);
    }
  };

  const calculateLeaveDays = (start: string, end: string): number => {
    if (!start || !end) return 0;
    const sDate = new Date(start);
    const eDate = new Date(end);
    const diffTime = eDate.getTime() - sDate.getTime();
    if (diffTime < 0) return 0;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const getEmployeeLeaveBalances = (empId: string) => {
    const approvedLeaves = leaves.filter(l => l.employeeId === empId && l.status === 'APPROVED');
    const sickApproved = approvedLeaves.filter(l => l.leaveType === 'Sick Leave').reduce((sum, l) => sum + (l.numberOfDays || 1), 0);
    const casualApproved = approvedLeaves.filter(l => l.leaveType === 'Casual Leave').reduce((sum, l) => sum + (l.numberOfDays || 1), 0);
    const earnedApproved = approvedLeaves.filter(l => l.leaveType === 'Earned Leave').reduce((sum, l) => sum + (l.numberOfDays || 1), 0);

    const initialSick = 10;
    const initialCasual = 7;
    const initialEarned = 15;

    return {
      sick: Math.max(0, initialSick - sickApproved),
      casual: Math.max(0, initialCasual - casualApproved),
      earned: Math.max(0, initialEarned - earnedApproved)
    };
  };

  const handleCancelLeaveRequest = () => {
    setLeaveType('Sick Leave');
    setLeaveFrom('');
    setLeaveTo('');
    setLeaveReason('');
    setLeaveEmergencyContact('');
    setLeaveAttachmentName('');
  };

  // Apply Leave Request
  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveFrom || !leaveTo || !leaveReason) return;
    const empId = currentEmployeeId;
    const empName = employees.find(e => e.id === empId)?.name || 'Staff Member';
    const days = calculateLeaveDays(leaveFrom, leaveTo);
    
    const payload = {
      employeeId: empId,
      leaveType,
      startDate: leaveFrom,
      endDate: leaveTo,
      reason: leaveReason,
      status: 'PENDING',
      numberOfDays: days,
      emergencyContact: leaveEmergencyContact || null,
      attachmentName: leaveAttachmentName || null
    };

    try {
      await apiRequest('/restaurant/leaves', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      handleCancelLeaveRequest();
      fetchERPData();
      addToast('Leave request submitted successfully.');
      window.dispatchEvent(new CustomEvent('employee-leave-mutated'));
    } catch (err) {
      const mockNew: Leave = {
        id: `lv-${Date.now()}`,
        employeeId: empId,
        employeeName: empName,
        leaveType,
        reason: leaveReason,
        startDate: leaveFrom,
        endDate: leaveTo,
        status: 'PENDING',
        createdAt: todayStr,
        numberOfDays: days,
        emergencyContact: leaveEmergencyContact || undefined,
        attachmentName: leaveAttachmentName || undefined
      };
      setLeaves(prev => [mockNew, ...prev]);
      handleCancelLeaveRequest();
      addToast('Leave request submitted successfully (Offline mode).');
      window.dispatchEvent(new CustomEvent('employee-leave-mutated'));
    }
  };

  const handleLeaveApproval = async (id: string, newStatus: 'APPROVED' | 'REJECTED') => {
    try {
      await apiRequest(`/restaurant/leaves/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      fetchERPData();
      window.dispatchEvent(new CustomEvent('employee-leave-mutated'));
    } catch (err) {
      setLeaves(prev => prev.map(lv => {
        if (lv.id === id) {
          // If approved, automatically update/add attendance record for the leave dates
          if (newStatus === 'APPROVED') {
            const today = new Date(todayStr);
            const startDate = new Date(lv.startDate);
            const endDate = new Date(lv.endDate);
            if (today >= startDate && today <= endDate) {
              setAttendance(prev => {
                const existing = prev.find(a => a.employeeId === lv.employeeId && a.date === todayStr);
                if (existing) {
                  return prev.map(a => a.id === existing.id ? { ...a, status: 'On Leave' } : a);
                } else {
                  return [...prev, {
                    id: `att-lv-${lv.id}`,
                    employeeId: lv.employeeId,
                    employeeName: lv.employeeName,
                    role: employees.find(e => e.id === lv.employeeId)?.role || 'Staff',
                    date: todayStr,
                    checkIn: '--',
                    checkOut: '--',
                    workingHours: 0,
                    status: 'On Leave'
                  }];
                }
              });
            }
          }
          return { ...lv, status: newStatus };
        }
        return lv;
      }));
      addToast(`Leave status updated to ${newStatus}.`);
      window.dispatchEvent(new CustomEvent('employee-leave-mutated'));
    }
  };

  // Confirm Payout
  const handleConfirmSalaryPayment = () => {
    if (!payingSalaryRecord) return;
    
    const payoutDetails = {
      paymentStatus: 'PAID',
      paymentDate: payDate,
      paymentMethod: payMethod,
      paidBy: user?.employee?.name || user?.name || 'Vikram Malhotra',
      notes: payNotes || 'Monthly salary processed'
    };

    setSalaries(prev => prev.map(sal => 
      sal.id === payingSalaryRecord.id ? { ...sal, ...payoutDetails } : sal
    ));

    setSalaryPaymentModalOpen(false);
    setPayingSalaryRecord(null);
    setPayNotes('');
    addToast('Salary payout processed successfully.');
  };

  const handlePrintSlip = (sal: Salary) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Salary Slip - ${sal.employeeName}</title>
            <style>
              body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; }
              .header { text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
              .details { margin-top: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
              .title { font-size: 24px; font-weight: bold; margin-bottom: 5px; color: #0f172a; }
              .field { font-weight: bold; color: #475569; margin-bottom: 5px; }
              .value { font-size: 16px; font-weight: bold; margin-bottom: 15px; color: #0f172a; }
              .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 20px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="title">RESTAURANT SALARY SLIP</div>
              <div style="font-size: 16px; font-weight: bold;">Month: ${sal.month}</div>
            </div>
            <div class="details">
              <div>
                <div class="field">Employee Name:</div>
                <div class="value">${sal.employeeName}</div>
                <div class="field">Monthly Salary:</div>
                <div class="value">₹${sal.netSalary.toLocaleString()}</div>
              </div>
              <div>
                <div class="field">Payment Status:</div>
                <div class="value">${sal.paymentStatus}</div>
                <div class="field">Payment Date:</div>
                <div class="value">${sal.paymentDate || 'N/A'}</div>
                <div class="field">Payment Method:</div>
                <div class="value">${sal.paymentMethod || 'N/A'}</div>
                <div class="field">Paid By:</div>
                <div class="value">${sal.paidBy || 'N/A'}</div>
              </div>
            </div>
            ${sal.notes ? `
            <div style="margin-top: 20px;">
              <div class="field">Notes:</div>
              <div class="value" style="font-weight: normal; font-style: italic;">${sal.notes}</div>
            </div>
            ` : ''}
            <div class="footer">
              Generated by Restaurant POS on ${new Date().toLocaleDateString()}
            </div>
            <script>window.print();</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormName(emp.name);
    setFormPhone(emp.phone);
    setFormEmail(emp.email || '');
    setFormDept(emp.department);
    setFormRole(emp.role);
    setFormJoinDate(emp.joiningDate);
    setFormShift(emp.shift);
    setFormEmpType(emp.employmentType);
    setFormSalary(emp.salary ? String(emp.salary) : '');
    setFormNotes(emp.notes || '');
    setShowEditModal(true);
  };

  // Filter Employees
  const filteredEmployeesList = employees.filter(emp => {
    if (!isManagerOrAdmin && emp.id !== currentEmployeeId) return false;
    const matchSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        emp.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        emp.employeeId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchDept = !deptFilter || emp.department === deptFilter;
    const matchStatus = !statusFilter || emp.status === statusFilter;
    return matchSearch && matchDept && matchStatus;
  });

  // Calculate Salary summary values for current month (July 2026)
  const currentMonthSalaries = salaries.filter(s => s.month === 'July 2026');
  const totalEmployeesCount = employees.length;
  const monthlySalaryBudget = currentMonthSalaries.reduce((sum, s) => sum + s.netSalary, 0);
  const salaryPaid = currentMonthSalaries.filter(s => s.paymentStatus === 'PAID').reduce((sum, s) => sum + s.netSalary, 0);
  const pendingSalary = currentMonthSalaries.filter(s => s.paymentStatus === 'UNPAID').reduce((sum, s) => sum + s.netSalary, 0);

  // Helper to fetch today's attendance status
  const getAttendanceStatusToday = (emp: Employee) => {
    if (emp.shift === 'Weekly Off') return 'Weekly Off';
    const record = attendance.find(a => a.employeeId === emp.id && a.date === todayStr);
    if (record) return record.status;
    
    // Check if approved leave today
    const onLeave = leaves.some(l => l.employeeId === emp.id && l.status === 'APPROVED' && todayStr >= l.startDate && todayStr <= l.endDate);
    if (onLeave) return 'On Leave';

    return 'Absent';
  };

  // Helper to get leave status description
  const getLeaveStatusToday = (empId: string) => {
    const activeLeave = leaves.find(l => 
      l.employeeId === empId && 
      l.status === 'APPROVED' && 
      todayStr >= l.startDate && 
      todayStr <= l.endDate
    );
    return activeLeave ? `${activeLeave.leaveType} Today` : 'No Leaves';
  };

  // Get monthly deterministic stats for popup details
  const getMonthlyStatsForEmployee = (empId: string) => {
    const numId = parseInt(empId.replace(/\D/g, '')) || 1;
    const workingDays = 26;
    const weeklyOff = 4;
    const holidays = 1;

    // Unique deterministic variation per employee
    const present = 21 + (numId % 4); // 21 to 24
    const absent = (numId % 3); // 0 to 2
    const leave = 26 - present - absent; // remaining working days
    const lateEntry = (numId % 3) + 1; // 1 to 3
    const halfDays = numId % 2;

    return {
      workingDays,
      present,
      absent,
      leave,
      weeklyOff,
      holidays,
      lateEntry,
      halfDays
    };
  };

  /*
  // Get attendance history list
  const getAttendanceHistoryForEmployee = (emp: Employee) => {
    const numId = parseInt(emp.id.replace(/\D/g, '')) || 1;
    const records = [];

    for (let i = 0; i < 10; i++) {
      const d = new Date(todayStr);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayOfWeek = d.getDay(); // 0 is Sunday

      let status = 'Checked Out';
      let checkIn = '09:00 AM';
      let checkOut = '05:00 PM';
      let hours = 8.0;

      if (dayOfWeek === 0 || emp.shift === 'Weekly Off') {
        status = 'Weekly Off';
        checkIn = '--';
        checkOut = '--';
        hours = 0;
      } else {
        const dayNum = d.getDate();
        // Deterministic leaves or absents
        if (dayNum === 4 || (numId % 2 === 0 && dayNum === 15)) {
          status = 'On Leave';
          checkIn = '--';
          checkOut = '--';
          hours = 0;
        } else if (dayNum === 10 || (numId % 3 === 0 && dayNum === 22)) {
          status = 'Absent';
          checkIn = '--';
          checkOut = '--';
          hours = 0;
        } else if (i === 0) {
          // Today
          const todayRecord = attendance.find(a => a.employeeId === emp.id && a.date === todayStr);
          if (todayRecord) {
            status = todayRecord.status;
            checkIn = todayRecord.checkIn;
            checkOut = todayRecord.checkOut || '--';
            hours = todayRecord.workingHours || 0;
          } else {
            const onLeave = leaves.some(l => l.employeeId === emp.id && l.status === 'APPROVED' && todayStr >= l.startDate && todayStr <= l.endDate);
            if (onLeave) {
              status = 'On Leave';
              checkIn = '--';
              checkOut = '--';
              hours = 0;
            } else {
              status = 'Absent';
              checkIn = '--';
              checkOut = '--';
              hours = 0;
            }
          }
        }
      }

      records.push({
        date: dateStr,
        checkIn,
        checkOut,
        workingHours: hours,
        status
      });
    }
    return records;
  };
  */

  // Render monthly calendar grid
  const renderMonthlyCalendar = (emp: Employee) => {
    const numId = parseInt(emp.id.replace(/\D/g, '')) || 1;
    const startDayOffset = 3; // Wednesday (0=Sun, 1=Mon, 2=Tue, 3=Wed)

    const days = [];
    for (let i = 0; i < startDayOffset; i++) {
      days.push({ day: null, status: 'empty' });
    }

    for (let d = 1; d <= 31; d++) {
      let status = 'present';
      const isSunday = (d + startDayOffset - 1) % 7 === 0;

      if (isSunday || emp.shift === 'Weekly Off') {
        status = 'weekly_off';
      } else {
        if (d === 4 || (numId % 2 === 0 && d === 15)) {
          status = 'leave';
        } else if (d === 10 || (numId % 3 === 0 && d === 22)) {
          status = 'absent';
        } else if (d === 2 && getAttendanceStatusToday(emp) === 'Absent') {
          status = 'absent';
        } else if (d === 2 && getAttendanceStatusToday(emp) === 'On Leave') {
          status = 'leave';
        }
      }

      days.push({ day: d, status });
    }

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[10px] text-slate-550 font-bold uppercase tracking-wider">
          <span>July 2026 Grid</span>
          <div className="flex gap-2">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded bg-emerald-500 block"></span> Present
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded bg-rose-500 block"></span> Absent
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded bg-amber-500 block"></span> Leave
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded bg-slate-300 block"></span> Off
            </span>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center font-mono font-bold text-[9px]">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(w => (
            <div key={w} className="text-slate-400 py-1">{w}</div>
          ))}
          {days.map((item, idx) => {
            if (item.day === null) return <div key={`empty-${idx}`}></div>;

            let bgClass = "bg-slate-100 text-slate-400";
            if (item.status === 'present') bgClass = "bg-emerald-500 text-white";
            else if (item.status === 'absent') bgClass = "bg-rose-500 text-white";
            else if (item.status === 'leave') bgClass = "bg-amber-500 text-white";
            else if (item.status === 'weekly_off') bgClass = "bg-slate-300 text-slate-700";

            return (
              <div
                key={`day-${item.day}`}
                className={`p-1.5 flex items-center justify-center rounded-md ${bgClass}`}
                title={`Day ${item.day} - ${item.status.toUpperCase()}`}
              >
                {item.day}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Beautiful Shift badge rendering
  const getShiftBadge = (shift: string) => {
    switch (shift) {
      case 'Morning':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-100 whitespace-nowrap">
            🌅 Morning Shift (8:00 AM – 4:00 PM)
          </span>
        );
      case 'Evening':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-100 whitespace-nowrap">
            🌇 Evening Shift (2:00 PM – 10:00 PM)
          </span>
        );
      case 'Night':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-900 border border-indigo-150 whitespace-nowrap">
            🌙 Night Shift (10:00 PM – 6:00 AM)
          </span>
        );
      case 'Weekly Off':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200 whitespace-nowrap">
            🏖 Weekly Off
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200 whitespace-nowrap">
            {shift}
          </span>
        );
    }
  };

  // Beautiful Status badge rendering with consistent height (h-7) and padding
  const getAttendanceBadge = (status: string) => {
    const baseClass = "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase border h-7 select-none whitespace-nowrap";
    switch (status) {
      case 'Working':
        return (
          <span className={`${baseClass} bg-blue-50 text-blue-700 border-blue-200`}>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            Working
          </span>
        );
      case 'Checked Out':
        return (
          <span className={`${baseClass} bg-emerald-50 text-emerald-700 border-emerald-200`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Checked Out
          </span>
        );
      case 'On Leave':
        return (
          <span className={`${baseClass} bg-amber-50 text-amber-700 border-amber-200`}>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            On Leave
          </span>
        );
      case 'Absent':
        return (
          <span className={`${baseClass} bg-rose-50 text-rose-700 border-rose-200`}>
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Absent
          </span>
        );
      case 'Weekly Off':
        return (
          <span className={`${baseClass} bg-slate-100 text-slate-700 border-slate-300`}>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            Weekly Off
          </span>
        );
      default:
        return (
          <span className={`${baseClass} bg-slate-50 text-slate-700 border-slate-200`}>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 text-left antialiased select-none pb-20 p-2 sm:p-4 bg-slate-50/50 min-h-screen">
      
      {/* PAGE HEADER */}
      {isManagerOrAdmin ? (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-left">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              🔑 Restaurant Staff Operations
            </h1>
            <p className="text-sm text-slate-600 font-semibold mt-1">
              Manage employees, approve leave applications, monitor logs, and distribute payments.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 text-xs font-semibold text-slate-700">
              <span className="text-slate-500 whitespace-nowrap">Simulate:</span>
              <select
                value={`${simulatedRole}:${simulatedEmployeeId}`}
                onChange={(e) => {
                  const [selRole, selEmpId] = e.target.value.split(':');
                  setSimulatedRole(selRole as 'ADMIN' | 'MANAGER' | 'EMPLOYEE');
                  setSimulatedEmployeeId(selEmpId);
                  if (selRole !== 'ADMIN' && selRole !== 'MANAGER') {
                    setCurrentTab('dashboard');
                  } else {
                    setCurrentTab('roster');
                  }
                }}
                className="bg-transparent border-none text-xs font-bold text-slate-900 focus:outline-none cursor-pointer"
              >
                <option value="ADMIN:emp-1">System Admin (Full Access)</option>
                <option value="MANAGER:emp-1">Vikram Malhotra (Manager)</option>
                <option value="EMPLOYEE:emp-11">Rahul Sharma (Senior Waiter)</option>
                <option value="EMPLOYEE:emp-9">Priya Patil (Waiter)</option>
                <option value="EMPLOYEE:emp-3">Neha Gupta (Cashier)</option>
                <option value="EMPLOYEE:emp-5">Rajesh Kumar (Kitchen Staff)</option>
              </select>
            </div>
            {currentTab === 'roster' && (
              <button
                onClick={() => {
                  setEditingEmployee(null);
                  setFormName('');
                  setFormPhone('');
                  setFormEmail('');
                  setFormDept('Service');
                  setFormRole('Waiter');
                  setFormSalary('');
                  setFormNotes('');
                  setShowAddModal(true);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer font-bold text-xs uppercase tracking-wider"
              >
                <Plus className="w-4 h-4" /> Add Employee
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-left">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight">
              Good Morning, {employees.find(e => e.id === currentEmployeeId)?.name || 'Staff'} 👋
            </h1>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              Welcome back! Here's a quick overview of your work today.
            </p>
            {/* Dev simulated role indicator switcher */}
            <div className="mt-2 inline-flex items-center gap-2 border border-slate-200 rounded-lg px-2 py-1 bg-slate-50 text-[10px] font-bold text-slate-600">
              <span className="text-slate-400">Simulate:</span>
              <select
                value={`${simulatedRole}:${simulatedEmployeeId}`}
                onChange={(e) => {
                  const [selRole, selEmpId] = e.target.value.split(':');
                  setSimulatedRole(selRole as 'ADMIN' | 'MANAGER' | 'EMPLOYEE');
                  setSimulatedEmployeeId(selEmpId);
                  if (selRole !== 'ADMIN' && selRole !== 'MANAGER') {
                    setCurrentTab('dashboard');
                  } else {
                    setCurrentTab('roster');
                  }
                }}
                className="bg-transparent border-none text-[10px] font-bold text-slate-900 focus:outline-none cursor-pointer"
              >
                <option value="ADMIN:emp-1">System Admin (Full Access)</option>
                <option value="MANAGER:emp-1">Vikram Malhotra (Manager)</option>
                <option value="EMPLOYEE:emp-11">Rahul Sharma (Senior Waiter)</option>
                <option value="EMPLOYEE:emp-9">Priya Patil (Waiter)</option>
                <option value="EMPLOYEE:emp-3">Neha Gupta (Cashier)</option>
                <option value="EMPLOYEE:emp-5">Rajesh Kumar (Kitchen Staff)</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col items-end text-right">
            <span className="text-xs font-bold text-slate-900">{currentTime.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
            <span className="text-[10px] font-semibold text-slate-500 uppercase mt-0.5">{currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
          </div>
        </div>
      )}

      {/* TWO COLUMN VIEW (Sidebar Simulation + Content) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* LOCAL SIDEBAR */}
        <div className="col-span-1 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm h-fit space-y-1.5">
          <span className="text-[10px] text-slate-500 block px-3 uppercase tracking-widest font-extrabold mb-2">Navigation Links</span>
          
          {isManagerOrAdmin ? (
            <>
              <button
                onClick={() => setCurrentTab('roster')}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${currentTab === 'roster' ? 'bg-emerald-50 text-emerald-800' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <User className="w-4 h-4" /> Employee List
              </button>
              <button
                onClick={() => setCurrentTab('attendance')}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${currentTab === 'attendance' ? 'bg-emerald-50 text-emerald-800' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Clock className="w-4 h-4" /> Attendance
              </button>
              <button
                onClick={() => setCurrentTab('leaves')}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${currentTab === 'leaves' ? 'bg-emerald-50 text-emerald-800' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Calendar className="w-4 h-4" /> Leave Management
              </button>
              {isAdmin && (
                <button
                  onClick={() => setCurrentTab('salary')}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${currentTab === 'salary' ? 'bg-emerald-50 text-emerald-800' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <CreditCard className="w-4 h-4" /> Salary Management
                </button>
              )}
            </>
          ) : (
            <>
              <button
                onClick={() => setCurrentTab('dashboard')}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${currentTab === 'dashboard' ? 'bg-emerald-50 text-emerald-800' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </button>
              <button
                onClick={() => setCurrentTab('roster')}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${currentTab === 'roster' ? 'bg-emerald-50 text-emerald-800' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <User className="w-4 h-4" /> My Profile
              </button>
              <button
                onClick={() => setCurrentTab('attendance')}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${currentTab === 'attendance' ? 'bg-emerald-50 text-emerald-800' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Clock className="w-4 h-4" /> Attendance Register
              </button>
              <button
                onClick={() => setCurrentTab('leaves')}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${currentTab === 'leaves' ? 'bg-emerald-50 text-emerald-800' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Calendar className="w-4 h-4" /> Leave Request
              </button>
              <button
                onClick={() => setCurrentTab('salary')}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${currentTab === 'salary' ? 'bg-emerald-50 text-emerald-800' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <CreditCard className="w-4 h-4" /> My Salary
              </button>
            </>
          )}
        </div>

        {/* RIGHT COLUMN CONTENT PANEL */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* TAB CONTENT: EMPLOYEE SELF SERVICE DASHBOARD */}
          {currentTab === 'dashboard' && !isManagerOrAdmin && (
            <div className="space-y-6">
              {/* Standardised Attendance Widget */}
              {(() => {
                const todayAtt = attendance.find(a => a.employeeId === currentEmployeeId && a.date === todayStr);
                const activeEmp = employees.find(e => e.id === currentEmployeeId);
                const shiftName = activeEmp?.shift || 'Morning (09:00 AM – 06:00 PM)';
                
                let widgetStatus: 'CHECKED_IN' | 'CHECKED_OUT' | null = null;
                let checkInTime = null;
                let checkOutTime = null;
                let workingHoursStr = "0h 0m";

                if (todayAtt) {
                  checkInTime = todayAtt.checkIn || null;
                  if (todayAtt.status === 'Working') {
                    widgetStatus = 'CHECKED_IN';
                    checkOutTime = null;
                    const diffMs = Date.now() - new Date(`${todayStr} ${todayAtt.checkIn}`).getTime();
                    if (diffMs > 0) {
                      const hrs = Math.floor(diffMs / 3600000);
                      const mins = Math.floor((diffMs % 3600000) / 60000);
                      workingHoursStr = `${hrs}h ${mins}m`;
                    }
                  } else {
                    widgetStatus = 'CHECKED_OUT';
                    checkOutTime = todayAtt.checkOut || null;
                    const dec = todayAtt.workingHours || 0;
                    const hrs = Math.floor(dec);
                    const mins = Math.round((dec - hrs) * 60);
                    workingHoursStr = `${hrs}h ${mins}m`;
                  }
                }

                return (
                  <AttendanceWidget
                    status={widgetStatus}
                    checkInTime={checkInTime}
                    checkOutTime={checkOutTime}
                    workingHours={workingHoursStr}
                    shiftName={shiftName}
                    onCheckIn={() => handleClockAction('IN')}
                    onCheckOut={() => handleClockAction('OUT')}
                    isActionLoading={isCheckInLoading}
                  />
                );
              })()}

              {/* Dashboard KPI cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                {/* 2. Working Hours */}
                {(() => {
                  const todayAtt = attendance.find(a => a.employeeId === currentEmployeeId && a.date === todayStr);
                  let workingHoursStr = "0h 00m";
                  let workStatus = "Not Started";
                  let workStatusColor = "text-slate-400";
                  
                  if (todayAtt) {
                    if (todayAtt.status === 'Working') {
                      workStatus = "In Progress";
                      workStatusColor = "text-blue-600";
                      const diffMs = Date.now() - new Date(`${todayStr} ${todayAtt.checkIn}`).getTime();
                      if (diffMs > 0) {
                        const hrs = Math.floor(diffMs / 3600000);
                        const mins = Math.floor((diffMs % 3600000) / 60000);
                        workingHoursStr = `${hrs}h ${mins}m`;
                      } else {
                        workingHoursStr = "0h 00m";
                      }
                    } else {
                      workStatus = "Completed";
                      workStatusColor = "text-emerald-600";
                      const dec = todayAtt.workingHours || 0;
                      const hrs = Math.floor(dec);
                      const mins = Math.round((dec - hrs) * 60);
                      workingHoursStr = `${hrs}h ${mins}m`;
                    }
                  }

                  return (
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between space-y-3 text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Working Hours</span>
                        <Clock className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div className="py-1">
                        <h4 className="text-2xl font-extrabold text-slate-900">{workingHoursStr}</h4>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Today's Logged Time</p>
                      </div>
                      <div className="border-t border-slate-100 pt-2 flex justify-between items-center text-[10px]">
                        <span className="text-slate-400 font-bold uppercase">Status</span>
                        <span className={`font-extrabold ${workStatusColor}`}>{workStatus}</span>
                      </div>
                    </div>
                  );
                })()}

                {/* 3. Current Shift */}
                {(() => {
                  const activeEmp = employees.find(e => e.id === currentEmployeeId);
                  const shiftStr = activeEmp?.shift || 'Morning (09:00 AM – 06:00 PM)';
                  const parts = shiftStr.split('(');
                  const name = parts[0].trim();
                  const time = parts[1] ? parts[1].replace(')', '').trim() : '09:00 AM – 06:00 PM';
                  
                  return (
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between space-y-3 text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Current Shift</span>
                        <Calendar className="w-4 h-4 text-indigo-500" />
                      </div>
                      <div className="py-1">
                        <h4 className="text-base font-bold text-slate-900">{name} Shift</h4>
                        <p className="text-xs text-slate-500 font-bold mt-1 font-mono">{time}</p>
                      </div>
                      <div className="border-t border-slate-100 pt-2 flex justify-between items-center text-[10px]">
                        <span className="text-slate-400 font-bold uppercase">Shift Status</span>
                        <span className="text-indigo-600 font-extrabold">Active</span>
                      </div>
                    </div>
                  );
                })()}

                {/* 4. Leave Balance */}
                {(() => {
                  const bal = getEmployeeLeaveBalances(currentEmployeeId);
                  return (
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between space-y-3 text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Leave Balance</span>
                        <Calendar className="w-4 h-4 text-amber-500" />
                      </div>
                      <div className="space-y-1 text-xs font-semibold text-slate-600">
                        <div className="flex justify-between">
                          <span>Casual Leave:</span>
                          <span className="text-slate-900 font-bold">{bal.casual} Days</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Sick Leave:</span>
                          <span className="text-slate-900 font-bold">{bal.sick} Days</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Earned Leave:</span>
                          <span className="text-slate-900 font-bold">{bal.earned} Days</span>
                        </div>
                      </div>
                      <div className="border-t border-slate-100 pt-2 flex justify-between items-center text-[10px]">
                        <span className="text-slate-400 font-bold uppercase">Total Available</span>
                        <span className="text-slate-900 font-extrabold">{bal.casual + bal.sick + bal.earned} Days</span>
                      </div>
                    </div>
                  );
                })()}

                {/* 5. Pending Leave Requests */}
                {(() => {
                  const pendingCount = leaves.filter(l => l.employeeId === currentEmployeeId && l.status === 'PENDING').length;
                  return (
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between space-y-3 text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pending Leaves</span>
                        <FileText className="w-4 h-4 text-amber-600" />
                      </div>
                      <div className="py-1">
                        <h4 className="text-2xl font-extrabold text-slate-900">{pendingCount} Requests</h4>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Awaiting Review</p>
                      </div>
                      <div className="border-t border-slate-100 pt-2 flex justify-between items-center text-[10px]">
                        <span className="text-slate-400 font-bold uppercase">Approval Workflow</span>
                        <span className="text-amber-600 font-extrabold">Active</span>
                      </div>
                    </div>
                  );
                })()}

                {/* 6. Performance Rating */}
                {(() => {
                  const hash = currentEmployeeId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                  const rating = (4.5 + (hash % 6) / 10).toFixed(1);
                  return (
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between space-y-3 text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Performance Rating</span>
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      </div>
                      <div className="py-1">
                        <h4 className="text-2xl font-extrabold text-slate-900">{rating} / 5.0</h4>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Evaluated This Quarter</p>
                      </div>
                      <div className="border-t border-slate-100 pt-2 flex justify-between items-center text-[10px]">
                        <span className="text-slate-400 font-bold uppercase">Feedback Status</span>
                        <span className="text-emerald-600 font-bold uppercase text-[10px]">Excellent</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Two column sub-panel */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                  {/* Profile Summary Widget */}
                  {(() => {
                    const emp = employees.find(e => e.id === currentEmployeeId);
                    if (!emp) return null;
                    return (
                      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4 text-left">
                        <h3 className="text-sm font-bold text-slate-800 tracking-wider flex items-center gap-1.5 uppercase">
                          <User className="w-4 h-4 text-slate-500" /> Profile Summary
                        </h3>
                        <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                          <div>
                            <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold">Staff Name</span>
                            <span className="text-slate-800 font-bold">{emp.name}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold">Designated Role</span>
                            <span className="text-emerald-800 font-bold">{emp.role}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold">Staff ID</span>
                            <span className="text-slate-600 font-mono">{emp.employeeId}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold">Shift Duration</span>
                            <span className="text-slate-700">{emp.shift}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Quick Actions Panel */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-left space-y-4">
                    <h3 className="text-sm font-bold text-slate-800 tracking-wider flex items-center gap-1.5 uppercase">
                      <Zap className="w-4 h-4 text-amber-500" /> Quick Actions
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {[
                        { name: 'Apply Leave', tab: 'leaves' as const, icon: Calendar, color: 'text-amber-600 bg-amber-50 border-amber-100' },
                        { name: 'Attendance History', tab: 'attendance' as const, icon: Clock, color: 'text-blue-600 bg-blue-50 border-blue-100' },
                        { name: 'View Shift', tab: 'dashboard' as const, icon: User, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
                        { name: 'Messages & Updates', tab: 'dashboard' as const, icon: MessageSquare, color: 'text-purple-600 bg-purple-50 border-purple-100' },
                        { name: 'My Documents', tab: 'roster' as const, icon: FileText, color: 'text-slate-700 bg-slate-100 border-slate-200' },
                        { name: 'Update Contact', action: 'update_contact', icon: Edit2, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' }
                      ].map((act, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            if (act.tab) {
                              setCurrentTab(act.tab);
                            } else if (act.action === 'update_contact') {
                              addToast('Contact details update request submitted to HR.', 'success');
                            }
                          }}
                          className="p-3 border rounded-xl hover:bg-slate-50 transition-all text-left flex flex-col justify-between h-20 group cursor-pointer"
                        >
                          <div className={`p-1.5 rounded-lg w-fit ${act.color} transition-all group-hover:scale-105`}>
                            <act.icon className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-[10px] font-bold text-slate-700 tracking-tight block mt-2">{act.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Announcements Widget */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-left space-y-4">
                    <h3 className="text-sm font-bold text-slate-800 tracking-wider flex items-center gap-1.5 uppercase">
                      <MessageSquare className="w-4 h-4 text-purple-500" /> Announcements & Messages
                    </h3>
                    <div className="space-y-3">
                      {[
                        { type: 'meeting', title: 'Kitchen Staff Meeting', desc: 'Brief operational alignment at 05:00 PM today.', time: 'Today', icon: User, color: 'text-blue-700 bg-blue-50/50' },
                        { type: 'update', title: 'New Menu Launch', desc: 'Summer special beverage items added. Review details.', time: '1 day ago', icon: Zap, color: 'text-amber-700 bg-amber-50/50' },
                        { type: 'payroll', title: 'Salary Credited', desc: 'Salary for June 2026 has been credited to your bank account.', time: '2 days ago', icon: CreditCard, color: 'text-emerald-700 bg-emerald-50/50' }
                      ].map((msg, idx) => (
                        <div key={idx} className="flex gap-3 p-3 border border-slate-100 rounded-xl hover:bg-slate-50/20 transition-all">
                          <div className={`p-2 rounded-lg h-fit ${msg.color}`}>
                            <msg.icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-baseline">
                              <h4 className="text-xs font-bold text-slate-900">{msg.title}</h4>
                              <span className="text-[9px] text-slate-400 font-semibold">{msg.time}</span>
                            </div>
                            <p className="text-[10px] text-slate-500 font-semibold mt-1 leading-relaxed">{msg.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Calendar Widget */}
                  {(() => {
                    const emp = employees.find(e => e.id === currentEmployeeId);
                    if (!emp) return null;
                    return (
                      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-left">
                        {renderMonthlyCalendar(emp)}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: EMPLOYEE DIRECTORY OR MY PROFILE */}
          {currentTab === 'roster' && (
            isManagerOrAdmin ? (
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <h2 className="text-lg font-bold text-slate-800 tracking-wider">
                    Staff Roster Directory
                  </h2>
                  
                  {/* Filters */}
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-none">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search staff..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full sm:w-48 pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 bg-slate-50 text-xs font-semibold text-slate-800"
                      />
                    </div>
                    
                    <select
                      value={deptFilter}
                      onChange={(e) => setDeptFilter(e.target.value)}
                      className="border border-slate-200 rounded-xl px-2 py-1.5 bg-slate-50 text-xs font-bold text-slate-600 cursor-pointer"
                    >
                      <option value="">All Departments</option>
                      {Object.keys(DEPARTMENT_ROLES_MAP).map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>

                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="border border-slate-200 rounded-xl px-2 py-1.5 bg-slate-50 text-xs font-bold text-slate-600 cursor-pointer"
                    >
                      <option value="">All Statuses</option>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50/50">
                        <th className="px-4 py-3.5 text-left">Staff ID</th>
                        <th className="px-4 py-3.5 text-left">Staff Name</th>
                        <th className="px-4 py-3.5 text-left">Department</th>
                        <th className="px-4 py-3.5 text-left">Designated Role</th>
                        <th className="px-4 py-3.5 text-left">Shift</th>
                        <th className="px-4 py-3.5 text-left">Today's Attendance</th>
                        <th className="px-4 py-3.5 text-left">Leave Status</th>
                        <th className="px-4 py-3.5 text-left">Status</th>
                        <th className="px-4 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-900 text-sm font-semibold">
                      {loading ? (
                        <tr>
                          <td colSpan={9} className="py-12 text-center text-slate-400 font-semibold">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                            <span>Loading staff roster directory...</span>
                          </td>
                        </tr>
                      ) : filteredEmployeesList.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-12 text-center text-slate-400 font-semibold italic">No staff profiles found.</td>
                        </tr>
                      ) : (
                        filteredEmployeesList.map(emp => (
                          <tr 
                            key={emp.id} 
                            className="hover:bg-slate-50/30 cursor-pointer transition-colors align-middle"
                            onClick={() => setSelectedEmployeeDetail(emp)}
                          >
                            <td className="px-4 py-3.5 font-mono text-slate-500 align-middle">{emp.employeeId}</td>
                            <td className="px-4 py-3.5 font-semibold text-slate-900 align-middle">{emp.name}</td>
                            <td className="px-4 py-3.5 text-slate-600 align-middle">{emp.department}</td>
                            <td className="px-4 py-3.5 text-slate-900 align-middle">{emp.role}</td>
                            <td className="px-4 py-3.5 align-middle">{getShiftBadge(emp.shift)}</td>
                            <td className="px-4 py-3.5 align-middle">
                              {getAttendanceBadge(getAttendanceStatusToday(emp))}
                            </td>
                            <td className="px-4 py-3.5 align-middle">
                              <span className="text-slate-600 font-medium text-xs bg-slate-50 px-2 py-1 rounded border border-slate-150">{getLeaveStatusToday(emp.id)}</span>
                            </td>
                            <td className="px-4 py-3.5 align-middle">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                emp.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-150 text-slate-600'
                              }`}>
                                {emp.status}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-right align-middle" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setSelectedEmployeeDetail(emp)}
                                  className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-bold transition text-xs cursor-pointer"
                                >
                                  Details
                                </button>
                                <button
                                  onClick={() => openEditModal(emp)}
                                  className="p-1.5 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-500 hover:text-slate-800 transition cursor-pointer"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteEmployee(emp.id)}
                                  className="p-1.5 hover:bg-rose-55 hover:text-rose-600 text-rose-500 rounded-lg transition cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* EMPLOYEE: MY PROFILE VIEW */
              (() => {
                const emp = employees.find(e => e.id === currentEmployeeId);
                if (!emp) return <p className="text-slate-400 italic">No employee profile linked to this user.</p>;
                
                const getInitials = (nameStr: string) => {
                  if (!nameStr) return 'EE';
                  const parts = nameStr.trim().split(/\s+/);
                  if (parts.length >= 2) {
                    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
                  }
                  return parts[0].substring(0, 2).toUpperCase();
                };

                return (
                  <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-left">
                      <div className="flex flex-col md:flex-row gap-6">
                        {/* Left profile block: avatar & quick stats */}
                        <div className="flex flex-col items-center text-center p-6 bg-slate-50/50 rounded-2xl border border-slate-100 min-w-[240px]">
                          <div className="w-20 h-20 bg-slate-805 text-white rounded-full flex items-center justify-center font-extrabold text-2xl tracking-wider shadow-inner">
                            {getInitials(emp.name)}
                          </div>
                          <h3 className="text-lg font-bold text-slate-900 mt-4">{emp.name}</h3>
                          <p className="text-xs text-slate-500 font-semibold mt-1">{emp.role}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 tracking-wider">{emp.department}</p>
                          
                          <div className="mt-5 w-full pt-4 border-t border-slate-200/60">
                            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-extrabold block">Duty Status</span>
                            {(() => {
                              const hasClockedInToday = attendance.some(a => a.employeeId === currentEmployeeId && a.date === todayStr);
                              const isCurrentlyWorking = attendance.some(a => a.employeeId === currentEmployeeId && a.date === todayStr && !a.checkOut);
                              if (isCurrentlyWorking) {
                                return <span className="inline-flex items-center gap-1.5 mt-2 bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-200"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>ON DUTY</span>;
                              } else if (hasClockedInToday) {
                                return <span className="inline-flex items-center gap-1.5 mt-2 bg-slate-100 text-slate-800 text-[10px] font-bold px-2.5 py-1 rounded-full border border-slate-200"><span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>SHIFT COMPLETED</span>;
                              } else {
                                return <span className="inline-flex items-center gap-1.5 mt-2 bg-slate-50 text-slate-500 text-[10px] font-bold px-2.5 py-1 rounded-full border border-slate-200"><span className="w-1.5 h-1.5 rounded-full bg-slate-350"></span>OFF DUTY</span>;
                              }
                            })()}
                          </div>
                        </div>

                        {/* Right profile block: detailed fields */}
                        <div className="flex-1 space-y-6">
                          <div>
                            <h2 className="text-lg font-bold text-slate-800 tracking-wider">
                              Personal Profile Details
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 mt-4">
                              <div>
                                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold mb-1">Employee ID</span>
                                <span className="text-slate-900 font-mono font-bold text-sm">{emp.employeeId}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold mb-1">Designation</span>
                                <span className="text-slate-900 font-bold text-sm">{emp.role}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold mb-1">Department</span>
                                <span className="text-slate-900 font-bold text-sm">{emp.department}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold mb-1">Phone Number</span>
                                <span className="text-slate-900 font-bold font-mono text-sm">{emp.phone}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold mb-1">Email Address</span>
                                <span className="text-slate-900 font-bold text-sm break-all">{emp.email || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold mb-1">Date of Joining</span>
                                <span className="text-slate-900 font-bold text-sm">{emp.joiningDate}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold mb-1">Assigned Shift</span>
                                <span className="text-slate-900 font-bold text-sm">{emp.shift}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold mb-1">Reporting Manager</span>
                                <span className="text-slate-900 font-bold text-sm">Amit Patil</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold mb-1">Employment Type</span>
                                <span className="text-slate-900 font-bold text-sm">{emp.employmentType || 'Full-Time'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* MY DOCUMENTS */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-left space-y-4">
                      <div>
                        <h2 className="text-lg font-bold text-slate-800 tracking-wider">
                          My Document Vault
                        </h2>
                        <p className="text-xs text-slate-500 font-semibold mt-1">
                          Access and download your employment records, credentials, and company policies.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { name: 'Appointment Letter', date: '10 March 2025', size: '1.2 MB' },
                          { name: 'ID Card', date: '12 March 2025', size: '450 KB' },
                          ...(emp.role !== 'MANAGER' ? [{ name: 'Salary Slip - June 2026', date: '01 July 2026', size: '320 KB' }] : []),
                          { name: 'Experience Certificate', date: 'N/A', size: 'Pending' },
                          { name: 'Company Handbook & Policies', date: 'Updated Jan 2026', size: '2.5 MB' }
                        ].map((doc, idx) => (
                          <div key={idx} className="flex justify-between items-center p-3.5 border border-slate-100 rounded-xl hover:border-slate-200 hover:bg-slate-50/20 transition-all">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-slate-100 rounded-lg text-slate-700">
                                <FileText className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-900">{doc.name}</p>
                                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{doc.date !== 'N/A' ? `Issued: ${doc.date}` : 'Not Issued Yet'} • {doc.size}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => addToast(`Opening preview for ${doc.name}...`, 'success')}
                                className="px-2.5 py-1 text-slate-750 hover:text-slate-900 border border-slate-205 hover:bg-slate-50 rounded-lg text-[10px] font-bold transition cursor-pointer"
                              >
                                View
                              </button>
                              <button
                                onClick={() => addToast(`Downloading ${doc.name}...`, 'success')}
                                className="px-2.5 py-1 text-white bg-slate-800 hover:bg-slate-900 rounded-lg text-[10px] font-bold transition cursor-pointer"
                              >
                                Download
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()
            )
          )}

          {/* TAB CONTENT: ATTENDANCE */}
          {currentTab === 'attendance' && (
            <div className="space-y-6">
              
              {/* Employee Clock In/Out panel */}
              {!isManagerOrAdmin && (
                (() => {
                  const todayAtt = attendance.find(a => a.employeeId === currentEmployeeId && a.date === todayStr);
                  const activeEmp = employees.find(e => e.id === currentEmployeeId);
                  const shiftName = activeEmp?.shift || 'Morning (09:00 AM – 06:00 PM)';
                  
                  let widgetStatus: 'CHECKED_IN' | 'CHECKED_OUT' | null = null;
                  let checkInTime = null;
                  let checkOutTime = null;
                  let workingHoursStr = "0h 0m";

                  if (todayAtt) {
                    checkInTime = todayAtt.checkIn || null;
                    if (todayAtt.status === 'Working') {
                      widgetStatus = 'CHECKED_IN';
                      checkOutTime = null;
                      const diffMs = Date.now() - new Date(`${todayStr} ${todayAtt.checkIn}`).getTime();
                      if (diffMs > 0) {
                        const hrs = Math.floor(diffMs / 3600000);
                        const mins = Math.floor((diffMs % 3600000) / 60000);
                        workingHoursStr = `${hrs}h ${mins}m`;
                      }
                    } else {
                      widgetStatus = 'CHECKED_OUT';
                      checkOutTime = todayAtt.checkOut || null;
                      const dec = todayAtt.workingHours || 0;
                      const hrs = Math.floor(dec);
                      const mins = Math.round((dec - hrs) * 60);
                      workingHoursStr = `${hrs}h ${mins}m`;
                    }
                  }

                  return (
                    <AttendanceWidget
                      status={widgetStatus}
                      checkInTime={checkInTime}
                      checkOutTime={checkOutTime}
                      workingHours={workingHoursStr}
                      shiftName={shiftName}
                      onCheckIn={() => handleClockAction('IN')}
                      onCheckOut={() => handleClockAction('OUT')}
                      isActionLoading={isCheckInLoading}
                    />
                  );
                })()
              )}

              {/* Attendance logs directory sheet */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <h2 className="text-lg font-bold text-slate-800 tracking-wider">
                  {isManagerOrAdmin ? "Today's Attendance Sheets" : "My Attendance Register Log"}
                </h2>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      {isManagerOrAdmin ? (
                        <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50/50">
                          <th className="px-4 py-3.5 text-left">Employee Name</th>
                          <th className="px-4 py-3.5 text-left">Designated Role</th>
                          <th className="px-4 py-3.5 text-left">Date</th>
                          <th className="px-4 py-3.5 text-left">Check-In Time</th>
                          <th className="px-4 py-3.5 text-left">Check-Out Time</th>
                          <th className="px-4 py-3.5 text-center">Working Hours</th>
                          <th className="px-4 py-3.5 text-right">Status</th>
                        </tr>
                      ) : (
                        <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50/50">
                          <th className="px-4 py-3.5 text-left">Date</th>
                          <th className="px-4 py-3.5 text-left">Check-In Time</th>
                          <th className="px-4 py-3.5 text-left">Check-Out Time</th>
                          <th className="px-4 py-3.5 text-center">Working Hours</th>
                          <th className="px-4 py-3.5 text-right">Status</th>
                        </tr>
                      )}
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-900 text-sm font-semibold">
                      {(() => {
                        const logs = isManagerOrAdmin 
                          ? attendance.filter(a => a.date === todayStr)
                          : attendance.filter(a => a.employeeId === currentEmployeeId);
                        
                        if (logs.length === 0) {
                          return (
                            <tr>
                              <td colSpan={isManagerOrAdmin ? 7 : 5} className="py-12 text-center text-slate-400 italic font-semibold">No attendance records found.</td>
                            </tr>
                          );
                        }

                        return logs.map(rec => (
                          <tr key={rec.id} className="align-middle">
                            {isManagerOrAdmin && (
                              <>
                                <td className="px-4 py-3.5 font-semibold text-slate-900 align-middle">{rec.employeeName}</td>
                                <td className="px-4 py-3.5 text-slate-600 align-middle">{rec.role}</td>
                              </>
                            )}
                            <td className="px-4 py-3.5 font-mono align-middle">{rec.date}</td>
                            <td className="px-4 py-3.5 font-mono text-emerald-700 align-middle">{rec.checkIn}</td>
                            <td className="px-4 py-3.5 font-mono text-amber-700 align-middle">{rec.checkOut || '--'}</td>
                            <td className="px-4 py-3.5 text-center align-middle">{rec.workingHours ? `${rec.workingHours} hrs` : '--'}</td>
                            <td className="px-4 py-3.5 text-right align-middle">
                              {getAttendanceBadge(rec.status)}
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB CONTENT: LEAVES */}
          {currentTab === 'leaves' && (
            <div className="space-y-6">
              
              {/* Employee Leave Balance cards */}
              {!isManagerOrAdmin && (
                <div className="grid grid-cols-3 gap-4">
                  {(() => {
                    const bal = getEmployeeLeaveBalances(currentEmployeeId);
                    return (
                      <>
                        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs text-left">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Casual Leave</span>
                          <span className="text-xl font-extrabold text-slate-800 mt-1 block">{bal.casual} Days</span>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs text-left">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sick Leave</span>
                          <span className="text-xl font-extrabold text-slate-800 mt-1 block">{bal.sick} Days</span>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs text-left">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Earned Leave</span>
                          <span className="text-xl font-extrabold text-slate-800 mt-1 block">{bal.earned} Days</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {/* Employee Apply Leave request Form */}
              {!isManagerOrAdmin && (
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4 text-left">
                  <h3 className="text-base font-bold text-slate-800 tracking-wider">
                    Submit New Leave Request
                  </h3>

                  <form onSubmit={handleApplyLeave} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block mb-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Leave Type</label>
                        <select
                          value={leaveType}
                          onChange={(e) => setLeaveType(e.target.value)}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer focus:outline-none focus:border-emerald-600 focus:bg-white"
                        >
                          <option value="Sick Leave">Sick Leave</option>
                          <option value="Casual Leave">Casual Leave</option>
                          <option value="Earned Leave">Earned Leave</option>
                        </select>
                      </div>

                      <div>
                        <label className="block mb-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Start Date</label>
                        <input
                          type="date"
                          required
                          value={leaveFrom}
                          onChange={(e) => setLeaveFrom(e.target.value)}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-600 focus:bg-white"
                        />
                      </div>

                      <div>
                        <label className="block mb-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">End Date</label>
                        <input
                          type="date"
                          required
                          value={leaveTo}
                          onChange={(e) => setLeaveTo(e.target.value)}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-600 focus:bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block mb-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Number of Days (Auto Calculate)</label>
                        <input
                          type="text"
                          readOnly
                          value={leaveFrom && leaveTo ? `${calculateLeaveDays(leaveFrom, leaveTo)} Days` : '0 Days'}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-slate-100 text-xs font-bold text-slate-700 focus:outline-none select-none"
                        />
                      </div>

                      <div>
                        <label className="block mb-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Emergency Contact (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. Spouse / Parent Contact Number"
                          value={leaveEmergencyContact}
                          onChange={(e) => setLeaveEmergencyContact(e.target.value)}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-600 focus:bg-white"
                        />
                      </div>

                      <div>
                        <label className="block mb-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Attachment (Optional)</label>
                        <input
                          type="text"
                          placeholder="Filename (e.g. medical_certificate.pdf)"
                          value={leaveAttachmentName}
                          onChange={(e) => setLeaveAttachmentName(e.target.value)}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-600 focus:bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block mb-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Reason Description</label>
                      <input
                        type="text"
                        required
                        placeholder="Briefly state the reason..."
                        value={leaveReason}
                        onChange={(e) => setLeaveReason(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-600 focus:bg-white"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleCancelLeaveRequest}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl transition-colors cursor-pointer text-center text-xs uppercase tracking-wider border border-slate-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl transition-colors cursor-pointer text-center text-xs uppercase tracking-wider"
                      >
                        Submit Request
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Leave registry logs list */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <h2 className="text-lg font-bold text-slate-800 tracking-wider">
                  {isManagerOrAdmin ? "Staff Leave Approvals" : "My Leave Requests Status"}
                </h2>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      {isManagerOrAdmin ? (
                        <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50/50">
                          <th className="px-4 py-3.5 text-left">Staff Name</th>
                          <th className="px-4 py-3.5 text-left">Leave Category</th>
                          <th className="px-4 py-3.5 text-left">Date Range</th>
                          <th className="px-4 py-3.5 text-center">Days</th>
                          <th className="px-4 py-3.5 text-left">Reason</th>
                          <th className="px-4 py-3.5 text-right">Status / Actions</th>
                        </tr>
                      ) : (
                        <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50/50">
                          <th className="px-4 py-3.5 text-left">Date</th>
                          <th className="px-4 py-3.5 text-left">Leave Type</th>
                          <th className="px-4 py-3.5 text-center">Days</th>
                          <th className="px-4 py-3.5 text-right">Status</th>
                        </tr>
                      )}
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-900 text-sm font-semibold">
                      {(() => {
                        const logs = isManagerOrAdmin 
                          ? leaves 
                          : leaves.filter(l => l.employeeId === currentEmployeeId);
                        
                        if (logs.length === 0) {
                          return (
                            <tr>
                              <td colSpan={isManagerOrAdmin ? 6 : 4} className="py-12 text-center text-slate-400 font-semibold italic">No leave applications found.</td>
                            </tr>
                          );
                        }

                        return logs.map(lv => {
                          const days = lv.numberOfDays || calculateLeaveDays(lv.startDate, lv.endDate);
                          const formatDate = (dateStr: string) => {
                            try {
                              const d = new Date(dateStr);
                              if (isNaN(d.getTime())) return dateStr;
                              return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
                            } catch {
                              return dateStr;
                            }
                          };
                          const dateDisplay = formatDate(lv.startDate);

                          if (isManagerOrAdmin) {
                            return (
                              <tr key={lv.id} className="align-middle">
                                <td className="px-4 py-3.5 font-semibold text-slate-900 align-middle">{lv.employeeName}</td>
                                <td className="px-4 py-3.5 text-slate-600 align-middle">{lv.leaveType}</td>
                                <td className="px-4 py-3.5 whitespace-nowrap align-middle">{lv.startDate} to {lv.endDate}</td>
                                <td className="px-4 py-3.5 text-center align-middle font-mono">{days}</td>
                                <td className="px-4 py-3.5 text-slate-700 max-w-[200px] truncate align-middle" title={lv.reason}>{lv.reason}</td>
                                <td className="px-4 py-3.5 text-right whitespace-nowrap align-middle">
                                  {isAdmin || lv.status === 'PENDING' ? (
                                    <div className="flex items-center justify-end gap-1.5">
                                      <button
                                        onClick={() => handleLeaveApproval(lv.id, 'APPROVED')}
                                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition uppercase"
                                      >
                                        Approve
                                      </button>
                                      <button
                                        onClick={() => handleLeaveApproval(lv.id, 'REJECTED')}
                                        className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition uppercase"
                                      >
                                        Reject
                                      </button>
                                    </div>
                                  ) : (
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${
                                      lv.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                                    }`}>
                                      {lv.status}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          } else {
                            return (
                              <tr key={lv.id} className="align-middle">
                                <td className="px-4 py-3.5 font-semibold text-slate-900 align-middle">{dateDisplay}</td>
                                <td className="px-4 py-3.5 text-slate-600 align-middle">{lv.leaveType}</td>
                                <td className="px-4 py-3.5 text-center align-middle font-bold text-slate-700">{days}</td>
                                <td className="px-4 py-3.5 text-right whitespace-nowrap align-middle">
                                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${
                                    lv.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                                    lv.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                                  }`}>
                                    {lv.status}
                                  </span>
                                </td>
                              </tr>
                            );
                          }
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB CONTENT: SALARY (Admin Only or Staff Own Salary) */}
          {currentTab === 'salary' && (
            isAdmin ? (
              /* ADMIN: SALARY MANAGEMENT */
              <div className="space-y-6">
                
                {/* Salary KPI Summary cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Staff</span>
                    <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{totalEmployeesCount} Employees</h3>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Monthly Budget</span>
                    <h3 className="text-2xl font-extrabold text-slate-800 mt-1">₹{monthlySalaryBudget.toLocaleString()}</h3>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-105 shadow-sm bg-emerald-50/20 border-emerald-100">
                    <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">Salary Paid</span>
                    <h3 className="text-2xl font-extrabold text-emerald-700 mt-1">₹{salaryPaid.toLocaleString()}</h3>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-105 shadow-sm bg-rose-50/20 border-rose-100">
                    <span className="text-xs font-bold text-rose-600 uppercase tracking-wider block">Pending Salary</span>
                    <h3 className="text-2xl font-extrabold text-rose-600 mt-1">₹{pendingSalary.toLocaleString()}</h3>
                  </div>
                </div>

                {/* Salary Table */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                  <h2 className="text-lg font-bold text-slate-800 tracking-wider">
                    Payroll Settlement Ledger
                  </h2>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50/50">
                          <th className="px-4 py-3.5 text-left">Employee Name</th>
                          <th className="px-4 py-3.5 text-left">Role</th>
                          <th className="px-4 py-3.5 text-right">Monthly Salary</th>
                          <th className="px-4 py-3.5 text-left">Salary Month</th>
                          <th className="px-4 py-3.5 text-center">Payment Status</th>
                          <th className="px-4 py-3.5 text-left">Payment Date</th>
                          <th className="px-4 py-3.5 text-left">Payment Method</th>
                          <th className="px-4 py-3.5 text-left">Paid By</th>
                          <th className="px-4 py-3.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-900 text-sm font-semibold">
                        {salaries.map(sal => (
                          <tr key={sal.id} className="hover:bg-slate-50/30 align-middle">
                            <td className="px-4 py-3.5 font-semibold text-slate-900 align-middle">{sal.employeeName}</td>
                            <td className="px-4 py-3.5 text-slate-600 align-middle">{sal.role}</td>
                            <td className="px-4 py-3.5 text-right font-mono font-bold align-middle text-slate-950">₹{sal.netSalary.toLocaleString()}</td>
                            <td className="px-4 py-3.5 text-slate-705 align-middle">{sal.month}</td>
                            <td className="px-4 py-3.5 text-center align-middle">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                                sal.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}>
                                {sal.paymentStatus}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-slate-600 align-middle font-mono">{sal.paymentDate || '--'}</td>
                            <td className="px-4 py-3.5 text-slate-600 align-middle">{sal.paymentMethod || '--'}</td>
                            <td className="px-4 py-3.5 text-slate-600 align-middle">{sal.paidBy || '--'}</td>
                            <td className="px-4 py-3.5 text-right whitespace-nowrap align-middle" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1.5">
                                {sal.paymentStatus === 'UNPAID' && (
                                  <button
                                    onClick={() => {
                                      setPayingSalaryRecord(sal);
                                      setSalaryPaymentModalOpen(true);
                                    }}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition"
                                  >
                                    Mark Paid
                                  </button>
                                )}
                                <button
                                  onClick={() => setViewingSalarySlip(sal)}
                                  className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition"
                                >
                                  View
                                </button>
                                <button
                                  onClick={() => handlePrintSlip(sal)}
                                  className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition"
                                >
                                  Print
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : isManager ? (
              /* MANAGER: RESTRICTED ACCESS */
              <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 border border-rose-100">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Access Denied</h3>
                <p className="text-sm text-slate-600 max-w-md">
                  Managers do not have authorization to view or edit payroll ledgers. Please contact the administrator for budget or salary details.
                </p>
              </div>
            ) : (
              /* EMPLOYEE: MY SALARY VIEW */
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
                
                {/* Detailed Payslip Component */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5 col-span-1">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 tracking-wider uppercase">Payslip Breakdown</h3>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Pay Period: {selectedSalaryMonth}</p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase border bg-emerald-50 text-emerald-700 border-emerald-200">
                      PAID
                    </span>
                  </div>
                  
                  {(() => {
                    const empRecord = employees.find(e => e.id === currentEmployeeId);
                    const gross = empRecord?.salary || 18000;
                    const esi = Math.round(gross * 0.0075);
                    const pf = Math.round(gross * 0.12);
                    const totalDeductions = esi + pf;
                    const netTakeHome = gross - totalDeductions;

                    const salSlip = salaries.find(s => s.employeeId === currentEmployeeId && s.month === selectedSalaryMonth);
                    const paymentDate = salSlip?.paymentDate || '01 July 2026';

                    return (
                      <div className="space-y-4">
                        {/* Summary Header */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 text-center">
                          <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold">Net Take-Home Salary</span>
                          <h4 className="text-2xl font-extrabold text-slate-900 mt-1 font-mono">₹{netTakeHome.toLocaleString()}</h4>
                        </div>

                        {/* Earnings Section */}
                        <div className="space-y-2">
                          <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold border-b border-slate-100 pb-1">Earnings</span>
                          <div className="space-y-1.5 text-xs font-semibold text-slate-600">
                            <div className="flex justify-between">
                              <span>Base Pay:</span>
                              <span className="text-slate-900 font-bold font-mono">₹{gross.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Overtime Pay:</span>
                              <span className="text-slate-900 font-bold font-mono">₹0</span>
                            </div>
                            <div className="flex justify-between border-t border-slate-100 pt-1.5 font-bold text-slate-805">
                              <span>Total Earnings:</span>
                              <span className="font-mono text-slate-900">₹{gross.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>

                        {/* Deductions Section */}
                        <div className="space-y-2 pt-1">
                          <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold border-b border-slate-100 pb-1">Deductions</span>
                          <div className="space-y-1.5 text-xs font-semibold text-slate-600">
                            <div className="flex justify-between">
                              <span>ESI (0.75%):</span>
                              <span className="text-slate-900 font-bold font-mono">₹{esi.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Provident Fund (12%):</span>
                              <span className="text-slate-900 font-bold font-mono">₹{pf.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between border-t border-slate-100 pt-1.5 font-bold text-slate-805">
                              <span>Total Deductions:</span>
                              <span className="font-mono text-rose-600">₹{totalDeductions.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>

                        {/* Metadata Section */}
                        <div className="border-t border-slate-100 pt-3 space-y-1.5 text-xs font-semibold text-slate-600">
                          <div className="flex justify-between">
                            <span>Payment Date:</span>
                            <span className="text-slate-900 font-bold">{paymentDate === '2026-06-30' ? '01 July 2026' : paymentDate}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Payment Mode:</span>
                            <span className="text-slate-900 font-bold">{salSlip?.paymentMethod || 'Bank Transfer'}</span>
                          </div>
                        </div>

                        {/* Action Button */}
                        <button
                          onClick={() => addToast(`Payslip for ${selectedSalaryMonth} downloaded successfully.`, 'success')}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition text-xs uppercase tracking-wider cursor-pointer shadow-sm text-center flex items-center justify-center gap-1.5 mt-2"
                        >
                          <FileText className="w-4 h-4" /> Download Slip
                        </button>
                      </div>
                    );
                  })()}
                </div>

                {/* Salary Payout Ledger History */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4 lg:col-span-2">
                  <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 tracking-wider uppercase">Salary Payout Ledger</h3>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Click any row to load the payslip breakdown on the left</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50/50">
                          <th className="px-4 py-3.5 text-left">Pay Period</th>
                          <th className="px-4 py-3.5 text-right">Net Salary</th>
                          <th className="px-4 py-3.5 text-center">Status</th>
                          <th className="px-4 py-3.5 text-left">Payment Date</th>
                          <th className="px-4 py-3.5 text-left">Payment Method</th>
                          <th className="px-4 py-3.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-900 text-sm font-semibold">
                        {salaries
                          .filter(s => s.employeeId === currentEmployeeId)
                          .map(sal => {
                            const empRecord = employees.find(e => e.id === currentEmployeeId);
                            const gross = empRecord?.salary || 18000;
                            const esi = Math.round(gross * 0.0075);
                            const pf = Math.round(gross * 0.12);
                            const netTakeHome = gross - (esi + pf);
                            const displayNet = sal.paymentStatus === 'PAID' ? netTakeHome : sal.netSalary;
                            const displayDate = sal.paymentDate === '2026-06-30' ? '01 July 2026' : sal.paymentDate || 'Pending';

                            const isSelected = selectedSalaryMonth === sal.month;

                            return (
                              <tr
                                key={sal.id}
                                onClick={() => setSelectedSalaryMonth(sal.month)}
                                className={`align-middle cursor-pointer transition-all hover:bg-slate-50/50 ${isSelected ? 'bg-slate-50/70 border-l-4 border-l-emerald-600' : ''}`}
                              >
                                <td className="px-4 py-3.5 font-bold text-slate-900 align-middle">{sal.month}</td>
                                <td className="px-4 py-3.5 text-right font-mono font-bold align-middle text-slate-950">₹{displayNet.toLocaleString()}</td>
                                <td className="px-4 py-3.5 text-center align-middle">
                                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase ${
                                    sal.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                                  }`}>
                                    {sal.paymentStatus}
                                  </span>
                                </td>
                                <td className="px-4 py-3.5 text-slate-650 font-mono align-middle">{displayDate}</td>
                                <td className="px-4 py-3.5 text-slate-700 align-middle">{sal.paymentMethod || 'Bank Transfer'}</td>
                                <td className="px-4 py-3.5 text-right align-middle" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    onClick={() => addToast(`Downloading salary slip for ${sal.month}...`, 'success')}
                                    className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-750 px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition uppercase"
                                  >
                                    Slip
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )
          )}

        </div>

      </div>

      {/* --- POPUP MODALS: PERFECTLY CENTERED, NEVER CUT OFF, FIXED HEADER/FOOTER, SCROLLABLE BODY --- */}
      
      {/* 1. Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
            {/* Header (Fixed) */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Register New Employee</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-slate-50 text-slate-400 hover:text-slate-655 rounded-lg border border-slate-150 transition cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Form & Body */}
            <form onSubmit={handleSaveEmployee} className="flex flex-col flex-1 overflow-hidden">
              {/* Body (Scrollable Only) */}
              <div className="p-5 overflow-y-auto space-y-3.5 flex-grow">
                <div>
                  <label className="block mb-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rohan Sharma"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Phone *</label>
                    <input
                      type="text"
                      required
                      placeholder="10 digits"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                    />
                  </div>
                  <div>
                    <label className="block mb-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                    <input
                      type="email"
                      placeholder="e.g. name@diner.com"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Department *</label>
                    <select
                      value={formDept}
                      onChange={(e) => handleDeptChange(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-2 py-2 bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                    >
                      {Object.keys(DEPARTMENT_ROLES_MAP).map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Role *</label>
                    <select
                      value={formRole}
                      onChange={(e) => setFormRole(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-2 py-2 bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                    >
                      {(DEPARTMENT_ROLES_MAP[formDept] || []).map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block mb-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Shift *</label>
                    <select
                      value={formShift}
                      onChange={(e) => setFormShift(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-1.5 py-2 bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer focus:outline-none"
                    >
                      <option value="Morning">Morning</option>
                      <option value="Evening">Evening</option>
                      <option value="Night">Night</option>
                      <option value="Weekly Off">Weekly Off</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Employment</label>
                    <select
                      value={formEmpType}
                      onChange={(e) => setFormEmpType(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-1.5 py-2 bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer focus:outline-none"
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Salary (₹) *</label>
                    <input
                      type="number"
                      required
                      placeholder="Max 25000"
                      value={formSalary}
                      onChange={(e) => setFormSalary(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-1.5 py-2 bg-slate-50 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Join Date</label>
                  <input
                    type="date"
                    required
                    value={formJoinDate}
                    onChange={(e) => setFormJoinDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block mb-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Remarks Notes</label>
                  <textarea
                    placeholder="Bio context, records..."
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    rows={2}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-xs font-semibold text-slate-800 resize-none focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Footer (Fixed) */}
              <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex gap-2 flex-shrink-0 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold px-4 py-2 rounded-xl cursor-pointer text-xs uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-xl cursor-pointer text-xs uppercase tracking-wider"
                >
                  Register Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Edit Employee Modal */}
      {showEditModal && editingEmployee && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
            {/* Header (Fixed) */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Edit Staff Details</h3>
              <button onClick={() => setShowEditModal(false)} className="p-1 hover:bg-slate-50 text-slate-400 hover:text-slate-655 rounded-lg border border-slate-150 transition cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Form & Body */}
            <form onSubmit={handleSaveEmployee} className="flex flex-col flex-1 overflow-hidden">
              {/* Body (Scrollable Only) */}
              <div className="p-5 overflow-y-auto space-y-3.5 flex-grow">
                <div>
                  <label className="block mb-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1.5 text-[10px] font-bold text-slate-505 uppercase tracking-wider">Phone *</label>
                    <input
                      type="text"
                      required
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                    />
                  </div>
                  <div>
                    <label className="block mb-1.5 text-[10px] font-bold text-slate-505 uppercase tracking-wider">Email Address</label>
                    <input
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1.5 text-[10px] font-bold text-slate-505 uppercase tracking-wider">Department *</label>
                    <select
                      value={formDept}
                      onChange={(e) => handleDeptChange(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-2 py-2 bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                    >
                      {Object.keys(DEPARTMENT_ROLES_MAP).map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1.5 text-[10px] font-bold text-slate-550 uppercase tracking-wider">Designated Role *</label>
                    <select
                      value={formRole}
                      onChange={(e) => setFormRole(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-2 py-2 bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                    >
                      {(DEPARTMENT_ROLES_MAP[formDept] || []).map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block mb-1.5 text-[10px] font-bold text-slate-505 uppercase tracking-wider">Shift *</label>
                    <select
                      value={formShift}
                      onChange={(e) => setFormShift(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-1.5 py-2 bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer focus:outline-none"
                    >
                      <option value="Morning">Morning</option>
                      <option value="Evening">Evening</option>
                      <option value="Night">Night</option>
                      <option value="Weekly Off">Weekly Off</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1.5 text-[10px] font-bold text-slate-505 uppercase tracking-wider">Employment</label>
                    <select
                      value={formEmpType}
                      onChange={(e) => setFormEmpType(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-1.5 py-2 bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer"
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1.5 text-[10px] font-bold text-slate-505 uppercase tracking-wider">Salary (₹) *</label>
                    <input
                      type="number"
                      required
                      disabled={!isAdmin} // Non-admins cannot edit salary
                      value={formSalary}
                      onChange={(e) => setFormSalary(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-1.5 py-2 bg-slate-50 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-600 focus:bg-white transition disabled:opacity-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-1.5 text-[10px] font-bold text-slate-505 uppercase tracking-wider">Join Date</label>
                  <input
                    type="date"
                    required
                    value={formJoinDate}
                    onChange={(e) => setFormJoinDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block mb-1.5 text-[10px] font-bold text-slate-505 uppercase tracking-wider">Remarks Notes</label>
                  <textarea
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    rows={2}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-xs font-semibold text-slate-800 resize-none focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Footer (Fixed) */}
              <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex gap-2 flex-shrink-0 justify-end">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold px-4 py-2 rounded-xl cursor-pointer text-xs uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-xl cursor-pointer text-xs uppercase tracking-wider"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Salary Payment Modal */}
      {salaryPaymentModalOpen && payingSalaryRecord && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
            {/* Header (Fixed) */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Process Salary Payment</h3>
              <button onClick={() => { setSalaryPaymentModalOpen(false); setPayingSalaryRecord(null); }} className="p-1 hover:bg-slate-50 text-slate-400 hover:text-slate-655 rounded-lg border border-slate-150 transition cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body (Scrollable Only) */}
            <div className="p-5 overflow-y-auto space-y-3.5 flex-grow text-xs font-semibold text-slate-700">
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Employee Name:</span>
                <span className="font-bold text-slate-900">{payingSalaryRecord.employeeName}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Salary Amount:</span>
                <span className="font-bold text-slate-900 font-mono">₹{payingSalaryRecord.netSalary.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Salary Month:</span>
                <span className="font-bold text-slate-900">{payingSalaryRecord.month}</span>
              </div>

              <div className="space-y-1">
                <label className="block mb-1.5 text-[10px] font-bold text-slate-505 uppercase tracking-wider">Payment Date *</label>
                <input
                  type="date"
                  required
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                />
              </div>

              <div className="space-y-1">
                <label className="block mb-1.5 text-[10px] font-bold text-slate-505 uppercase tracking-wider">Payment Method *</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block mb-1.5 text-[10px] font-bold text-slate-505 uppercase tracking-wider">Notes</label>
                <input
                  type="text"
                  placeholder="Remarks..."
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                />
              </div>
            </div>

            {/* Footer (Fixed) */}
            <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex gap-2 flex-shrink-0 justify-end">
              <button
                onClick={() => { setSalaryPaymentModalOpen(false); setPayingSalaryRecord(null); }}
                className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold px-4 py-2 rounded-xl cursor-pointer text-xs uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSalaryPayment}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-xl cursor-pointer text-xs uppercase tracking-wider"
              >
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Salary Slip View Details Modal */}
      {viewingSalarySlip && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
            {/* Header (Fixed) */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Salary Slip Details</h3>
              <button onClick={() => setViewingSalarySlip(null)} className="p-1 hover:bg-slate-50 text-slate-400 hover:text-slate-655 rounded-lg border border-slate-150 transition cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body (Scrollable Only) */}
            <div className="p-5 overflow-y-auto space-y-3.5 flex-grow text-xs font-semibold text-slate-700">
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Employee Name:</span>
                <span className="font-bold text-slate-905">{viewingSalarySlip.employeeName}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Designated Role:</span>
                <span className="text-slate-900 font-bold">{viewingSalarySlip.role}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Basic Salary:</span>
                <span className="font-mono">₹{viewingSalarySlip.basicSalary.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Allowances:</span>
                <span className="font-mono text-emerald-700">+₹{viewingSalarySlip.allowances.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Net Salary:</span>
                <span className="font-bold text-slate-900 font-mono">₹{viewingSalarySlip.netSalary.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-505">Month:</span>
                <span className="font-bold text-slate-900">{viewingSalarySlip.month}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-505">Payment Status:</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                  viewingSalarySlip.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-250' : 'bg-rose-50 text-rose-700 border-rose-250'
                }`}>{viewingSalarySlip.paymentStatus}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-505">Payment Date:</span>
                <span className="text-slate-900 font-mono">{viewingSalarySlip.paymentDate || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-505">Payment Method:</span>
                <span className="text-slate-900">{viewingSalarySlip.paymentMethod || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-505">Paid By:</span>
                <span className="text-slate-900">{viewingSalarySlip.paidBy || 'N/A'}</span>
              </div>
              {viewingSalarySlip.notes && (
                <div className="space-y-1.5 pt-1.5">
                  <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider">Notes:</span>
                  <p className="bg-slate-50 p-3 rounded-xl border border-slate-100 font-normal italic text-slate-600 leading-relaxed">{viewingSalarySlip.notes}</p>
                </div>
              )}
            </div>

            {/* Footer (Fixed) */}
            <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex-shrink-0">
              <button
                onClick={() => setViewingSalarySlip(null)}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 rounded-xl cursor-pointer text-xs uppercase tracking-wider"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Employee Details Modal */}
      {selectedEmployeeDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden text-left">
            {/* Header (Fixed) */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider">Employee Dashboard Profile</h3>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{selectedEmployeeDetail.name} ({selectedEmployeeDetail.employeeId})</p>
                {/* 4. CURRENT STATUS TODAY */}
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[9px] text-slate-400 uppercase tracking-wider font-extrabold">Current Status Today:</span>
                  {getAttendanceBadge(getAttendanceStatusToday(selectedEmployeeDetail))}
                </div>
              </div>
              <button onClick={() => setSelectedEmployeeDetail(null)} className="p-1 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-lg border border-slate-150 transition cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body (Scrollable Only) */}
            <div className="p-5 overflow-y-auto space-y-5 flex-grow text-xs font-semibold text-slate-705">
              
              {/* 2. Profile Overview Row (Grid 4 columns, equal width, no overlapping) */}
              <div className="grid grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-150 w-full min-w-0">
                <div className="min-w-0">
                  <span className="text-[9px] text-slate-555 uppercase tracking-wider block font-extrabold mb-1">Department</span>
                  <span className="text-slate-900 font-bold block truncate" title={selectedEmployeeDetail.department}>{selectedEmployeeDetail.department}</span>
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] text-slate-555 uppercase tracking-wider block font-extrabold mb-1">Role</span>
                  <span className="text-emerald-700 font-bold block truncate" title={selectedEmployeeDetail.role}>{selectedEmployeeDetail.role}</span>
                </div>
                <div className="min-w-0 col-span-1">
                  <span className="text-[9px] text-slate-555 uppercase tracking-wider block font-extrabold mb-1">Shift Time</span>
                  <span className="text-slate-900 font-bold block text-[10px] leading-tight break-words">
                    {selectedEmployeeDetail.shift === 'Morning' && 'Morning Shift (8 AM – 4 PM)'}
                    {selectedEmployeeDetail.shift === 'Evening' && 'Evening Shift (2 PM – 10 PM)'}
                    {selectedEmployeeDetail.shift === 'Night' && 'Night Shift (10 PM – 6 AM)'}
                    {selectedEmployeeDetail.shift === 'Weekly Off' && 'Weekly Off'}
                  </span>
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] text-slate-555 uppercase tracking-wider block font-extrabold mb-1">Employment</span>
                  <span className="text-slate-900 font-bold block truncate" title={selectedEmployeeDetail.employmentType}>{selectedEmployeeDetail.employmentType}</span>
                </div>
              </div>

              {/* Two-Column Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* LEFT COLUMN: Profile Info, Leave Balance, Alert Metrics */}
                <div className="space-y-4">
                  
                  {/* General Profile Contact Details */}
                  <div className="space-y-2 bg-white p-4 rounded-xl border border-slate-150 shadow-xs">
                    <h4 className="text-xs font-bold text-slate-805 uppercase tracking-wider border-b pb-1.5 mb-2">Profile Details</h4>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Phone Number</span>
                        <span className="text-slate-900 font-bold font-mono">{selectedEmployeeDetail.phone}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Email Address</span>
                        <span className="text-slate-900 truncate block" title={selectedEmployeeDetail.email || 'N/A'}>{selectedEmployeeDetail.email || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Join Date</span>
                        <span className="text-slate-900">{selectedEmployeeDetail.joiningDate}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Status</span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase inline-block mt-0.5 ${
                          selectedEmployeeDetail.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-150 text-slate-600'
                        }`}>
                          {selectedEmployeeDetail.status}
                        </span>
                      </div>
                    </div>

                    {isAdmin && (
                      <div className="pt-2 border-t mt-2 flex justify-between items-center bg-emerald-50/20 p-2 rounded-lg border border-emerald-100/50 text-[10px]">
                        <span className="text-emerald-805 uppercase font-bold">Confidential Salary:</span>
                        <span className="text-emerald-705 font-bold font-mono text-xs">₹{selectedEmployeeDetail.salary?.toLocaleString() || 'N/A'}</span>
                      </div>
                    )}
                  </div>

                  {/* 5. Leave Balance Card (Dedicated Section) */}
                  <div className="bg-white p-4 rounded-xl border border-slate-150 shadow-xs space-y-2.5">
                    <h4 className="text-xs font-bold text-slate-805 uppercase tracking-wider border-b pb-1.5">Leave Balance Ledger</h4>
                    {(() => {
                      const empLeaves = leaves.filter(l => l.employeeId === selectedEmployeeDetail.id);
                      const pendingCount = empLeaves.filter(l => l.status === 'PENDING').length;
                      const approvedCount = empLeaves.filter(l => l.status === 'APPROVED').length;
                      const rejectedCount = empLeaves.filter(l => l.status === 'REJECTED').length;
                      const annual = 15;
                      const used = approvedCount;
                      const remaining = annual - used;

                      return (
                        <div className="space-y-2.5">
                          <div className="grid grid-cols-3 gap-2 text-[10px] text-center font-bold">
                            <div className="bg-slate-50 p-2 rounded-lg border border-slate-150">
                              <span className="text-[8px] text-slate-505 uppercase block">Annual Leave</span>
                              <span className="text-slate-900 text-xs font-extrabold mt-0.5 block">{annual} Days</span>
                            </div>
                            <div className="bg-amber-50/50 p-2 rounded-lg border border-amber-100 text-amber-900">
                              <span className="text-[8px] text-amber-700 uppercase block">Used Leave</span>
                              <span className="text-xs font-extrabold mt-0.5 block">{used} Days</span>
                            </div>
                            <div className="bg-emerald-50/50 p-2 rounded-lg border border-emerald-100 text-emerald-900">
                              <span className="text-[8px] text-emerald-700 uppercase block">Remaining</span>
                              <span className="text-xs font-extrabold mt-0.5 block">{remaining} Days</span>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-1.5 text-center mt-1 text-[9px] font-bold">
                            <div className="bg-amber-50 text-amber-850 p-1.5 rounded-lg border border-amber-100">
                              <div>{pendingCount}</div>
                              <div className="text-[8px] uppercase">Pending Requests</div>
                            </div>
                            <div className="bg-emerald-50 text-emerald-850 p-1.5 rounded-lg border border-emerald-100">
                              <div>{approvedCount}</div>
                              <div className="text-[8px] uppercase">Approved This Month</div>
                            </div>
                            <div className="bg-rose-50 text-rose-855 p-1.5 rounded-lg border border-rose-100">
                              <div>{rejectedCount}</div>
                              <div className="text-[8px] uppercase">Rejected Requests</div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* 6. Alert & Performance Metrics Section */}
                  <div className="bg-white p-4 rounded-xl border border-slate-150 shadow-xs space-y-2.5">
                    <h4 className="text-xs font-bold text-slate-805 uppercase tracking-wider border-b pb-1.5">Alert & Performance Metrics</h4>
                    {(() => {
                      const stats = getMonthlyStatsForEmployee(selectedEmployeeDetail.id);
                      const attendancePercent = ((stats.present / stats.workingDays) * 100).toFixed(0);
                      const overtimeHrs = (stats.present * 0.6).toFixed(1);

                      return (
                        <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
                          <div className="bg-slate-50 p-2 rounded-lg border border-slate-150 flex justify-between items-center">
                            <span className="text-slate-550">Late Arrivals</span>
                            <span className="text-amber-700 font-extrabold">{stats.lateEntry} Days</span>
                          </div>
                          <div className="bg-slate-50 p-2 rounded-lg border border-slate-150 flex justify-between items-center">
                            <span className="text-slate-550">Half Days Worked</span>
                            <span className="text-slate-900 font-extrabold">{stats.halfDays} Days</span>
                          </div>
                          <div className="bg-rose-50/50 p-2 rounded-lg border border-rose-100 flex justify-between items-center text-rose-900">
                            <span className="text-rose-700">Absent Days</span>
                            <span className="font-extrabold">{stats.absent} Days</span>
                          </div>
                          <div className="bg-emerald-50/50 p-2 rounded-lg border border-emerald-100 flex justify-between items-center text-emerald-955">
                            <span className="text-emerald-700">Attendance %</span>
                            <span className="font-extrabold">{attendancePercent}%</span>
                          </div>
                          <div className="col-span-2 bg-slate-50 p-2 rounded-lg border border-slate-150 flex justify-between items-center">
                            <span className="text-slate-550">Total Overtime Hours</span>
                            <span className="text-slate-900 font-extrabold">{overtimeHrs} Hours</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                </div>

                {/* RIGHT COLUMN: Today's status details, Summary & Calendar */}
                <div className="space-y-4">
                  
                  {/* Today's Log Block (Section 2 - Today's Attendance) */}
                  <div className="bg-white p-4 rounded-xl border border-slate-150 shadow-xs space-y-2.5">
                    <h4 className="text-xs font-bold text-slate-805 uppercase tracking-wider border-b pb-1.5">Today's Shift Log</h4>
                    
                    {(() => {
                      const todayStatus = getAttendanceStatusToday(selectedEmployeeDetail);
                      const todayRecord = attendance.find(a => a.employeeId === selectedEmployeeDetail.id && a.date === todayStr);

                      if (todayStatus === 'Absent') {
                        return (
                          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl flex flex-col gap-1">
                            <span className="font-bold flex items-center gap-1.5 text-xs">
                              🔴 Absent Today
                            </span>
                            <span className="text-[10px] text-rose-700 font-semibold">
                              Reason: No Check-In / Leave Not Applied / Unapproved Absence
                            </span>
                          </div>
                        );
                      }

                      if (todayStatus === 'On Leave') {
                        const activeLeave = leaves.find(l => 
                          l.employeeId === selectedEmployeeDetail.id && 
                          l.status === 'APPROVED' && 
                          todayStr >= l.startDate && 
                          todayStr <= l.endDate
                        );
                        return (
                          <div className="bg-amber-50 border border-amber-250 text-amber-800 p-3 rounded-xl flex flex-col gap-1">
                            <span className="font-bold flex items-center gap-1.5 text-xs">
                              🟡 Currently On Leave
                            </span>
                            {activeLeave && (
                              <span className="text-[10px] text-amber-700 font-semibold">
                                {activeLeave.leaveType} ({activeLeave.startDate} to {activeLeave.endDate}) • Approved By Owner
                              </span>
                            )}
                          </div>
                        );
                      }

                      if (todayStatus === 'Weekly Off') {
                        return (
                          <div className="bg-slate-100 border border-slate-200 text-slate-800 p-3 rounded-xl flex flex-col gap-1">
                            <span className="font-bold flex items-center gap-1.5 text-xs">
                              ⚪ Weekly Off Today
                            </span>
                            <span className="text-[10px] text-slate-600 font-semibold">
                              Scheduled weekly rest day.
                            </span>
                          </div>
                        );
                      }

                      if (todayRecord) {
                        const overtime = Math.max(0, (todayRecord.workingHours || 0) - 8.0);
                        return (
                          <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-2 text-[10px]">
                              <div>
                                <span className="text-slate-400 block">Check-In Time</span>
                                <span className="text-slate-900 font-bold font-mono">{todayRecord.checkIn}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block">Check-Out Time</span>
                                <span className="text-slate-900 font-bold font-mono">{todayRecord.checkOut || 'Active'}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block">Working Hours</span>
                                <span className="text-slate-900 font-bold">{todayRecord.workingHours ? `${todayRecord.workingHours} hrs` : 'Calculating...'}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block">Overtime Hours</span>
                                <span className="text-slate-905 font-bold">{overtime > 0 ? `${overtime.toFixed(1)} hrs` : '0.0 hrs'}</span>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div className="bg-slate-50 border border-slate-200 text-slate-500 p-3 rounded-xl text-center font-bold">
                          ⚠️ Not Checked In Today
                        </div>
                      );
                    })()}
                  </div>

                  {/* Monthly Stats Summary Grid */}
                  <div className="bg-white p-4 rounded-xl border border-slate-150 shadow-xs space-y-2.5">
                    <h4 className="text-xs font-bold text-slate-850 uppercase tracking-wider border-b pb-1.5">Monthly Roster Counts</h4>
                    {(() => {
                      const stats = getMonthlyStatsForEmployee(selectedEmployeeDetail.id);
                      return (
                        <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold">
                          <div className="bg-emerald-50 text-emerald-805 p-1.5 rounded-xl border border-emerald-150">
                            <div className="text-xs font-extrabold text-emerald-700">{stats.present}</div>
                            <div className="text-[8px] text-emerald-600 uppercase font-bold">Present</div>
                          </div>
                          <div className="bg-rose-50 text-rose-805 p-1.5 rounded-xl border border-rose-150">
                            <div className="text-xs font-extrabold text-rose-600">{stats.absent}</div>
                            <div className="text-[8px] text-rose-550 uppercase font-bold">Absent</div>
                          </div>
                          <div className="bg-amber-50 text-amber-805 p-1.5 rounded-xl border border-amber-150">
                            <div className="text-xs font-extrabold text-amber-700">{stats.leave}</div>
                            <div className="text-[8px] text-amber-600 uppercase font-bold">Leave</div>
                          </div>
                          <div className="bg-slate-100 text-slate-805 p-1.5 rounded-xl border border-slate-200">
                            <div className="text-xs font-extrabold text-slate-705">{stats.weeklyOff}</div>
                            <div className="text-[8px] text-slate-550 uppercase font-bold">Off</div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Monthly Attendance Calendar */}
                  <div className="bg-white p-4 rounded-xl border border-slate-150 shadow-xs space-y-2">
                    {renderMonthlyCalendar(selectedEmployeeDetail)}
                    
                    {/* Tooltip Legend notes for the calendar */}
                    <div className="border-t pt-2 mt-2 space-y-1.5 text-[9px] font-semibold text-slate-500 leading-relaxed">
                      <div className="grid grid-cols-2 gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded bg-emerald-500 block"></span>
                          <span>🟢 Present → Employee worked.</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded bg-amber-500 block"></span>
                          <span>🟡 Leave → Approved leave.</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded bg-rose-500 block"></span>
                          <span>🔴 Absent → Employee did not report.</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded bg-slate-300 block"></span>
                          <span>⚪ Weekly Off → Scheduled holiday.</span>
                        </div>
                      </div>
                      <p className="text-slate-400 italic pt-1 border-t border-dashed mt-1.5">
                        * Note: Approved leaves are planned time-off requests processed in advance. Unapproved absences reflect missing shift check-in logs.
                      </p>
                    </div>
                  </div>

                </div>

              </div>

            </div>

            {/* Footer (Fixed) */}
            <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex-shrink-0 flex justify-end">
              <button
                onClick={() => setSelectedEmployeeDetail(null)}
                className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 px-6 rounded-xl cursor-pointer text-xs uppercase tracking-wider"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Toast Alert Popups */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`border-l-4 p-3 rounded-xl shadow-md flex items-center justify-between gap-3 border bg-white ${
              toast.type === 'success' ? 'border-emerald-500 text-emerald-800 bg-emerald-50/50' : 'border-rose-500 text-rose-800 bg-rose-50/50'
            }`}
          >
            <div className="flex-1 text-xs font-semibold">{toast.message}</div>
            <button
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="text-neutral-400 hover:text-neutral-700 text-xs font-bold cursor-pointer"
            >
              ×
            </button>
          </div>
        ))}
      </div>

    </div>
  );
};

export default EmployeeManagement;

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Calendar, 
  Clock, 
  Users, 
  User, 
  Search, 
  Phone, 
  AlertCircle, 
  RefreshCw,
  FileDown,
  X,
  ArrowRight,
  Coffee,
  Utensils
} from 'lucide-react';

export const Reservations: React.FC = () => {
  const { user, apiRequest } = useAuth();
  const navigate = useNavigate();
  
  // Role verification
  const getEffectiveRoleLocal = (u: any) => {
    if (!u) return 'ADMIN';
    if (u.employee?.role) {
      const r = u.employee.role.toLowerCase();
      if (r.includes('admin')) return 'ADMIN';
      if (r.includes('manager')) return 'MANAGER';
      if (r.includes('waiter') || r.includes('captain')) return 'WAITER';
      if (r.includes('chef')) return 'CHEF';
      return 'EMPLOYEE';
    }
    return u.role;
  };

  const role = getEffectiveRoleLocal(user);
  const isAuthorized = role === 'ADMIN' || role === 'MANAGER';

  const [reservations, setReservations] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterDateType, setFilterDateType] = useState<'ALL' | 'TODAY' | 'UPCOMING' | 'CUSTOM'>('ALL');
  const [onlyAssignedTable, setOnlyAssignedTable] = useState<boolean>(false);

  // Modals & Drawer state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [drawerTable, setDrawerTable] = useState<any>(null);

  // Form State - Add/Edit Reservation
  const [editingId, setEditingId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [resDate, setResDate] = useState('');
  const [resTime, setResTime] = useState('');
  const [guests, setGuests] = useState(2);
  const [tableId, setTableId] = useState('');
  const [notes, setNotes] = useState('');
  const [source, setSource] = useState('RECEPTION');
  const [status, setStatus] = useState('RESERVED');

  // Form State - Walk-In
  const [walkInName, setWalkInName] = useState('');
  const [walkInMobile, setWalkInMobile] = useState('');
  const [walkInGuests, setWalkInGuests] = useState(2);
  const [walkInTableId, setWalkInTableId] = useState('');

  // Selected customer for history viewing
  const [historyCustomer, setHistoryCustomer] = useState<{ name: string; mobile: string } | null>(null);

  // Current date & time for UI header
  const [currentTime, setCurrentTime] = useState(new Date());

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchReservationsAndTables = async () => {
    try {
      setLoading(true);
      const resvs = await apiRequest(`/restaurant/reservations?restaurantId=${user?.restaurantId || 'mock-id'}`);
      setReservations(resvs || []);
      
      const tbs = await apiRequest(`/restaurant/tables?restaurantId=${user?.restaurantId || 'mock-id'}`);
      setTables(tbs || []);
    } catch (err) {
      console.warn('Utilizing mock reservations database.');
      setTables([
        { id: 't-1', tableNumber: 'Table 1', capacity: 2, status: 'AVAILABLE' },
        { id: 't-2', tableNumber: 'Table 2', capacity: 4, status: 'AVAILABLE' },
        { id: 't-3', tableNumber: 'Table 3', capacity: 4, status: 'RESERVED' },
        { id: 't-4', tableNumber: 'Table 4', capacity: 6, status: 'OCCUPIED' },
        { id: 't-5', tableNumber: 'Table 5', capacity: 8, status: 'BILLING_PENDING' },
        { id: 't-6', tableNumber: 'Table 6', capacity: 2, status: 'CLEANING' }
      ]);
      setReservations([
        { id: 'r-1', customerName: 'Robert Dow', mobileNumber: '9988554422', date: todayStr, time: '19:30', guests: 4, status: 'RESERVED', notes: 'Window seat preferred', source: 'WEBSITE', tableId: 't-3', table: { tableNumber: 'Table 3', capacity: 4 } },
        { id: 'r-2', customerName: 'Emily Clark', mobileNumber: '9988554433', date: todayStr, time: '20:00', guests: 2, status: 'ARRIVED', notes: 'Anniversary celebration', source: 'PHONE', tableId: 't-1', table: { tableNumber: 'Table 1', capacity: 2 } },
        { id: 'r-3', customerName: 'Mark Ronson', mobileNumber: '9988554444', date: todayStr, time: '18:00', guests: 6, status: 'WAITING', notes: 'Need baby high-chair', source: 'WALK_IN', tableId: null, table: null },
        { id: 'r-4', customerName: 'David Miller', mobileNumber: '9977553311', date: todayStr, time: '21:00', guests: 3, status: 'RESERVED', notes: '', source: 'RECEPTION', tableId: 't-2', table: { tableNumber: 'Table 2', capacity: 4 } },
        { id: 'r-5', customerName: 'Jessica Taylor', mobileNumber: '9966442200', date: todayStr, time: '19:00', guests: 2, status: 'COMPLETED', notes: '', source: 'WEBSITE', tableId: 't-1', table: { tableNumber: 'Table 1', capacity: 2 } },
        { id: 'r-6', customerName: 'Sarah Jenkins', mobileNumber: '9955331199', date: todayStr, time: '13:00', guests: 4, status: 'CANCELLED', notes: 'Had to reschedule', source: 'PHONE', tableId: null, table: null },
        { id: 'r-7', customerName: 'Michael Brown', mobileNumber: '9944220088', date: todayStr, time: '20:30', guests: 5, status: 'WAITING', notes: 'Prefers quiet booth', source: 'RECEPTION', tableId: null, table: null }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      fetchReservationsAndTables();
      
      const API_BASE = window.location.hostname === 'localhost'
        ? 'http://localhost:5000/api'
        : `${window.location.protocol}//${window.location.hostname}:5000/api`;
        
      let eventSource: EventSource | null = null;
      try {
        eventSource = new EventSource(`${API_BASE}/restaurant/realtime`);
        eventSource.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);
            if (
              payload.type === 'TABLE_STATUS_UPDATE' ||
              payload.type === 'TABLE_MUTATED' ||
              payload.type === 'NEW_RESERVATION' ||
              payload.type === 'RESERVATION_MUTATED' ||
              payload.type === 'NEW_ORDER' ||
              payload.type === 'ORDER_STATUS_UPDATE' ||
              payload.event === 'ORDER_MUTATED'
            ) {
              fetchReservationsAndTables();
            }
          } catch (e) {
            // Fail silently
          }
        };
      } catch (e) {
        console.warn('Realtime SSE connection failed');
      }

      const handleMutation = () => {
        fetchReservationsAndTables();
      };
      window.addEventListener('reservation-mutated', handleMutation);
      window.addEventListener('table-mutated', handleMutation);
      window.addEventListener('order-mutated', handleMutation);

      return () => {
        if (eventSource) eventSource.close();
        window.removeEventListener('reservation-mutated', handleMutation);
        window.removeEventListener('table-mutated', handleMutation);
        window.removeEventListener('order-mutated', handleMutation);
      };
    }
  }, [user]);

  // Sync drawer table state when tables list changes
  useEffect(() => {
    if (drawerTable) {
      const updated = tables.find(t => t.id === drawerTable.id);
      if (updated) {
        setDrawerTable(updated);
      }
    }
  }, [tables]);

  const checkTableConflict = (selectedTableId: string, dateVal: string, timeVal: string, excludeResId: string | null = null) => {
    if (!selectedTableId) return false;
    return reservations.some(r => 
      r.id !== excludeResId &&
      r.tableId === selectedTableId && 
      r.date === dateVal && 
      r.time === timeVal && 
      ['RESERVED', 'PENDING_APPROVAL'].includes(r.status)
    );
  };

  const handleCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !mobileNumber || !resDate || !resTime) return;

    if (tableId && checkTableConflict(tableId, resDate, resTime)) {
      alert('Selected table is already reserved at this date and time.');
      return;
    }

    const body = {
      customerName,
      mobileNumber,
      date: resDate,
      time: resTime,
      guests: Number(guests),
      tableId: tableId || null,
      notes,
      source,
      status: tableId ? 'RESERVED' : 'WAITING'
    };

    try {
      await apiRequest('/restaurant/reservations', {
        method: 'POST',
        body: JSON.stringify(body)
      });
      setShowAddModal(false);
      resetForm();
      fetchReservationsAndTables();
      window.dispatchEvent(new CustomEvent('reservation-mutated'));
    } catch (err) {
      const selectedTable = tables.find(t => t.id === tableId);
      const newRes = {
        id: `r-${Date.now()}`,
        customerName,
        mobileNumber,
        date: resDate,
        time: resTime,
        guests,
        notes,
        source,
        status: tableId ? 'RESERVED' : 'WAITING',
        tableId: tableId || null,
        table: selectedTable || null
      };
      setReservations(prev => [newRes, ...prev]);
      setShowAddModal(false);
      resetForm();
    }
  };

  const handleEditReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !customerName || !mobileNumber || !resDate || !resTime) return;

    if (tableId && checkTableConflict(tableId, resDate, resTime, editingId)) {
      alert('Selected table is already reserved at this date and time.');
      return;
    }

    const body = {
      customerName,
      mobileNumber,
      date: resDate,
      time: resTime,
      guests: Number(guests),
      tableId: tableId || null,
      notes,
      source,
      status
    };

    try {
      await apiRequest(`/restaurant/reservations/${editingId}`, {
        method: 'PUT',
        body: JSON.stringify(body)
      });
      setShowEditModal(false);
      resetForm();
      fetchReservationsAndTables();
      window.dispatchEvent(new CustomEvent('reservation-mutated'));
      window.dispatchEvent(new CustomEvent('table-mutated'));
    } catch (err) {
      const selectedTable = tables.find(t => t.id === tableId);
      setReservations(prev => prev.map(r => r.id === editingId ? {
        ...r,
        customerName,
        mobileNumber,
        date: resDate,
        time: resTime,
        guests,
        notes,
        source,
        status,
        tableId: tableId || null,
        table: selectedTable || null
      } : r));
      setShowEditModal(false);
      resetForm();
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string, assignedTableId: string | null = null) => {
    try {
      const res = await apiRequest(`/restaurant/reservations/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ 
          status: newStatus,
          tableId: assignedTableId
        })
      });

      fetchReservationsAndTables();
      window.dispatchEvent(new CustomEvent('reservation-mutated'));
      window.dispatchEvent(new CustomEvent('table-mutated'));

      if (newStatus === 'ARRIVED') {
        const tId = assignedTableId || res?.reservation?.tableId;
        if (tId) {
          navigate(`/restaurant/take-order?tableId=${tId}`);
        }
      }
    } catch (err) {
      setReservations(prev => prev.map(r => {
        if (r.id === id) {
          const finalTableId = assignedTableId || r.tableId;
          const selectedTable = tables.find(t => t.id === finalTableId);
          
          if (newStatus === 'ARRIVED' && finalTableId) {
            setTables(prevTables => prevTables.map(t => t.id === finalTableId ? { ...t, status: 'OCCUPIED' } : t));
          } else if (newStatus === 'CANCELLED' && finalTableId) {
            setTables(prevTables => prevTables.map(t => t.id === finalTableId ? { ...t, status: 'AVAILABLE' } : t));
          } else if (newStatus === 'COMPLETED' && finalTableId) {
            setTables(prevTables => prevTables.map(t => t.id === finalTableId ? { ...t, status: 'AVAILABLE' } : t));
          }

          return { 
            ...r, 
            status: newStatus,
            tableId: finalTableId,
            table: selectedTable ? { ...selectedTable, status: newStatus === 'ARRIVED' ? 'OCCUPIED' : selectedTable.status } : null
          };
        }
        return r;
      }));

      if (newStatus === 'ARRIVED') {
        const current = reservations.find(r => r.id === id);
        const tId = assignedTableId || current?.tableId;
        if (tId) {
          navigate(`/restaurant/take-order?tableId=${tId}`);
        }
      }
    }
  };

  const handleUpdateTableStatusDirect = async (tableId: string, newStatus: string) => {
    try {
      await apiRequest(`/restaurant/tables/${tableId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      fetchReservationsAndTables();
      window.dispatchEvent(new CustomEvent('table-mutated'));
    } catch (err) {
      setTables(prev => prev.map(t => t.id === tableId ? { ...t, status: newStatus } : t));
    }
  };

  const handleCreateWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkInName || !walkInTableId) return;

    try {
      await apiRequest('/restaurant/orders', {
        method: 'POST',
        body: JSON.stringify({
          tableId: walkInTableId,
          source: 'WALK_IN',
          items: [],
          notes: `Walk-in Guest: ${walkInName} (${walkInGuests} guests)`
        })
      });

      setShowWalkInModal(false);
      setWalkInName('');
      setWalkInMobile('');
      setWalkInGuests(2);
      setWalkInTableId('');
      
      window.dispatchEvent(new CustomEvent('table-mutated'));
      navigate(`/restaurant/take-order?tableId=${walkInTableId}`);
    } catch (err) {
      setShowWalkInModal(false);
      navigate(`/restaurant/take-order?tableId=${walkInTableId}`);
    }
  };

  const openEditModal = (res: any) => {
    setEditingId(res.id);
    setCustomerName(res.customerName);
    setMobileNumber(res.mobileNumber);
    setResDate(res.date);
    setResTime(res.time);
    setGuests(res.guests);
    setTableId(res.tableId || '');
    setNotes(res.notes || '');
    setSource(res.source || 'RECEPTION');
    setStatus(res.status);
    setShowEditModal(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setCustomerName('');
    setMobileNumber('');
    setResDate('');
    setResTime('');
    setGuests(2);
    setTableId('');
    setNotes('');
    setSource('RECEPTION');
    setStatus('RESERVED');
  };

  const getCustomerHistoryStats = (mobile: string) => {
    const matched = reservations.filter(r => r.mobileNumber === mobile);
    const total = matched.length;
    const completed = matched.filter(r => ['ARRIVED', 'COMPLETED'].includes(r.status)).length;
    const cancelled = matched.filter(r => r.status === 'CANCELLED').length;
    
    const tableCounts: Record<string, number> = {};
    matched.forEach(r => {
      if (r.table?.tableNumber) {
        tableCounts[r.table.tableNumber] = (tableCounts[r.table.tableNumber] || 0) + 1;
      }
    });
    let favTable = 'None';
    let maxCount = 0;
    Object.entries(tableCounts).forEach(([tbl, count]) => {
      if (count > maxCount) {
        maxCount = count;
        favTable = tbl;
      }
    });

    return {
      total,
      completed,
      cancelled,
      favTable,
      allBookings: matched
    };
  };

  const getStatusBadge = (stat: string) => {
    switch (stat) {
      case 'PENDING_APPROVAL': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'RESERVED': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'WAITING': return 'bg-orange-50 text-orange-705 border-orange-200';
      case 'ARRIVED': return 'bg-emerald-50 text-emerald-700 border-emerald-250';
      case 'COMPLETED': return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'CANCELLED': return 'bg-rose-50 text-rose-600 border-rose-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getTableColorClasses = (status: string) => {
    switch (status) {
      case 'AVAILABLE': 
        return 'border-emerald-250 bg-white hover:border-emerald-400 hover:bg-emerald-50/10 text-emerald-800 shadow-emerald-50/20';
      case 'RESERVED': 
        return 'border-amber-200 bg-amber-50/5 hover:border-amber-400 hover:bg-amber-50/20 text-amber-850 shadow-amber-50/10';
      case 'OCCUPIED': 
        return 'border-sky-200 bg-sky-50/5 hover:border-sky-400 hover:bg-sky-50/20 text-sky-850 shadow-sky-50/10';
      case 'BILLING_PENDING':
      case 'BILLING': 
        return 'border-purple-205 bg-purple-50/5 hover:border-purple-400 hover:bg-purple-50/20 text-purple-800 shadow-purple-50/10';
      case 'CLEANING': 
        return 'border-slate-300 bg-slate-50/40 hover:border-slate-400 hover:bg-slate-50/70 text-slate-505';
      default: 
        return 'border-slate-200 bg-white hover:border-slate-350 text-slate-700';
    }
  };

  const getTableStatusDot = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-emerald-500';
      case 'RESERVED': return 'bg-amber-500';
      case 'OCCUPIED': return 'bg-sky-500';
      case 'BILLING_PENDING':
      case 'BILLING': return 'bg-purple-500';
      case 'CLEANING': return 'bg-slate-400';
      default: return 'bg-slate-300';
    }
  };

  const getTableStatusText = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'Available';
      case 'RESERVED': return 'Reserved';
      case 'OCCUPIED': return 'Occupied';
      case 'BILLING_PENDING':
      case 'BILLING': return 'Billing';
      case 'CLEANING': return 'Cleaning';
      default: return status;
    }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleKpiClick = (cardType: 'available' | 'reserved' | 'occupied' | 'today') => {
    setOnlyAssignedTable(false);
    setSearchQuery('');
    setFilterDate('');
    setFilterDateType('ALL');

    if (cardType === 'available') {
      scrollToSection('interactive-floor-map');
    } else if (cardType === 'reserved') {
      setOnlyAssignedTable(true);
      scrollToSection('reservation-cards-section');
    } else if (cardType === 'occupied') {
      scrollToSection('interactive-floor-map');
    } else if (cardType === 'today') {
      setFilterDateType('TODAY');
      scrollToSection('reservation-cards-section');
    }
  };

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 font-['Inter']">
        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-655 flex items-center justify-center border border-rose-105 shadow-sm animate-bounce">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-extrabold text-slate-805">Access Restricted</h1>
        <p className="text-sm text-slate-500 max-w-sm">
          Waitstaff and Kitchen profiles have restricted view access to table logs. Please contact the administrator.
        </p>
      </div>
    );
  }

  // Active Filters
  const filteredReservations = reservations.filter(res => {
    const matchesSearch = 
      res.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.mobileNumber.includes(searchQuery) ||
      (res.table?.tableNumber && res.table.tableNumber.toLowerCase().includes(searchQuery.toLowerCase()));
      
    const matchesDate = (() => {
      if (filterDateType === 'TODAY') return res.date === todayStr;
      if (filterDateType === 'UPCOMING') return res.date > todayStr;
      return filterDate ? res.date === filterDate : true;
    })();

    const matchesAssigned = onlyAssignedTable ? !!res.tableId : true;

    return matchesSearch && matchesDate && matchesAssigned;
  });

  // Category splits for Right Sidebar summary
  const upcomingArrivals = reservations.filter(res => res.date === todayStr && res.status === 'RESERVED').sort((a, b) => a.time.localeCompare(b.time));
  const walkInQueue = reservations.filter(res => res.status === 'WAITING' && res.source === 'WALK_IN');
  const waitingGuestsList = reservations.filter(res => res.status === 'WAITING' && res.source !== 'WALK_IN');
  const recentCheckIns = reservations.filter(res => res.status === 'ARRIVED');

  // KPI Numbers
  const availableTablesCount = tables.filter(t => t.status === 'AVAILABLE').length;
  const reservedTablesCount = tables.filter(t => t.status === 'RESERVED').length;
  const occupiedTablesCount = tables.filter(t => t.status === 'OCCUPIED' || t.status === 'BILLING_PENDING').length;
  const todayReservationsCount = reservations.filter(r => r.date === todayStr).length;

  // Floor layout Zones
  const mainHallTables = tables.filter(t => ['Table 1', 'Table 2', 'Table 3'].includes(t.tableNumber));
  const vipLoungeTables = tables.filter(t => ['Table 4', 'Table 5'].includes(t.tableNumber));
  const terraceBarTables = tables.filter(t => !['Table 1', 'Table 2', 'Table 3', 'Table 4', 'Table 5'].includes(t.tableNumber));

  // Helper to retrieve active booking details for a table
  const getTableBookingDetails = (tableId: string) => {
    return reservations.find(r => r.tableId === tableId && r.date === todayStr && ['RESERVED', 'ARRIVED'].includes(r.status));
  };

  // Mock waiter assignment
  const getTableWaiter = (tableNumber: string) => {
    const assignments: Record<string, string> = {
      'Table 1': 'Vikram R.',
      'Table 2': 'Anjali S.',
      'Table 3': 'Amit K.',
      'Table 4': 'Rohan M. (VIP)',
      'Table 5': 'Priya D. (VIP)',
      'Table 6': 'Karan P.'
    };
    return assignments[tableNumber] || 'Self-Service QR';
  };

  // Mock orders for occupied/billing tables
  const getTableActiveOrder = (tableNumber: string) => {
    if (tableNumber === 'Table 4') {
      return { total: 1040 };
    }
    if (tableNumber === 'Table 5') {
      return { total: 820 };
    }
    return { total: 480 };
  };

  return (
    <div className="space-y-6 text-left font-['Inter',_sans-serif] antialiased select-none">
      
      {/* 2. PAGE HEADER - EXACTLY ALIGNED WITH RESTAURANT MODULE */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3.5 text-left">
          <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-655 font-extrabold text-base">
            🛎️
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
              Reservation & Desk Operations
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-0.5">
              Morning Shift • Host Desk • {currentTime.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' })}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Search bar */}
          <div className="relative flex-grow sm:flex-grow-0 sm:w-60">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search reservations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-350 bg-slate-50/50 font-semibold text-slate-800 placeholder-slate-400 transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={fetchReservationsAndTables}
            title="Refresh logs"
            className="p-2 bg-white hover:bg-slate-50 text-slate-655 border border-slate-200 rounded-xl transition-all cursor-pointer shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => alert('Exporting reservation worksheet (CSV)...')}
            className="p-2 bg-white hover:bg-slate-50 text-slate-655 border border-slate-200 rounded-xl transition-all cursor-pointer shadow-sm"
          >
            <FileDown className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowWalkInModal(true)}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold py-2 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer text-xs"
          >
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <span>New Walk-in</span>
          </button>
          
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-600/10 cursor-pointer text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Booking</span>
          </button>
        </div>
      </div>

      {/* 3. KPI CARDS - MATCHING RESTAURANT DASHBOARD EXACTLY */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { 
            label: "Available Tables", 
            count: `${availableTablesCount} Tables`, 
            icon: Utensils, 
            color: 'bg-emerald-50 text-emerald-600',
            desc: "Ready for seating",
            onClick: () => handleKpiClick('available')
          },
          { 
            label: "Reserved Tables", 
            count: `${reservedTablesCount} Tables`, 
            icon: Calendar, 
            color: 'bg-amber-50 text-amber-600',
            desc: "Booked today",
            onClick: () => handleKpiClick('reserved')
          },
          { 
            label: "Occupied Tables", 
            count: `${occupiedTablesCount} Tables`, 
            icon: Coffee, 
            color: 'bg-blue-50 text-blue-600',
            desc: "Dining sessions live",
            onClick: () => handleKpiClick('occupied')
          },
          { 
            label: "Today's Reservations", 
            count: `${todayReservationsCount} Bookings`, 
            icon: Clock, 
            color: 'bg-slate-100 text-slate-600',
            desc: "Total roster listings",
            onClick: () => handleKpiClick('today')
          }
        ].map((card, idx) => (
          <div 
            key={idx}
            onClick={card.onClick}
            className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md hover:-translate-y-0.5 active:scale-95 cursor-pointer transition-all duration-200"
          >
            <div className="text-left">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">{card.label}</span>
              <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{card.count}</h3>
              <span className="text-slate-500 text-xs font-medium mt-1 block">{card.desc}</span>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${card.color}`}>
              <card.icon className="w-6 h-6" />
            </div>
          </div>
        ))}
      </div>

      {/* MAIN CONTENT GRID - REMOVED OUTER CARD BOXES */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
        
        {/* LEFT MAIN PANELS */}
        <div className="xl:col-span-3 space-y-8">
          
          {/* FLOOR MAP SECTION - NO LARGE CARD BOX CONTAINER */}
          <div id="interactive-floor-map" className="space-y-4 text-left">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2 uppercase tracking-wider">
                  <span>🪑 Floor Layout & Zones</span>
                </h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Live layout of dining zones. Select any table to update status or view bookings.
                </p>
              </div>

              {/* Status Legend */}
              <div className="flex flex-wrap gap-2.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span>Available</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span>Reserved</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                  <span>Occupied</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                  <span>Billing</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                  <span>Cleaning</span>
                </span>
              </div>
            </div>

            {/* ZONES */}
            <div className="space-y-6 pt-2">
              
              {/* ZONE A */}
              <div className="space-y-3 text-left">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block bg-slate-50 px-3 py-1 rounded-lg border border-slate-100 w-fit">
                  📍 Zone A: Main Dining Hall
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {mainHallTables.map(table => {
                    const booking = getTableBookingDetails(table.id);
                    const occupied = table.status === 'OCCUPIED' || table.status === 'BILLING_PENDING';
                    return (
                      <div
                        key={table.id}
                        className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between h-[210px] w-full text-left"
                      >
                        {/* Top: No & Dot Indicator */}
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-base font-extrabold text-slate-800">{table.tableNumber}</span>
                            <span className="text-[10px] text-slate-500 font-bold bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-lg ml-2">
                              👤 {table.capacity} Seats
                            </span>
                          </div>
                          <span className="relative flex h-2.5 w-2.5 mt-1.5">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${getTableStatusDot(table.status)}`}></span>
                            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${getTableStatusDot(table.status)}`}></span>
                          </span>
                        </div>

                        {/* Middle body */}
                        <div className="space-y-1.5 py-2">
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border uppercase tracking-wider block w-fit ${getTableColorClasses(table.status).split(' ').slice(0, 3).join(' ')}`}>
                            {getTableStatusText(table.status)}
                          </span>
                          
                          <div className="text-[11px] font-semibold text-slate-500 space-y-0.5">
                            <p>🤵 Waiter: {getTableWaiter(table.tableNumber)}</p>
                            
                            {occupied && (
                              <>
                                <p className="text-slate-800 font-bold">👤 Guest: {booking?.customerName || 'Walk-in'}</p>
                                <p className="text-emerald-600 font-bold">₹ Bill: ₹{getTableActiveOrder(table.tableNumber).total}.00</p>
                              </>
                            )}

                            {table.status === 'RESERVED' && booking && (
                              <p className="text-amber-600 font-bold">⏰ Booking: {booking.time} ({booking.customerName})</p>
                            )}
                          </div>
                        </div>

                        {/* Bottom Actions */}
                        <div className="border-t border-slate-100 pt-3 flex gap-2">
                          <button
                            onClick={() => setDrawerTable(table)}
                            className="flex-1 bg-slate-800 hover:bg-slate-900 text-white font-bold py-1.5 px-3 rounded-xl text-[10px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                          >
                            View Details
                          </button>
                          {table.status === 'AVAILABLE' && (
                            <button
                              onClick={() => navigate(`/restaurant/take-order?tableId=${table.id}`)}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-3 rounded-xl text-[10px] transition-colors cursor-pointer"
                            >
                              Take Order
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ZONE B */}
              <div className="space-y-3 text-left">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block bg-slate-50 px-3 py-1 rounded-lg border border-slate-100 w-fit">
                  ⭐ Zone B: VIP Lounge & Booths
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {vipLoungeTables.map(table => {
                    const booking = getTableBookingDetails(table.id);
                    const occupied = table.status === 'OCCUPIED' || table.status === 'BILLING_PENDING';
                    return (
                      <div
                        key={table.id}
                        className="bg-white p-4 rounded-2xl border-2 border-double border-amber-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between h-[210px] w-full text-left"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-base font-extrabold text-slate-850">👑 {table.tableNumber}</span>
                            <span className="text-[10px] text-slate-500 font-bold bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-lg ml-2">
                              👤 {table.capacity} Seats
                            </span>
                          </div>
                          <span className="relative flex h-2.5 w-2.5 mt-1.5">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${getTableStatusDot(table.status)}`}></span>
                            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${getTableStatusDot(table.status)}`}></span>
                          </span>
                        </div>

                        <div className="space-y-1.5 py-2">
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border uppercase tracking-wider block w-fit ${getTableColorClasses(table.status).split(' ').slice(0, 3).join(' ')}`}>
                            {getTableStatusText(table.status)}
                          </span>
                          
                          <div className="text-[11px] font-semibold text-slate-500 space-y-0.5">
                            <p>🤵 Waiter: {getTableWaiter(table.tableNumber)}</p>
                            
                            {occupied && (
                              <>
                                <p className="text-slate-800 font-bold">👤 Guest: {booking?.customerName || 'Walk-in'}</p>
                                <p className="text-emerald-600 font-bold">₹ Bill: ₹{getTableActiveOrder(table.tableNumber).total}.00</p>
                              </>
                            )}

                            {table.status === 'RESERVED' && booking && (
                              <p className="text-amber-600 font-bold">⏰ Booking: {booking.time} ({booking.customerName})</p>
                            )}
                          </div>
                        </div>

                        <div className="border-t border-slate-100 pt-3 flex gap-2">
                          <button
                            onClick={() => setDrawerTable(table)}
                            className="flex-1 bg-slate-800 hover:bg-slate-900 text-white font-bold py-1.5 px-3 rounded-xl text-[10px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                          >
                            View Details
                          </button>
                          {table.status === 'AVAILABLE' && (
                            <button
                              onClick={() => navigate(`/restaurant/take-order?tableId=${table.id}`)}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-3 rounded-xl text-[10px] transition-colors cursor-pointer"
                            >
                              Take Order
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ZONE C */}
              <div className="space-y-3 text-left">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block bg-slate-50 px-3 py-1 rounded-lg border border-slate-100 w-fit">
                  🌿 Zone C: Outdoor Terrace & Bar
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {terraceBarTables.length === 0 ? (
                    <div className="col-span-full py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                      No terrace tables configured.
                    </div>
                  ) : (
                    terraceBarTables.map(table => {
                      const booking = getTableBookingDetails(table.id);
                      const occupied = table.status === 'OCCUPIED' || table.status === 'BILLING_PENDING';
                      return (
                        <div
                          key={table.id}
                          className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between h-[210px] w-full text-left"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-base font-extrabold text-slate-800">{table.tableNumber}</span>
                              <span className="text-[10px] text-slate-500 font-bold bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-lg ml-2">
                                👤 {table.capacity} Seats
                              </span>
                            </div>
                            <span className="relative flex h-2.5 w-2.5 mt-1.5">
                              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${getTableStatusDot(table.status)}`}></span>
                              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${getTableStatusDot(table.status)}`}></span>
                            </span>
                          </div>

                          <div className="space-y-1.5 py-2">
                            <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border uppercase tracking-wider block w-fit ${getTableColorClasses(table.status).split(' ').slice(0, 3).join(' ')}`}>
                              {getTableStatusText(table.status)}
                            </span>
                            
                            <div className="text-[11px] font-semibold text-slate-500 space-y-0.5">
                              <p>🤵 Waiter: {getTableWaiter(table.tableNumber)}</p>
                              
                              {occupied && (
                                <>
                                  <p className="text-slate-800 font-bold">👤 Guest: {booking?.customerName || 'Walk-in'}</p>
                                  <p className="text-emerald-600 font-bold">₹ Bill: ₹{getTableActiveOrder(table.tableNumber).total}.00</p>
                                </>
                              )}

                              {table.status === 'RESERVED' && booking && (
                                <p className="text-amber-600 font-bold">⏰ Booking: {booking.time} ({booking.customerName})</p>
                              )}
                            </div>
                          </div>

                          <div className="border-t border-slate-100 pt-3 flex gap-2">
                            <button
                              onClick={() => setDrawerTable(table)}
                              className="flex-1 bg-slate-800 hover:bg-slate-900 text-white font-bold py-1.5 px-3 rounded-xl text-[10px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                            >
                              View Details
                            </button>
                            {table.status === 'AVAILABLE' && (
                              <button
                                onClick={() => navigate(`/restaurant/take-order?tableId=${table.id}`)}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-3 rounded-xl text-[10px] transition-colors cursor-pointer"
                              >
                                Take Order
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* RESERVATION LIST - CONVERTED TO PREMIUM ROW LAYOUT WITH MINIMAL BORDERS */}
          <div id="reservation-cards-section" className="space-y-4 text-left pt-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-extrabold text-slate-800 tracking-wider uppercase">
                  📋 Today's Reservations
                </h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  List of booked reservations, pending approvals, and active waitlists.
                </p>
              </div>
              <span className="text-xs font-bold text-slate-500 bg-slate-50 border border-slate-100 px-3 py-1 rounded-lg">
                {filteredReservations.length} RECORDS
              </span>
            </div>

            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-16 bg-slate-50/50 border border-slate-100 rounded-xl animate-pulse"></div>
                ))}
              </div>
            ) : filteredReservations.length === 0 ? (
              <div className="py-12 text-center text-slate-400 font-medium text-xs border border-dashed border-slate-200 rounded-2xl">
                No active bookings found matching query.
              </div>
            ) : (
              <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-100 shadow-sm">
                {filteredReservations.map(res => {
                  const initials = res.customerName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
                  return (
                    <div 
                      key={res.id} 
                      className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/40 transition-colors"
                    >
                      {/* Customer core info */}
                      <div className="flex items-center gap-3.5 min-w-[200px]">
                        <div className="w-9 h-9 rounded-full bg-slate-50 border border-slate-150 flex items-center justify-center font-extrabold text-slate-655 text-xs shrink-0 shadow-inner">
                          {initials || <User className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <span className="font-extrabold text-slate-800 text-sm block leading-tight">{res.customerName}</span>
                          <span className="text-[11px] text-slate-400 font-semibold block mt-0.5 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{res.mobileNumber}</span>
                          </span>
                        </div>
                      </div>

                      {/* Details row */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1 text-left">
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Arrival Slot</span>
                          <span className="text-xs font-semibold text-slate-705">{res.date} @ {res.time}</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Covers</span>
                          <span className="text-xs font-semibold text-slate-700">{res.guests} covers</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Table Assigned</span>
                          <span className="text-xs font-bold text-slate-800 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-lg w-fit block">
                            {res.table?.tableNumber || 'Unassigned'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Roster Status</span>
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border uppercase tracking-wider block w-fit ${getStatusBadge(res.status)}`}>
                            {res.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      {/* Quick notes */}
                      {res.notes && (
                        <div className="lg:max-w-xs text-left px-2 leading-relaxed border-l-2 border-slate-200 text-[11px] italic text-slate-400">
                          "{res.notes}"
                        </div>
                      )}

                      {/* Operations actions */}
                      <div className="flex items-center gap-2 shrink-0 border-t border-slate-100 lg:border-t-0 pt-3 lg:pt-0">
                        <button
                          onClick={() => {
                            setHistoryCustomer({ name: res.customerName, mobile: res.mobileNumber });
                            setShowHistoryModal(true);
                          }}
                          className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline px-2 py-1 cursor-pointer"
                        >
                          CRM Logs
                        </button>

                        <div className="flex gap-1.5 ml-2">
                          {res.status === 'PENDING_APPROVAL' && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(res.id, 'RESERVED')}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-1.5 px-3 rounded-xl text-[10px] shadow-sm transition-colors cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => openEditModal(res)}
                                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-extrabold py-1.5 px-3 rounded-xl text-[10px] transition-colors cursor-pointer"
                              >
                                Assign Table
                              </button>
                            </>
                          )}

                          {res.status === 'RESERVED' && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(res.id, 'ARRIVED')}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-1.5 px-3.5 rounded-xl text-[10px] shadow-md shadow-emerald-600/10 transition-all cursor-pointer"
                              >
                                Arrived
                              </button>
                              <button
                                onClick={() => openEditModal(res)}
                                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-extrabold py-1.5 px-2.5 rounded-xl text-[10px] transition-all cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(res.id, 'CANCELLED')}
                                className="bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 font-extrabold py-1.5 px-2.5 rounded-xl text-[10px] transition-all cursor-pointer"
                              >
                                Cancel
                              </button>
                            </>
                          )}

                          {res.status === 'ARRIVED' && (
                            <button
                              onClick={() => handleUpdateStatus(res.id, 'COMPLETED')}
                              className="bg-slate-700 hover:bg-slate-800 text-white font-extrabold py-1.5 px-3 rounded-xl text-[10px] transition-all cursor-pointer"
                            >
                              Complete
                            </button>
                          )}

                          {res.status === 'WAITING' && (
                            <>
                              <button
                                onClick={() => openEditModal(res)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-1.5 px-3 rounded-xl text-[10px] shadow-md shadow-emerald-600/10 transition-all cursor-pointer"
                              >
                                Seat Table
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(res.id, 'CANCELLED')}
                                className="bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 font-extrabold py-1.5 px-2.5 rounded-xl text-[10px] transition-all cursor-pointer"
                              >
                                Dismiss
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT SIDE PANEL - REMOVED OVERSIZED CARD BOX WRAPPERS */}
        <div className="xl:col-span-1 space-y-8 text-left">
          
          <div className="space-y-5">
            <div className="pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">
                📋 Host Roster Logs
              </h3>
            </div>

            {/* UPCOMING ARRIVALS */}
            <div className="space-y-2">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                ⏳ Upcoming Arrivals ({upcomingArrivals.length})
              </span>
              {upcomingArrivals.length === 0 ? (
                <p className="text-[10px] text-slate-400 font-medium italic pl-1">No upcoming arrivals rostered.</p>
              ) : (
                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                  {upcomingArrivals.slice(0, 4).map(arr => (
                    <div key={arr.id} className="p-2.5 border border-slate-100 bg-white rounded-xl flex items-center justify-between text-xs hover:bg-slate-50 transition-colors shadow-sm">
                      <div className="text-left">
                        <span className="font-extrabold text-slate-805 block text-[11px] leading-tight">{arr.customerName}</span>
                        <span className="text-[9px] font-bold text-slate-400 block mt-0.5">👤 {arr.guests} guests • Table {arr.table?.tableNumber || 'Unassigned'}</span>
                      </div>
                      <span className="font-bold text-slate-700 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded text-[10px] font-mono shrink-0">
                        {arr.time}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* WALK-IN QUEUE */}
            <div className="space-y-2">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                🚶 Walk-in Queue ({walkInQueue.length})
              </span>
              {walkInQueue.length === 0 ? (
                <p className="text-[10px] text-slate-400 font-medium italic pl-1">No guests in walk-in queue.</p>
              ) : (
                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                  {walkInQueue.slice(0, 4).map(wq => (
                    <div key={wq.id} className="p-2.5 border border-slate-100 bg-white rounded-xl flex items-center justify-between text-xs hover:bg-slate-50 transition-colors shadow-sm">
                      <div className="text-left flex-1">
                        <span className="font-extrabold text-slate-800 block text-[11px] leading-tight">{wq.customerName}</span>
                        <span className="text-[9px] font-bold text-slate-450 block mt-0.5">Covers: {wq.guests} • {wq.mobileNumber || "No contact"}</span>
                      </div>
                      <button
                        onClick={() => openEditModal(wq)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-1 px-2 rounded-lg text-[9px] shadow-sm shrink-0 cursor-pointer"
                      >
                        Seat
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* WAITING LIST GUESTS */}
            <div className="space-y-2">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                🛎️ Waiting List ({waitingGuestsList.length})
              </span>
              {waitingGuestsList.length === 0 ? (
                <p className="text-[10px] text-slate-400 font-medium italic pl-1">No guests on waiting list.</p>
              ) : (
                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                  {waitingGuestsList.slice(0, 4).map(wg => (
                    <div key={wg.id} className="p-2.5 border border-slate-100 bg-white rounded-xl flex items-center justify-between text-xs hover:bg-slate-50 transition-colors shadow-sm">
                      <div className="text-left flex-1">
                        <span className="font-extrabold text-slate-800 block text-[11px] leading-tight">{wg.customerName}</span>
                        <span className="text-[9px] font-bold text-slate-450 block mt-0.5">Covers: {wg.guests} • Time: {wg.time}</span>
                      </div>
                      <button
                        onClick={() => openEditModal(wg)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-1 px-2 rounded-lg text-[9px] shadow-sm shrink-0 cursor-pointer"
                      >
                        Seat
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* RECENT CHECK-INS */}
            <div className="space-y-2">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                ✅ Recent Seated ({recentCheckIns.length})
              </span>
              {recentCheckIns.length === 0 ? (
                <p className="text-[10px] text-slate-400 font-medium italic pl-1">No checked-in tables currently.</p>
              ) : (
                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                  {recentCheckIns.slice(0, 4).map(rci => (
                    <div key={rci.id} className="p-2.5 border border-emerald-100 bg-emerald-50/10 rounded-xl flex items-center justify-between text-xs hover:bg-emerald-50/20 transition-all shadow-sm">
                      <div className="text-left">
                        <span className="font-extrabold text-slate-800 block text-[11px] leading-tight">{rci.customerName}</span>
                        <span className="text-[9px] font-bold text-emerald-700 block mt-0.5">Seated at {rci.table?.tableNumber || 'N/A'}</span>
                      </div>
                      <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full border border-emerald-200 uppercase">Seated</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white p-5 rounded-2xl shadow-md text-left space-y-3 relative overflow-hidden">
            <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4">
              <Utensils className="w-36 h-36" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider block">Host Desk tip</span>
              <h4 className="text-xs font-bold leading-tight">Fast Allocations</h4>
            </div>
            <p className="text-[10px] text-slate-300 leading-relaxed font-medium">
              Sanitize cleaning tables rapidly to reduce check-in delays for waiting walk-in queue.
            </p>
            <div className="pt-1">
              <button
                onClick={() => navigate('/restaurant/dashboard')}
                className="bg-white/10 hover:bg-white/15 text-white font-extrabold px-3 py-1.5 rounded-lg text-[9px] flex items-center gap-1 transition-all cursor-pointer"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* CRM DETAILS SIDE DRAWER */}
      {drawerTable && (
        <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
          <div 
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setDrawerTable(null)}
          />

          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between border-l border-slate-200 transition-all duration-300 transform translate-x-0 relative animate-slide-in font-['Inter']">
              
              <div className="p-5 border-b border-slate-100 flex items-center justify-between text-left">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🪑</span>
                    <h3 className="text-base font-extrabold text-slate-800 tracking-tight">{drawerTable.tableNumber} details</h3>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Operational control drawer</span>
                </div>
                <button
                  onClick={() => setDrawerTable(null)}
                  className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-650 rounded-xl transition-all cursor-pointer border border-slate-150"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6 text-left">
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-150">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Dining Status</span>
                    <span className="text-xs font-extrabold text-slate-850 block mt-1 flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${getTableStatusDot(drawerTable.status)}`}></span>
                      <span>{getTableStatusText(drawerTable.status)}</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Capacity</span>
                    <span className="text-xs font-extrabold text-slate-800 block mt-1">👤 {drawerTable.capacity} Seats</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Assigned Captain</span>
                  <div className="flex items-center gap-3 p-3 bg-white border border-slate-200/80 rounded-xl">
                    <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-extrabold text-slate-550 shrink-0">
                      🤵
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <span className="font-extrabold text-slate-800 text-xs block leading-tight">{getTableWaiter(drawerTable.tableNumber)}</span>
                      <span className="text-[9px] font-bold text-slate-450 block mt-0.5">Floor Captain Assigned</span>
                    </div>
                  </div>
                </div>

                {(() => {
                  const booking = getTableBookingDetails(drawerTable.id);
                  if (!booking) return null;
                  return (
                    <div className="space-y-2 bg-amber-50/15 border border-amber-200 p-4 rounded-xl">
                      <span className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider block">📅 Table Reservation Details</span>
                      <div className="space-y-1.5 text-xs text-slate-700 font-semibold pt-1">
                        <p><span className="text-slate-400">Customer:</span> {booking.customerName}</p>
                        <p><span className="text-slate-400">Contact:</span> {booking.mobileNumber}</p>
                        <p><span className="text-slate-400">Arrival Slot:</span> {booking.date} @ {booking.time}</p>
                        <p><span className="text-slate-400">Covers:</span> {booking.guests} Guests</p>
                        {booking.notes && (
                          <p className="italic text-[10px] text-slate-555 mt-2 bg-white/70 p-2 rounded border border-amber-100">
                            "{booking.notes}"
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {(drawerTable.status === 'OCCUPIED' || drawerTable.status === 'BILLING_PENDING') && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Current Session subtotal</span>
                    <div className="bg-white border border-slate-200 rounded-xl p-3 flex justify-between items-center text-xs font-semibold text-slate-600">
                      <span className="font-extrabold text-slate-800">Total Bill Amount</span>
                      <span className="text-emerald-700 font-extrabold">₹{getTableActiveOrder(drawerTable.tableNumber).total}.00</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="p-4 border-t border-slate-100 space-y-3 bg-slate-50 text-left">
                {(() => {
                  const booking = getTableBookingDetails(drawerTable.id);
                  if (drawerTable.status === 'RESERVED' && booking) {
                    return (
                      <button
                        onClick={() => handleUpdateStatus(booking.id, 'ARRIVED')}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2.5 px-4 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>Check-In Arrived Customer</span>
                      </button>
                    );
                  }
                  return (
                    <button
                      onClick={() => navigate(`/restaurant/take-order?tableId=${drawerTable.id}`)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2.5 px-4 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Take POS Order</span>
                    </button>
                  );
                })()}

                <div className="pt-2 border-t border-slate-200">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Toggle Table Status</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {['AVAILABLE', 'RESERVED', 'OCCUPIED', 'BILLING_PENDING', 'CLEANING'].map(st => (
                      <button
                        key={st}
                        onClick={() => handleUpdateTableStatusDirect(drawerTable.id, st)}
                        className={`py-1.5 px-2 rounded-xl text-[9px] font-extrabold transition-all border ${
                          drawerTable.status === st 
                            ? 'bg-slate-700 border-slate-700 text-white shadow-sm'
                            : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        {getTableStatusText(st)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      alert(`Printing Menu QR Label for ${drawerTable.tableNumber}`);
                    }}
                    className="flex-1 bg-white hover:bg-slate-50 text-slate-705 border border-slate-200 font-extrabold py-2 rounded-xl text-[10px] text-center transition-colors cursor-pointer"
                  >
                    Menu QR
                  </button>
                  <button
                    onClick={() => setDrawerTable(null)}
                    className="flex-1 bg-slate-200 hover:bg-slate-250 text-slate-750 font-extrabold py-2 rounded-xl text-[10px] text-center transition-colors cursor-pointer"
                  >
                    Dismiss Panel
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* --- ADD RESERVATION MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 p-6 animate-fade-in text-left">
            <h3 className="font-extrabold text-slate-800 text-base mb-4 flex items-center gap-1.5">
              <span>📅</span> New Table Reservation
            </h3>
            <form onSubmit={handleCreateReservation} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Customer Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Robert Dow"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-emerald-600 bg-slate-50/50 font-semibold text-slate-850"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Mobile Contact</label>
                <input
                  type="text"
                  required
                  placeholder="9888554422"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-emerald-600 bg-slate-50/50 font-semibold text-slate-855"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={resDate}
                    onChange={(e) => setResDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[10px] focus:outline-none focus:border-emerald-600 bg-slate-50/50 font-semibold text-slate-800 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Time</label>
                  <input
                    type="time"
                    required
                    value={resTime}
                    onChange={(e) => setResTime(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[10px] focus:outline-none focus:border-emerald-600 bg-slate-50/50 font-semibold text-slate-800 cursor-pointer"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Guests</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-600 bg-slate-50/50 font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Assign Table</label>
                  <select
                    value={tableId}
                    onChange={(e) => setTableId(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[10px] focus:outline-none focus:border-emerald-600 bg-slate-50/50 font-semibold cursor-pointer text-slate-800"
                  >
                    <option value="">-- Waiting List --</option>
                    {tables.map(t => (
                      <option key={t.id} value={t.id}>{t.tableNumber} (Cap: {t.capacity})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Channel Source</label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-emerald-600 bg-slate-50/50 font-semibold cursor-pointer text-slate-800"
                >
                  <option value="RECEPTION">🛎️ Walk-in desk</option>
                  <option value="WEBSITE">💻 Direct Website</option>
                  <option value="PHONE">📞 Phone reservation</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Notes / Requests</label>
                <textarea
                  placeholder="e.g. Need highchair, vegan menu preference"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-emerald-600 bg-slate-50/50 font-semibold text-slate-800"
                />
              </div>

              {tableId && resDate && resTime && checkTableConflict(tableId, resDate, resTime) && (
                <div className="bg-red-50 text-red-705 border border-red-200 rounded-xl p-2 flex items-center gap-1.5 text-[10px] font-bold">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Conflict: Selected table is reserved at this slot.</span>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={!!(tableId && resDate && resTime && checkTableConflict(tableId, resDate, resTime))}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2.5 rounded-xl text-xs shadow-lg transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Save Reservation
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bg-slate-100 text-slate-700 font-extrabold px-4 py-2.5 rounded-xl text-xs hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT RESERVATION MODAL --- */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 p-6 animate-fade-in text-left">
            <h3 className="font-extrabold text-slate-800 text-base mb-4 flex items-center gap-1.5">
              <span>📝</span> Edit Reservation
            </h3>
            <form onSubmit={handleEditReservation} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Customer Name</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-emerald-600 bg-slate-50/50 font-semibold text-slate-805"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Mobile Contact</label>
                <input
                  type="text"
                  required
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-emerald-600 bg-slate-50/50 font-semibold text-slate-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={resDate}
                    onChange={(e) => setResDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[10px] focus:outline-none focus:border-emerald-600 bg-slate-50/50 font-semibold text-slate-800 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Time</label>
                  <input
                    type="time"
                    required
                    value={resTime}
                    onChange={(e) => setResTime(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[10px] focus:outline-none focus:border-emerald-600 bg-slate-50/50 font-semibold text-slate-800 cursor-pointer"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Guests</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-600 bg-slate-50/50 font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Table</label>
                  <select
                    value={tableId}
                    onChange={(e) => setTableId(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[10px] focus:outline-none focus:border-emerald-600 bg-slate-50/50 font-semibold cursor-pointer text-slate-800"
                  >
                    <option value="">-- Waiting List (Unassigned) --</option>
                    {tables.map(t => (
                      <option key={t.id} value={t.id}>{t.tableNumber} (Cap: {t.capacity})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Reservation Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-emerald-600 bg-slate-50/50 font-semibold cursor-pointer text-slate-800"
                >
                  <option value="PENDING_APPROVAL">Pending Approval</option>
                  <option value="RESERVED">Reserved</option>
                  <option value="WAITING">Waiting List</option>
                  <option value="ARRIVED">Arrived (Check-In)</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Notes / Requests</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-emerald-600 bg-slate-50/50 font-semibold text-slate-800"
                />
              </div>

              {tableId && resDate && resTime && checkTableConflict(tableId, resDate, resTime, editingId) && (
                <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl p-2 flex items-center gap-1.5 text-[10px] font-bold">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Conflict: Selected table is reserved at this slot.</span>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={!!(tableId && resDate && resTime && checkTableConflict(tableId, resDate, resTime, editingId))}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2.5 rounded-xl text-xs shadow-lg transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Update Reservation
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="bg-slate-100 text-slate-705 font-extrabold px-4 py-2.5 rounded-xl text-xs hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- NEW WALK-IN MODAL --- */}
      {showWalkInModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 p-6 animate-fade-in text-left">
            <h3 className="font-extrabold text-slate-800 text-base mb-1 flex items-center gap-1.5">
              <span>🚶</span> New Walk-in Customer
            </h3>
            <p className="text-[10px] text-slate-400 font-medium mb-4">Assigns available dining tables instantly and launches the KOT cart.</p>
            <form onSubmit={handleCreateWalkIn} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Customer Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Walk-in Guest"
                  value={walkInName}
                  onChange={(e) => setWalkInName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-emerald-600 bg-slate-50/50 font-semibold text-slate-800"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Mobile Contact (Optional)</label>
                <input
                  type="text"
                  placeholder="9888554422"
                  value={walkInMobile}
                  onChange={(e) => setWalkInMobile(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-emerald-600 bg-slate-50/50 font-semibold text-slate-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Guests</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={walkInGuests}
                    onChange={(e) => setWalkInGuests(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-600 bg-slate-50/50 font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Select Available Table</label>
                  <select
                    required
                    value={walkInTableId}
                    onChange={(e) => setWalkInTableId(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[10px] focus:outline-none focus:border-emerald-600 bg-slate-50/50 font-extrabold cursor-pointer text-slate-800"
                  >
                    <option value="">-- Choose Table --</option>
                    {tables
                      .filter(t => t.status === 'AVAILABLE')
                      .map(t => (
                        <option key={t.id} value={t.id}>{t.tableNumber} (Cap: {t.capacity})</option>
                      ))
                    }
                  </select>
                </div>
              </div>

              {tables.filter(t => t.status === 'AVAILABLE').length === 0 && (
                <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl p-3 text-[10px] font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>No dining tables are currently available! Please complete ongoing table bills or wait list.</span>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={!walkInTableId}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2.5 rounded-xl text-xs shadow-lg transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Assign & Open Take Order
                </button>
                <button
                  type="button"
                  onClick={() => setShowWalkInModal(false)}
                  className="bg-slate-100 text-slate-700 font-extrabold px-4 py-2.5 rounded-xl text-xs hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- CUSTOMER VISIT HISTORY MODAL --- */}
      {showHistoryModal && historyCustomer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 animate-fade-in text-left">
            <h3 className="font-extrabold text-slate-800 text-sm mb-1 flex items-center gap-1.5">
              <span>📅</span>
              <span>CRM Visit Profile</span>
            </h3>
            <p className="text-[10px] text-slate-400 font-medium mb-5">Historical records for customer: <span className="text-slate-700 font-bold">{historyCustomer.name} ({historyCustomer.mobile})</span></p>
            
            {(() => {
              const stats = getCustomerHistoryStats(historyCustomer.mobile);
              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-150 text-center">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total Bookings</span>
                      <span className="text-sm font-extrabold text-slate-800 mt-1 block">{stats.total}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Checked In</span>
                      <span className="text-sm font-extrabold text-emerald-600 mt-1 block">{stats.completed}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">No Shows</span>
                      <span className="text-sm font-extrabold text-rose-500 mt-1 block">{stats.cancelled}</span>
                    </div>
                  </div>

                  <div className="bg-emerald-50/50 border border-emerald-100 p-3 rounded-xl flex justify-between items-center text-xs font-bold text-emerald-800">
                    <span>Preferred Table Choice:</span>
                    <span className="bg-white px-2 py-0.5 rounded shadow-sm text-slate-700 border border-emerald-200">{stats.favTable}</span>
                  </div>

                  <div>
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block mb-2">Recent Visits & Bookings</span>
                    <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                      {stats.allBookings.map((b: any) => (
                        <div key={b.id} className="flex justify-between items-center bg-slate-50/50 border border-slate-150 p-2.5 rounded-xl text-xs">
                          <div className="text-left">
                            <span className="font-extrabold text-slate-750">{b.date}</span>
                            <span className="text-slate-400 ml-1.5">{b.time}</span>
                            {b.notes && <span className="block text-[10px] text-slate-450 mt-0.5">"{b.notes}"</span>}
                          </div>
                          <span className={`text-[8px] font-extrabold px-2 py-0.5 rounded-full border uppercase ${getStatusBadge(b.status)}`}>
                            {b.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => setShowHistoryModal(false)}
                      className="bg-slate-100 text-slate-700 font-extrabold px-4 py-2 rounded-xl text-xs hover:bg-slate-202 transition-all cursor-pointer"
                    >
                      Close CRM Card
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

    </div>
  );
};

export default Reservations;

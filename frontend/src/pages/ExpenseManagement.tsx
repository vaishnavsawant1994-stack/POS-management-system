import React, { useEffect, useState } from 'react';
import {
  Plus, Search, Trash2, Edit2, X,
  ChevronRight, Receipt, Calendar, CreditCard, Clock,
  TrendingUp, BarChart2, Download, Upload, Lock, Eye,
  ChefHat, Zap, Brush, Wrench, Megaphone, Package, Truck,
  Briefcase, CircleEllipsis
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line
} from 'recharts';

const BACKEND_URL = 'http://localhost:5000';

interface ExpenseCategory {
  id: string;
  name: string;
  description?: string;
  isCustom: boolean;
}

interface ExpenseReceipt {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
}

interface ExpenseApprovalHistory {
  id: string;
  status: string;
  notes?: string;
  actionDate: string;
  actionByUser: {
    name: string;
    role: string;
  };
}

interface ExpensePaymentDetails {
  id: string;
  paidAt?: string;
  transactionReference?: string;
  paidByUser?: {
    name: string;
    role: string;
  };
}

interface Expense {
  id: string;
  displayId: string;
  title: string;
  amount: number;
  paymentMethod: string;
  expenseDate: string;
  vendor?: string;
  description?: string;
  status: string; // Draft, Pending Approval, Approved, Rejected, Paid
  categoryId: string;
  category: ExpenseCategory;
  createdByUser: {
    name: string;
    role: string;
  };
  receipts: ExpenseReceipt[];
  approvals: ExpenseApprovalHistory[];
  paymentDetails?: ExpensePaymentDetails;
  purchaseOrderId?: string;
  restaurantPurchaseOrderId?: string;
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
    if (r.includes('inventory') || r.includes('keeper')) return 'INVENTORY';
    if (r.includes('cashier') || r.includes('billing')) return 'CASHIER';
    return 'EMPLOYEE';
  }
  return user.role || 'ADMIN';
};

const getCategoryIconComponent = (categoryName: string) => {
  const name = categoryName.toLowerCase();
  if (name.includes('kitchen') || name.includes('veg') || name.includes('food') || name.includes('supply')) {
    return <ChefHat className="w-5 h-5 text-emerald-600 shrink-0" />;
  }
  if (name.includes('utilit') || name.includes('electricity') || name.includes('water') || name.includes('gas') || name.includes('power')) {
    return <Zap className="w-5 h-5 text-amber-500 shrink-0" />;
  }
  if (name.includes('clean') || name.includes('wash') || name.includes('detergent')) {
    return <Brush className="w-5 h-5 text-blue-500 shrink-0" />;
  }
  if (name.includes('mainten') || name.includes('repair') || name.includes('fix') || name.includes('cool')) {
    return <Wrench className="w-5 h-5 text-orange-500 shrink-0" />;
  }
  if (name.includes('packag') || name.includes('box') || name.includes('bag') || name.includes('material')) {
    return <Package className="w-5 h-5 text-amber-700 shrink-0" />;
  }
  if (name.includes('market') || name.includes('ad') || name.includes('promo')) {
    return <Megaphone className="w-5 h-5 text-red-500 shrink-0" />;
  }
  if (name.includes('transport') || name.includes('travel') || name.includes('cab') || name.includes('delivery') || name.includes('bus')) {
    return <Truck className="w-5 h-5 text-indigo-500 shrink-0" />;
  }
  if (name.includes('office') || name.includes('station') || name.includes('paper') || name.includes('pen') || name.includes('write')) {
    return <Briefcase className="w-5 h-5 text-gray-500 shrink-0" />;
  }
  return <CircleEllipsis className="w-5 h-5 text-gray-500 shrink-0" />;
};


const categoryStyles: Record<string, { icon: React.ReactNode, textClass: string, bgClass: string, borderClass: string, barClass: string }> = {
  'kitchen supplies': {
    icon: <ChefHat className="w-5 h-5" />,
    textClass: 'text-green-600',
    bgClass: 'bg-green-50/70',
    borderClass: 'hover:border-green-400 hover:shadow-green-50',
    barClass: 'bg-green-500'
  },
  'utilities': {
    icon: <Zap className="w-5 h-5" />,
    textClass: 'text-amber-500',
    bgClass: 'bg-amber-50/70',
    borderClass: 'hover:border-amber-400 hover:shadow-amber-50',
    barClass: 'bg-amber-500'
  },
  'cleaning supplies': {
    icon: <Brush className="w-5 h-5" />,
    textClass: 'text-blue-500',
    bgClass: 'bg-blue-50/70',
    borderClass: 'hover:border-blue-400 hover:shadow-blue-50',
    barClass: 'bg-blue-500'
  },
  'maintenance': {
    icon: <Wrench className="w-5 h-5" />,
    textClass: 'text-orange-500',
    bgClass: 'bg-orange-50/70',
    borderClass: 'hover:border-orange-400 hover:shadow-orange-50',
    barClass: 'bg-orange-500'
  },
  'marketing': {
    icon: <Megaphone className="w-5 h-5" />,
    textClass: 'text-purple-600',
    bgClass: 'bg-purple-50/70',
    borderClass: 'hover:border-purple-400 hover:shadow-purple-50',
    barClass: 'bg-purple-500'
  },
  'packaging materials': {
    icon: <Package className="w-5 h-5" />,
    textClass: 'text-cyan-500',
    bgClass: 'bg-cyan-50/70',
    borderClass: 'hover:border-cyan-400 hover:shadow-cyan-50',
    barClass: 'bg-cyan-500'
  },
  'transportation': {
    icon: <Truck className="w-5 h-5" />,
    textClass: 'text-indigo-500',
    bgClass: 'bg-indigo-50/70',
    borderClass: 'hover:border-indigo-400 hover:shadow-indigo-50',
    barClass: 'bg-indigo-500'
  },
  'office supplies': {
    icon: <Briefcase className="w-5 h-5" />,
    textClass: 'text-gray-500',
    bgClass: 'bg-gray-50/70',
    borderClass: 'hover:border-gray-400 hover:shadow-gray-50',
    barClass: 'bg-gray-500'
  },
  'miscellaneous': {
    icon: <CircleEllipsis className="w-5 h-5" />,
    textClass: 'text-slate-500',
    bgClass: 'bg-slate-50/70',
    borderClass: 'hover:border-slate-400 hover:shadow-slate-50',
    barClass: 'bg-slate-500'
  }
};

const getCategoryStyle = (catName: string) => {
  const name = catName.toLowerCase();
  return categoryStyles[name] || {
    icon: <CircleEllipsis className="w-5 h-5" />,
    textClass: 'text-slate-500',
    bgClass: 'bg-slate-50/70',
    borderClass: 'hover:border-slate-400 hover:shadow-slate-50',
    barClass: 'bg-slate-500'
  };
};

const getPaymentMethodLabel = (method: string) => {
  const m = method.toLowerCase();
  if (m.includes('cash')) return '💵 Cash';
  if (m.includes('upi')) return '📱 UPI';
  if (m.includes('card')) return '💳 Card';
  if (m.includes('transfer') || m.includes('bank')) return '🏦 Bank Transfer';
  return `💳 ${method}`;
};

export const ExpenseManagement: React.FC = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const role = getEffectiveRole(auth.user);
  const isOwnerAdmin = role === 'ADMIN';

  // Core lists
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [stats, setStats] = useState({
    todayExpenses: 0,
    thisMonthExpenses: 0,
    pendingPayments: 0,
    expenseCategories: 0,
    categoryStats: [] as any[]
  });

  const [reportsData, setReportsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Search & Filters state
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Details drawer & Modals
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editExpenseId, setEditExpenseId] = useState<string | null>(null);

  // Form states
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    categoryId: '',
    vendor: '',
    amount: '',
    paymentMethod: 'Cash',
    expenseDate: new Date().toISOString().split('T')[0],
    billNumber: '',
    receiptImage: '', // base64
    receiptName: '',
    remarks: ''
  });

  const [recordPaymentForm, setRecordPaymentForm] = useState({
    paymentMethod: 'Cash',
    paidAt: new Date().toISOString().split('T')[0],
    transactionReference: '',
    remarks: ''
  });

  // Load basic configurations
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch expenses when filters change
  useEffect(() => {
    fetchExpenses();
    fetchStats();
    fetchReports();
  }, [search, categoryFilter, statusFilter, startDateFilter, endDateFilter, paymentMethodFilter, page]);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (categoryFilter) params.append('category', categoryFilter);
      if (statusFilter) params.append('status', statusFilter);
      if (startDateFilter) params.append('startDate', startDateFilter);
      if (endDateFilter) params.append('endDate', endDateFilter);
      if (paymentMethodFilter) params.append('paymentMethod', paymentMethodFilter);
      
      params.append('page', page.toString());
      params.append('limit', '10');

      const res = await auth.apiRequest(`/expenses?${params.toString()}`);
      if (res && res.expenses) {
        setExpenses(res.expenses);
        setTotalPages(res.pagination.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await auth.apiRequest('/expenses/stats');
      if (res) {
        setStats(res);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await auth.apiRequest('/expenses/categories');
      if (res) {
        setCategories(res);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchReports = async () => {
    try {
      const res = await auth.apiRequest('/expenses/reports');
      if (res) {
        setReportsData(res);
      }
    } catch (error) {
      console.error('Failed to fetch reports data:', error);
    }
  };

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('File size exceeds 2MB limit.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setExpenseForm(prev => ({
          ...prev,
          receiptImage: reader.result as string,
          receiptName: file.name
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.title || !expenseForm.categoryId || !expenseForm.amount || !expenseForm.expenseDate) {
      alert('Please fill out all required fields.');
      return;
    }

    if (isNaN(parseFloat(expenseForm.amount)) || parseFloat(expenseForm.amount) <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    try {
      const descriptionData = JSON.stringify({
        billNumber: expenseForm.billNumber,
        remarks: expenseForm.remarks
      });

      const payload = {
        title: expenseForm.title,
        categoryId: expenseForm.categoryId,
        vendor: expenseForm.vendor,
        amount: parseFloat(expenseForm.amount),
        paymentMethod: expenseForm.paymentMethod,
        expenseDate: expenseForm.expenseDate,
        receiptImage: expenseForm.receiptImage,
        receiptName: expenseForm.receiptName,
        description: descriptionData
      };

      if (isEditMode && editExpenseId) {
        await auth.apiRequest(`/expenses/${editExpenseId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        await auth.apiRequest('/expenses', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }

      setShowAddModal(false);
      resetExpenseForm();
      fetchExpenses();
      fetchStats();
      fetchReports();
    } catch (error: any) {
      alert(error.message || 'Failed to save expense request.');
    }
  };

  const handleEditExpense = (expense: Expense) => {
    if (!isOwnerAdmin && expense.status !== 'Pending Approval' && expense.status !== 'Draft') {
      alert('Managers can only edit pending or draft expenses.');
      return;
    }

    setIsEditMode(true);
    setEditExpenseId(expense.id);

    let parsedBillNumber = '';
    let parsedRemarks = '';
    if (expense.description && expense.description.startsWith('{')) {
      try {
        const parsed = JSON.parse(expense.description);
        parsedBillNumber = parsed.billNumber || '';
        parsedRemarks = parsed.remarks || '';
      } catch (err) {}
    } else {
      parsedRemarks = expense.description || '';
    }

    setExpenseForm({
      title: expense.title,
      categoryId: expense.categoryId,
      vendor: expense.vendor || '',
      amount: expense.amount.toString(),
      paymentMethod: expense.paymentMethod,
      expenseDate: expense.expenseDate.split('T')[0],
      billNumber: parsedBillNumber,
      receiptImage: '',
      receiptName: expense.receipts?.[0]?.fileName || '',
      remarks: parsedRemarks
    });
    setShowAddModal(true);
  };

  const handleDeleteExpense = async (id: string, status: string) => {
    if (!isOwnerAdmin) {
      alert('Permission Denied. Only Restaurant Admin can delete expenses.');
      return;
    }
    if (status === 'Approved' || status === 'Paid') {
      alert('Approved/Paid expenses cannot be deleted to preserve financial audit trail.');
      return;
    }

    if (!window.confirm('Are you sure you want to permanently delete this expense?')) return;
    try {
      await auth.apiRequest(`/expenses/${id}`, {
        method: 'DELETE'
      });
      fetchExpenses();
      fetchStats();
      fetchReports();
      if (selectedExpense?.id === id) {
        setSelectedExpense(null);
      }
    } catch (error: any) {
      alert(error.message || 'Failed to delete expense.');
    }
  };

  const handleApproveExpense = async (id: string) => {
    if (!isOwnerAdmin && role !== 'MANAGER') {
      alert('Only Admin and Managers can approve expenses.');
      return;
    }
    const notes = window.prompt('Add approval notes (optional):');
    if (notes === null) return;
    try {
      await auth.apiRequest(`/expenses/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ notes })
      });
      fetchExpenses();
      fetchStats();
      fetchReports();
      const updatedDetail = await auth.apiRequest(`/expenses/${id}`);
      setSelectedExpense(updatedDetail);
    } catch (error: any) {
      alert(error.message || 'Failed to approve expense.');
    }
  };

  const handleRejectExpense = async (id: string) => {
    if (!isOwnerAdmin && role !== 'MANAGER') {
      alert('Only Admin and Managers can reject expenses.');
      return;
    }
    const notes = window.prompt('Enter rejection reason (required):');
    if (!notes) {
      if (notes === '') alert('Rejection reason is required.');
      return;
    }
    try {
      await auth.apiRequest(`/expenses/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ notes })
      });
      fetchExpenses();
      fetchStats();
      fetchReports();
      const updatedDetail = await auth.apiRequest(`/expenses/${id}`);
      setSelectedExpense(updatedDetail);
    } catch (error: any) {
      alert(error.message || 'Failed to reject expense.');
    }
  };

  const handlePayExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExpense) return;
    try {
      await auth.apiRequest(`/expenses/${selectedExpense.id}/pay`, {
        method: 'POST',
        body: JSON.stringify({
          transactionReference: recordPaymentForm.transactionReference,
          paymentMethod: recordPaymentForm.paymentMethod,
          paidAt: recordPaymentForm.paidAt,
          remarks: recordPaymentForm.remarks
        })
      });
      setShowSettleModal(false);
      setRecordPaymentForm({
        paymentMethod: 'Cash',
        paidAt: new Date().toISOString().split('T')[0],
        transactionReference: '',
        remarks: ''
      });
      fetchExpenses();
      fetchStats();
      fetchReports();
      const updatedDetail = await auth.apiRequest(`/expenses/${selectedExpense.id}`);
      setSelectedExpense(updatedDetail);
    } catch (error: any) {
      alert(error.message || 'Failed to record payment.');
    }
  };

  const handleOpenRecordPayment = (expense: Expense) => {
    setSelectedExpense(expense);
    setRecordPaymentForm({
      paymentMethod: expense.paymentMethod || 'Cash',
      paidAt: new Date().toISOString().split('T')[0],
      transactionReference: '',
      remarks: ''
    });
    setShowSettleModal(true);
  };

  const resetExpenseForm = () => {
    setIsEditMode(false);
    setEditExpenseId(null);
    setExpenseForm({
      title: '',
      categoryId: '',
      vendor: '',
      amount: '',
      paymentMethod: 'Cash',
      expenseDate: new Date().toISOString().split('T')[0],
      billNumber: '',
      receiptImage: '',
      receiptName: '',
      remarks: ''
    });
  };

  // KPI card filtering logic
  const handleKpiClick = (type: 'today' | 'month' | 'pending' | 'kitchen') => {
    if (type === 'today') {
      const todayStr = new Date().toISOString().split('T')[0];
      setStartDateFilter(todayStr);
      setEndDateFilter(todayStr);
      setStatusFilter('');
      setCategoryFilter('');
    } else if (type === 'month') {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      setStartDateFilter(firstDay);
      setEndDateFilter(lastDay);
      setStatusFilter('');
      setCategoryFilter('');
    } else if (type === 'pending') {
      setStatusFilter('Pending Approval');
      setStartDateFilter('');
      setEndDateFilter('');
      setCategoryFilter('');
    } else if (type === 'kitchen') {
      const kitchenCat = categories.find(c => c.name.toLowerCase().includes('kitchen'));
      if (kitchenCat) {
        setCategoryFilter(kitchenCat.id);
        setStatusFilter('');
        setStartDateFilter('');
        setEndDateFilter('');
      }
    }
    setPage(1);
  };

  // Dynamic calculations for Bottom Summary Reports
  const getSummaryStats = () => {
    const activeExpenses = expenses.filter(e => e.status !== 'Rejected');
    const total = activeExpenses.reduce((sum, e) => sum + e.amount, 0);

    const highestExp = activeExpenses.reduce<Expense | null>((acc, curr) => {
      if (!acc || curr.amount > acc.amount) {
        return curr;
      }
      return acc;
    }, null);

    const uniqueDates = new Set(activeExpenses.map(e => e.expenseDate.split('T')[0]));
    const daysCount = uniqueDates.size || 1;
    const avgDaily = total / daysCount;

    const payCounts: Record<string, number> = {};
    activeExpenses.forEach(e => {
      payCounts[e.paymentMethod] = (payCounts[e.paymentMethod] || 0) + 1;
    });
    let mostUsedPay = 'N/A';
    let maxCount = 0;
    Object.entries(payCounts).forEach(([method, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostUsedPay = method;
      }
    });

    const categoryTotals: Record<string, number> = {};
    activeExpenses.forEach(e => {
      if (e.category?.name) {
        categoryTotals[e.category.name] = (categoryTotals[e.category.name] || 0) + e.amount;
      }
    });

    let highestCategoryName = '';
    let highestCategoryAmount = 0;
    Object.entries(categoryTotals).forEach(([name, amt]) => {
      if (amt > highestCategoryAmount) {
        highestCategoryAmount = amt;
        highestCategoryName = name;
      }
    });

    return {
      total,
      highestExp,
      avgDaily,
      mostUsedPay,
      categoryTotals,
      highestCategoryName,
      highestCategoryAmount
    };
  };

  const summary = getSummaryStats();

  const getApprovalStatus = (expense: Expense) => {
    if (expense.status === 'Rejected') {
      return { text: '🔴 Rejected', badge: 'bg-red-50 text-red-600 border-red-200' };
    }
    if (expense.status === 'Pending Approval') {
      return { text: '🟡 Pending Approval', badge: 'bg-orange-50 text-orange-600 border-orange-200' };
    }
    if (expense.status === 'Draft') {
      return { text: '⚪ Draft', badge: 'bg-gray-100 text-gray-700 border-gray-200' };
    }
    return { text: '🟢 Approved', badge: 'bg-green-50 text-green-700 border-green-200' };
  };

  const getPaymentStatus = (expense: Expense) => {
    if (expense.status === 'Paid') {
      return { text: '🟢 Paid', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
    if (expense.status === 'Approved') {
      return { text: '🟡 Pending Payment', badge: 'bg-amber-50 text-amber-600 border-amber-200' };
    }
    if (expense.status === 'Rejected') {
      return { text: '🔴 Cancelled', badge: 'bg-rose-50 text-rose-600 border-rose-200' };
    }
    return { text: '⚪ Not Available', badge: 'bg-gray-50 text-gray-400 border-gray-150' };
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Draft':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'Pending Approval':
      case 'Pending':
        return 'bg-orange-50 text-orange-600 border-orange-200';
      case 'Approved':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'Rejected':
        return 'bg-red-50 text-red-600 border-red-200';
      case 'Paid':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const parseDescriptionField = (descText: string | undefined) => {
    if (!descText) return { billNumber: '', remarks: '' };
    if (descText.startsWith('{')) {
      try {
        const parsed = JSON.parse(descText);
        return {
          billNumber: parsed.billNumber || 'N/A',
          remarks: parsed.remarks || 'N/A'
        };
      } catch (err) {}
    }
    return { billNumber: 'N/A', remarks: descText };
  };

  // KPI Trend Calculations
  const getTodayTrend = () => {
    if (!reportsData || !reportsData.dailyExpenses) return { text: 'Stable vs Yesterday', isPositive: true };
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const todayItem = reportsData.dailyExpenses.find((d: any) => d.date === todayStr);
    const yesterdayItem = reportsData.dailyExpenses.find((d: any) => d.date === yesterdayStr);

    const todayVal = todayItem ? todayItem.amount : 0;
    const yesterdayVal = yesterdayItem ? yesterdayItem.amount : 0;

    const diff = todayVal - yesterdayVal;
    if (diff > 0) {
      return { text: `↑ ₹${diff.toLocaleString('en-IN')} vs Yesterday`, isPositive: true };
    } else if (diff < 0) {
      return { text: `↓ ₹${Math.abs(diff).toLocaleString('en-IN')} vs Yesterday`, isPositive: false };
    }
    return { text: 'Stable vs Yesterday', isPositive: true };
  };

  const getMonthTrend = () => {
    if (!reportsData || !reportsData.monthlyExpenses) return { text: 'Stable vs Last Month', isPositive: true };
    const now = new Date();
    const currentMonthIdx = now.getMonth();
    const prevMonthIdx = currentMonthIdx === 0 ? 11 : currentMonthIdx - 1;

    const currentMonthData = reportsData.monthlyExpenses[currentMonthIdx];
    const prevMonthData = reportsData.monthlyExpenses[prevMonthIdx];

    const currentVal = currentMonthData ? currentMonthData.amount : 0;
    const prevVal = prevMonthData ? prevMonthData.amount : 0;

    const diff = currentVal - prevVal;
    if (diff > 0) {
      return { text: `↑ ₹${diff.toLocaleString('en-IN')} vs Last Month`, isPositive: true };
    } else if (diff < 0) {
      return { text: `↓ ₹${Math.abs(diff).toLocaleString('en-IN')} vs Last Month`, isPositive: false };
    }
    return { text: 'Stable vs Last Month', isPositive: true };
  };

  const todayTrend = getTodayTrend();
  const monthTrend = getMonthTrend();

  const kitchenSuppliesStat = stats.categoryStats?.find(
    (c: any) => c.categoryName.toLowerCase().includes('kitchen')
  );
  const kitchenSuppliesTotal = kitchenSuppliesStat ? kitchenSuppliesStat.todayAmt : 0;
  const kitchenSuppliesBills = kitchenSuppliesStat ? kitchenSuppliesStat.billsCount : 0;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 text-left font-['Outfit',sans-serif] antialiased text-gray-900 p-4 select-none">
      
      {/* Header and Breadcrumbs */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-200 pb-5 gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
            <span className="hover:text-black transition cursor-pointer" onClick={() => navigate('/restaurant')}>Restaurant</span>
            <ChevronRight className="w-3 h-3 text-gray-400" />
            <span className="text-emerald-700 font-semibold">Expense Panel</span>
          </div>
          <h1 className="text-[30px] font-semibold text-black tracking-tight flex items-center gap-2.5">
            <Receipt className="w-8 h-8 text-emerald-600 shrink-0" /> Expense Management
          </h1>
          <p className="text-[14px] text-gray-600 font-normal mt-2 max-w-3xl leading-relaxed">
            Expense Management helps restaurant managers record daily business expenses such as kitchen supplies, utility bills, maintenance, cleaning materials, and operational costs. This allows the restaurant owner to monitor spending and maintain accurate financial records.
          </p>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          {isOwnerAdmin && (
            <button
              onClick={() => {
                if (reportsData) {
                  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(reportsData, null, 2));
                  const downloadAnchor = document.createElement('a');
                  downloadAnchor.setAttribute("href", dataStr);
                  downloadAnchor.setAttribute("download", `Expense_Report_${new Date().toISOString().split('T')[0]}.json`);
                  document.body.appendChild(downloadAnchor);
                  downloadAnchor.click();
                  downloadAnchor.remove();
                } else {
                  alert('Reports data not loaded yet.');
                }
              }}
              className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-semibold h-[36px] px-4 rounded-xl text-[15px] transition-all border border-gray-200 shadow-sm cursor-pointer"
            >
              <Download className="w-4 h-4 text-gray-500" /> Export Reports
            </button>
          )}
          <button
            onClick={() => {
              resetExpenseForm();
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-[36px] px-4 rounded-xl text-[15px] transition-all shadow-sm border border-emerald-600 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Expense
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Today's Expense */}
        <div
          onClick={() => handleKpiClick('today')}
          className="p-4 bg-white rounded-2xl border border-gray-200 transition-all shadow-sm hover:border-gray-400 cursor-pointer flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-[15px] font-medium text-gray-600 block">Today's Expense</span>
            <span className="text-[30px] font-bold text-black block leading-none">
              ₹{stats.todayExpenses.toLocaleString('en-IN')}
            </span>
            <span className={`text-[11px] font-semibold block ${todayTrend.isPositive ? 'text-green-700' : 'text-red-600'}`}>
              {todayTrend.text}
            </span>
          </div>
          <div className="p-3 bg-gray-50 rounded-full shrink-0">
            <Calendar className="w-5 h-5 text-gray-600" />
          </div>
        </div>

        {/* Monthly Expense */}
        <div
          onClick={() => handleKpiClick('month')}
          className="p-4 bg-white rounded-2xl border border-gray-200 transition-all shadow-sm hover:border-gray-400 cursor-pointer flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-[15px] font-medium text-gray-600 block">Monthly Expense</span>
            <span className="text-[30px] font-bold text-black block leading-none">
              ₹{stats.thisMonthExpenses.toLocaleString('en-IN')}
            </span>
            <span className={`text-[11px] font-semibold block ${monthTrend.isPositive ? 'text-green-700' : 'text-red-600'}`}>
              {monthTrend.text}
            </span>
          </div>
          <div className="p-3 bg-gray-50 rounded-full shrink-0">
            <TrendingUp className="w-5 h-5 text-gray-600" />
          </div>
        </div>

        {/* Pending */}
        <div
          onClick={() => handleKpiClick('pending')}
          className="p-4 bg-white rounded-2xl border border-gray-200 transition-all shadow-sm hover:border-gray-400 cursor-pointer flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-[15px] font-medium text-gray-600 block">Pending Approvals</span>
            <span className="text-[30px] font-bold text-black block leading-none">
              {stats.pendingPayments} Bills
            </span>
            <span className="text-[11px] font-semibold text-orange-600 block">
              Requires Action
            </span>
          </div>
          <div className="p-3 bg-gray-50 rounded-full shrink-0">
            <Clock className="w-5 h-5 text-gray-600" />
          </div>
        </div>

        {/* Kitchen Supplies */}
        <div
          onClick={() => handleKpiClick('kitchen')}
          className="p-4 bg-white rounded-2xl border border-gray-200 transition-all shadow-sm hover:border-gray-400 cursor-pointer flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-[15px] font-medium text-gray-600 block">Kitchen Supplies</span>
            <span className="text-[30px] font-bold text-black block leading-none">
              ₹{kitchenSuppliesTotal.toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] font-semibold text-green-700 block">
              {kitchenSuppliesBills} Bills Logged
            </span>
          </div>
          <div className="p-3 bg-gray-50 rounded-full shrink-0">
            <ChefHat className="w-5 h-5 text-gray-600" />
          </div>
        </div>
      </div>

      {/* Expense Categories Section */}
      <div className="space-y-3">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-[15px] font-bold text-black uppercase tracking-wide">Expense Categories</h3>
          <p className="text-[12px] text-gray-500 font-normal">
            Track business spending by category and quickly filter related expenses.
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[
            'Kitchen Supplies', 'Utilities', 'Cleaning Supplies', 'Maintenance',
            'Packaging Materials', 'Marketing', 'Transportation', 'Office Supplies', 'Miscellaneous'
          ].map(catName => {
            const catStatItem = stats.categoryStats?.find(
              (c: any) => c.categoryName.toLowerCase() === catName.toLowerCase()
            );

            const monthlyAmt = catStatItem ? catStatItem.monthlyAmt : 0;
            const billsCount = catStatItem ? catStatItem.billsCount : 0;

            const matchingCatObj = categories.find(c => c.name.toLowerCase() === catName.toLowerCase());
            const isCurrentlyFiltered = matchingCatObj && categoryFilter === matchingCatObj.id;

            const monthlyTotal = stats.thisMonthExpenses || 1;
            const pct = Math.min(100, Math.max(0, Math.round((monthlyAmt / monthlyTotal) * 100)));

            const style = getCategoryStyle(catName);

            return (
              <div
                key={catName}
                onClick={() => {
                  if (matchingCatObj) {
                    if (isCurrentlyFiltered) {
                      setCategoryFilter('');
                    } else {
                      setCategoryFilter(matchingCatObj.id);
                    }
                    setPage(1);
                  }
                }}
                className={`p-4 bg-white border rounded-2xl flex flex-col justify-between transition-all duration-200 cursor-pointer h-[120px] relative select-none ${
                  isCurrentlyFiltered
                    ? 'border-emerald-600 ring-2 ring-emerald-500/10 shadow-md bg-emerald-50/5'
                    : `border-gray-200 hover:shadow-md hover:scale-[1.01] ${style.borderClass}`
                }`}
              >
                {/* Top Row: Icon on left, Amount on right */}
                <div className="flex justify-between items-start">
                  <div className={`p-2.5 rounded-xl ${style.bgClass} ${style.textClass} shrink-0`}>
                    {style.icon}
                  </div>
                  <div className="text-right">
                    <span className="text-[17px] font-bold text-black block leading-tight">
                      ₹{monthlyAmt.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Middle Row: Category Name */}
                <div className="my-1">
                  <span className="text-[15px] font-semibold text-black block truncate whitespace-nowrap">
                    {catName}
                  </span>
                </div>

                {/* Bottom Row: Bills count & Progress Percentage */}
                <div className="flex justify-between items-center text-xs text-gray-500 font-medium">
                  <span>{billsCount} Bills</span>
                  <span className="font-semibold text-black">{pct}%</span>
                </div>

                {/* Thin progress bar indicator */}
                <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mt-1.5">
                  <div className={`h-full rounded-full transition-all duration-300 ${style.barClass}`} style={{ width: `${pct}%` }}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column - Expense List & Filters (col-span-8) */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Universal Search & Simple Filters */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
              
              {/* Search */}
              <div className="relative sm:col-span-2">
                <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search ID, title, vendor..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600 bg-gray-50 text-[15px] font-normal text-black h-[36px]"
                />
              </div>

              {/* Category */}
              <div>
                <select
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full border border-gray-200 rounded-xl px-2.5 bg-gray-50 text-xs font-semibold text-gray-700 cursor-pointer h-[36px]"
                >
                  <option value="">All Categories</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Payment Method */}
              <div>
                <select
                  value={paymentMethodFilter}
                  onChange={(e) => {
                    setPaymentMethodFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full border border-gray-200 rounded-xl px-2.5 bg-gray-50 text-xs font-semibold text-gray-700 cursor-pointer h-[36px]"
                >
                  <option value="">All Payments</option>
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Card">Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full border border-gray-200 rounded-xl px-2.5 bg-gray-50 text-xs font-semibold text-gray-700 cursor-pointer h-[36px]"
                >
                  <option value="">All Statuses</option>
                  <option value="Pending Approval">Pending Approval</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Pending Payment">Pending Payment</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>
            </div>

            {/* Row 2: Date Selector & Clear Option */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-gray-100 mt-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-600">Date Range:</span>
                <input
                  type="date"
                  value={startDateFilter}
                  onChange={(e) => {
                    setStartDateFilter(e.target.value);
                    setPage(1);
                  }}
                  className="border border-gray-200 rounded-xl px-2 py-1 bg-gray-50 text-xs font-semibold text-gray-700 cursor-pointer h-[30px]"
                  title="Start Date"
                />
                <span className="text-xs text-gray-400">to</span>
                <input
                  type="date"
                  value={endDateFilter}
                  onChange={(e) => {
                    setEndDateFilter(e.target.value);
                    setPage(1);
                  }}
                  className="border border-gray-200 rounded-xl px-2 py-1 bg-gray-50 text-xs font-semibold text-gray-700 cursor-pointer h-[30px]"
                  title="End Date"
                />
              </div>

              {(search || categoryFilter || statusFilter || startDateFilter || endDateFilter || paymentMethodFilter) && (
                <button
                  onClick={() => {
                    setSearch('');
                    setCategoryFilter('');
                    setStatusFilter('');
                    setStartDateFilter('');
                    setEndDateFilter('');
                    setPaymentMethodFilter('');
                    setPage(1);
                  }}
                  className="text-xs font-semibold text-red-600 hover:text-red-800 transition flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3 h-3" /> Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Expense List Main Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="py-16 text-center text-gray-500 font-semibold">
                <span>Loading expense records...</span>
              </div>
            ) : expenses.length === 0 ? (
              <div className="py-16 text-center text-gray-500 font-semibold italic">
                No expense transactions found matching the filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-gray-800 text-[15px]">
                  <thead>
                    <tr className="border-b border-gray-200 text-[14px] font-semibold text-gray-700 uppercase tracking-wider bg-gray-50/60">
                      <th className="px-4 py-4 text-left w-[110px]">Expense</th>
                      <th className="px-4 py-4 text-left">Category</th>
                      <th className="px-4 py-4 text-left">Vendor</th>
                      <th className="px-4 py-4 text-left">Payment Method</th>
                      <th className="px-4 py-4 text-left">Amount</th>
                      <th className="px-4 py-4 text-left">Date</th>
                      <th className="px-4 py-4 text-left">Approval</th>
                      <th className="px-4 py-4 text-left">Payment Status</th>
                      <th className="px-4 py-4 text-right w-[150px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-normal text-black">
                    {expenses.map(expense => {
                      const appStatus = getApprovalStatus(expense);
                      const payStatus = getPaymentStatus(expense);
                      return (
                        <tr 
                          key={expense.id} 
                          className="hover:bg-gray-50/50 cursor-pointer transition-colors align-middle h-[56px]"
                          onClick={() => setSelectedExpense(expense)}
                        >
                          <td className="px-4 py-4 font-semibold text-black">
                            <span className="block font-mono text-emerald-800 text-xs">{expense.displayId}</span>
                            <span className="text-sm block truncate max-w-[130px]">{expense.title}</span>
                          </td>
                          <td className="px-4 py-4 text-gray-700">
                            <div className="flex items-center gap-1.5">
                              {getCategoryIconComponent(expense.category?.name || '')}
                              <span>{expense.category?.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-gray-700 truncate max-w-[120px]">{expense.vendor || 'N/A'}</td>
                          <td className="px-4 py-4 text-gray-700 whitespace-nowrap align-middle">
                            <span className="align-middle">{getPaymentMethodLabel(expense.paymentMethod)}</span>
                          </td>
                          <td className="px-4 py-4 font-bold text-green-700">
                            ₹{expense.amount.toLocaleString('en-IN')}
                          </td>
                          <td className="px-4 py-4 text-gray-700 whitespace-nowrap">
                            {new Date(expense.expenseDate).toLocaleDateString('en-IN')}
                          </td>
                          <td className="px-4 py-4 align-middle">
                            <span className={`inline-flex px-2 py-0.5 rounded-full border text-[11px] font-semibold ${appStatus.badge}`}>
                              {appStatus.text}
                            </span>
                          </td>
                          <td className="px-4 py-4 align-middle">
                            <span className={`inline-flex px-2 py-0.5 rounded-full border text-[11px] font-semibold ${payStatus.badge}`}>
                              {payStatus.text}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-end gap-2.5">
                              
                              {/* View Action Button */}
                              <button
                                onClick={() => setSelectedExpense(expense)}
                                className="text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold text-xs transition cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" /> View
                              </button>

                              {/* Record Payment Action Button */}
                              {expense.status === 'Approved' && (
                                <button
                                  onClick={() => handleOpenRecordPayment(expense)}
                                  className="text-emerald-700 hover:text-emerald-900 flex items-center gap-1 font-semibold text-xs transition cursor-pointer"
                                >
                                  <CreditCard className="w-3.5 h-3.5" /> Settle
                                </button>
                              )}

                              {/* Edit Action Button */}
                              {(isOwnerAdmin || expense.status === 'Pending Approval' || expense.status === 'Draft') && (
                                <button
                                  onClick={() => handleEditExpense(expense)}
                                  className="text-orange-600 hover:text-orange-800 flex items-center gap-1 font-semibold text-xs transition cursor-pointer"
                                >
                                  <Edit2 className="w-3.5 h-3.5" /> Edit
                                </button>
                              )}

                              {/* Delete Action Button */}
                              {isOwnerAdmin && (
                                <button
                                  onClick={() => handleDeleteExpense(expense.id, expense.status)}
                                  disabled={expense.status === 'Approved' || expense.status === 'Paid'}
                                  className={`flex items-center gap-1 font-semibold text-xs transition cursor-pointer ${
                                    expense.status === 'Approved' || expense.status === 'Paid'
                                      ? 'text-gray-350 cursor-not-allowed'
                                      : 'text-red-600 hover:text-red-800'
                                  }`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Delete
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
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center px-4 py-3 border-t border-gray-200 bg-gray-50/50">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1 border border-gray-200 hover:bg-gray-50 text-gray-700 h-[30px] px-3 rounded-lg text-xs font-bold disabled:opacity-40 cursor-pointer"
                >
                  Previous
                </button>
                <span className="text-[12px] text-gray-600 font-semibold tracking-wider">Page {page} of {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex items-center gap-1 border border-gray-200 hover:bg-gray-50 text-gray-700 h-[30px] px-3 rounded-lg text-xs font-bold disabled:opacity-40 cursor-pointer"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Recent Expenses Sidebar (col-span-4) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-150 pb-2">
              <h3 className="text-[15px] font-semibold text-black tracking-wide uppercase flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-600" /> Recent Expenses
              </h3>
              <span className="text-[10px] bg-gray-100 text-gray-600 font-bold px-2 py-0.5 rounded-full">Feed</span>
            </div>
            
            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
              {expenses.slice(0, 5).map(e => (
                <div
                  key={e.id}
                  onClick={() => setSelectedExpense(e)}
                  className="p-3.5 bg-gray-50/50 rounded-xl border border-gray-200 hover:border-gray-400 hover:bg-white transition-all cursor-pointer flex justify-between items-start gap-2"
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {getCategoryIconComponent(e.category?.name || '')}
                      <span className="text-xs font-bold text-black truncate block">{e.title}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-semibold text-gray-500">
                      <span>{e.displayId}</span>
                      <span>•</span>
                      <span>{new Date(e.expenseDate).toLocaleDateString('en-IN')}</span>
                    </div>
                  </div>
                  
                  <div className="text-right space-y-1 shrink-0">
                    <span className="text-xs font-bold text-green-700 block">₹{e.amount.toLocaleString('en-IN')}</span>
                    <span className={`inline-flex px-1.5 py-0.2 rounded-full text-[9px] font-semibold border ${getStatusBadgeClass(e.status)}`}>
                      {e.status === 'Pending Approval' ? 'Pending' : e.status}
                    </span>
                  </div>
                </div>
              ))}

              {expenses.length === 0 && (
                <p className="text-gray-500 text-xs italic text-center py-6">No recent entries</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reports Summary Section at the Bottom */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-150 pb-2">
          <h3 className="text-[15px] font-semibold text-black uppercase tracking-wide flex items-center gap-1.5">
            <BarChart2 className="w-4 h-4 text-emerald-600" /> Expense Reports & Audit Summary
          </h3>
          <span className="text-[10px] text-gray-600 font-bold uppercase">Dynamic Cost Metrics</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-left">
          
          {/* Box 1: Total Outflow */}
          <div className="p-4 bg-gray-50/50 border border-gray-200 rounded-xl flex flex-col justify-between h-[90px]">
            <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wide">Total Outflow</span>
            <div>
              <span className="text-[20px] font-bold text-black block">₹{summary.total.toLocaleString('en-IN')}</span>
              <span className="text-[9px] text-gray-600 font-semibold mt-0.5 block">Approved & Pending</span>
            </div>
          </div>

          {/* Box 2: Average Daily Outflow */}
          <div className="p-4 bg-gray-50/50 border border-gray-200 rounded-xl flex flex-col justify-between h-[90px]">
            <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wide">Avg Daily Expense</span>
            <div>
              <span className="text-[20px] font-bold text-black block">₹{Math.round(summary.avgDaily).toLocaleString('en-IN')}</span>
              <span className="text-[9px] text-gray-600 font-semibold mt-0.5 block">Based on logged days</span>
            </div>
          </div>

          {/* Box 3: Most Used Payment Method */}
          <div className="p-4 bg-gray-50/50 border border-gray-200 rounded-xl flex flex-col justify-between h-[90px]">
            <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wide">Top Pay Method</span>
            <div>
              <span className="text-[14px] font-bold text-black block flex items-center gap-1 mt-1">
                {getPaymentMethodLabel(summary.mostUsedPay)}
              </span>
              <span className="text-[9px] text-gray-600 font-semibold mt-1 block">Most frequent settlement</span>
            </div>
          </div>

          {/* Box 4: Highest Expense Entry */}
          <div className="p-4 bg-gray-50/50 border border-gray-200 rounded-xl flex flex-col justify-between h-[90px] md:col-span-2">
            <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wide">Highest Expense Record</span>
            <div>
              {summary.highestExp ? (
                <>
                  <span className="text-[13px] font-semibold text-black truncate block max-w-full leading-tight">
                    {summary.highestExp.title}
                  </span>
                  <span className="text-[14px] font-bold text-green-700 block mt-0.5">
                    ₹{summary.highestExp.amount.toLocaleString('en-IN')}
                    <span className="text-[10px] text-gray-500 font-normal ml-1">({summary.highestExp.displayId})</span>
                  </span>
                </>
              ) : (
                <span className="text-xs text-gray-600 italic block">No records available</span>
              )}
            </div>
          </div>
        </div>

        {/* Category Share Progress Bars */}
        <div className="space-y-2 pt-2">
          <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider block">Category Allocation Share</span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-2.5">
            {Object.entries(summary.categoryTotals).map(([name, amount]) => {
              const pct = summary.total > 0 ? Math.round((amount / summary.total) * 100) : 0;
              return (
                <div key={name} className="space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold text-gray-700">
                    <span className="truncate flex items-center gap-1.5">
                      {getCategoryIconComponent(name)}
                      {name}
                    </span>
                    <span className="text-green-700 font-bold">₹{amount.toLocaleString('en-IN')} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-600 h-full rounded-full transition-all duration-300" style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
            {Object.keys(summary.categoryTotals).length === 0 && (
              <p className="text-gray-500 text-xs italic md:col-span-3">No expenses category statistics available.</p>
            )}
          </div>
        </div>
      </div>

      {/* Owner Financial Analytics Dashboard (Admin Only) */}
      {isOwnerAdmin && reportsData && (
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-150 pb-2">
            <h3 className="text-[15px] font-semibold text-black uppercase tracking-wide flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-600" /> Admin Profit & Expense Analysis
            </h3>
            <span className="text-[10px] bg-gray-100 text-gray-600 font-bold px-2 py-0.5 rounded-full">Owner Dashboard</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Chart 1: Monthly Cost Trend */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider block">Monthly Operating Outflows</span>
              <div className="h-[220px] bg-gray-50/50 rounded-xl p-3 border border-gray-200">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportsData.monthlyExpenses}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Expenses']} />
                    <Bar dataKey="amount" fill="#10b981" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Daily Outflow (Last 30 Days) */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider block">Daily Outflow Trend (Last 30 Days)</span>
              <div className="h-[220px] bg-gray-50/50 rounded-xl p-3 border border-gray-200">
                {reportsData.dailyExpenses?.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-500 text-xs italic">No transaction history in this timeframe</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={reportsData.dailyExpenses}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={9} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Amount']} />
                      <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lock Banner for Managers regarding restricted panels */}
      {!isOwnerAdmin && (
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex items-center justify-between text-xs font-semibold text-gray-600">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-gray-500 shrink-0" />
            <span>Some panels (Profit Analysis, Employee Salaries, Financial Settings) are restricted to the Restaurant Owner (Admin).</span>
          </div>
          <span className="text-[10px] text-gray-500 font-bold uppercase">Restricted Mode</span>
        </div>
      )}

      {/* RIGHT-SIDE EXPENSE DETAILS DRAWER */}
      {selectedExpense && (
        <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
          <div className="absolute inset-0 overflow-hidden">
            
            {/* Drawer Backdrop Overlay */}
            <div
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-xs transition-opacity"
              onClick={() => setSelectedExpense(null)}
            ></div>

            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <div className="pointer-events-auto w-screen max-w-md">
                <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-2xl font-['Outfit',sans-serif]">
                  
                  {/* Header */}
                  <div className="bg-gray-50 px-5 py-5 border-b border-gray-200 flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-semibold text-black uppercase tracking-tight flex items-center gap-1.5">
                        <Receipt className="w-5 h-5 text-emerald-600 animate-pulse" /> {selectedExpense.displayId} Details
                      </h2>
                      <div className="flex gap-1.5 mt-1.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getApprovalStatus(selectedExpense).badge}`}>
                          Approval: {getApprovalStatus(selectedExpense).text.split(' ').slice(1).join(' ')}
                        </span>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getPaymentStatus(selectedExpense).badge}`}>
                          Payment: {getPaymentStatus(selectedExpense).text.split(' ').slice(1).join(' ')}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedExpense(null)}
                      className="rounded-lg p-1.5 text-gray-500 hover:text-black hover:bg-gray-100 transition cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 space-y-6 py-5 px-5 text-xs text-gray-700">
                    
                    {/* Expense Information Card */}
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-3">
                      <div>
                        <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Expense Title</span>
                        <p className="text-[15px] font-bold text-black">{selectedExpense.title}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 border-t border-gray-200 pt-3">
                        <div>
                          <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Amount</span>
                          <p className="text-[20px] font-bold text-green-700">₹{selectedExpense.amount.toLocaleString('en-IN')}</p>
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Expense Date</span>
                          <p className="text-xs font-semibold text-gray-900 mt-1">{new Date(selectedExpense.expenseDate).toLocaleDateString('en-IN')}</p>
                        </div>
                      </div>

                      <div className="border-t border-gray-200 pt-3">
                        <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Description / Remarks</span>
                        <p className="text-xs font-normal text-gray-800 leading-relaxed mt-1">
                          {parseDescriptionField(selectedExpense.description).remarks || 'No description notes provided.'}
                        </p>
                      </div>
                    </div>

                    {/* Metadata Parameters */}
                    <div className="space-y-3.5 border-b border-gray-200 pb-5">
                      
                      {/* Approval Status */}
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500 font-bold uppercase text-[10px] tracking-wider">Approval Status</span>
                        <span className={`font-semibold px-2 py-0.5 rounded-lg border text-[11px] ${getApprovalStatus(selectedExpense).badge}`}>
                          {getApprovalStatus(selectedExpense).text}
                        </span>
                      </div>

                      {/* Payment Status */}
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500 font-bold uppercase text-[10px] tracking-wider">Payment Status</span>
                        <span className={`font-semibold px-2 py-0.5 rounded-lg border text-[11px] ${getPaymentStatus(selectedExpense).badge}`}>
                          {getPaymentStatus(selectedExpense).text}
                        </span>
                      </div>

                      {/* Category */}
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500 font-bold uppercase text-[10px] tracking-wider">Expense Category</span>
                        <span className="font-semibold text-black bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-lg flex items-center gap-1">
                          {getCategoryIconComponent(selectedExpense.category?.name || '')}
                          {selectedExpense.category?.name}
                        </span>
                      </div>

                      {/* Vendor */}
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500 font-bold uppercase text-[10px] tracking-wider">Vendor Details</span>
                        <span className="font-semibold text-black">{selectedExpense.vendor || 'N/A'}</span>
                      </div>

                      {/* Payment Method */}
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500 font-bold uppercase text-[10px] tracking-wider">Payment Method</span>
                        <span className="font-semibold text-black">
                          {getPaymentMethodLabel(selectedExpense.paymentMethod)}
                        </span>
                      </div>

                      {/* Payment Date */}
                      {selectedExpense.status === 'Paid' && selectedExpense.paymentDetails?.paidAt && (
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-500 font-bold uppercase text-[10px] tracking-wider">Payment Date</span>
                          <span className="font-semibold text-black">
                            {new Date(selectedExpense.paymentDetails.paidAt).toLocaleString('en-IN')}
                          </span>
                        </div>
                      )}

                      {/* Paid By */}
                      {selectedExpense.status === 'Paid' && selectedExpense.paymentDetails?.paidByUser && (
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-500 font-bold uppercase text-[10px] tracking-wider">Paid By</span>
                          <span className="font-semibold text-black">
                            {selectedExpense.paymentDetails.paidByUser.name} ({selectedExpense.paymentDetails.paidByUser.role})
                          </span>
                        </div>
                      )}

                      {/* Bill Number */}
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500 font-bold uppercase text-[10px] tracking-wider">Bill Number</span>
                        <span className="font-semibold text-black">{parseDescriptionField(selectedExpense.description).billNumber}</span>
                      </div>

                      {/* Created By */}
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500 font-bold uppercase text-[10px] tracking-wider">Created By</span>
                        <span className="font-semibold text-black">
                          {selectedExpense.createdByUser?.name || 'System'} ({selectedExpense.createdByUser?.role || 'Operator'})
                        </span>
                      </div>
                    </div>

                    {/* Receipt Document Section */}
                    <div className="space-y-2 border-b border-gray-200 pb-5">
                      <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Receipt / Bill Invoice</span>
                      {selectedExpense.receipts && selectedExpense.receipts.length > 0 ? (
                        <div className="border border-gray-200 rounded-xl overflow-hidden p-2.5 bg-gray-50 flex flex-col items-center">
                          <img
                            src={`${BACKEND_URL}${selectedExpense.receipts[0].fileUrl}`}
                            alt="Receipt Doc"
                            className="max-h-[160px] object-contain rounded-lg"
                          />
                          <a
                            href={`${BACKEND_URL}${selectedExpense.receipts[0].fileUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2.5 flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-950 hover:underline cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" /> Download invoice file
                          </a>
                        </div>
                      ) : (
                        <p className="text-gray-500 text-[12px] italic">No receipt document has been uploaded.</p>
                      )}
                    </div>

                    {/* Transaction Reference & Remarks Details */}
                    {selectedExpense.status === 'Paid' && selectedExpense.paymentDetails && (
                      <div className="p-3.5 bg-green-50 border border-green-200 rounded-xl space-y-1.5 text-xs text-green-900 font-medium">
                        <div className="flex justify-between">
                          <span>Transaction Ref:</span>
                          <span className="font-mono">{selectedExpense.paymentDetails.transactionReference || 'N/A'}</span>
                        </div>
                      </div>
                    )}

                    {/* Timeline Log */}
                    <div className="space-y-3 pb-6">
                      <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Workflow Timeline Log</span>
                      {selectedExpense.approvals && selectedExpense.approvals.length > 0 ? (
                        <div className="space-y-4 relative pl-3.5 border-l border-gray-200 mt-2">
                          {selectedExpense.approvals.map((appLog, appIdx) => (
                            <div key={appIdx} className="relative space-y-0.5">
                              <span className="absolute -left-[19.5px] top-1.5 w-2 h-2 rounded-full bg-emerald-600 ring-4 ring-white"></span>
                              <div className="flex justify-between text-[9px] font-bold text-gray-500 uppercase">
                                <span>{appLog.actionByUser?.name} ({appLog.actionByUser?.role})</span>
                                <span>{new Date(appLog.actionDate).toLocaleDateString('en-IN')}</span>
                              </div>
                              <p className="text-black font-semibold text-xs">
                                Status: <span className="text-emerald-700">{appLog.status}</span>
                              </p>
                              {appLog.notes && (
                                <p className="text-[11px] text-gray-600 font-normal italic mt-0.5">"{appLog.notes}"</p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-xs italic">No timeline history recorded.</p>
                      )}
                    </div>
                  </div>

                  {/* Drawer Footer Actions */}
                  <div className="bg-gray-50 px-5 py-5 border-t border-gray-200 flex flex-col gap-2">
                    {selectedExpense.status === 'Pending Approval' && (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleRejectExpense(selectedExpense.id)}
                          className="flex items-center justify-center bg-white hover:bg-red-50 text-red-600 font-semibold h-[36px] rounded-xl text-xs border border-red-200 cursor-pointer shadow-sm"
                        >
                          Reject Request
                        </button>
                        <button
                          onClick={() => handleApproveExpense(selectedExpense.id)}
                          className="flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-[36px] rounded-xl text-xs border border-emerald-600 cursor-pointer shadow-sm"
                        >
                          Approve Request
                        </button>
                      </div>
                    )}

                    {selectedExpense.status === 'Approved' && (
                      <button
                        onClick={() => handleOpenRecordPayment(selectedExpense)}
                        className="w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold h-[36px] rounded-xl text-xs border border-blue-600 cursor-pointer shadow-sm"
                      >
                        <CreditCard className="w-4 h-4" /> Record Payment
                      </button>
                    )}

                    {(isOwnerAdmin || selectedExpense.status === 'Pending Approval' || selectedExpense.status === 'Draft') && (
                      <button
                        onClick={() => {
                          const expToEdit = selectedExpense;
                          setSelectedExpense(null);
                          handleEditExpense(expToEdit);
                        }}
                        className="w-full flex items-center justify-center gap-1.5 bg-white hover:bg-gray-100 text-gray-800 font-semibold h-[34px] rounded-xl text-xs border border-gray-300 transition-all cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit details
                      </button>
                    )}
                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ADD / EDIT EXPENSE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/45 backdrop-blur-xs" onClick={() => setShowAddModal(false)}></div>
          
          <div className="relative bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl font-['Outfit',sans-serif] z-10 space-y-4 max-h-[90vh] overflow-y-auto border border-gray-200">
            <div className="flex justify-between items-center border-b border-gray-150 pb-3.5">
              <h3 className="text-[16px] font-semibold text-black uppercase tracking-tight">
                {isEditMode ? 'Edit Operating Expense' : 'Add New Operating Expense'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1 text-gray-500 hover:text-black transition hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-4 text-xs text-left">
              
              <div>
                <label className="block text-[14px] font-medium text-gray-700 mb-1">Expense Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fresh Milk Purchase"
                  value={expenseForm.title}
                  onChange={e => setExpenseForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full border border-gray-200 h-[36px] rounded-xl text-[15px] px-3 focus:outline-none focus:border-emerald-600 font-normal text-black bg-gray-50/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[14px] font-medium text-gray-700 mb-1">Expense Category *</label>
                  <select
                    required
                    value={expenseForm.categoryId}
                    onChange={e => setExpenseForm(prev => ({ ...prev, categoryId: e.target.value }))}
                    className="w-full border border-gray-200 h-[36px] rounded-xl text-[15px] px-2 focus:outline-none focus:border-emerald-600 font-normal text-gray-700 bg-gray-50/50 cursor-pointer"
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[14px] font-medium text-gray-700 mb-1">Vendor / Supplier Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Amul Distributor"
                    value={expenseForm.vendor}
                    onChange={e => setExpenseForm(prev => ({ ...prev, vendor: e.target.value }))}
                    className="w-full border border-gray-200 h-[36px] rounded-xl text-[15px] px-3 focus:outline-none focus:border-emerald-600 font-normal text-black bg-gray-50/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[14px] font-medium text-gray-700 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="₹ 0.00"
                    value={expenseForm.amount}
                    onChange={e => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full border border-gray-200 h-[36px] rounded-xl text-[15px] px-3 focus:outline-none focus:border-emerald-600 font-normal text-black bg-gray-50/50"
                  />
                </div>
                <div>
                  <label className="block text-[14px] font-medium text-gray-700 mb-1">Expense Date *</label>
                  <input
                    type="date"
                    required
                    value={expenseForm.expenseDate}
                    onChange={e => setExpenseForm(prev => ({ ...prev, expenseDate: e.target.value }))}
                    className="w-full border border-gray-200 h-[36px] rounded-xl text-[15px] px-2 focus:outline-none focus:border-emerald-600 font-normal text-black bg-gray-50/50 cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[14px] font-medium text-gray-700 mb-1">Payment Method</label>
                  <select
                    value={expenseForm.paymentMethod}
                    onChange={e => setExpenseForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    className="w-full border border-gray-200 h-[36px] rounded-xl text-[15px] px-2 focus:outline-none focus:border-emerald-600 font-normal text-gray-750 bg-gray-50/50 cursor-pointer"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Card">Card</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[14px] font-medium text-gray-700 mb-1">Bill Number (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. BILL-99238"
                    value={expenseForm.billNumber}
                    onChange={e => setExpenseForm(prev => ({ ...prev, billNumber: e.target.value }))}
                    className="w-full border border-gray-200 h-[36px] rounded-xl text-[15px] px-3 focus:outline-none focus:border-emerald-600 font-normal text-black bg-gray-50/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[14px] font-medium text-gray-700 mb-1">Receipt Upload (Optional - Max 2MB)</label>
                <div className="relative border border-dashed border-gray-300 rounded-xl px-3 py-3.5 flex flex-col items-center justify-center hover:bg-gray-50 transition cursor-pointer">
                  <Upload className="w-4 h-4 text-gray-400 mb-1" />
                  <span className="text-[11px] font-semibold text-gray-600">
                    {expenseForm.receiptName ? `Selected: ${expenseForm.receiptName}` : 'Upload transaction invoice receipt'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleReceiptChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[14px] font-medium text-gray-700 mb-1">Remarks</label>
                <textarea
                  placeholder="Provide remarks or description notes..."
                  value={expenseForm.remarks}
                  onChange={e => setExpenseForm(prev => ({ ...prev, remarks: e.target.value }))}
                  className="w-full border border-gray-200 p-2.5 rounded-xl text-[15px] focus:outline-none focus:border-emerald-600 font-normal text-black bg-gray-50/50 h-[65px]"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-white hover:bg-gray-50 text-gray-700 font-semibold h-[36px] rounded-xl border border-gray-200 transition-all cursor-pointer text-[15px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-[36px] rounded-xl border border-emerald-600 transition-all cursor-pointer shadow-sm text-[15px]"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD PAYMENT MODAL */}
      {showSettleModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/45 backdrop-blur-xs" onClick={() => setShowSettleModal(false)}></div>
          
          <div className="relative bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl font-['Outfit',sans-serif] z-10 space-y-4 border border-gray-200">
            <div className="flex justify-between items-center border-b border-gray-150 pb-2.5">
              <h3 className="text-sm font-semibold text-black uppercase tracking-tight flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-emerald-600" /> Record Expense Payment
              </h3>
              <button
                onClick={() => setShowSettleModal(false)}
                className="rounded-lg p-1 text-gray-500 hover:text-black transition hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePayExpense} className="space-y-4 text-xs text-left">
              <div>
                <label className="block text-[14px] font-medium text-gray-700 mb-1 font-semibold">Payment Method *</label>
                <select
                  value={recordPaymentForm.paymentMethod}
                  onChange={e => setRecordPaymentForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                  className="w-full border border-gray-200 h-[36px] rounded-xl text-[15px] px-2 focus:outline-none focus:border-emerald-600 font-normal text-gray-750 bg-gray-50/50 cursor-pointer"
                >
                  <option value="Cash">💵 Cash</option>
                  <option value="UPI">📱 UPI</option>
                  <option value="Card">💳 Card</option>
                  <option value="Bank Transfer">🏦 Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-[14px] font-medium text-gray-700 mb-1 font-semibold">Payment Date *</label>
                <input
                  type="date"
                  required
                  value={recordPaymentForm.paidAt}
                  onChange={e => setRecordPaymentForm(prev => ({ ...prev, paidAt: e.target.value }))}
                  className="w-full border border-gray-200 h-[36px] rounded-xl text-[15px] px-3 focus:outline-none focus:border-emerald-600 font-normal text-black bg-gray-50/50 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[14px] font-medium text-gray-700 mb-1">Transaction Reference (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. TXN9410423851"
                  value={recordPaymentForm.transactionReference}
                  onChange={e => setRecordPaymentForm(prev => ({ ...prev, transactionReference: e.target.value }))}
                  className="w-full border border-gray-200 h-[36px] rounded-xl text-[15px] px-3 focus:outline-none focus:border-emerald-600 font-normal text-black bg-gray-50/50"
                />
              </div>

              <div>
                <label className="block text-[14px] font-medium text-gray-700 mb-1">Payment Remarks (Optional)</label>
                <textarea
                  placeholder="Enter any payment settlement remarks..."
                  value={recordPaymentForm.remarks}
                  onChange={e => setRecordPaymentForm(prev => ({ ...prev, remarks: e.target.value }))}
                  className="w-full border border-gray-200 p-2.5 rounded-xl text-[15px] focus:outline-none focus:border-emerald-600 font-normal text-black bg-gray-50/50 h-[65px]"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSettleModal(false)}
                  className="flex-1 bg-white hover:bg-gray-50 text-gray-700 font-semibold h-[36px] rounded-xl border border-gray-200 transition-all cursor-pointer text-[15px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-[36px] rounded-xl border border-emerald-600 transition-all cursor-pointer shadow-sm text-[15px]"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

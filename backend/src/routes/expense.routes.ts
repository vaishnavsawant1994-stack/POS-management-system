import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getExpenses,
  getExpenseStats,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  approveExpense,
  rejectExpense,
  payExpense,
  getExpenseReports,
  getExpenseCategories,
  createExpenseCategory,
  deleteExpenseCategory,
  createExpenseFromPO
} from '../controllers/expense.controller';

const router = Router();

// Apply authentication middleware to all expense routes
router.use(authenticateToken as any);

// Categories
router.get('/categories', getExpenseCategories as any);
router.post('/categories', createExpenseCategory as any);
router.delete('/categories/:id', deleteExpenseCategory as any);

// Statistics & Reports
router.get('/stats', getExpenseStats as any);
router.get('/reports', getExpenseReports as any);

// PO Integration
router.post('/from-po', createExpenseFromPO as any);

// Core CRUD
router.get('/', getExpenses as any);
router.post('/', createExpense as any);
router.get('/:id', getExpenseById as any);
router.put('/:id', updateExpense as any);
router.delete('/:id', deleteExpense as any);

// Approvals & Payments
router.post('/:id/approve', approveExpense as any);
router.post('/:id/reject', rejectExpense as any);
router.post('/:id/pay', payExpense as any);

export default router;

import { Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';
import path from 'path';
import fs from 'fs';

// Helper to seed categories if they don't exist
const DEFAULT_CATEGORIES = [
  'Rent', 'Electricity', 'Water', 'Gas', 'Internet',
  'Staff Meals', 'Kitchen Supplies', 'Cleaning Supplies',
  'Packaging', 'Maintenance', 'Equipment Repair',
  'Marketing', 'Transportation', 'Licenses', 'Miscellaneous'
];

const seedCategoriesAndExpensesIfNeeded = async () => {
  // 1. Categories
  const count = await prisma.expenseCategory.count();
  if (count === 0) {
    const data = DEFAULT_CATEGORIES.map(name => ({
      name,
      description: `Default category for ${name}`,
      isCustom: false
    }));
    await prisma.expenseCategory.createMany({ data });
    console.log('[EXPENSE SEED] Default categories seeded successfully.');
  }

  // Ensure user requested categories exist
  const requiredCategories = [
    'Kitchen Supplies', 'Utilities', 'Cleaning Supplies', 'Maintenance',
    'Packaging Materials', 'Marketing', 'Transportation', 'Office Supplies', 'Miscellaneous'
  ];
  for (const catName of requiredCategories) {
    const existing = await prisma.expenseCategory.findFirst({
      where: { name: { equals: catName, mode: 'insensitive' } }
    });
    if (!existing) {
      await prisma.expenseCategory.create({
        data: {
          name: catName,
          description: `Default category for ${catName}`,
          isCustom: false
        }
      });
    }
  }

  // 2. Expenses
  const expenseCount = await prisma.expense.count();
  if (expenseCount === 0) {
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });
    if (!adminUser) {
      console.log('[EXPENSE SEED] No admin user found yet to associate seeded expenses with.');
      return;
    }
    
    const categories = await prisma.expenseCategory.findMany();
    const getCatId = (name: string) => {
      const found = categories.find(c => c.name.toLowerCase() === name.toLowerCase());
      return found ? found.id : categories[0]?.id;
    };

    // Clean up previous seed to prevent duplicates and ensure correct dummy dataset
    await prisma.expensePaymentDetails.deleteMany();
    await prisma.expenseApprovalHistory.deleteMany();
    await prisma.expenseReceipt.deleteMany();
    await prisma.expense.deleteMany();

    const dummyExpenses = [
      // Kitchen Supplies (12 bills, total 28,450)
      { displayId: 'EXP-1001', title: 'Fresh Vegetables Procurement', categoryName: 'Kitchen Supplies', vendor: 'Green Farm Vegetables', amount: 2350, paymentMethod: 'Cash', status: 'Paid', expenseDate: new Date() },
      { displayId: 'EXP-1002', title: 'Poultry & Meat Supply', categoryName: 'Kitchen Supplies', vendor: 'Quality Meats Ltd', amount: 5000, paymentMethod: 'Card', status: 'Paid', expenseDate: new Date() },
      { displayId: 'EXP-1003', title: 'Dairy & Milk Bulk Purchase', categoryName: 'Kitchen Supplies', vendor: 'Amul Distributor', amount: 4500, paymentMethod: 'UPI', status: 'Paid', expenseDate: new Date() },
      { displayId: 'EXP-1004', title: 'Imported Spices & Seasoning', categoryName: 'Kitchen Supplies', vendor: 'Spices World', amount: 3000, paymentMethod: 'Cash', status: 'Paid', expenseDate: new Date() },
      { displayId: 'EXP-1005', title: 'Basmati Rice Bags', categoryName: 'Kitchen Supplies', vendor: 'Rice Traders', amount: 2000, paymentMethod: 'UPI', status: 'Paid', expenseDate: new Date() },
      { displayId: 'EXP-1006', title: 'Refined Sunflower Oil', categoryName: 'Kitchen Supplies', vendor: 'Oil Corp', amount: 2500, paymentMethod: 'Bank Transfer', status: 'Paid', expenseDate: new Date() },
      { displayId: 'EXP-1007', title: 'Flour & Bakery Raw Materials', categoryName: 'Kitchen Supplies', vendor: 'Flour Mills', amount: 1800, paymentMethod: 'Cash', status: 'Paid', expenseDate: new Date() },
      { displayId: 'EXP-1008', title: 'Premium Sauces & Condiments', categoryName: 'Kitchen Supplies', vendor: 'Global Foods', amount: 1500, paymentMethod: 'UPI', status: 'Paid', expenseDate: new Date() },
      { displayId: 'EXP-1009', title: 'Canned Goods & Purees', categoryName: 'Kitchen Supplies', vendor: 'Canners Inc', amount: 2200, paymentMethod: 'Card', status: 'Paid', expenseDate: new Date() },
      { displayId: 'EXP-1010', title: 'Fresh Exotic Fruits Delivery', categoryName: 'Kitchen Supplies', vendor: 'Fruit Island', amount: 1200, paymentMethod: 'Cash', status: 'Paid', expenseDate: new Date() },
      { displayId: 'EXP-1011', title: 'Kitchen Herbs & Microgreens', categoryName: 'Kitchen Supplies', vendor: 'Urban Greens', amount: 1400, paymentMethod: 'UPI', status: 'Paid', expenseDate: new Date() },
      { displayId: 'EXP-1012', title: 'Emergency Baking Supplies', categoryName: 'Kitchen Supplies', vendor: 'Local Grocery', amount: 1000, paymentMethod: 'Cash', status: 'Paid', expenseDate: new Date() },

      // Utilities (6 bills, total 14,200)
      { displayId: 'EXP-1013', title: 'Electricity Bill Payment', categoryName: 'Utilities', vendor: 'State Electricity Board', amount: 5000, paymentMethod: 'Bank Transfer', status: 'Paid', expenseDate: new Date() },
      { displayId: 'EXP-1014', title: 'Water Tanker Supply', categoryName: 'Utilities', vendor: 'Aqua Carriers', amount: 3000, paymentMethod: 'Cash', status: 'Paid', expenseDate: new Date() },
      { displayId: 'EXP-1015', title: 'LPG Gas Cylinder Refills', categoryName: 'Utilities', vendor: 'Bharat Gas Agency', amount: 2150, paymentMethod: 'UPI', status: 'Paid', expenseDate: new Date() },
      { displayId: 'EXP-1016', title: 'High-speed Fiber Internet', categoryName: 'Utilities', vendor: 'Airtel Business', amount: 1500, paymentMethod: 'UPI', status: 'Paid', expenseDate: new Date() },
      { displayId: 'EXP-1017', title: 'Commercial Waste Disposal', categoryName: 'Utilities', vendor: 'Municipal Cleanliness', amount: 1350, paymentMethod: 'Cash', status: 'Paid', expenseDate: new Date() },
      { displayId: 'EXP-1018', title: 'Telephone Line Rental', categoryName: 'Utilities', vendor: 'BSNL commercial', amount: 1200, paymentMethod: 'Bank Transfer', status: 'Paid', expenseDate: new Date() },

      // Cleaning Supplies (4 bills, total 6,150)
      { displayId: 'EXP-1019', title: 'Industrial Floor Disinfectants', categoryName: 'Cleaning Supplies', vendor: 'CleanPro Store', amount: 3000, paymentMethod: 'Bank Transfer', status: 'Paid', expenseDate: new Date() },
      { displayId: 'EXP-1020', title: 'Dishwasher Detergents & Rinse', categoryName: 'Cleaning Supplies', vendor: 'CleanPro Store', amount: 1500, paymentMethod: 'Card', status: 'Paid', expenseDate: new Date() },
      { displayId: 'EXP-1021', title: 'Restaurant Cleaning Supplies', categoryName: 'Cleaning Supplies', vendor: 'CleanPro Store', amount: 890, paymentMethod: 'Card', status: 'Approved', expenseDate: new Date() },
      { displayId: 'EXP-1022', title: 'Hand Wash & Paper Towels', categoryName: 'Cleaning Supplies', vendor: 'Hygiene Supplies Ltd', amount: 760, paymentMethod: 'Cash', status: 'Paid', expenseDate: new Date() },

      // Maintenance (3 bills, total 9,800)
      { displayId: 'EXP-1023', title: 'Refrigerator Maintenance Repair', categoryName: 'Maintenance', vendor: 'CoolTech Services', amount: 4800, paymentMethod: 'Bank Transfer', status: 'Paid', expenseDate: new Date() },
      { displayId: 'EXP-1024', title: 'Kitchen Exhaust Hood Cleaning', categoryName: 'Maintenance', vendor: 'Ventilation Experts', amount: 3000, paymentMethod: 'Bank Transfer', status: 'Paid', expenseDate: new Date() },
      { displayId: 'EXP-1025', title: 'Plumbing Leaks & Repairs', categoryName: 'Maintenance', vendor: 'PlumbRight', amount: 2000, paymentMethod: 'Cash', status: 'Paid', expenseDate: new Date() },

      // Packaging Materials (5 bills, total 8,250)
      { displayId: 'EXP-1026', title: 'Biodegradable Takeaway Boxes', categoryName: 'Packaging Materials', vendor: 'PackWell Industries', amount: 2500, paymentMethod: 'UPI', status: 'Paid', expenseDate: new Date() },
      { displayId: 'EXP-1027', title: 'Custom Printed Carry Bags', categoryName: 'Packaging Materials', vendor: 'PackWell Industries', amount: 1800, paymentMethod: 'Card', status: 'Paid', expenseDate: new Date() },
      { displayId: 'EXP-1028', title: 'Food Packaging Boxes & Foil', categoryName: 'Packaging Materials', vendor: 'PackWell Industries', amount: 1560, paymentMethod: 'UPI', status: 'Approved', expenseDate: new Date() },
      { displayId: 'EXP-1029', title: 'Paper Straws & Napkins Pack', categoryName: 'Packaging Materials', vendor: 'EcoPack Co', amount: 1200, paymentMethod: 'Cash', status: 'Paid', expenseDate: new Date() },
      { displayId: 'EXP-1030', title: 'Wrapping Sheets & Tape Roll', categoryName: 'Packaging Materials', vendor: 'Stationery Hub', amount: 1190, paymentMethod: 'UPI', status: 'Paid', expenseDate: new Date() },

      // Marketing (2 bills, total 5,600)
      { displayId: 'EXP-1031', title: 'Facebook Advertisement Campaign', categoryName: 'Marketing', vendor: 'Meta Ads Manager', amount: 3000, paymentMethod: 'Card', status: 'Pending Approval', expenseDate: new Date() },
      { displayId: 'EXP-1032', title: 'Flyer Printing & Distribution', categoryName: 'Marketing', vendor: 'PrintMax Agency', amount: 2600, paymentMethod: 'UPI', status: 'Paid', expenseDate: new Date() },

      // Office Supplies (2 bills, total 2,900)
      { displayId: 'EXP-1033', title: 'Printer Cartridges & Paper', categoryName: 'Office Supplies', vendor: 'OfficeMart', amount: 2000, paymentMethod: 'Card', status: 'Paid', expenseDate: new Date() },
      { displayId: 'EXP-1034', title: 'Office Stationery Supplies', categoryName: 'Office Supplies', vendor: 'OfficeMart', amount: 900, paymentMethod: 'Cash', status: 'Approved', expenseDate: new Date() },

      // Miscellaneous (4 bills, total 7,300)
      { displayId: 'EXP-1035', title: 'First Aid Kit & Safety Supplies', categoryName: 'Miscellaneous', vendor: 'MediCare Pharma', amount: 3000, paymentMethod: 'Cash', status: 'Paid', expenseDate: new Date() },
      { displayId: 'EXP-1036', title: 'Staff Dinner Tea & Snacks', categoryName: 'Miscellaneous', vendor: 'Local Tea Vendor', amount: 2000, paymentMethod: 'Cash', status: 'Paid', expenseDate: new Date() },
      { displayId: 'EXP-1037', title: 'Pest Control Gel Treatment', categoryName: 'Miscellaneous', vendor: 'PestKill Inc', amount: 1300, paymentMethod: 'Card', status: 'Paid', expenseDate: new Date() },
      { displayId: 'EXP-1038', title: 'Emergency Bulbs & Hardware', categoryName: 'Miscellaneous', vendor: 'Hardware Store', amount: 1000, paymentMethod: 'UPI', status: 'Paid', expenseDate: new Date() }
    ];

    for (const dummy of dummyExpenses) {
      const createdExpense = await prisma.expense.create({
        data: {
          displayId: dummy.displayId,
          title: dummy.title,
          categoryId: getCatId(dummy.categoryName),
          amount: dummy.amount,
          paymentMethod: dummy.paymentMethod,
          status: dummy.status,
          vendor: dummy.vendor,
          expenseDate: dummy.expenseDate,
          createdById: adminUser.id,
          description: JSON.stringify({
            billNumber: `BILL-${Math.floor(10000 + Math.random() * 90000)}`,
            remarks: `Dummy seeding record for ${dummy.title}.`
          })
        }
      });

      // Seeding approval histories
      if (dummy.status === 'Approved' || dummy.status === 'Paid') {
        await prisma.expenseApprovalHistory.create({
          data: {
            expenseId: createdExpense.id,
            status: 'Approved',
            notes: 'System automatic approval seeding',
            actionById: adminUser.id,
            actionDate: new Date()
          }
        });
      }

      // Seeding payment details if Paid
      if (dummy.status === 'Paid') {
        await prisma.expensePaymentDetails.create({
          data: {
            expenseId: createdExpense.id,
            paidAt: new Date(),
            transactionReference: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
            paidById: adminUser.id
          }
        });
      }
    }
    console.log('[EXPENSE SEED] 38 dummy expenses seeded successfully.');
  }
};

// Trigger seeding
seedCategoriesAndExpensesIfNeeded().catch(err => {
  console.error('[EXPENSE SEED ERROR] Failed to seed default categories and expenses:', err);
});

// Generate Display ID (e.g. EXP-1001)
const generateDisplayId = async (): Promise<string> => {
  const count = await prisma.expense.count();
  const nextNumber = 1001 + count;
  return `EXP-${nextNumber}`;
};

// 1. GET EXPENSES (with Search, Filter, Sort, Pagination)
export const getExpenses = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      search,
      category,
      status,
      paymentMethod,
      startDate,
      endDate,
      sortBy = 'expenseDate',
      sortOrder = 'desc',
      page = '1',
      limit = '10'
    } = req.query;

    const pageNum = parseInt(String(page)) || 1;
    const limitNum = parseInt(String(limit)) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Build filters
    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: String(search), mode: 'insensitive' } },
        { vendor: { contains: String(search), mode: 'insensitive' } },
        { description: { contains: String(search), mode: 'insensitive' } },
        { displayId: { contains: String(search), mode: 'insensitive' } }
      ];
    }

    if (category) {
      where.categoryId = String(category);
    }

    if (status) {
      if (status === 'Pending Payment') {
        where.status = 'Approved';
      } else if (status === 'Approved') {
        where.status = { in: ['Approved', 'Paid'] };
      } else {
        where.status = String(status);
      }
    }

    if (paymentMethod) {
      where.paymentMethod = String(paymentMethod);
    }

    if (startDate || endDate) {
      where.expenseDate = {};
      if (startDate && !endDate) {
        const start = new Date(String(startDate));
        start.setHours(0, 0, 0, 0);
        const end = new Date(String(startDate));
        end.setHours(23, 59, 59, 999);
        where.expenseDate.gte = start;
        where.expenseDate.lte = end;
      } else {
        if (startDate) {
          const start = new Date(String(startDate));
          start.setHours(0, 0, 0, 0);
          where.expenseDate.gte = start;
        }
        if (endDate) {
          const end = new Date(String(endDate));
          end.setHours(23, 59, 59, 999);
          where.expenseDate.lte = end;
        }
      }
    }

    // Fetch total count for pagination
    const total = await prisma.expense.count({ where });

    // Fetch data
    const expenses = await prisma.expense.findMany({
      where,
      include: {
        category: true,
        createdByUser: {
          select: { id: true, name: true, role: true }
        },
        receipts: true,
        approvals: {
          include: {
            actionByUser: {
              select: { id: true, name: true, role: true }
            }
          },
          orderBy: { actionDate: 'desc' }
        },
        paymentDetails: {
          include: {
            paidByUser: {
              select: { id: true, name: true, role: true }
            }
          }
        }
      },
      orderBy: {
        [String(sortBy)]: String(sortOrder).toLowerCase() === 'asc' ? 'asc' : 'desc'
      },
      skip,
      take: limitNum
    });

    return res.status(200).json({
      expenses,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    console.error('Error fetching expenses:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// 2. GET KPI STATS
export const getExpenseStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Today's expenses sum
    const todaySum = await prisma.expense.aggregate({
      where: {
        expenseDate: { gte: today },
        status: { not: 'Rejected' }
      },
      _sum: { amount: true }
    });

    // This month's expenses sum
    const monthSum = await prisma.expense.aggregate({
      where: {
        expenseDate: { gte: firstDayOfMonth },
        status: { not: 'Rejected' }
      },
      _sum: { amount: true }
    });

    // Pending Payments (count of expenses where status is Approved but not paid, or status is Pending Approval)
    const pendingCount = await prisma.expense.count({
      where: {
        status: { in: ['Pending Approval', 'Approved'] }
      }
    });

    // Expense Categories count
    const categoriesCount = await prisma.expenseCategory.count();

    // Query stats for each category
    const dbCategories = await prisma.expenseCategory.findMany();
    const categoryStats = await Promise.all(
      dbCategories.map(async (cat) => {
        const todaySumCat = await prisma.expense.aggregate({
          where: {
            categoryId: cat.id,
            expenseDate: { gte: today },
            status: { not: 'Rejected' }
          },
          _sum: { amount: true }
        });

        const monthSumCat = await prisma.expense.aggregate({
          where: {
            categoryId: cat.id,
            expenseDate: { gte: firstDayOfMonth },
            status: { not: 'Rejected' }
          },
          _sum: { amount: true }
        });

        const billsCountCat = await prisma.expense.count({
          where: {
            categoryId: cat.id,
            status: { not: 'Rejected' }
          }
        });

        return {
          categoryId: cat.id,
          categoryName: cat.name,
          todayAmt: todaySumCat._sum.amount || 0,
          monthlyAmt: monthSumCat._sum.amount || 0,
          billsCount: billsCountCat
        };
      })
    );

    return res.status(200).json({
      todayExpenses: todaySum._sum.amount || 0,
      thisMonthExpenses: monthSum._sum.amount || 0,
      pendingPayments: pendingCount,
      expenseCategories: categoriesCount,
      categoryStats
    });
  } catch (error: any) {
    console.error('Error fetching expense stats:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// 3. GET EXPENSE BY ID
export const getExpenseById = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  try {
    const expense = await prisma.expense.findUnique({
      where: { id },
      include: {
        category: true,
        createdByUser: {
          select: { id: true, name: true, role: true }
        },
        lastUpdatedByUser: {
          select: { id: true, name: true, role: true }
        },
        receipts: true,
        approvals: {
          include: {
            actionByUser: {
              select: { id: true, name: true, role: true }
            }
          },
          orderBy: { actionDate: 'desc' }
        },
        paymentDetails: {
          include: {
            paidByUser: {
              select: { id: true, name: true, role: true }
            }
          }
        },
        purchaseOrder: true,
        restaurantPurchaseOrder: true
      }
    });

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    return res.status(200).json(expense);
  } catch (error: any) {
    console.error('Error fetching expense by ID:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// 4. CREATE EXPENSE
export const createExpense = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      title,
      categoryId,
      amount,
      paymentMethod,
      expenseDate,
      vendor,
      description,
      receiptImage, // base64 receipt
      receiptName,
      purchaseOrderId,
      restaurantPurchaseOrderId
    } = req.body;

    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = req.user.id;
    const userRole = req.user.role || 'EMPLOYEE';

    // Auto-approve if manager or admin, else set to Pending Approval
    // High-value expenses (> 10000 INR) always go to Pending Approval initially, regardless of who creates them (manager/employee), except Admins can create Paid/Approved directly.
    let status = 'Draft';
    if (userRole === 'ADMIN') {
      status = 'Approved';
    } else if (userRole === 'MANAGER') {
      status = parseFloat(amount) > 10000 ? 'Pending Approval' : 'Approved';
    } else {
      status = 'Pending Approval';
    }

    const displayId = await generateDisplayId();

    const expense = await prisma.expense.create({
      data: {
        displayId,
        title,
        categoryId,
        amount: parseFloat(amount),
        paymentMethod,
        expenseDate: new Date(expenseDate),
        vendor: vendor || null,
        description: description || null,
        status,
        createdById: userId,
        purchaseOrderId: purchaseOrderId || null,
        restaurantPurchaseOrderId: restaurantPurchaseOrderId || null
      }
    });

    // Handle receipt base64 upload
    if (receiptImage) {
      try {
        const matches = receiptImage.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        let buffer: Buffer;
        let extension = 'png';

        if (matches && matches.length === 3) {
          const type = matches[1];
          buffer = Buffer.from(matches[2], 'base64');
          const extMatch = type.split('/');
          if (extMatch.length > 1) {
            extension = extMatch[1];
          }
        } else {
          buffer = Buffer.from(receiptImage, 'base64');
        }

        const uploadsDir = path.join(process.cwd(), 'uploads', 'receipts');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const uniqueName = `receipt-${expense.id}-${Date.now()}.${extension}`;
        const filePath = path.join(uploadsDir, uniqueName);
        fs.writeFileSync(filePath, buffer);

        const fileUrl = `/uploads/receipts/${uniqueName}`;

        await prisma.expenseReceipt.create({
          data: {
            expenseId: expense.id,
            fileName: receiptName || uniqueName,
            fileUrl,
            fileType: extension
          }
        });
      } catch (uploadError) {
        console.error('Failed to upload receipt:', uploadError);
        // Don't fail the whole request just because receipt upload failed
      }
    }

    // Add draft approval history log
    await prisma.expenseApprovalHistory.create({
      data: {
        expenseId: expense.id,
        status,
        notes: `Expense request created. Initial status: ${status}`,
        actionById: userId
      }
    });

    // If Payment Method was selected and status is Approved, we can initialize payment details
    if (status === 'Approved') {
      await prisma.expensePaymentDetails.create({
        data: {
          expenseId: expense.id,
          paidAt: null,
          transactionReference: null
        }
      });
    }

    return res.status(201).json(expense);
  } catch (error: any) {
    console.error('Error creating expense:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// 5. UPDATE EXPENSE
export const updateExpense = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  try {
    const {
      title,
      categoryId,
      amount,
      paymentMethod,
      expenseDate,
      vendor,
      description,
      status,
      receiptImage,
      receiptName
    } = req.body;

    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = req.user.id;
    const userRole = req.user.role || 'EMPLOYEE';

    // Permissions check
    if (userRole !== 'ADMIN' && userRole !== 'MANAGER') {
      return res.status(403).json({ message: 'Forbidden. Managers and Admins only.' });
    }

    const existing = await prisma.expense.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod;
    if (expenseDate !== undefined) updateData.expenseDate = new Date(expenseDate);
    if (vendor !== undefined) updateData.vendor = vendor || null;
    if (description !== undefined) updateData.description = description || null;
    if (status !== undefined) updateData.status = status;

    updateData.lastUpdatedById = userId;

    const updated = await prisma.expense.update({
      where: { id },
      data: updateData
    });

    // Handle receipt base64 upload if provided during edit
    if (receiptImage) {
      try {
        const matches = receiptImage.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        let buffer: Buffer;
        let extension = 'png';

        if (matches && matches.length === 3) {
          const type = matches[1];
          buffer = Buffer.from(matches[2], 'base64');
          const extMatch = type.split('/');
          if (extMatch.length > 1) {
            extension = extMatch[1];
          }
        } else {
          buffer = Buffer.from(receiptImage, 'base64');
        }

        const uploadsDir = path.join(process.cwd(), 'uploads', 'receipts');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const uniqueName = `receipt-${updated.id}-${Date.now()}.${extension}`;
        const filePath = path.join(uploadsDir, uniqueName);
        fs.writeFileSync(filePath, buffer);

        const fileUrl = `/uploads/receipts/${uniqueName}`;

        // Delete old receipts
        await prisma.expenseReceipt.deleteMany({
          where: { expenseId: updated.id }
        });

        await prisma.expenseReceipt.create({
          data: {
            expenseId: updated.id,
            fileName: receiptName || uniqueName,
            fileUrl,
            fileType: extension
          }
        });
      } catch (uploadError) {
        console.error('Failed to upload receipt during edit:', uploadError);
      }
    }

    // Add to history log if status changed
    if (status && status !== existing.status) {
      await prisma.expenseApprovalHistory.create({
        data: {
          expenseId: updated.id,
          status,
          notes: `Expense status manually updated to ${status}`,
          actionById: userId
        }
      });
    }

    return res.status(200).json(updated);
  } catch (error: any) {
    console.error('Error updating expense:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// 6. DELETE EXPENSE
export const deleteExpense = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userRole = req.user.role || 'EMPLOYEE';

    // Only Admin can delete
    if (userRole !== 'ADMIN') {
      return res.status(403).json({ message: 'Forbidden. Admins only.' });
    }

    const expense = await prisma.expense.findUnique({
      where: { id },
      include: { receipts: true }
    });

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Delete physical files
    expense.receipts.forEach(rec => {
      try {
        const filePath = path.join(process.cwd(), rec.fileUrl);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (fileErr) {
        console.error('Failed to delete physical receipt file:', fileErr);
      }
    });

    await prisma.expense.delete({
      where: { id }
    });

    return res.status(200).json({ message: 'Expense deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting expense:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// 7. APPROVE EXPENSE
export const approveExpense = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { notes } = req.body;
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userRole = req.user.role || 'EMPLOYEE';
    const userId = req.user.id;

    if (userRole !== 'ADMIN' && userRole !== 'MANAGER') {
      return res.status(403).json({ message: 'Forbidden. Managers and Admins only.' });
    }

    const expense = await prisma.expense.findUnique({ where: { id } });
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    const updated = await prisma.expense.update({
      where: { id },
      data: { status: 'Approved' }
    });

    await prisma.expenseApprovalHistory.create({
      data: {
        expenseId: id,
        status: 'Approved',
        notes: notes || 'Expense approved.',
        actionById: userId
      }
    });

    // Create payment details placeholder
    await prisma.expensePaymentDetails.upsert({
      where: { expenseId: id },
      update: {},
      create: {
        expenseId: id,
        paidAt: null,
        transactionReference: null
      }
    });

    return res.status(200).json(updated);
  } catch (error: any) {
    console.error('Error approving expense:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// 8. REJECT EXPENSE
export const rejectExpense = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { notes } = req.body;
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userRole = req.user.role || 'EMPLOYEE';
    const userId = req.user.id;

    if (userRole !== 'ADMIN' && userRole !== 'MANAGER') {
      return res.status(403).json({ message: 'Forbidden. Managers and Admins only.' });
    }

    const expense = await prisma.expense.findUnique({ where: { id } });
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    const updated = await prisma.expense.update({
      where: { id },
      data: { status: 'Rejected' }
    });

    await prisma.expenseApprovalHistory.create({
      data: {
        expenseId: id,
        status: 'Rejected',
        notes: notes || 'Expense rejected.',
        actionById: userId
      }
    });

    return res.status(200).json(updated);
  } catch (error: any) {
    console.error('Error rejecting expense:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// 9. SETTLE / PAY EXPENSE
export const payExpense = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { transactionReference, paymentMethod, paidAt, remarks } = req.body;
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userRole = req.user.role || 'EMPLOYEE';
    const userId = req.user.id;

    if (userRole !== 'ADMIN' && userRole !== 'MANAGER') {
      return res.status(403).json({ message: 'Forbidden. Managers and Admins only.' });
    }

    const expense = await prisma.expense.findUnique({ where: { id } });
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    const updated = await prisma.expense.update({
      where: { id },
      data: {
        status: 'Paid',
        paymentMethod: paymentMethod || expense.paymentMethod
      }
    });

    // Update payment details
    await prisma.expensePaymentDetails.upsert({
      where: { expenseId: id },
      update: {
        paidAt: paidAt ? new Date(paidAt) : new Date(),
        transactionReference: transactionReference || null,
        paidById: userId
      },
      create: {
        expenseId: id,
        paidAt: paidAt ? new Date(paidAt) : new Date(),
        transactionReference: transactionReference || null,
        paidById: userId
      }
    });

    await prisma.expenseApprovalHistory.create({
      data: {
        expenseId: id,
        status: 'Paid',
        notes: `Expense marked as Paid. Method: ${paymentMethod || expense.paymentMethod}. Transaction Ref: ${transactionReference || 'N/A'}. Remarks: ${remarks || 'N/A'}`,
        actionById: userId
      }
    });

    return res.status(200).json(updated);
  } catch (error: any) {
    console.error('Error paying expense:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// 10. GET EXPENSE REPORTS
export const getExpenseReports = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { year = new Date().getFullYear().toString() } = req.query;
    const selectedYear = parseInt(String(year)) || new Date().getFullYear();

    // Fetch all non-rejected expenses for the selected year
    const startDate = new Date(selectedYear, 0, 1);
    const endDate = new Date(selectedYear, 11, 31, 23, 59, 59, 999);

    const expenses = await prisma.expense.findMany({
      where: {
        expenseDate: {
          gte: startDate,
          lte: endDate
        },
        status: { not: 'Rejected' }
      },
      include: {
        category: true
      }
    });

    // Daily expenses for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dailyExpensesRaw = await prisma.expense.groupBy({
      by: ['expenseDate'],
      where: {
        expenseDate: { gte: thirtyDaysAgo },
        status: { not: 'Rejected' }
      },
      _sum: { amount: true }
    });
    // Format daily expenses
    const dailyExpenses = dailyExpensesRaw.map(d => ({
      date: d.expenseDate.toISOString().split('T')[0],
      amount: d._sum.amount || 0
    })).sort((a, b) => a.date.localeCompare(b.date));

    // Weekly expenses (last 12 weeks)
    // For simplicity, we aggregate weekly data in JS
    const weeklyExpenses: Record<string, number> = {};
    const twelveWeeksAgo = new Date();
    twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84); // 12 weeks
    expenses.forEach(e => {
      if (e.expenseDate >= twelveWeeksAgo) {
        // Find the start of the week (Sunday)
        const date = new Date(e.expenseDate);
        const day = date.getDay();
        const diff = date.getDate() - day;
        const sunday = new Date(date.setDate(diff));
        const weekStr = sunday.toISOString().split('T')[0];
        weeklyExpenses[weekStr] = (weeklyExpenses[weekStr] || 0) + e.amount;
      }
    });
    const formattedWeeklyExpenses = Object.entries(weeklyExpenses)
      .map(([week, amount]) => ({ week, amount }))
      .sort((a, b) => a.week.localeCompare(b.week));

    // Monthly expenses for the selected year
    const monthlyExpenses = Array(12).fill(0).map((_, i) => ({
      month: new Date(selectedYear, i, 1).toLocaleString('default', { month: 'short' }),
      amount: 0
    }));
    expenses.forEach(e => {
      const m = e.expenseDate.getMonth();
      monthlyExpenses[m].amount += e.amount;
    });

    // Yearly expenses comparison (current and past 4 years)
    const yearlyRaw = await prisma.expense.findMany({
      where: { status: { not: 'Rejected' } },
      select: { amount: true, expenseDate: true }
    });
    const yearlyExpensesMap: Record<string, number> = {};
    yearlyRaw.forEach(e => {
      const y = e.expenseDate.getFullYear().toString();
      yearlyExpensesMap[y] = (yearlyExpensesMap[y] || 0) + e.amount;
    });
    const formattedYearlyExpenses = Object.entries(yearlyExpensesMap)
      .map(([year, amount]) => ({ year, amount }))
      .sort((a, b) => a.year.localeCompare(b.year))
      .slice(-5); // Get last 5 years

    // Category-wise Breakdown
    const categoryBreakdown: Record<string, { name: string; amount: number; count: number }> = {};
    expenses.forEach(e => {
      const catName = e.category.name;
      if (!categoryBreakdown[catName]) {
        categoryBreakdown[catName] = { name: catName, amount: 0, count: 0 };
      }
      categoryBreakdown[catName].amount += e.amount;
      categoryBreakdown[catName].count += 1;
    });
    const totalYearlyExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const formattedCategoryBreakdown = Object.values(categoryBreakdown).map(c => ({
      ...c,
      percentage: totalYearlyExpenses > 0 ? parseFloat(((c.amount / totalYearlyExpenses) * 100).toFixed(1)) : 0
    })).sort((a, b) => b.amount - a.amount);

    // Payment Method Breakdown
    const paymentBreakdown: Record<string, { method: string; amount: number; count: number }> = {};
    expenses.forEach(e => {
      const method = e.paymentMethod || 'Other';
      if (!paymentBreakdown[method]) {
        paymentBreakdown[method] = { method, amount: 0, count: 0 };
      }
      paymentBreakdown[method].amount += e.amount;
      paymentBreakdown[method].count += 1;
    });
    const formattedPaymentBreakdown = Object.values(paymentBreakdown);

    return res.status(200).json({
      summary: {
        totalExpenses: totalYearlyExpenses,
        expenseCount: expenses.length,
        averageExpense: expenses.length > 0 ? parseFloat((totalYearlyExpenses / expenses.length).toFixed(2)) : 0
      },
      dailyExpenses,
      weeklyExpenses: formattedWeeklyExpenses,
      monthlyExpenses,
      yearlyExpenses: formattedYearlyExpenses,
      categoryBreakdown: formattedCategoryBreakdown,
      paymentBreakdown: formattedPaymentBreakdown
    });
  } catch (error: any) {
    console.error('Error creating expense reports:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// 11. CATEGORY MANAGEMENT
export const getExpenseCategories = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const categories = await prisma.expenseCategory.findMany({
      orderBy: { name: 'asc' }
    });
    return res.status(200).json(categories);
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const createExpenseCategory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const existing = await prisma.expenseCategory.findUnique({
      where: { name }
    });

    if (existing) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    const cat = await prisma.expenseCategory.create({
      data: {
        name,
        description: description || null,
        isCustom: true
      }
    });

    return res.status(201).json(cat);
  } catch (error: any) {
    console.error('Error creating category:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const deleteExpenseCategory = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  try {
    const cat = await prisma.expenseCategory.findUnique({
      where: { id }
    });

    if (!cat) {
      return res.status(404).json({ message: 'Category not found' });
    }

    if (!cat.isCustom) {
      return res.status(400).json({ message: 'Cannot delete default categories' });
    }

    // Check if category is used in expenses
    const expensesCount = await prisma.expense.count({
      where: { categoryId: id }
    });

    if (expensesCount > 0) {
      return res.status(400).json({ message: 'Cannot delete category that is in use by expenses' });
    }

    await prisma.expenseCategory.delete({
      where: { id }
    });

    return res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting category:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// 12. CREATE EXPENSE FROM PURCHASE ORDER (INTEGRATION)
export const createExpenseFromPO = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { purchaseOrderId, type = 'retail' } = req.body;
    if (!purchaseOrderId) {
      return res.status(400).json({ message: 'Purchase Order ID is required' });
    }

    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = req.user.id;

    // Check if expense already exists for this PO to prevent duplicate entries
    const existingExpense = await prisma.expense.findFirst({
      where: {
        OR: [
          { purchaseOrderId },
          { restaurantPurchaseOrderId: purchaseOrderId }
        ]
      }
    });

    if (existingExpense) {
      return res.status(400).json({ message: 'Expense entry already exists for this Purchase Order', expense: existingExpense });
    }

    let poTitle = '';
    let poAmount = 0;
    let poVendor = '';
    let poDescription = '';

    if (type === 'restaurant') {
      const po = await prisma.restaurantPurchaseOrder.findUnique({
        where: { id: purchaseOrderId },
        include: { supplier: true }
      });
      if (!po) {
        return res.status(404).json({ message: 'Restaurant Purchase Order not found' });
      }
      
      poTitle = `Procurement for PO #${po.poNumber}`;
      poVendor = po.supplier.name;
      
      // Calculate amount based on items
      const poItems = await prisma.restaurantPurchaseOrderItem.findMany({
        where: { purchaseOrderId }
      });
      poAmount = poItems.reduce((sum, item) => sum + (item.quantityOrdered * 10), 0); // fallback multiplier if cost is in item
      
      poDescription = `Auto-generated expense from Restaurant Purchase Order #${po.poNumber}`;
    } else {
      const po = await prisma.purchaseOrder.findUnique({
        where: { id: purchaseOrderId },
        include: { supplier: true }
      });
      if (!po) {
        return res.status(404).json({ message: 'Purchase Order not found' });
      }

      poTitle = `Procurement for PO #${po.orderNumber}`;
      poAmount = po.totalAmount;
      poVendor = po.supplier.name;
      poDescription = `Auto-generated expense from Purchase Order #${po.orderNumber}`;
    }

    // Get or Create "Kitchen Supplies" category ID
    let category = await prisma.expenseCategory.findFirst({
      where: { name: 'Kitchen Supplies' }
    });
    if (!category) {
      category = await prisma.expenseCategory.findFirst({
        where: { name: 'Miscellaneous' }
      });
    }

    const displayId = await generateDisplayId();

    const expense = await prisma.expense.create({
      data: {
        displayId,
        title: poTitle,
        categoryId: category ? category.id : '',
        amount: poAmount,
        paymentMethod: 'Bank Transfer',
        expenseDate: new Date(),
        vendor: poVendor,
        description: poDescription,
        status: 'Approved',
        createdById: userId,
        purchaseOrderId: type === 'retail' ? purchaseOrderId : null,
        restaurantPurchaseOrderId: type === 'restaurant' ? purchaseOrderId : null
      }
    });

    // Create payment details placeholder
    await prisma.expensePaymentDetails.create({
      data: {
        expenseId: expense.id,
        paidAt: new Date(),
        transactionReference: 'AUTO-PO-SETTLEMENT',
        paidById: userId
      }
    });

    await prisma.expenseApprovalHistory.create({
      data: {
        expenseId: expense.id,
        status: 'Approved',
        notes: `Expense created automatically from approved Purchase Order.`,
        actionById: userId
      }
    });

    return res.status(201).json(expense);
  } catch (error: any) {
    console.error('Error generating expense from PO:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

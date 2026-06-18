import { Request, Response } from 'express';
import prisma from '../config/db';
import Razorpay from 'razorpay';
import fs from 'fs';
import path from 'path';
import { addClient, removeClient, broadcast } from '../utils/realtime';

// Utility: Deduct ingredients from stock based on recipe
async function deductRecipeIngredients(menuItemId: string, quantity: number) {
  try {
    const recipe = await prisma.recipe.findUnique({
      where: { menuItemId },
      include: {
        ingredients: {
          include: {
            ingredient: true
          }
        }
      }
    });

    if (!recipe) return;

    for (const ri of recipe.ingredients) {
      const reduction = ri.quantity * quantity;
      await prisma.ingredient.update({
        where: { id: ri.ingredientId },
        data: {
          stock: {
            decrement: reduction
          }
        }
      });
      console.log(`[Inventory Auto] Deducted ${reduction} of ${ri.ingredient.name} from stock`);
    }
  } catch (err) {
    console.error('[Inventory Error] Failed to deduct ingredients:', err);
  }
}

// 1. DASHBOARD METRICS
export const getDashboardMetrics = async (req: Request, res: Response) => {
  const { restaurantId } = req.query;
  if (!restaurantId) {
    return res.status(400).json({ message: 'restaurantId query parameter is required' });
  }

  try {
    const restId = String(restaurantId);

    // Sales Today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = await prisma.kitchenOrder.findMany({
      where: {
        createdAt: { gte: today },
        status: { not: 'CANCELLED' }
      }
    });
    const todaySales = todayOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    // Tables Count
    const totalTables = await prisma.restaurantTable.count({ where: { restaurantId: restId } });
    const occupiedTables = await prisma.restaurantTable.count({ where: { restaurantId: restId, status: 'OCCUPIED' } });
    const reservedTables = await prisma.restaurantTable.count({ where: { restaurantId: restId, status: 'RESERVED' } });
    const cleaningTables = await prisma.restaurantTable.count({ where: { restaurantId: restId, status: 'CLEANING' } });
    const availableTables = totalTables - occupiedTables - reservedTables - cleaningTables;

    // Kitchen orders count
    const pendingOrdersCount = await prisma.kitchenOrder.count({
      where: {
        status: { in: ['NEW', 'ACCEPTED', 'PREPARING'] }
      }
    });
    const readyOrdersCount = await prisma.kitchenOrder.count({
      where: {
        status: 'READY'
      }
    });

    // Reservations Today
    const todayStr = new Date().toISOString().split('T')[0];
    const reservationsToday = await prisma.restaurantReservation.count({
      where: {
        table: { restaurantId: restId },
        date: todayStr
      }
    });

    // Low stock ingredients
    const lowStock = (await prisma.ingredient.findMany()).filter(i => i.stock <= i.reorderLevel);

    // Top Selling Dishes
    const items = await prisma.kitchenOrderItem.findMany({
      include: { menuItem: true }
    });
    const counts: Record<string, { name: string, quantity: number, price: number }> = {};
    items.forEach(it => {
      const name = it.menuItem.name;
      if (!counts[name]) {
        counts[name] = { name, quantity: 0, price: it.unitPrice };
      }
      counts[name].quantity += it.quantity;
    });
    const topDishes = Object.values(counts).sort((a, b) => b.quantity - a.quantity).slice(0, 5);

    // Pending Online Orders
    const pendingOnline = await prisma.restaurantOnlineOrder.count({
      where: { status: 'PENDING' }
    });

    // Popular categories
    const categories = await prisma.menuCategory.findMany({
      where: { restaurantId: restId },
      include: {
        menuItems: {
          include: {
            orderItems: true
          }
        }
      }
    });
    const popularCategories = categories.map(cat => {
      const orderCount = cat.menuItems.reduce((sum, item) => sum + item.orderItems.length, 0);
      return {
        name: cat.name,
        orders: orderCount
      };
    }).sort((a, b) => b.orders - a.orders).slice(0, 5);

    return res.status(200).json({
      todaySales,
      tables: {
        total: totalTables,
        occupied: occupiedTables,
        reserved: reservedTables,
        cleaning: cleaningTables,
        available: availableTables
      },
      kitchen: {
        pending: pendingOrdersCount,
        ready: readyOrdersCount
      },
      reservationsToday,
      topDishes,
      popularCategories,
      lowIngredientStock: lowStock.length,
      pendingOnlineOrders: pendingOnline
    });
  } catch (err: any) {
    return res.status(500).json({ message: 'Failed to fetch dashboard metrics', error: err.message });
  }
};

// 2. TABLE MANAGEMENT
export const getTables = async (req: Request, res: Response) => {
  const { restaurantId } = req.query;
  if (!restaurantId) return res.status(400).json({ message: 'restaurantId is required' });

  try {
    const tables = await prisma.restaurantTable.findMany({
      where: { restaurantId: String(restaurantId) },
      include: {
        qrCode: true,
        kitchenOrders: {
          where: {
            status: { in: ['NEW', 'ACCEPTED', 'PREPARING', 'READY', 'SERVING'] }
          },
          include: {
            items: {
              include: {
                menuItem: true
              }
            }
          }
        }
      },
      orderBy: { tableNumber: 'asc' }
    });
    return res.status(200).json(tables);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const createTable = async (req: Request, res: Response) => {
  const { restaurantId, tableNumber, capacity } = req.body;
  try {
    // Check if tableNumber already exists for this restaurant (case-insensitive)
    const existing = await prisma.restaurantTable.findFirst({
      where: {
        restaurantId,
        tableNumber: {
          equals: tableNumber,
          mode: 'insensitive'
        }
      }
    });

    if (existing) {
      if (existing.status === 'DEACTIVATED') {
        const reactivated = await prisma.restaurantTable.update({
          where: { id: existing.id },
          data: { status: 'AVAILABLE' }
        });
        return res.status(200).json(reactivated);
      }
      return res.status(200).json(existing);
    }

    const table = await prisma.restaurantTable.create({
      data: {
        restaurantId,
        tableNumber,
        capacity: Number(capacity) || 4,
        status: 'AVAILABLE'
      }
    });

    // Create QR Code entry
    const qrToken = `QR_${table.tableNumber.replace(/\s+/g, '_')}_${restaurantId.slice(0, 4)}`;
    const existingQR = await prisma.tableQRCode.findUnique({
      where: { qrToken }
    });

    if (!existingQR) {
      await prisma.tableQRCode.create({
        data: {
          tableId: table.id,
          qrToken,
          qrCodeUrl: `/menu/${table.id}`
        }
      });
    }

    return res.status(201).json(table);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const updateTableStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, activeOrderId } = req.body;
  try {
    const table = await prisma.restaurantTable.update({
      where: { id },
      data: { status, activeOrderId }
    });
    return res.status(200).json(table);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const transferTable = async (req: Request, res: Response) => {
  const { sourceTableId, targetTableId } = req.body;
  try {
    const sourceTable = await prisma.restaurantTable.findUnique({ where: { id: sourceTableId } });
    const targetTable = await prisma.restaurantTable.findUnique({ where: { id: targetTableId } });

    if (!sourceTable || !targetTable) {
      return res.status(404).json({ message: 'One or both tables not found' });
    }

    // Move order ID
    await prisma.restaurantTable.update({
      where: { id: targetTableId },
      data: {
        activeOrderId: sourceTable.activeOrderId,
        status: 'OCCUPIED'
      }
    });

    await prisma.restaurantTable.update({
      where: { id: sourceTableId },
      data: {
        activeOrderId: null,
        status: 'CLEANING'
      }
    });

    // Move associated kitchen orders table reference
    if (sourceTable.activeOrderId) {
      await prisma.kitchenOrder.updateMany({
        where: { id: sourceTable.activeOrderId },
        data: { tableId: targetTableId }
      });
    }

    return res.status(200).json({ message: 'Table transferred successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const mergeTables = async (req: Request, res: Response) => {
  const { sourceTableId, targetTableId } = req.body;
  try {
    const sourceTable = await prisma.restaurantTable.findUnique({ where: { id: sourceTableId } });
    if (!sourceTable) return res.status(404).json({ message: 'Source table not found' });

    // In a merge, we copy orders to the target table and clear the source table
    await prisma.restaurantTable.update({
      where: { id: targetTableId },
      data: { status: 'OCCUPIED' }
    });

    await prisma.restaurantTable.update({
      where: { id: sourceTableId },
      data: {
        status: 'AVAILABLE',
        activeOrderId: null
      }
    });

    // Update order items of source table's active order to belong to target active order, or re-link order
    if (sourceTable.activeOrderId) {
      await prisma.kitchenOrder.updateMany({
        where: { id: sourceTable.activeOrderId },
        data: { tableId: targetTableId }
      });
    }

    return res.status(200).json({ message: 'Tables merged successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const splitTableBill = async (req: Request, res: Response) => {
  const { tableId, splitsCount } = req.body;
  try {
    const table = await prisma.restaurantTable.findUnique({ where: { id: tableId } });
    if (!table || !table.activeOrderId) return res.status(404).json({ message: 'No active order for this table' });

    const order = await prisma.kitchenOrder.findUnique({
      where: { id: table.activeOrderId },
      include: { items: { include: { menuItem: true } } }
    });

    if (!order) return res.status(404).json({ message: 'Order not found' });

    const splitAmount = order.totalAmount / Number(splitsCount);
    const splitDetails = Array.from({ length: Number(splitsCount) }).map((_, i) => ({
      splitIndex: i + 1,
      amount: parseFloat(splitAmount.toFixed(2)),
      status: 'PENDING'
    }));

    return res.status(200).json({
      orderId: order.id,
      totalAmount: order.totalAmount,
      splitsCount,
      splits: splitDetails
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

// 3. MENU CATEGORIES & ITEMS
export const getCategories = async (req: Request, res: Response) => {
  const { restaurantId } = req.query;
  try {
    const categories = await prisma.menuCategory.findMany({
      where: { restaurantId: String(restaurantId) },
      orderBy: { sortOrder: 'asc' }
    });
    return res.status(200).json(categories);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  const { restaurantId, name, description, status, sortOrder } = req.body;
  try {
    const category = await prisma.menuCategory.create({
      data: {
        restaurantId,
        name,
        description,
        status: status || 'Active',
        sortOrder: Number(sortOrder) || 1
      }
    });
    return res.status(201).json(category);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const getMenuItems = async (req: Request, res: Response) => {
  const { categoryId, restaurantId } = req.query;
  try {
    let whereClause: any = {};
    if (categoryId) {
      whereClause.categoryId = String(categoryId);
    } else if (restaurantId) {
      whereClause.category = { restaurantId: String(restaurantId) };
    }

    const items = await prisma.menuItem.findMany({
      where: whereClause,
      include: { category: true, recipe: true, addons: true },
      orderBy: { name: 'asc' }
    });
    return res.status(200).json(items);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const createMenuItem = async (req: Request, res: Response) => {
  const { categoryId, name, description, price, image, isVeg, isChefSpecial, isRecommended, isOnOffer, offerPrice, addons } = req.body;
  try {
    const item = await prisma.menuItem.create({
      data: {
        categoryId,
        name,
        description,
        price: Number(price),
        image,
        isVeg: Boolean(isVeg),
        isChefSpecial: Boolean(isChefSpecial),
        isRecommended: Boolean(isRecommended),
        isOnOffer: Boolean(isOnOffer),
        offerPrice: offerPrice ? Number(offerPrice) : null,
        status: 'Active',
        addons: addons ? {
          create: addons.map((addon: any) => ({
            name: addon.name,
            price: Number(addon.price),
            category: addon.category || 'Add-ons',
            maxQty: Number(addon.maxQty) || 1,
            isOptional: addon.isOptional !== undefined ? Boolean(addon.isOptional) : true
          }))
        } : undefined
      },
      include: { addons: true }
    });
    return res.status(201).json(item);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const updateMenuItem = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { categoryId, name, description, price, image, isVeg, isChefSpecial, isRecommended, isOnOffer, offerPrice, addons } = req.body;
  try {
    if (addons) {
      await prisma.menuItemAddOn.deleteMany({
        where: { menuItemId: id }
      });
    }

    const updated = await prisma.menuItem.update({
      where: { id },
      data: {
        categoryId,
        name,
        description,
        price: Number(price),
        image,
        isVeg: Boolean(isVeg),
        isChefSpecial: Boolean(isChefSpecial),
        isRecommended: Boolean(isRecommended),
        isOnOffer: Boolean(isOnOffer),
        offerPrice: offerPrice ? Number(offerPrice) : null,
        addons: addons ? {
          create: addons.map((addon: any) => ({
            name: addon.name,
            price: Number(addon.price),
            category: addon.category || 'Add-ons',
            maxQty: Number(addon.maxQty) || 1,
            isOptional: addon.isOptional !== undefined ? Boolean(addon.isOptional) : true
          }))
        } : undefined
      },
      include: { addons: true }
    });
    return res.status(200).json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const deleteMenuItem = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.menuItem.delete({
      where: { id }
    });
    return res.status(200).json({ message: 'Menu item deleted successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

// 4. PUBLIC QR MENU & ORDERING
export const getPublicMenuByQR = async (req: Request, res: Response) => {
  const { qrToken } = req.params;
  try {
    const qrEntry = await prisma.tableQRCode.findUnique({
      where: { qrToken },
      include: {
        table: {
          include: {
            restaurant: true
          }
        }
      }
    });

    if (!qrEntry) {
      return res.status(404).json({ message: 'Invalid QR Code' });
    }

    // Fetch categories and items
    const categories = await prisma.menuCategory.findMany({
      where: { restaurantId: qrEntry.table.restaurantId },
      include: {
        menuItems: {
          where: { status: 'Active' },
          include: { addons: true }
        }
      },
      orderBy: { sortOrder: 'asc' }
    });

    return res.status(200).json({
      table: qrEntry.table,
      restaurant: qrEntry.table.restaurant,
      categories
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const placeQROrder = async (req: Request, res: Response) => {
  const { tableId, items, notes, paymentMethod, razorpayPaymentId, razorpayOrderId } = req.body;
  // items format: [{ menuItemId, quantity, notes, unitPrice }]

  try {
    const table = await prisma.restaurantTable.findUnique({ where: { id: tableId } });
    if (!table) return res.status(404).json({ message: 'Table not found' });

    let total = 0;
    const orderItemsData = items.map((it: any) => {
      const subtotal = it.unitPrice * it.quantity;
      total += subtotal;
      return {
        menuItemId: it.menuItemId,
        quantity: it.quantity,
        notes: it.notes,
        unitPrice: it.unitPrice
      };
    });

    // Create kitchen order
    const order = await prisma.kitchenOrder.create({
      data: {
        tableId,
        source: 'QR',
        status: 'NEW',
        notes,
        totalAmount: total,
        paymentStatus: razorpayPaymentId ? 'PAID' : 'PENDING',
        paymentMethod: paymentMethod || 'CASH',
        razorpayOrderId,
        razorpayPaymentId,
        items: {
          create: orderItemsData
        }
      },
      include: {
        items: true
      }
    });

    // Mark table occupied
    await prisma.restaurantTable.update({
      where: { id: tableId },
      data: {
        status: 'OCCUPIED',
        activeOrderId: order.id
      }
    });

    // Deduct ingredients automatically upon order placement
    for (const it of items) {
      await deductRecipeIngredients(it.menuItemId, it.quantity);
    }

    // Fetch full order with items and table details to broadcast to KDS
    const fullOrder = await prisma.kitchenOrder.findUnique({
      where: { id: order.id },
      include: {
        items: {
          include: {
            menuItem: true
          }
        },
        table: true
      }
    });

    broadcast('NEW_ORDER', fullOrder);

    return res.status(201).json(order);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const createPublicPaymentOrder = async (req: Request, res: Response) => {
  const { amount } = req.body;
  try {
    const totalAmount = parseFloat(String(amount));
    if (isNaN(totalAmount) || totalAmount <= 0) {
      return res.status(400).json({ message: 'Valid amount is required' });
    }
    const rzpKeyId = process.env.RAZORPAY_KEY_ID;
    const rzpSecret = process.env.RAZORPAY_KEY_SECRET;
    const isRzpConfigured = !!(rzpKeyId && rzpSecret && rzpKeyId !== 'your_key_id' && rzpSecret !== 'your_secret_key');

    if (isRzpConfigured) {
      const rzp = new Razorpay({
        key_id: rzpKeyId as string,
        key_secret: rzpSecret as string
      });
      const options = {
        amount: Math.round(totalAmount * 100), // in paise
        currency: 'INR',
        receipt: `receipt_qr_${Date.now()}`
      };
      const order = await rzp.orders.create(options);
      return res.status(201).json({
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        key: rzpKeyId,
        mock: false
      });
    } else {
      // Mock Fallback
      return res.status(201).json({
        id: `order_mock_${Date.now()}`,
        amount: Math.round(totalAmount * 100),
        currency: 'INR',
        key: 'rzp_test_mockKey12345',
        mock: true
      });
    }
  } catch (error: any) {
    console.error('Error creating public Razorpay Order:', error);
    return res.status(500).json({ message: 'Razorpay order creation failed', error: error.message });
  }
};

// 5. KITCHEN DISPLAY SYSTEM (KDS)
export const getKitchenOrders = async (req: Request, res: Response) => {
  const { restaurantId, includeServed } = req.query;
  try {
    const statusFilter = includeServed === 'true'
      ? undefined
      : { not: 'SERVED' };

    const orders = await prisma.kitchenOrder.findMany({
      where: {
        OR: [
          { tableId: null }, // Delivery / Walkin
          {
            table: { restaurantId: String(restaurantId) }
          }
        ],
        status: statusFilter
      },
      include: {
        items: {
          include: {
            menuItem: true
          }
        },
        table: true
      },
      orderBy: { createdAt: 'asc' }
    });
    return res.status(200).json(orders);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, estimatedPrepTime, waiterId, waiterStatus } = req.body; // NEW, ACCEPTED, PREPARING, READY, SERVING, SERVED, CANCELLED
  try {
    const updateData: any = {};
    if (status !== undefined) {
      updateData.status = status;
    }
    if (estimatedPrepTime !== undefined) {
      updateData.estimatedPrepTime = Number(estimatedPrepTime);
    }
    if (waiterId !== undefined) {
      updateData.waiterId = waiterId;
    }
    if (waiterStatus !== undefined) {
      updateData.waiterStatus = waiterStatus;
    }

    const now = new Date();
    if (status === 'ACCEPTED') {
      updateData.acceptedAt = now;
    } else if (status === 'PREPARING') {
      updateData.preparingAt = now;
    } else if (status === 'READY') {
      updateData.readyAt = now;
    } else if (status === 'SERVING') {
      updateData.pickedUpAt = now;
      updateData.waiterStatus = 'SERVING';
    } else if (status === 'SERVED') {
      updateData.servedAt = now;
      updateData.waiterStatus = 'SERVED';
    }

    const order = await prisma.kitchenOrder.update({
      where: { id },
      data: updateData,
      include: { table: true }
    });

    // Create a waiter notification if status is READY
    if (status === 'READY') {
      const tableName = order.table?.tableNumber || 'Takeaway';

      // System Automatically Creates Service Task
      // Find waiter assigned to this table
      const cleanTableNum = tableName.replace(/\s+/g, '').toLowerCase();
      const restaurantId = order.table?.restaurantId || undefined;

      const waitersWithAssignments = await prisma.restaurantWaiter.findMany({
        where: {
          restaurantId,
          status: 'ACTIVE'
        },
        include: { tableAssignments: true }
      });

      let assignedWaiterId: string | null = null;
      for (const waiter of waitersWithAssignments) {
        const hasAssignment = waiter.tableAssignments.some(assign => {
          const cleanAssign = assign.tableNumber.replace(/\s+/g, '').toLowerCase();
          if (cleanAssign === cleanTableNum) return true;

          const assignDigits = cleanAssign.match(/\d+/)?.[0];
          const tableDigits = cleanTableNum.match(/\d+/)?.[0];
          if (assignDigits && tableDigits && assignDigits === tableDigits) return true;
          return false;
        });
        if (hasAssignment) {
          assignedWaiterId = waiter.id;
          break;
        }
      }

      const serviceTask = await prisma.serviceTask.create({
        data: {
          orderId: order.id,
          tableNumber: tableName,
          waiterId: assignedWaiterId,
          status: 'ready'
        }
      });

      // Update the KitchenOrder in database to link the waiter if matched
      if (assignedWaiterId) {
        await prisma.kitchenOrder.update({
          where: { id: order.id },
          data: { waiterId: assignedWaiterId }
        });
        order.waiterId = assignedWaiterId;

        // Create waiter notification record
        await prisma.waiterNotification.create({
          data: {
            waiterId: assignedWaiterId,
            orderId: order.id,
            title: 'New Ready Order',
            message: `${tableName} - Order #${order.id.slice(-4).toUpperCase()}`
          }
        });
      }

      await prisma.orderNotification.create({
        data: {
          orderId: order.id,
          type: 'ORDER_READY',
          message: `${tableName.toUpperCase()} - ORDER READY - Serve Now`
        }
      });

      // Broadcast service task created
      broadcast('NEW_SERVICE_TASK', {
        task: serviceTask,
        order,
        assignedWaiterId
      });

      // Also broadcast the notification
      broadcast('NOTIFICATION', {
        id: `notif_${Date.now()}`,
        orderId: order.id,
        type: 'ORDER_READY',
        message: `${tableName.toUpperCase()} - ORDER READY - Serve Now`,
        assignedWaiterId,
        tableNumber: tableName
      });
    }

    // If served, clean/free up the table if it was table order
    if (status === 'SERVED' && order.tableId) {
      await prisma.restaurantTable.update({
        where: { id: order.tableId },
        data: {
          status: 'CLEANING',
          activeOrderId: null
        }
      });

      // Track waiter performance if waiter was assigned
      if (order.waiterId) {
        await prisma.restaurantWaiter.update({
          where: { id: order.waiterId },
          data: {
            ordersServed: { increment: 1 },
            salesHandled: { increment: order.totalAmount }
          }
        });
      }
    }

    // Broadcast status change
    broadcast('ORDER_STATUS_UPDATE', {
      id: order.id,
      status: order.status,
      estimatedPrepTime: order.estimatedPrepTime,
      acceptedAt: order.acceptedAt,
      preparingAt: order.preparingAt,
      readyAt: order.readyAt,
      pickedUpAt: order.pickedUpAt,
      servedAt: order.servedAt,
      waiterStatus: order.waiterStatus,
      waiterId: order.waiterId
    });

    return res.status(200).json(order);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

// 6. WAITER MANAGEMENT
export const getWaiters = async (req: Request, res: Response) => {
  const { restaurantId } = req.query;
  if (!restaurantId) {
    return res.status(400).json({ error: 'restaurantId is required' });
  }
  try {
    let waiters = await prisma.restaurantWaiter.findMany({
      where: { restaurantId: String(restaurantId) },
      include: { tableAssignments: true },
      orderBy: { name: 'asc' }
    });

    if (waiters.length === 0) {
      // Auto seed standard waiters Rahul, Amit, Suresh, Priya
      const standardWaiters = [
        { name: 'Rahul', employeeCode: 'WT001', email: 'rahul@restaurant.com', mobile: '9876543210', tables: ['1', '2', 'Table 1', 'Table 2'] },
        { name: 'Ritesh', employeeCode: 'WT002', email: 'ritesh@restaurant.com', mobile: '9876543211', tables: ['3', '4', 'Table 3', 'Table 4'] },
        { name: 'Akshay', employeeCode: 'WT003', email: 'akshay@restaurant.com', mobile: '9876543212', tables: ['5', '6', 'Table 5', 'Table 6'] },
        { name: 'Adesh', employeeCode: 'WT004', email: 'adesh@restaurant.com', mobile: '9876543213', tables: ['7', '8', 'Table 7', 'Table 8'] },
        { name: 'Sagar', employeeCode: 'WT005', email: 'sagar@restaurant.com', mobile: '9876543214', tables: ['9', '10', 'Table 9', 'Table 10'] },
        { name: 'Pratik', employeeCode: 'WT006', email: 'pratik@restaurant.com', mobile: '9876543215', tables: ['11', '12', 'Table 11', 'Table 12'] },
        { name: 'Rohan', employeeCode: 'WT007', email: 'rohan@restaurant.com', mobile: '9876543216', tables: ['13', '14', 'Table 13', 'Table 14'] },
        { name: 'Amit', employeeCode: 'WT008', email: 'amit@restaurant.com', mobile: '9876543217', tables: ['15', '16', 'Table 15', 'Table 16'] },
        { name: 'Vikas', employeeCode: 'WT009', email: 'vikas@restaurant.com', mobile: '9876543218', tables: [] },
        { name: 'Nikhil', employeeCode: 'WT010', email: 'nikhil@restaurant.com', mobile: '9876543219', tables: [] },
        { name: 'Mahesh', employeeCode: 'WT011', email: 'mahesh@restaurant.com', mobile: '9876543220', tables: [] },
      ];

      for (const w of standardWaiters) {
        const waiter = await prisma.restaurantWaiter.create({
          data: {
            restaurantId: String(restaurantId),
            name: w.name,
            mobile: w.mobile,
            employeeCode: w.employeeCode,
            email: w.email,
            status: 'ACTIVE'
          }
        });

        await prisma.waiterTableAssignment.createMany({
          data: w.tables.map(t => ({
            waiterId: waiter.id,
            tableNumber: t,
            businessId: String(restaurantId)
          }))
        });
      }

      // Re-fetch
      waiters = await prisma.restaurantWaiter.findMany({
        where: { restaurantId: String(restaurantId) },
        include: { tableAssignments: true },
        orderBy: { name: 'asc' }
      });
    }

    return res.status(200).json(waiters);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const createWaiter = async (req: Request, res: Response) => {
  const { restaurantId, name, mobile, role, employeeCode } = req.body;
  if (!mobile || !/^\d{10}$/.test(mobile)) {
    return res.status(400).json({ error: 'Mobile number must contain exactly 10 digits.' });
  }
  try {
    const waiter = await prisma.restaurantWaiter.create({
      data: {
        restaurantId,
        name,
        mobile,
        role: role || 'Waiter',
        status: 'ACTIVE',
        employeeCode: employeeCode || undefined
      }
    });
    return res.status(201).json(waiter);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const updateWaiterAssignments = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { tableNumbers } = req.body;
  try {
    const waiter = await prisma.restaurantWaiter.findUnique({
      where: { id }
    });
    if (!waiter) {
      return res.status(404).json({ error: 'Waiter not found' });
    }
    const businessId = waiter.restaurantId;

    await prisma.waiterTableAssignment.deleteMany({
      where: { waiterId: id }
    });

    if (Array.isArray(tableNumbers) && tableNumbers.length > 0) {
      const dataToInsert: any[] = [];
      const seen = new Set<string>();

      for (const t of tableNumbers) {
        const cleanT = String(t).trim();
        if (!cleanT) continue;

        if (!seen.has(cleanT)) {
          seen.add(cleanT);
          dataToInsert.push({ waiterId: id, tableNumber: cleanT, businessId });
        }

        const digitMatch = cleanT.match(/\d+/);
        if (digitMatch) {
          const digit = digitMatch[0];
          const alt1 = `Table ${digit}`;
          const alt2 = digit;
          if (!seen.has(alt1)) {
            seen.add(alt1);
            dataToInsert.push({ waiterId: id, tableNumber: alt1, businessId });
          }
          if (!seen.has(alt2)) {
            seen.add(alt2);
            dataToInsert.push({ waiterId: id, tableNumber: alt2, businessId });
          }
        }
      }

      await prisma.waiterTableAssignment.createMany({
        data: dataToInsert
      });
    }

    const updatedWaiter = await prisma.restaurantWaiter.findUnique({
      where: { id },
      include: { tableAssignments: true }
    });

    return res.status(200).json(updatedWaiter);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

// SERVICE TASK ENDPOINTS
export const getServiceTasks = async (req: Request, res: Response) => {
  const { restaurantId } = req.query;
  try {
    const tasks = await prisma.serviceTask.findMany({
      where: {
        kitchenOrder: restaurantId ? {
          table: { restaurantId: String(restaurantId) }
        } : undefined
      },
      include: {
        kitchenOrder: {
          include: {
            items: {
              include: {
                menuItem: true
              }
            },
            table: true
          }
        },
        waiter: {
          include: {
            tableAssignments: true
          }
        }
      },
      orderBy: { assignedAt: 'desc' }
    });
    return res.status(200).json(tasks);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const pickupServiceTask = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { waiterId } = req.body;
  try {
    const now = new Date();
    const task = await prisma.serviceTask.update({
      where: { id },
      data: {
        status: 'picked_up',
        pickedUpAt: now,
        waiterId: waiterId || undefined
      },
      include: {
        kitchenOrder: true
      }
    });

    const order = await prisma.kitchenOrder.update({
      where: { id: task.orderId },
      data: {
        status: 'SERVING',
        waiterStatus: 'SERVING',
        waiterId: waiterId || task.waiterId || undefined,
        pickedUpAt: now
      },
      include: { table: true }
    });

    broadcast('ORDER_STATUS_UPDATE', {
      id: order.id,
      status: 'SERVING',
      waiterStatus: 'SERVING',
      waiterId: order.waiterId,
      pickedUpAt: now,
      task: {
        id: task.id,
        status: 'picked_up',
        pickedUpAt: now,
        waiterId: task.waiterId
      }
    });

    return res.status(200).json({ task, order });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const serveServiceTask = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { waiterId } = req.body;
  try {
    const now = new Date();
    const task = await prisma.serviceTask.update({
      where: { id },
      data: {
        status: 'served',
        servedAt: now,
        waiterId: waiterId || undefined
      },
      include: {
        kitchenOrder: true
      }
    });

    const order = await prisma.kitchenOrder.update({
      where: { id: task.orderId },
      data: {
        status: 'SERVED',
        waiterStatus: 'SERVED',
        waiterId: waiterId || task.waiterId || undefined,
        servedAt: now
      },
      include: {
        table: true,
        items: {
          include: {
            menuItem: true
          }
        }
      }
    });

    if (order.tableId) {
      await prisma.restaurantTable.update({
        where: { id: order.tableId },
        data: {
          status: 'AVAILABLE',
          activeOrderId: null
        }
      });
    }

    const finalWaiterId = waiterId || task.waiterId;
    if (finalWaiterId) {
      await prisma.restaurantWaiter.update({
        where: { id: finalWaiterId },
        data: {
          ordersServed: { increment: 1 },
          salesHandled: { increment: order.totalAmount }
        }
      });
    }

    // Create Billing History Log permanently
    try {
      const waiter = finalWaiterId ? await prisma.restaurantWaiter.findUnique({ where: { id: finalWaiterId } }) : null;
      const waiterName = waiter ? waiter.name : 'Unknown';
      const itemsList = order.items && Array.isArray(order.items)
        ? order.items.map((it: any) => `${it.menuItem?.name || 'Item'} (Qty ${it.quantity})`).join(', ')
        : 'N/A';

      const billDate = now.toLocaleDateString('en-GB'); // DD/MM/YYYY
      const billTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

      const invoiceNumber = `INV-REST-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      await prisma.billingHistory.create({
        data: {
          invoiceNumber,
          tableNumber: order.table?.tableNumber || 'Takeaway',
          orderSource: order.source || 'WALK_IN',
          paymentMode: order.paymentMethod || 'CASH',
          items: itemsList,
          totalAmount: order.totalAmount,
          gst: order.totalAmount * 0.05, // 5% GST for restaurant orders
          waiterName,
          date: billDate,
          time: billTime
        }
      });

      // Create Payment History Log permanently
      await prisma.paymentHistory.create({
        data: {
          orderId: order.id,
          amount: order.totalAmount,
          paymentMode: order.paymentMethod || 'CASH',
          paidBy: order.table?.tableNumber || 'Walk-in Customer'
        }
      });
    } catch (e) {
      console.error('Failed to log billing or payment history:', e);
    }

    broadcast('ORDER_STATUS_UPDATE', {
      id: order.id,
      status: 'SERVED',
      waiterStatus: 'SERVED',
      waiterId: order.waiterId,
      servedAt: now,
      task: {
        id: task.id,
        status: 'served',
        servedAt: now,
        waiterId: task.waiterId
      }
    });

    return res.status(200).json({ task, order });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};


export const getWaiterNotifications = async (req: Request, res: Response) => {
  const { waiterId } = req.query;
  if (!waiterId) return res.status(400).json({ error: 'waiterId is required' });
  try {
    const notifications = await prisma.waiterNotification.findMany({
      where: {
        waiterId: String(waiterId)
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.status(200).json(notifications);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const readWaiterNotification = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const notification = await prisma.waiterNotification.update({
      where: { id },
      data: { isRead: true }
    });
    return res.status(200).json(notification);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const getWaiterTransfers = async (req: Request, res: Response) => {
  try {
    const transfers = await prisma.tableTransfer.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return res.status(200).json(transfers);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const transferWaiterTable = async (req: Request, res: Response) => {
  const { tableNumber, fromWaiterId, toWaiterId, transferredBy } = req.body;
  if (!tableNumber || !fromWaiterId || !toWaiterId) {
    return res.status(400).json({ error: 'tableNumber, fromWaiterId, and toWaiterId are required' });
  }
  try {
    // 1. Delete assignment from source waiter
    try {
      await prisma.waiterTableAssignment.deleteMany({
        where: {
          waiterId: fromWaiterId,
          tableNumber: tableNumber
        }
      });
    } catch (e) {
      console.warn('No source assignment to delete or failed:', e);
    }

    // 2. Add assignment to target waiter
    const waiter = await prisma.restaurantWaiter.findUnique({
      where: { id: toWaiterId }
    });
    if (!waiter) {
      return res.status(404).json({ error: 'Target waiter not found' });
    }

    const assignment = await prisma.waiterTableAssignment.upsert({
      where: {
        waiterId_tableNumber: {
          waiterId: toWaiterId,
          tableNumber: tableNumber
        }
      },
      update: {},
      create: {
        waiterId: toWaiterId,
        tableNumber: tableNumber,
        businessId: waiter.restaurantId
      }
    });

    // 3. Create transfer log
    const transferLog = await prisma.tableTransfer.create({
      data: {
        tableNumber,
        fromWaiterId,
        toWaiterId,
        transferredBy: transferredBy || 'Admin'
      }
    });

    // 4. Send notification to target waiter
    await prisma.waiterNotification.create({
      data: {
        waiterId: toWaiterId,
        orderId: 'N/A',
        title: 'Table Transferred To You',
        message: `${tableNumber} has been transferred to you.`
      }
    });

    // Broadcast update via SSE
    broadcast('NOTIFICATION', {
      type: 'TABLE_ASSIGNMENT_CHANGE',
      waiterId: toWaiterId,
      message: `${tableNumber} assigned to you.`
    });

    return res.status(200).json({ transferLog, assignment });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const assignTable = async (req: Request, res: Response) => {
  const { waiterId, tableNumber } = req.body;
  if (!waiterId || !tableNumber) {
    return res.status(400).json({ error: 'waiterId and tableNumber are required' });
  }
  try {
    const cleanTableNum = String(tableNumber).trim();
    const digitMatch = cleanTableNum.match(/\d+/);
    const digit = digitMatch ? digitMatch[0] : null;
    const lookupNumbers = [cleanTableNum];
    if (digit) {
      lookupNumbers.push(digit);
      lookupNumbers.push(`Table ${digit}`);
    }

    const existing = await prisma.waiterTableAssignment.findFirst({
      where: {
        tableNumber: { in: lookupNumbers }
      },
      include: { waiter: true }
    });

    let previousWaiterName = "None";
    if (existing) {
      if (existing.waiterId === waiterId) {
        return res.status(200).json({ message: 'Table already assigned to this waiter' });
      }
      previousWaiterName = existing.waiter.name;
      // Delete previous table assignments first to keep ownership unique
      await prisma.waiterTableAssignment.deleteMany({
        where: {
          tableNumber: { in: lookupNumbers }
        }
      });
    }

    const waiter = await prisma.restaurantWaiter.findUnique({
      where: { id: waiterId }
    });
    if (!waiter) {
      return res.status(404).json({ error: 'Waiter not found' });
    }

    const uniqueLookupNumbers = Array.from(new Set(lookupNumbers));

    const existingUserAssignments = await prisma.waiterTableAssignment.findMany({
      where: {
        waiterId,
        tableNumber: { in: uniqueLookupNumbers }
      }
    });
    const existingTableNumbers = new Set(existingUserAssignments.map(a => a.tableNumber));
    const toInsert = uniqueLookupNumbers.filter(num => !existingTableNumbers.has(num));

    if (toInsert.length > 0) {
      const dataToInsert = toInsert.map(num => ({
        waiterId,
        tableNumber: num,
        businessId: waiter.restaurantId
      }));

      await prisma.waiterTableAssignment.createMany({
        data: dataToInsert,
        skipDuplicates: true
      });
    }

    await prisma.tableAssignmentHistory.create({
      data: {
        tableNumber: cleanTableNum,
        previousWaiter: previousWaiterName,
        currentWaiter: waiter.name,
        assignedBy: "Admin"
      }
    });

    await prisma.waiterNotification.create({
      data: {
        waiterId,
        orderId: 'N/A',
        title: 'New Table Assigned',
        message: `${cleanTableNum} has been assigned to you.`
      }
    });

    broadcast('NOTIFICATION', {
      type: 'TABLE_ASSIGNMENT_CHANGE',
      waiterId,
      message: `${cleanTableNum} assigned to you.`
    });

    return res.status(200).json({ message: 'Table assigned successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const unassignTable = async (req: Request, res: Response) => {
  const { tableNumber } = req.body;
  if (!tableNumber) {
    return res.status(400).json({ error: 'tableNumber is required' });
  }
  try {
    const cleanTableNum = String(tableNumber).trim();
    const digitMatch = cleanTableNum.match(/\d+/);
    const digit = digitMatch ? digitMatch[0] : null;
    const lookupNumbers = [cleanTableNum];
    if (digit) {
      lookupNumbers.push(digit);
      lookupNumbers.push(`Table ${digit}`);
    }

    const assignments = await prisma.waiterTableAssignment.findMany({
      where: {
        tableNumber: { in: lookupNumbers }
      },
      include: { waiter: true }
    });

    if (assignments.length === 0) {
      return res.status(400).json({ error: 'No assignments found for this table' });
    }

    const waiterName = assignments[0].waiter.name;

    await prisma.waiterTableAssignment.deleteMany({
      where: {
        tableNumber: { in: lookupNumbers }
      }
    });

    await prisma.tableAssignmentHistory.create({
      data: {
        tableNumber: cleanTableNum,
        previousWaiter: waiterName,
        currentWaiter: "None",
        assignedBy: "Admin"
      }
    });

    broadcast('NOTIFICATION', {
      type: 'TABLE_ASSIGNMENT_CHANGE',
      message: `${cleanTableNum} unassigned.`
    });

    return res.status(200).json({ message: 'Table unassigned successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const getAssignmentHistory = async (req: Request, res: Response) => {
  try {
    const logs = await prisma.tableAssignmentHistory.findMany({
      orderBy: { assignedAt: 'desc' }
    });
    return res.status(200).json(logs);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};



// 7. RESERVATION SYSTEM
export const getReservations = async (req: Request, res: Response) => {
  const { restaurantId } = req.query;
  try {
    const reservations = await prisma.restaurantReservation.findMany({
      where: {
        table: { restaurantId: String(restaurantId) }
      },
      include: { table: true },
      orderBy: [
        { date: 'desc' },
        { time: 'asc' }
      ]
    });
    return res.status(200).json(reservations);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const createReservation = async (req: Request, res: Response) => {
  const { customerName, mobileNumber, date, time, guests, tableId } = req.body;
  try {
    const reservation = await prisma.restaurantReservation.create({
      data: {
        customerName,
        mobileNumber,
        date,
        time,
        guests: Number(guests),
        tableId,
        status: 'RESERVED'
      }
    });

    // Mark table status
    await prisma.restaurantTable.update({
      where: { id: tableId },
      data: { status: 'RESERVED' }
    });

    return res.status(201).json(reservation);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const updateReservationStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body; // RESERVED, CHECKED_IN, COMPLETED, CANCELLED
  try {
    const resv = await prisma.restaurantReservation.update({
      where: { id },
      data: { status },
      include: { table: true }
    });

    if (status === 'CHECKED_IN') {
      await prisma.restaurantTable.update({
        where: { id: resv.tableId },
        data: { status: 'OCCUPIED' }
      });
    } else if (status === 'COMPLETED' || status === 'CANCELLED') {
      await prisma.restaurantTable.update({
        where: { id: resv.tableId },
        data: { status: 'AVAILABLE' }
      });
    }

    return res.status(200).json(resv);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

// 8. RECIPES & INGREDIENT INVENTORY
export const getIngredients = async (req: Request, res: Response) => {
  try {
    const ingredients = await prisma.ingredient.findMany({
      orderBy: { name: 'asc' }
    });
    return res.status(200).json(ingredients);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const createIngredient = async (req: Request, res: Response) => {
  const { name, unit, stock, reorderLevel } = req.body;
  try {
    const ing = await prisma.ingredient.create({
      data: {
        name,
        unit: unit || 'PCS',
        stock: Number(stock) || 0,
        reorderLevel: Number(reorderLevel) || 10
      }
    });
    return res.status(201).json(ing);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const updateIngredientStock = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { stock } = req.body;
  try {
    const ing = await prisma.ingredient.update({
      where: { id },
      data: { stock: Number(stock) }
    });
    return res.status(200).json(ing);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const getRecipes = async (req: Request, res: Response) => {
  try {
    const recipes = await prisma.recipe.findMany({
      include: {
        menuItem: true,
        ingredients: {
          include: {
            ingredient: true
          }
        }
      }
    });
    return res.status(200).json(recipes);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const createRecipe = async (req: Request, res: Response) => {
  const { menuItemId, name, ingredients } = req.body; // ingredients: [{ ingredientId, quantity }]
  try {
    const recipe = await prisma.recipe.create({
      data: {
        menuItemId,
        name: name || 'Custom Recipe',
        ingredients: {
          create: ingredients.map((ing: any) => ({
            ingredientId: ing.ingredientId,
            quantity: Number(ing.quantity)
          }))
        }
      },
      include: {
        ingredients: true
      }
    });
    return res.status(201).json(recipe);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

// 9. SWIGGY / ZOMATO / ONLINE CHANNELS
export const getOnlineOrders = async (req: Request, res: Response) => {
  try {
    const orders = await prisma.restaurantOnlineOrder.findMany({
      include: {
        kitchenOrder: {
          include: {
            items: {
              include: {
                menuItem: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.status(200).json(orders);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const simulateOnlineOrder = async (req: Request, res: Response) => {
  const { source, items } = req.body; // source: SWIGGY or ZOMATO, items: [{ menuItemId, quantity, unitPrice }]
  try {
    let total = 0;
    const orderItemsData = items.map((it: any) => {
      total += it.unitPrice * it.quantity;
      return {
        menuItemId: it.menuItemId,
        quantity: it.quantity,
        unitPrice: it.unitPrice
      };
    });

    const kOrder = await prisma.kitchenOrder.create({
      data: {
        source,
        status: 'NEW',
        totalAmount: total,
        paymentStatus: 'PAID',
        paymentMethod: 'UPI',
        items: {
          create: orderItemsData
        }
      }
    });

    const commission = parseFloat((total * 0.15).toFixed(2));
    const revenue = parseFloat((total - commission).toFixed(2));

    const onlineOrder = await prisma.restaurantOnlineOrder.create({
      data: {
        kitchenOrderId: kOrder.id,
        orderSource: source,
        commission,
        revenue,
        status: 'ACCEPTED',
        paymentStatus: 'PAID'
      }
    });

    // Deduct ingredients automatically
    for (const it of items) {
      await deductRecipeIngredients(it.menuItemId, it.quantity);
    }

    return res.status(201).json(onlineOrder);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

// 10. FEEDBACK
export const submitFeedback = async (req: Request, res: Response) => {
  const { kitchenOrderId, rating, comments, customerName } = req.body;
  try {
    const fb = await prisma.restaurantFeedback.create({
      data: {
        kitchenOrderId,
        rating: Number(rating),
        comments,
        customerName
      }
    });
    return res.status(201).json(fb);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

// 11. REPORTS
export const getReports = async (req: Request, res: Response) => {
  const { restaurantId } = req.query;
  try {
    const orders = await prisma.kitchenOrder.findMany({
      where: {
        OR: [
          { tableId: null },
          { table: { restaurantId: String(restaurantId) } }
        ],
        status: { not: 'CANCELLED' }
      },
      include: {
        items: {
          include: {
            menuItem: true
          }
        },
        table: true
      }
    });

    // Table Revenue
    const tableRevenue: Record<string, number> = {};
    orders.forEach(o => {
      if (o.table) {
        const tableNum = o.table.tableNumber;
        tableRevenue[tableNum] = (tableRevenue[tableNum] || 0) + o.totalAmount;
      }
    });

    // Popular Dishes
    const dishes: Record<string, { quantity: number, revenue: number }> = {};
    orders.forEach(o => {
      o.items.forEach(it => {
        const name = it.menuItem.name;
        if (!dishes[name]) dishes[name] = { quantity: 0, revenue: 0 };
        dishes[name].quantity += it.quantity;
        dishes[name].revenue += it.quantity * it.unitPrice;
      });
    });

    // Online Source Revenue
    const onlineOrders = await prisma.restaurantOnlineOrder.findMany({
      include: { kitchenOrder: true }
    });
    const swiggyRevenue = onlineOrders.filter(o => o.orderSource === 'SWIGGY').reduce((sum, o) => sum + o.revenue, 0);
    const zomatoRevenue = onlineOrders.filter(o => o.orderSource === 'ZOMATO').reduce((sum, o) => sum + o.revenue, 0);

    // Waiter performance
    const waiters = await prisma.restaurantWaiter.findMany({
      where: { restaurantId: String(restaurantId) }
    });

    return res.status(200).json({
      totalSales: orders.reduce((sum, o) => sum + o.totalAmount, 0),
      tableRevenue,
      popularDishes: Object.entries(dishes).map(([name, data]) => ({ name, ...data })),
      swiggyRevenue,
      zomatoRevenue,
      waiters: waiters.map(w => ({ name: w.name, orders: w.ordersServed, sales: w.salesHandled }))
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const getKitchenOrderById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const order = await prisma.kitchenOrder.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            menuItem: true
          }
        },
        table: true
      }
    });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    return res.status(200).json(order);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};
export const uploadImage = async (req: Request, res: Response) => {
  const { image } = req.body;
  try {
    if (!image) {
      return res.status(400).json({ message: 'Image data is required' });
    }
    const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
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
      buffer = Buffer.from(image, 'base64');
    }

    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${extension}`;
    const filePath = path.join(uploadsDir, uniqueName);
    fs.writeFileSync(filePath, buffer);

    const relativePath = `/uploads/${uniqueName}`;
    return res.status(200).json({
      url: relativePath,
      message: 'Image uploaded successfully'
    });
  } catch (error: any) {
    console.error('Error uploading image:', error);
    return res.status(500).json({ message: 'Failed to upload image', error: error.message });
  }
};

export const handleRealtime = async (req: Request, res: Response) => {
  const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });

  res.write('\n');
  addClient(clientId, res);

  const keepAliveInterval = setInterval(() => {
    res.write(': keep-alive\n\n');
  }, 30000);

  req.on('close', () => {
    clearInterval(keepAliveInterval);
    removeClient(clientId);
  });
};

export const createKitchenOrder = async (req: Request, res: Response) => {
  const { tableId, source, items, notes, waiterId, paymentMethod, paymentStatus } = req.body;
  try {
    let tableName = 'Takeaway';
    if (tableId) {
      const table = await prisma.restaurantTable.findUnique({ where: { id: tableId } });
      if (table) {
        tableName = table.tableNumber;
      }
    }

    let total = 0;
    const orderItemsData = items.map((it: any) => {
      const subtotal = it.unitPrice * it.quantity;
      total += subtotal;
      return {
        menuItemId: it.menuItemId,
        quantity: it.quantity,
        notes: it.notes || null,
        unitPrice: it.unitPrice
      };
    });

    const order = await prisma.kitchenOrder.create({
      data: {
        tableId: tableId || null,
        source: source || 'WAITER',
        status: 'NEW',
        notes: notes || null,
        waiterId: waiterId || null,
        totalAmount: total,
        paymentStatus: paymentStatus || 'PENDING',
        paymentMethod: paymentMethod || 'CASH',
        items: {
          create: orderItemsData
        }
      },
      include: {
        items: true
      }
    });

    if (tableId) {
      await prisma.restaurantTable.update({
        where: { id: tableId },
        data: {
          status: 'OCCUPIED',
          activeOrderId: order.id
        }
      });
    }

    for (const it of items) {
      await deductRecipeIngredients(it.menuItemId, it.quantity);
    }

    const fullOrder = await prisma.kitchenOrder.findUnique({
      where: { id: order.id },
      include: {
        items: {
          include: {
            menuItem: true
          }
        },
        table: true
      }
    });

    broadcast('NEW_ORDER', fullOrder);

    return res.status(201).json(order);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const getRestaurantBillingHistory = async (req: Request, res: Response) => {
  try {
    const history = await prisma.billingHistory.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return res.status(200).json(history);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const getTableHistoryLogs = async (req: Request, res: Response) => {
  const { tableNumber } = req.params;
  try {
    const cleanNum = tableNumber.replace('Table ', '');
    const bills = await prisma.billingHistory.findMany({
      where: {
        OR: [
          { tableNumber: `Table ${cleanNum}` },
          { tableNumber: cleanNum }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.status(200).json(bills);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const editWaiter = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, mobile, role, status, employeeCode } = req.body;
  if (!mobile || !/^\d{10}$/.test(mobile)) {
    return res.status(400).json({ error: 'Mobile number must contain exactly 10 digits.' });
  }
  try {
    const waiter = await prisma.restaurantWaiter.update({
      where: { id },
      data: {
        name,
        mobile,
        role: role || undefined,
        status: status || undefined,
        employeeCode: employeeCode === null ? null : (employeeCode || undefined)
      }
    });
    return res.status(200).json(waiter);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const deleteWaiter = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { transferToWaiterId, reason } = req.body;
  try {
    const waiter = await prisma.restaurantWaiter.findUnique({
      where: { id }
    });
    if (!waiter) {
      return res.status(404).json({ error: 'Waiter not found' });
    }

    const assignments = await prisma.waiterTableAssignment.findMany({
      where: { waiterId: id }
    });

    if (transferToWaiterId && transferToWaiterId !== 'remove') {
      const targetWaiter = await prisma.restaurantWaiter.findUnique({
        where: { id: transferToWaiterId }
      });
      if (!targetWaiter) {
        return res.status(404).json({ error: 'Target waiter for transfer not found' });
      }

      // Transfer assignments
      for (const assignment of assignments) {
        // Check if target waiter already has this table assigned
        const alreadyAssigned = await prisma.waiterTableAssignment.findFirst({
          where: { waiterId: transferToWaiterId, tableNumber: assignment.tableNumber }
        });
        if (!alreadyAssigned) {
          await prisma.waiterTableAssignment.update({
            where: { id: assignment.id },
            data: { waiterId: transferToWaiterId }
          });
        } else {
          // Delete the redundant assignment
          await prisma.waiterTableAssignment.delete({
            where: { id: assignment.id }
          });
        }

        await prisma.tableAssignmentHistory.create({
          data: {
            tableNumber: assignment.tableNumber,
            previousWaiter: waiter.name,
            currentWaiter: targetWaiter.name,
            assignedBy: "Admin"
          }
        });
      }
    } else {
      // Remove assignments
      for (const assignment of assignments) {
        await prisma.tableAssignmentHistory.create({
          data: {
            tableNumber: assignment.tableNumber,
            previousWaiter: waiter.name,
            currentWaiter: "None",
            assignedBy: "Admin"
          }
        });
      }
      await prisma.waiterTableAssignment.deleteMany({
        where: { waiterId: id }
      });
    }

    // Delete waiter
    await prisma.restaurantWaiter.delete({
      where: { id }
    });

    // Write Audit Log
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0];
    const auditId = require('crypto').randomUUID();

    await prisma.$executeRawUnsafe(
      `INSERT INTO audit_history (id, action, target_id, target_name, deleted_by, date, time, reason, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      auditId,
      'DELETE_WAITER',
      id,
      waiter.name,
      'Admin',
      dateStr,
      timeStr,
      reason || 'Staff Resigned/No longer working'
    );

    broadcast('NOTIFICATION', {
      type: 'TABLE_ASSIGNMENT_CHANGE',
      message: `Waiter ${waiter.name} deleted.`
    });

    return res.status(200).json({ message: 'Waiter deleted successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const editTable = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { tableNumber, capacity } = req.body;
  try {
    const table = await prisma.restaurantTable.update({
      where: { id },
      data: {
        tableNumber,
        capacity: Number(capacity) || 4
      }
    });
    return res.status(200).json(table);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const deleteTable = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;
  try {
    const table = await prisma.restaurantTable.findUnique({
      where: { id }
    });
    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }

    const cleanTableNum = table.tableNumber.trim();
    const digitMatch = cleanTableNum.match(/\d+/);
    const digit = digitMatch ? digitMatch[0] : null;
    const lookupNumbers = [cleanTableNum];
    if (digit) {
      lookupNumbers.push(digit);
      lookupNumbers.push(`Table ${digit}`);
    }

    // Find existing assignments to log previous waiter
    const assignments = await prisma.waiterTableAssignment.findMany({
      where: { tableNumber: { in: lookupNumbers } },
      include: { waiter: true }
    });

    let previousWaiter = "None";
    if (assignments.length > 0) {
      previousWaiter = assignments[0].waiter.name;
    }

    // Delete assignments
    await prisma.waiterTableAssignment.deleteMany({
      where: { tableNumber: { in: lookupNumbers } }
    });

    // Write assignment history
    await prisma.tableAssignmentHistory.create({
      data: {
        tableNumber: cleanTableNum,
        previousWaiter,
        currentWaiter: "None",
        assignedBy: "Admin"
      }
    });

    // Delete table
    await prisma.restaurantTable.delete({
      where: { id }
    });

    // Write Audit Log
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0];
    const auditId = require('crypto').randomUUID();

    await prisma.$executeRawUnsafe(
      `INSERT INTO audit_history (id, action, target_id, target_name, deleted_by, date, time, reason, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      auditId,
      'DELETE_TABLE',
      id,
      table.tableNumber,
      'Admin',
      dateStr,
      timeStr,
      reason || 'Removed from layout'
    );

    broadcast('NOTIFICATION', {
      type: 'TABLE_ASSIGNMENT_CHANGE',
      message: `Table ${table.tableNumber} deleted.`
    });

    return res.status(200).json({ message: 'Table deleted successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};


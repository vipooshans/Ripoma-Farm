import Order from '../models/Order.js';
import Product from '../models/Product.js';
import InventoryLog from '../models/Inventory.js';
import Transaction from '../models/Transaction.js';
import Notification from '../models/Notification.js';
import { jsonDb } from '../utils/jsonDb.js';
import { formatPrice } from '../utils/currency.js';

// Helper to check stock and trigger low stock alerts
const handleStockReduction = async (productId, variantName, qtyOrdered, orderId, userName) => {
  const threshold = 10;
  
  if (global.dbConnected) {
    const product = await Product.findById(productId);
    if (!product) return;

    let newStock = 0;
    if (variantName && product.variants && product.variants.length > 0) {
      const variant = product.variants.find(v => v.name === variantName);
      if (variant) {
        variant.stock = Math.max(0, variant.stock - qtyOrdered);
        newStock = variant.stock;
      }
      product.stock = product.variants.reduce((acc, v) => acc + (v.stock || 0), 0);
    } else {
      product.stock = Math.max(0, product.stock - qtyOrdered);
      newStock = product.stock;
    }
    await product.save();

    // Log to inventory log
    await InventoryLog.create({
      productId: product._id,
      productName: product.name,
      variantName: variantName || '',
      changeType: 'sale',
      quantityChanged: -qtyOrdered,
      stockAfterChange: newStock,
      description: `Sold in Order #${orderId}`,
      performedBy: userName,
    });

    // Alert if low stock
    if (newStock < threshold) {
      await Notification.create({
        title: 'Low Stock Alert',
        message: `Product "${product.name}" (${variantName || 'Base'}) is running low. Current stock: ${newStock}`,
        type: 'warning',
        roleRecipient: 'admin',
      });
    }
  } else {
    // JSON DB Flow
    const product = jsonDb.findById('products', productId);
    if (!product) return;

    let newStock = 0;
    let updatedVariants = [...(product.variants || [])];

    if (variantName && updatedVariants.length > 0) {
      const idx = updatedVariants.findIndex(v => v.name === variantName);
      if (idx !== -1) {
        updatedVariants[idx].stock = Math.max(0, updatedVariants[idx].stock - qtyOrdered);
        newStock = updatedVariants[idx].stock;
      }
      const totalStock = updatedVariants.reduce((acc, v) => acc + (v.stock || 0), 0);
      jsonDb.findByIdAndUpdate('products', productId, {
        variants: updatedVariants,
        stock: totalStock
      });
    } else {
      newStock = Math.max(0, product.stock - qtyOrdered);
      jsonDb.findByIdAndUpdate('products', productId, { stock: newStock });
    }

    // Log to inventory log
    jsonDb.create('inventorylogs', {
      productId: product._id,
      productName: product.name,
      variantName: variantName || '',
      changeType: 'sale',
      quantityChanged: -qtyOrdered,
      stockAfterChange: newStock,
      description: `Sold in Order #${orderId}`,
      performedBy: userName,
    });

    // Alert if low stock
    if (newStock < threshold) {
      jsonDb.create('notifications', {
        title: 'Low Stock Alert',
        message: `Product "${product.name}" (${variantName || 'Base'}) is running low. Current stock: ${newStock}`,
        type: 'warning',
        roleRecipient: 'admin',
      });
    }
  }
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Private/Public (allow checking out, protect extracts user id if logged in)
export const createOrder = async (req, res) => {
  const { customerDetails, items, subtotal, shippingFee, tax, total, paymentMethod } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ message: 'No order items' });
  }

  try {
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const userId = req.user ? req.user._id : null;
    const userName = req.user ? req.user.name : customerDetails.name;

    let order = null;

    if (global.dbConnected) {
      order = new Order({
        user: userId,
        customerDetails,
        items,
        subtotal,
        shippingFee,
        tax,
        total,
        paymentMethod,
        paymentStatus: (paymentMethod === 'Cash on Delivery' || paymentMethod.includes('WhatsApp') || paymentMethod.includes('Bank')) ? 'pending' : 'paid',
        invoiceNumber,
      });

      const createdOrder = await order.save();

      // Side Effects: Stock reduction & Financial Log
      let totalCost = 0;
      for (const item of items) {
        totalCost += (item.costPrice || 0) * item.quantity;
        await handleStockReduction(item.productId, item.variantName, item.quantity, createdOrder._id, userName);
      }

      // Log Transaction (Income)
      await Transaction.create({
        type: 'income',
        amount: total,
        costOfGoods: totalCost,
        category: 'sales',
        description: `Revenue from Order #${createdOrder._id} (Invoice: ${invoiceNumber})`,
        referenceId: createdOrder._id.toString(),
      });

      // Notify admin of new order
      await Notification.create({
        title: 'New Order Received',
        message: `Order #${createdOrder._id} was placed by ${userName} for a total of ${formatPrice(total)}`,
        type: 'success',
        roleRecipient: 'admin',
      });

      res.status(201).json(createdOrder);
    } else {
      // JSON DB flow
      const newOrder = jsonDb.create('orders', {
        user: userId,
        customerDetails,
        items,
        subtotal: Number(subtotal),
        shippingFee: Number(shippingFee),
        tax: Number(tax),
        total: Number(total),
        paymentMethod,
        paymentStatus: (paymentMethod === 'Cash on Delivery' || paymentMethod.includes('WhatsApp') || paymentMethod.includes('Bank')) ? 'pending' : 'paid',
        orderStatus: 'Pending',
        invoiceNumber,
      });

      let totalCost = 0;
      for (const item of items) {
        totalCost += (item.costPrice || 0) * item.quantity;
        await handleStockReduction(item.productId, item.variantName, item.quantity, newOrder._id, userName);
      }

      // Log Transaction
      jsonDb.create('transactions', {
        type: 'income',
        amount: Number(total),
        costOfGoods: Number(totalCost),
        category: 'sales',
        description: `Revenue from Order #${newOrder._id} (Invoice: ${invoiceNumber})`,
        referenceId: newOrder._id,
      });

      // Notify Admin
      jsonDb.create('notifications', {
        title: 'New Order Received',
        message: `Order #${newOrder._id} was placed by ${userName} for a total of ${formatPrice(total)}`,
        type: 'success',
        roleRecipient: 'admin',
      });

      res.status(201).json(newOrder);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
export const getMyOrders = async (req, res) => {
  try {
    let orders = [];
    if (global.dbConnected) {
      orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    } else {
      orders = jsonDb.find('orders', o => o.user === req.user._id);
      orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req, res) => {
  const { id } = req.params;

  try {
    let order = null;
    if (global.dbConnected) {
      order = await Order.findById(id).populate('user', 'name email');
    } else {
      order = jsonDb.findById('orders', id);
    }

    if (order) {
      // Check authorization (must be admin/worker, or the user who placed it)
      const isOwner = req.user.role === 'admin' || req.user.role === 'worker' || (order.user && order.user.toString() === req.user._id.toString());
      if (!isOwner) {
        return res.status(403).json({ message: 'Not authorized to view this order' });
      }
      res.json(order);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/WorkerOrAdmin
export const getOrders = async (req, res) => {
  try {
    let orders = [];
    if (global.dbConnected) {
      orders = await Order.find({}).sort({ createdAt: -1 });
    } else {
      orders = jsonDb.find('orders');
      orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/WorkerOrAdmin
export const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { orderStatus, paymentStatus, trackingNumber } = req.body;

  try {
    if (global.dbConnected) {
      const order = await Order.findById(id);

      if (order) {
        order.orderStatus = orderStatus || order.orderStatus;
        order.paymentStatus = paymentStatus || order.paymentStatus;
        if (trackingNumber !== undefined) order.trackingNumber = trackingNumber;

        const updatedOrder = await order.save();

        // Notify Customer if order status changed
        if (order.user) {
          await Notification.create({
            title: `Order #${order._id} Updated`,
            message: `Your order status is now: ${order.orderStatus}. Tracking: ${order.trackingNumber || 'N/A'}`,
            type: 'info',
            roleRecipient: 'customer',
            userId: order.user,
          });
        }

        res.json(updatedOrder);
      } else {
        res.status(404).json({ message: 'Order not found' });
      }
    } else {
      const order = jsonDb.findById('orders', id);
      if (order) {
        const updatedOrder = jsonDb.findByIdAndUpdate('orders', id, {
          orderStatus: orderStatus || order.orderStatus,
          paymentStatus: paymentStatus || order.paymentStatus,
          trackingNumber: trackingNumber !== undefined ? trackingNumber : order.trackingNumber,
        });

        // Notify Customer
        if (order.user) {
          jsonDb.create('notifications', {
            title: `Order #${order._id} Updated`,
            message: `Your order status is now: ${order.orderStatus}. Tracking: ${order.trackingNumber || 'N/A'}`,
            type: 'info',
            roleRecipient: 'customer',
            userId: order.user,
          });
        }

        res.json(updatedOrder);
      } else {
        res.status(404).json({ message: 'Order not found' });
      }
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const { pool } = require('../config/database');

/**
 * Generate unique ID with prefix
 */
const generateId = (prefix) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = prefix;
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Create a new order
 */
const createOrder = async (merchantId, orderData) => {
  const { amount, currency = 'INR', receipt = null, notes = null } = orderData;
  
  // Validate amount
  if (!amount || amount < 100) {
    throw { status: 400, code: 'BAD_REQUEST_ERROR', message: 'amount must be at least 100' };
  }
  
  // Generate unique order ID
  let orderId;
  let isUnique = false;
  
  while (!isUnique) {
    orderId = generateId('order_');
    const existing = await pool.query('SELECT id FROM orders WHERE id = $1', [orderId]);
    if (existing.rows.length === 0) {
      isUnique = true;
    }
  }
  
  const result = await pool.query(
    `INSERT INTO orders (id, merchant_id, amount, currency, receipt, notes, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, 'created', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     RETURNING id, merchant_id, amount, currency, receipt, notes, status, created_at`,
    [orderId, merchantId, amount, currency, receipt, notes ? JSON.stringify(notes) : null]
  );
  
  const order = result.rows[0];
  return {
    id: order.id,
    merchant_id: order.merchant_id,
    amount: order.amount,
    currency: order.currency,
    receipt: order.receipt,
    notes: order.notes || {},
    status: order.status,
    created_at: order.created_at.toISOString()
  };
};

/**
 * Get order by ID
 */
const getOrderById = async (orderId, merchantId) => {
  const result = await pool.query(
    'SELECT id, merchant_id, amount, currency, receipt, notes, status, created_at, updated_at FROM orders WHERE id = $1 AND merchant_id = $2',
    [orderId, merchantId]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  const order = result.rows[0];
  return {
    id: order.id,
    merchant_id: order.merchant_id,
    amount: order.amount,
    currency: order.currency,
    receipt: order.receipt,
    notes: order.notes || {},
    status: order.status,
    created_at: order.created_at.toISOString(),
    updated_at: order.updated_at.toISOString()
  };
};

/**
 * Get order by ID (public - no merchant verification)
 */
const getOrderByIdPublic = async (orderId) => {
  const result = await pool.query(
    'SELECT id, merchant_id, amount, currency, status, created_at FROM orders WHERE id = $1',
    [orderId]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  const order = result.rows[0];
  return {
    id: order.id,
    merchant_id: order.merchant_id,
    amount: order.amount,
    currency: order.currency,
    status: order.status,
    created_at: order.created_at.toISOString()
  };
};

/**
 * Get all orders for a merchant
 */
const getOrdersByMerchant = async (merchantId) => {
  const result = await pool.query(
    'SELECT id, merchant_id, amount, currency, receipt, notes, status, created_at, updated_at FROM orders WHERE merchant_id = $1 ORDER BY created_at DESC',
    [merchantId]
  );
  
  return result.rows.map(order => ({
    id: order.id,
    merchant_id: order.merchant_id,
    amount: order.amount,
    currency: order.currency,
    receipt: order.receipt,
    notes: order.notes || {},
    status: order.status,
    created_at: order.created_at.toISOString(),
    updated_at: order.updated_at.toISOString()
  }));
};

/**
 * Update order status
 */
const updateOrderStatus = async (orderId, status) => {
  await pool.query(
    'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [status, orderId]
  );
};

module.exports = {
  createOrder,
  getOrderById,
  getOrderByIdPublic,
  getOrdersByMerchant,
  updateOrderStatus,
  generateId
};

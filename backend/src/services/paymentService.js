const { pool } = require('../config/database');
const { generateId } = require('./orderService');
const { validateVPA, validateCard } = require('./validationService');

/**
 * Get processing delay based on configuration
 */
const getProcessingDelay = () => {
  const testMode = process.env.TEST_MODE === 'true';
  
  if (testMode) {
    return parseInt(process.env.TEST_PROCESSING_DELAY, 10) || 1000;
  }
  
  const min = parseInt(process.env.PROCESSING_DELAY_MIN, 10) || 5000;
  const max = parseInt(process.env.PROCESSING_DELAY_MAX, 10) || 10000;
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Determine payment success based on configuration
 */
const determinePaymentSuccess = (method) => {
  const testMode = process.env.TEST_MODE === 'true';
  
  if (testMode) {
    return process.env.TEST_PAYMENT_SUCCESS !== 'false';
  }
  
  const successRate = method === 'upi' 
    ? parseFloat(process.env.UPI_SUCCESS_RATE) || 0.90
    : parseFloat(process.env.CARD_SUCCESS_RATE) || 0.95;
  
  return Math.random() < successRate;
};

/**
 * Sleep utility for processing delay
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Create a new payment
 */
const createPayment = async (merchantId, paymentData) => {
  const { order_id, method, vpa, card } = paymentData;
  
  // Validate order exists and belongs to merchant
  const orderResult = await pool.query(
    'SELECT id, merchant_id, amount, currency, status FROM orders WHERE id = $1',
    [order_id]
  );
  
  if (orderResult.rows.length === 0) {
    throw { status: 404, code: 'NOT_FOUND_ERROR', message: 'Order not found' };
  }
  
  const order = orderResult.rows[0];
  
  if (order.merchant_id !== merchantId) {
    throw { status: 404, code: 'NOT_FOUND_ERROR', message: 'Order not found' };
  }
  
  if (order.status === 'paid') {
    throw { status: 400, code: 'BAD_REQUEST_ERROR', message: 'Order has already been paid' };
  }
  
  // Validate payment method
  if (!method || !['upi', 'card'].includes(method)) {
    throw { status: 400, code: 'BAD_REQUEST_ERROR', message: 'Invalid payment method. Must be "upi" or "card"' };
  }
  
  let paymentDetails = {};
  
  // Validate method-specific fields
  if (method === 'upi') {
    const vpaValidation = validateVPA(vpa);
    if (!vpaValidation.valid) {
      throw { status: 400, code: 'INVALID_VPA', message: vpaValidation.error };
    }
    paymentDetails.vpa = vpa;
  } else if (method === 'card') {
    const cardValidation = validateCard(card);
    if (!cardValidation.valid) {
      throw { status: 400, code: cardValidation.code || 'INVALID_CARD', message: cardValidation.error };
    }
    paymentDetails.card_network = cardValidation.cardNetwork;
    paymentDetails.card_last4 = cardValidation.cardLast4;
  }
  
  // Generate unique payment ID
  let paymentId;
  let isUnique = false;
  
  while (!isUnique) {
    paymentId = generateId('pay_');
    const existing = await pool.query('SELECT id FROM payments WHERE id = $1', [paymentId]);
    if (existing.rows.length === 0) {
      isUnique = true;
    }
  }
  
  // Create payment record with status 'processing'
  const insertResult = await pool.query(
    `INSERT INTO payments (id, order_id, merchant_id, amount, currency, method, status, vpa, card_network, card_last4, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, 'processing', $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     RETURNING id, order_id, amount, currency, method, status, vpa, card_network, card_last4, created_at`,
    [
      paymentId,
      order_id,
      merchantId,
      order.amount,
      order.currency,
      method,
      paymentDetails.vpa || null,
      paymentDetails.card_network || null,
      paymentDetails.card_last4 || null
    ]
  );
  
  const payment = insertResult.rows[0];
  
  // Build initial response
  const response = {
    id: payment.id,
    order_id: payment.order_id,
    amount: payment.amount,
    currency: payment.currency,
    method: payment.method,
    status: payment.status,
    created_at: payment.created_at.toISOString()
  };
  
  if (method === 'upi') {
    response.vpa = payment.vpa;
  } else if (method === 'card') {
    response.card_network = payment.card_network;
    response.card_last4 = payment.card_last4;
  }
  
  // Process payment asynchronously
  processPayment(paymentId, order_id, method);
  
  return response;
};

/**
 * Process payment (simulate bank processing)
 */
const processPayment = async (paymentId, orderId, method) => {
  try {
    // Wait for processing delay
    const delay = getProcessingDelay();
    await sleep(delay);
    
    // Determine success/failure
    const isSuccess = determinePaymentSuccess(method);
    
    if (isSuccess) {
      // Update payment status to success
      await pool.query(
        'UPDATE payments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['success', paymentId]
      );
      
      // Update order status to paid
      await pool.query(
        'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['paid', orderId]
      );
    } else {
      // Update payment status to failed
      const errorCode = method === 'upi' ? 'UPI_TRANSACTION_FAILED' : 'CARD_TRANSACTION_FAILED';
      const errorDescription = method === 'upi' 
        ? 'UPI transaction failed. Please try again.' 
        : 'Card transaction declined by bank.';
      
      await pool.query(
        'UPDATE payments SET status = $1, error_code = $2, error_description = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4',
        ['failed', errorCode, errorDescription, paymentId]
      );
    }
  } catch (error) {
    console.error('Payment processing error:', error);
    
    // Update payment status to failed on error
    await pool.query(
      'UPDATE payments SET status = $1, error_code = $2, error_description = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4',
      ['failed', 'PROCESSING_ERROR', 'An error occurred while processing the payment', paymentId]
    );
  }
};

/**
 * Get payment by ID
 */
const getPaymentById = async (paymentId, merchantId) => {
  const result = await pool.query(
    `SELECT id, order_id, amount, currency, method, status, vpa, card_network, card_last4, 
            error_code, error_description, created_at, updated_at 
     FROM payments WHERE id = $1 AND merchant_id = $2`,
    [paymentId, merchantId]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  const payment = result.rows[0];
  const response = {
    id: payment.id,
    order_id: payment.order_id,
    amount: payment.amount,
    currency: payment.currency,
    method: payment.method,
    status: payment.status,
    created_at: payment.created_at.toISOString(),
    updated_at: payment.updated_at.toISOString()
  };
  
  if (payment.method === 'upi' && payment.vpa) {
    response.vpa = payment.vpa;
  } else if (payment.method === 'card') {
    if (payment.card_network) response.card_network = payment.card_network;
    if (payment.card_last4) response.card_last4 = payment.card_last4;
  }
  
  if (payment.status === 'failed') {
    if (payment.error_code) response.error_code = payment.error_code;
    if (payment.error_description) response.error_description = payment.error_description;
  }
  
  return response;
};

/**
 * Get payment by ID (public - for checkout page)
 */
const getPaymentByIdPublic = async (paymentId) => {
  const result = await pool.query(
    `SELECT id, order_id, amount, currency, method, status, vpa, card_network, card_last4, 
            error_code, error_description, created_at, updated_at 
     FROM payments WHERE id = $1`,
    [paymentId]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  const payment = result.rows[0];
  const response = {
    id: payment.id,
    order_id: payment.order_id,
    amount: payment.amount,
    currency: payment.currency,
    method: payment.method,
    status: payment.status,
    created_at: payment.created_at.toISOString(),
    updated_at: payment.updated_at.toISOString()
  };
  
  if (payment.method === 'upi' && payment.vpa) {
    response.vpa = payment.vpa;
  } else if (payment.method === 'card') {
    if (payment.card_network) response.card_network = payment.card_network;
    if (payment.card_last4) response.card_last4 = payment.card_last4;
  }
  
  if (payment.status === 'failed') {
    if (payment.error_code) response.error_code = payment.error_code;
    if (payment.error_description) response.error_description = payment.error_description;
  }
  
  return response;
};

/**
 * Get all payments for a merchant
 */
const getPaymentsByMerchant = async (merchantId) => {
  const result = await pool.query(
    `SELECT id, order_id, amount, currency, method, status, vpa, card_network, card_last4, 
            error_code, error_description, created_at, updated_at 
     FROM payments WHERE merchant_id = $1 ORDER BY created_at DESC`,
    [merchantId]
  );
  
  return result.rows.map(payment => {
    const response = {
      id: payment.id,
      order_id: payment.order_id,
      amount: payment.amount,
      currency: payment.currency,
      method: payment.method,
      status: payment.status,
      created_at: payment.created_at.toISOString(),
      updated_at: payment.updated_at.toISOString()
    };
    
    if (payment.method === 'upi' && payment.vpa) {
      response.vpa = payment.vpa;
    } else if (payment.method === 'card') {
      if (payment.card_network) response.card_network = payment.card_network;
      if (payment.card_last4) response.card_last4 = payment.card_last4;
    }
    
    if (payment.status === 'failed') {
      if (payment.error_code) response.error_code = payment.error_code;
      if (payment.error_description) response.error_description = payment.error_description;
    }
    
    return response;
  });
};

/**
 * Get merchant statistics
 */
const getMerchantStats = async (merchantId) => {
  const result = await pool.query(
    `SELECT 
       COUNT(*) as total_transactions,
       COALESCE(SUM(CASE WHEN status = 'success' THEN amount ELSE 0 END), 0) as total_amount,
       COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_payments
     FROM payments WHERE merchant_id = $1`,
    [merchantId]
  );
  
  const stats = result.rows[0];
  const totalTransactions = parseInt(stats.total_transactions, 10);
  const successfulPayments = parseInt(stats.successful_payments, 10);
  const successRate = totalTransactions > 0 
    ? Math.round((successfulPayments / totalTransactions) * 100) 
    : 0;
  
  return {
    total_transactions: totalTransactions,
    total_amount: parseInt(stats.total_amount, 10),
    success_rate: successRate
  };
};

/**
 * Create payment from public endpoint (checkout page)
 */
const createPaymentPublic = async (paymentData) => {
  const { order_id, method, vpa, card } = paymentData;
  
  // Validate order exists
  const orderResult = await pool.query(
    'SELECT id, merchant_id, amount, currency, status FROM orders WHERE id = $1',
    [order_id]
  );
  
  if (orderResult.rows.length === 0) {
    throw { status: 404, code: 'NOT_FOUND_ERROR', message: 'Order not found' };
  }
  
  const order = orderResult.rows[0];
  
  if (order.status === 'paid') {
    throw { status: 400, code: 'BAD_REQUEST_ERROR', message: 'Order has already been paid' };
  }
  
  // Validate payment method
  if (!method || !['upi', 'card'].includes(method)) {
    throw { status: 400, code: 'BAD_REQUEST_ERROR', message: 'Invalid payment method. Must be "upi" or "card"' };
  }
  
  let paymentDetails = {};
  
  // Validate method-specific fields
  if (method === 'upi') {
    const vpaValidation = validateVPA(vpa);
    if (!vpaValidation.valid) {
      throw { status: 400, code: 'INVALID_VPA', message: vpaValidation.error };
    }
    paymentDetails.vpa = vpa;
  } else if (method === 'card') {
    const cardValidation = validateCard(card);
    if (!cardValidation.valid) {
      throw { status: 400, code: cardValidation.code || 'INVALID_CARD', message: cardValidation.error };
    }
    paymentDetails.card_network = cardValidation.cardNetwork;
    paymentDetails.card_last4 = cardValidation.cardLast4;
  }
  
  // Generate unique payment ID
  let paymentId;
  let isUnique = false;
  
  while (!isUnique) {
    paymentId = generateId('pay_');
    const existing = await pool.query('SELECT id FROM payments WHERE id = $1', [paymentId]);
    if (existing.rows.length === 0) {
      isUnique = true;
    }
  }
  
  // Create payment record with status 'processing'
  const insertResult = await pool.query(
    `INSERT INTO payments (id, order_id, merchant_id, amount, currency, method, status, vpa, card_network, card_last4, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, 'processing', $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     RETURNING id, order_id, amount, currency, method, status, vpa, card_network, card_last4, created_at`,
    [
      paymentId,
      order_id,
      order.merchant_id,
      order.amount,
      order.currency,
      method,
      paymentDetails.vpa || null,
      paymentDetails.card_network || null,
      paymentDetails.card_last4 || null
    ]
  );
  
  const payment = insertResult.rows[0];
  
  // Build initial response
  const response = {
    id: payment.id,
    order_id: payment.order_id,
    amount: payment.amount,
    currency: payment.currency,
    method: payment.method,
    status: payment.status,
    created_at: payment.created_at.toISOString()
  };
  
  if (method === 'upi') {
    response.vpa = payment.vpa;
  } else if (method === 'card') {
    response.card_network = payment.card_network;
    response.card_last4 = payment.card_last4;
  }
  
  // Process payment asynchronously
  processPayment(paymentId, order_id, method);
  
  return response;
};

module.exports = {
  createPayment,
  createPaymentPublic,
  getPaymentById,
  getPaymentByIdPublic,
  getPaymentsByMerchant,
  getMerchantStats
};

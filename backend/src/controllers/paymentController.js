const express = require('express');
const { authenticate } = require('../middleware/auth');
const paymentService = require('../services/paymentService');

const router = express.Router();

// POST /api/v1/payments - Create a new payment
router.post('/', authenticate, async (req, res) => {
  try {
    const payment = await paymentService.createPayment(req.merchant.id, req.body);
    res.status(201).json(payment);
  } catch (error) {
    console.error('Create payment error:', error);
    
    if (error.status) {
      return res.status(error.status).json({
        error: {
          code: error.code || 'BAD_REQUEST_ERROR',
          description: error.message
        }
      });
    }
    
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        description: 'Failed to create payment'
      }
    });
  }
});

// GET /api/v1/payments/:payment_id - Get payment by ID
router.get('/:payment_id', authenticate, async (req, res) => {
  try {
    const payment = await paymentService.getPaymentById(req.params.payment_id, req.merchant.id);
    
    if (!payment) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND_ERROR',
          description: 'Payment not found'
        }
      });
    }
    
    res.status(200).json(payment);
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        description: 'Failed to retrieve payment'
      }
    });
  }
});

// GET /api/v1/payments - Get all payments for merchant
router.get('/', authenticate, async (req, res) => {
  try {
    const payments = await paymentService.getPaymentsByMerchant(req.merchant.id);
    res.status(200).json({ payments });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        description: 'Failed to retrieve payments'
      }
    });
  }
});

// POST /api/v1/payments/public - Public payment endpoint for checkout
router.post('/public', async (req, res) => {
  try {
    const payment = await paymentService.createPaymentPublic(req.body);
    res.status(201).json(payment);
  } catch (error) {
    console.error('Create public payment error:', error);
    
    if (error.status) {
      return res.status(error.status).json({
        error: {
          code: error.code || 'BAD_REQUEST_ERROR',
          description: error.message
        }
      });
    }
    
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        description: 'Failed to create payment'
      }
    });
  }
});

// GET /api/v1/payments/:payment_id/public - Public payment status endpoint
router.get('/:payment_id/public', async (req, res) => {
  try {
    const payment = await paymentService.getPaymentByIdPublic(req.params.payment_id);
    
    if (!payment) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND_ERROR',
          description: 'Payment not found'
        }
      });
    }
    
    res.status(200).json(payment);
  } catch (error) {
    console.error('Get public payment error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        description: 'Failed to retrieve payment'
      }
    });
  }
});

module.exports = router;

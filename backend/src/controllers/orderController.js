const express = require('express');
const { authenticate } = require('../middleware/auth');
const orderService = require('../services/orderService');

const router = express.Router();

// POST /api/v1/orders - Create a new order
router.post('/', authenticate, async (req, res) => {
  try {
    const order = await orderService.createOrder(req.merchant.id, req.body);
    res.status(201).json(order);
  } catch (error) {
    console.error('Create order error:', error);
    
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
        description: 'Failed to create order'
      }
    });
  }
});

// GET /api/v1/orders/:order_id - Get order by ID
router.get('/:order_id', authenticate, async (req, res) => {
  try {
    const order = await orderService.getOrderById(req.params.order_id, req.merchant.id);
    
    if (!order) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND_ERROR',
          description: 'Order not found'
        }
      });
    }
    
    res.status(200).json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        description: 'Failed to retrieve order'
      }
    });
  }
});

// GET /api/v1/orders - Get all orders for merchant
router.get('/', authenticate, async (req, res) => {
  try {
    const orders = await orderService.getOrdersByMerchant(req.merchant.id);
    res.status(200).json({ orders });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        description: 'Failed to retrieve orders'
      }
    });
  }
});

// GET /api/v1/orders/:order_id/public - Public order endpoint for checkout
router.get('/:order_id/public', async (req, res) => {
  try {
    const order = await orderService.getOrderByIdPublic(req.params.order_id);
    
    if (!order) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND_ERROR',
          description: 'Order not found'
        }
      });
    }
    
    res.status(200).json(order);
  } catch (error) {
    console.error('Get public order error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        description: 'Failed to retrieve order'
      }
    });
  }
});

module.exports = router;

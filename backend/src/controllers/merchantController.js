const express = require('express');
const { pool } = require('../config/database');
const paymentService = require('../services/paymentService');

const router = express.Router();

// POST /api/v1/merchant/login - Merchant login
router.post('/login', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        error: {
          code: 'BAD_REQUEST_ERROR',
          description: 'Email is required'
        }
      });
    }
    
    const result = await pool.query(
      'SELECT id, name, email, api_key, api_secret, is_active FROM merchants WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({
        error: {
          code: 'AUTHENTICATION_ERROR',
          description: 'Invalid credentials'
        }
      });
    }
    
    const merchant = result.rows[0];
    
    if (!merchant.is_active) {
      return res.status(401).json({
        error: {
          code: 'AUTHENTICATION_ERROR',
          description: 'Merchant account is inactive'
        }
      });
    }
    
    res.status(200).json({
      id: merchant.id,
      name: merchant.name,
      email: merchant.email,
      api_key: merchant.api_key,
      api_secret: merchant.api_secret
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        description: 'Login failed'
      }
    });
  }
});

// GET /api/v1/merchant/stats - Get merchant statistics
router.get('/stats', async (req, res) => {
  try {
    const apiKey = req.headers['x-api-key'];
    const apiSecret = req.headers['x-api-secret'];
    
    if (!apiKey || !apiSecret) {
      return res.status(401).json({
        error: {
          code: 'AUTHENTICATION_ERROR',
          description: 'Invalid API credentials'
        }
      });
    }
    
    const merchantResult = await pool.query(
      'SELECT id FROM merchants WHERE api_key = $1 AND api_secret = $2',
      [apiKey, apiSecret]
    );
    
    if (merchantResult.rows.length === 0) {
      return res.status(401).json({
        error: {
          code: 'AUTHENTICATION_ERROR',
          description: 'Invalid API credentials'
        }
      });
    }
    
    const merchantId = merchantResult.rows[0].id;
    const stats = await paymentService.getMerchantStats(merchantId);
    
    res.status(200).json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        description: 'Failed to retrieve statistics'
      }
    });
  }
});

module.exports = router;

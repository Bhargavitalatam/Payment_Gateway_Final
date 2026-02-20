const express = require('express');
const { pool } = require('../config/database');
const paymentService = require('../services/paymentService');

const router = express.Router();

// GET /api/v1/test/merchant - Get test merchant details
router.get('/merchant', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, api_key FROM merchants WHERE email = $1',
      ['test@example.com']
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND_ERROR',
          description: 'Test merchant not found'
        }
      });
    }
    
    const merchant = result.rows[0];
    res.status(200).json({
      id: merchant.id,
      email: merchant.email,
      api_key: merchant.api_key,
      seeded: true
    });
  } catch (error) {
    console.error('Get test merchant error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        description: 'Failed to retrieve test merchant'
      }
    });
  }
});

// GET /api/v1/test/stats - Get merchant stats (for dashboard)
router.get('/stats/:merchant_id', async (req, res) => {
  try {
    const stats = await paymentService.getMerchantStats(req.params.merchant_id);
    res.status(200).json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        description: 'Failed to retrieve stats'
      }
    });
  }
});

module.exports = router;

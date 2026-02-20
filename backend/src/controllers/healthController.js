const express = require('express');
const { checkConnection } = require('../config/database');

const router = express.Router();

// GET /health - Health check endpoint
router.get('/', async (req, res) => {
  try {
    const isConnected = await checkConnection();
    
    res.status(200).json({
      status: 'healthy',
      database: isConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(200).json({
      status: 'healthy',
      database: 'disconnected',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;

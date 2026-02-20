require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { initializeDatabase } = require('./config/database');

// Import controllers
const healthController = require('./controllers/healthController');
const orderController = require('./controllers/orderController');
const paymentController = require('./controllers/paymentController');
const testController = require('./controllers/testController');
const merchantController = require('./controllers/merchantController');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://gateway_dashboard', 'http://gateway_checkout'],
  credentials: true
}));
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/health', healthController);
app.use('/api/v1/orders', orderController);
app.use('/api/v1/payments', paymentController);
app.use('/api/v1/test', testController);
app.use('/api/v1/merchant', merchantController);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      description: 'An unexpected error occurred'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND_ERROR',
      description: 'Endpoint not found'
    }
  });
});

// Initialize database and start server
const startServer = async () => {
  try {
    // Wait for database to be ready
    let retries = 10;
    while (retries > 0) {
      try {
        await initializeDatabase();
        break;
      } catch (error) {
        console.log(`Database not ready, retrying... (${retries} attempts left)`);
        retries--;
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    if (retries === 0) {
      console.error('Failed to connect to database after multiple retries');
      process.exit(1);
    }
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Payment Gateway API running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

require('dotenv').config();
require('express-async-errors');
const express  = require('express');
const cors     = require('cors');
const helmet   = require('helmet');
const morgan   = require('morgan');
const path     = require('path');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const seedDatabase = require('./utils/seed');
const errorHandler = require('./middleware/error');

const app = express();

// Security
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 500, message: 'Too many requests' }));

// Body + logging
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/api/health', (_, res) => res.json({ status: 'OK', time: new Date(), app: 'NN Billing API v2' }));

// Routes
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/bills',     require('./routes/billReserve')); // Mount before bills so /reserve-number isn't caught by /:id
app.use('/api/bills',     require('./routes/bills'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/products',  require('./routes/products'));
app.use('/api/export',    require('./routes/export'));
app.use('/api/labors',    require('./routes/labors'));
app.use('/api/sync',      require('./routes/sync'));

// 404
app.use('*', (_, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

async function startServer() {
  await connectDB();

  const User = require('./models/User');
  const hasSeedUser = await User.exists({ email: 'sabarish@nn.com' });
  if (connectDB.usingMemoryDB || !hasSeedUser) {
    await seedDatabase();
  }

  app.listen(PORT, () => {
    console.log(`\n⚜  NACHIMUTHU NATRAYAN — Billing API`);
    console.log(`✓  Server running on http://localhost:${PORT}`);
    console.log(`✓  Environment: ${process.env.NODE_ENV}`);
    console.log(`✓  MongoDB: ${process.env.MONGODB_URI || 'memory-fallback'}\n`);
  });
}

startServer().catch((err) => {
  console.error('✗ Failed to start server:', err.message);
  process.exit(1);
});

module.exports = app;

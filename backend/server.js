import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import { bootstrapSeedSuperAdmin } from './controllers/adminAuthController.js';

// Route Imports
import authRoutes from './routes/authRoutes.js';
import customerAuthRoutes from './routes/customerAuthRoutes.js';
import adminAuthRoutes from './routes/adminAuthRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import workerRoutes from './routes/workerRoutes.js';
import settingRoutes from './routes/settingRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

dotenv.config();

// Connect to Database (falls back to local JSON if Mongo offline)
connectDB().then(() => {
  // Bootstrap initial Super Admin account if needed
  bootstrapSeedSuperAdmin();
});

const app = express();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

// API Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 300, // Limit each IP to 300 requests per 15 minutes
  message: { message: 'Too many requests from this IP, please try again in 15 minutes.' }
});
app.use('/api', limiter);

// Base Route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to the RIPOMA Farm & Foods API Server',
    databaseMode: global.dbConnected ? 'MongoDB Connected' : 'Friction-Free JSON File System'
  });
});

// Bind API v1 Auth Routes (Strict separation)
app.use('/api/v1/auth/customer', customerAuthRoutes);
app.use('/api/v1/auth/admin', adminAuthRoutes);
app.use('/api/v1/auth', authRoutes);

// Bind Standard API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/notifications', notificationRoutes);

// Fallbacks
app.use(notFound);
app.use(errorHandler);

const PORT = Number(process.env.PORT) || 5050;

const server = app.listen(PORT, '127.0.0.1', () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on http://127.0.0.1:${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop the other process or set PORT in backend/.env.`);
    process.exit(1);
  }
  throw err;
});

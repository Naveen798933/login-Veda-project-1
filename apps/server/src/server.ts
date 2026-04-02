import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import connectDB from './config/db';
import { initializeRedis, isRedisConnected, disconnectRedis } from './config/redis';
import authRoutes from './routes/authRoutes';
import documentRoutes from './routes/documentRoutes';
import commentRoutes from './routes/commentRoutes';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { initSocketService } from './services/socketService';
import { register, collectDefaultMetrics } from 'prom-client';
import { setSocketIO, initializeNotificationWorker } from './services/notificationService';

dotenv.config();

// Initialize default metrics
collectDefaultMetrics();

// Initialize notification worker as early as possible
initializeNotificationWorker();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Connect Database
connectDB();

// Initialize Redis
initializeRedis();

// Middleware
app.use(helmet()); // Set security HTTP headers
app.use(mongoSanitize()); // Prevent NoSQL Injection
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));

// Rate limiting for API protection
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/comments', commentRoutes);

// Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health Check
app.get('/health', (req, res) => {
  res.json({
    server: 'ok',
    redis: isRedisConnected() ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// Prometheus Metrics
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err);
  }
});

const PORT = process.env.PORT || 5000;

// Initialize real-time collaboration with Socket.io & Yjs
initSocketService(io).then(() => {
    // Pass Socket.IO instance to notification service for real-time notifications
    setSocketIO(io);
    
    server.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
    });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(async () => {
    console.log('Server closed');
    await disconnectRedis();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(async () => {
    console.log('Server closed');
    await disconnectRedis();
    process.exit(0);
  });
});

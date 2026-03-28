import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
const { Pool } = pg;
import authRoutes from './routes/auth.js';
import wardRoutes from './routes/wards.js';
import patientRoutes from './routes/patients.js';
import bedRoutes from './routes/beds.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Allow any localhost origin (works with Vite on 5173, 5174, 5178, 3000, etc.)
const ALLOWED_ORIGINS = /^http:\/\/localhost:\d+$/;

const io = new Server(httpServer, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// CORS middleware - must be before routes
app.use(cors({
  origin: ALLOWED_ORIGINS,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
app.use(express.json());

// Attach io and prisma to req for use in route handlers
app.use((req, res, next) => {
  req.io = io;
  req.prisma = prisma;
  next();
});

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', port: process.env.PORT || 5001 }));

// Define Routes
app.use('/api/auth', authRoutes);
app.use('/api/wards', wardRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/beds', bedRoutes);

// 404 catch-all for undefined routes
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Global error handler
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5001;
httpServer.listen(PORT, () => {
  console.log(`✅ WardWatch backend running on http://localhost:${PORT}`);
  console.log(`📡 Routes: /api/health | /api/auth | /api/wards | /api/patients | /api/beds`);
});

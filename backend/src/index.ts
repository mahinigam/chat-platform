import express, { Request, Response } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import path from 'path';
import initializeSocket from './socket';
import Database from './config/database';
import { redisClient, RedisService } from './config/redis';
import authRoutes from './routes/auth';
import messageRoutes from './routes/messages';
import roomRoutes from './routes/rooms';
import uploadRoutes from './routes/upload';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;

// ============================================
// Middleware
// ============================================
app.use(helmet()); // Security headers
app.use(compression()); // Compress responses
app.use(cors({
    origin: (origin, callback) => {
        const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',');
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Request logging in development
if (process.env.NODE_ENV === 'development') {
    app.use((req, _res, next) => {
        console.log(`${req.method} ${req.path}`);
        next();
    });
}

// ============================================
// Routes
// ============================================
import contactRoutes from './routes/contacts';
import reactionRoutes from './routes/reactions';
import searchRoutes from './routes/search';

app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/reactions', reactionRoutes);
app.use('/api/search', searchRoutes);

// Health check endpoint
app.get('/health', async (_req: Request, res: Response) => {
    try {
        const dbHealthy = await Database.healthCheck();
        const redisHealthy = await RedisService.healthCheck();

        const status = dbHealthy && redisHealthy ? 'healthy' : 'unhealthy';
        const statusCode = dbHealthy && redisHealthy ? 200 : 503;

        return res.status(statusCode).json({
            status,
            timestamp: new Date().toISOString(),
            services: {
                database: dbHealthy ? 'up' : 'down',
                redis: redisHealthy ? 'up' : 'down',
            },
            server: process.env.SERVER_INSTANCE_ID || 'unknown',
        });
    } catch (error) {
        console.error('Health check error:', error);
        return res.status(503).json({
            status: 'unhealthy',
            error: 'Health check failed',
        });
    }
});

// 404 handler
app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: any) => {
    console.error('Error:', err);
    res.status(500).json({
        error: process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : err.message,
    });
});

// ============================================
// Initialize Socket.io with Redis Adapter
// ============================================
const io = initializeSocket(httpServer);

// ============================================
// Start Server
// ============================================
import { ReactionRepository } from './repositories/ReactionRepository';

async function startServer() {
    try {
        // Test database connection
        const dbHealthy = await Database.healthCheck();
        if (!dbHealthy) {
            throw new Error('Database connection failed');
        }
        console.log('Database connected');

        // Initialize reactions table
        await ReactionRepository.initTable();
        console.log('Reactions table initialized');

        // Test Redis connection
        const redisHealthy = await RedisService.healthCheck();
        if (!redisHealthy) {
            throw new Error('Redis connection failed');
        }

        httpServer.listen(PORT, () => {
            console.log('='.repeat(50));
            console.log('High-Scale Chat Server Started');
            console.log('='.repeat(50));
            console.log(`Server: http://localhost:${PORT}`);
            console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`Instance: ${process.env.SERVER_INSTANCE_ID || 'default'}`);
            console.log(`Redis Adapter: ENABLED (Horizontal Scaling Ready)`);
            console.log('='.repeat(50));
        });

    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');

    httpServer.close(async () => {
        await Database.close();
        await redisClient.quit();
        console.log('Server shut down successfully');
        process.exit(0);
    });
});

startServer();

export { io };

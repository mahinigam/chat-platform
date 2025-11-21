import express, { Request, Response } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import initializeSocket from './socket';
import Database from './config/database';
import { redisClient, RedisService } from './config/redis';
import authRoutes from './routes/auth';
import messageRoutes from './routes/messages';
import roomRoutes from './routes/rooms';

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
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging in development
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`${req.method} ${req.path}`);
        next();
    });
}

// ============================================
// Routes
// ============================================
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/rooms', roomRoutes);

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
    try {
        const dbHealthy = await Database.healthCheck();
        const redisHealthy = await RedisService.healthCheck();

        if (!dbHealthy || !redisHealthy) {
            return res.status(503).json({
                status: 'unhealthy',
                database: dbHealthy,
                redis: redisHealthy,
            });
        }

        res.json({
            status: 'healthy',
            database: true,
            redis: true,
            serverInstance: process.env.SERVER_INSTANCE_ID || 'unknown',
            uptime: process.uptime(),
        });
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            error: 'Health check failed',
        });
    }
});

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: any) => {
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
async function startServer() {
    try {
        // Test database connection
        const dbHealthy = await Database.healthCheck();
        if (!dbHealthy) {
            throw new Error('Database connection failed');
        }
        console.log('✓ Database connected');

        // Test Redis connection
        const redisHealthy = await RedisService.healthCheck();
        if (!redisHealthy) {
            throw new Error('Redis connection failed');
        }

        httpServer.listen(PORT, () => {
            console.log('='.repeat(50));
            console.log('🚀 High-Scale Chat Server Started');
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

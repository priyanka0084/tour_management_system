import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cartRoutes from './routes/cart.js';
// Load environment variables
dotenv.config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https:"],
            scriptSrc: ["'self'", "https:"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https:"],
        },
    },
}));

// CORS configuration
const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
        ? (process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : ['https://yourdomain.com', 'https://www.yourdomain.com'])
        : ['http://localhost:5173', 'http://localhost:5175', 'http://localhost:3000', 'http://localhost:5176'],
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'production' ? 100 : 1000,
    message: {
        success: false,
        error: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Apply rate limiting to API routes
app.use('/api/', limiter);

// Stricter rate limiting for booking routes
const bookingLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: {
        success: false,
        error: 'Too many booking requests, please try again later.'
    }
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'production') {
    app.use(morgan('combined'));
} else {
    app.use(morgan('dev'));
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Import routes (with .js extension for ES modules)
import authRoutes from './routes/auth.js';
import bookingRoutes from './routes/bookingpayment.js';
import destinationsRoutes from './routes/destinations.js';
import packagesRoutes from './routes/packages.js';
import adminDestinationsRoutes from './routes/admin/destinations.js';
import adminPackagesRoutes from './routes/admin/packages.js';
import adminBookingsRoutes from './routes/admin/bookings.js';
import adminUsersRoutes from './routes/admin/users.js';
import userDashboardRoutes from './routes/userDashboard.js';
import whatsappRoutes from './routes/whatsapp.js';
import wishlistRoutes from './routes/wishlist.js';
// Register ALL routes ONCE (order matters!)
app.use('/api/auth', authRoutes);
app.use('/api/bookingpayment', bookingLimiter, bookingRoutes);
app.use('/api/destinations', destinationsRoutes);
app.use('/api/packages', packagesRoutes);

// Admin routes
app.use('/api/admin/destinations', adminDestinationsRoutes);
app.use('/api/admin/packages', adminPackagesRoutes);
app.use('/api/admin/bookings', adminBookingsRoutes);
app.use('/api/admin/users', adminUsersRoutes);

// User dashboard routes (NEW)
app.use('/api/user', userDashboardRoutes);

// WhatsApp routes (NEW)
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/user', userDashboardRoutes);
// Cart routes (NEW) - Add this line
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 404 handler MUST come AFTER all routes
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'API endpoint not found'
    });
});

// Global error handler
app.use((error, req, res, next) => {
    console.error('Global error handler:', error);

    if (error.type === 'entity.parse.failed') {
        return res.status(400).json({
            success: false,
            error: 'Invalid JSON format'
        });
    }

    if (error.type === 'entity.too.large') {
        return res.status(413).json({
            success: false,
            error: 'Request payload too large'
        });
    }

    if (error.code === 'PROTOCOL_CONNECTION_LOST') {
        return res.status(503).json({
            success: false,
            error: 'Database connection lost'
        });
    }

    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
        return res.status(500).json({
            success: false,
            error: 'Database access denied'
        });
    }

    res.status(error.status || 500).json({
        success: false,
        error: process.env.NODE_ENV === 'production' 
            ? 'Internal server error' 
            : error.message
    });
});

// Start server
const server = app.listen(PORT, () => {
    console.log(`
🚀 Server is running on port ${PORT}
📦 Environment: ${process.env.NODE_ENV || 'development'}
🔗 API Base URL: http://localhost:${PORT}/api
📊 Health Check: http://localhost:${PORT}/health
    `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.error('Unhandled Promise Rejection:', err);
    server.close(() => {
        process.exit(1);
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nReceived SIGINT. Graceful shutdown...');
    server.close(() => {
        console.log('Process terminated');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('Received SIGTERM. Graceful shutdown...');
    server.close(() => {
        console.log('Process terminated');
        process.exit(0);
    });
});

export default app;
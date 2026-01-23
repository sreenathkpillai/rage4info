"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isMongoAvailable = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const content_1 = __importDefault(require("./routes/content"));
const auth_1 = __importDefault(require("./routes/auth"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Security middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
}));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);
// Body parsing
app.use((0, compression_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Track MongoDB connection status
let isMongoConnected = false;
// MongoDB connection with improved error handling
const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/care-resource-hub';
        // Set connection options for better reliability
        await mongoose_1.default.connect(mongoUri, {
            serverSelectionTimeoutMS: 5000, // 5 second timeout
            socketTimeoutMS: 45000, // 45 second socket timeout
            maxPoolSize: 10, // Maintain up to 10 socket connections
            bufferCommands: false, // Disable mongoose buffering
        });
        isMongoConnected = true;
        console.log('MongoDB connected successfully');
        // Handle connection events
        mongoose_1.default.connection.on('error', (error) => {
            console.error('MongoDB connection error:', error);
            isMongoConnected = false;
        });
        mongoose_1.default.connection.on('disconnected', () => {
            console.warn('MongoDB disconnected');
            isMongoConnected = false;
        });
        mongoose_1.default.connection.on('reconnected', () => {
            console.log('MongoDB reconnected');
            isMongoConnected = true;
        });
    }
    catch (error) {
        console.error('MongoDB connection failed:', error);
        console.log('Server will continue with JSON file fallback for data storage');
        isMongoConnected = false;
    }
};
// Export connection status checker
const isMongoAvailable = () => isMongoConnected && mongoose_1.default.connection.readyState === 1;
exports.isMongoAvailable = isMongoAvailable;
connectDB();
// Routes
app.use('/api/content', content_1.default);
app.use('/api/auth', auth_1.default);
// Health check
app.get('/api/health', (req, res) => {
    const mongoStatus = isMongoConnected && mongoose_1.default.connection.readyState === 1;
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        mongodb: mongoStatus ? 'connected' : 'disconnected',
        fallbackMode: !mongoStatus,
        message: mongoStatus ? 'Using MongoDB for data storage' : 'Using JSON file fallback for data storage'
    });
});
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found'
    });
});
// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
    });
});
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
});
//# sourceMappingURL=server.js.map
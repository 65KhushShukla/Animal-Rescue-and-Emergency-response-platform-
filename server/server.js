const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const connectDB = require('./src/config/db');
const seedData = require('./src/utils/seed');
const errorHandler = require('./src/middleware/errorHandler');

// Route files
const authRoutes = require('./src/routes/authRoutes');
const emergencyRoutes = require('./src/routes/emergencyRoutes');
const rescueRoutes = require('./src/routes/rescueRoutes');
const medicalRoutes = require('./src/routes/medicalRoutes');
const shelterRoutes = require('./src/routes/shelterRoutes');
const volunteerRoutes = require('./src/routes/volunteerRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const aiRoutes = require('./src/routes/aiRoutes');

const app = express();

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Enable CORS
app.use(
  cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Serve static uploaded media files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: '🐾 Animal Rescue & Emergency Response Platform API is running smoothly.',
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/emergencies', emergencyRoutes);
app.use('/api/rescues', rescueRoutes);
app.use('/api/medical', medicalRoutes);
app.use('/api/shelter', shelterRoutes);
app.use('/api/volunteers', volunteerRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);

// Fallback 404 for unhandled API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API route not found: ${req.originalUrl}`,
  });
});

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to Database
    await connectDB();

    // Auto-seed initial data if empty
    await seedData();

    const server = app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🐾 Animal Rescue Backend Server running on port ${PORT}`);
      console.log(`   Health Check: http://localhost:${PORT}/api/health`);
      console.log(`====================================================`);
    });

    // Handle unexpected errors gracefully without terminating
    process.on('uncaughtException', (err) => {
      console.error('[Process Uncaught Exception]:', err);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('[Process Unhandled Rejection]:', reason);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();

module.exports = app;


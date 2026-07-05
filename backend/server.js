const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ============ ROOT ROUTES ============
app.get('/', (req, res) => {
  res.json({ 
    message: ' Leave Management API is running!',
    version: '1.0.0',
    status: 'healthy',
    endpoints: {
      auth: '/api/auth',
      leaves: '/api/leaves',
      admin: '/api/admin',
      ai: '/api/ai',
      test: '/api/test',
      health: '/api/health'
    }
  });
});

app.get('/api/test', (req, res) => {
  res.json({ 
    status: 'success', 
    message: 'API test endpoint is working!',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// ============ ROUTES ============
console.log(' Registering routes...');

// FIXED: All route imports now use correct file names
app.use('/api/auth', require('./routes/auth.routes'));
console.log(' /api/auth routes registered');

app.use('/api/leaves', require('./routes/leave.routes'));  
console.log(' /api/leaves routes registered');

app.use('/api/admin', require('./routes/admin.routes'));   
console.log(' /api/admin routes registered');

app.use('/api/ai', require('./routes/ai.routes'));          
console.log(' /api/ai routes registered');

// ============ 404 Handler ============
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.url}`,
    availableEndpoints: {
      root: '/',
      test: '/api/test',
      health: '/api/health',
      auth: '/api/auth',
      leaves: '/api/leaves',
      admin: '/api/admin',
      ai: '/api/ai'
    }
  });
});

// ============ Error handling middleware ============
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message 
  });
});

// ============ MongoDB connection ============
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/leave_management');
    console.log('✅ MongoDB connected successfully');
    
    // Create default admin if none exists
    await createDefaultAdmin();
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.log('Retrying in 5 seconds...');
    setTimeout(connectDB, 5000);
  }
};

// ============ Create default admin account ============
const createDefaultAdmin = async () => {
  try {
    const User = require('./models/user.models');
    const bcrypt = require('bcryptjs');
    
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const admin = new User({
        email: 'admin@nrolled.com',
        password: hashedPassword,
        name: 'Admin',
        role: 'admin',
        leaveBalance: 0
      });
      await admin.save();
      console.log('✅ Default admin created: admin@nrolled.com / admin123');
    }
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
  }
};

// ============ Start Server ============
connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Test: http://localhost:${PORT}/api/test`);
  console.log(`📡 Health: http://localhost:${PORT}/api/health`);
  console.log(`📡 Auth: http://localhost:${PORT}/api/auth`);
});
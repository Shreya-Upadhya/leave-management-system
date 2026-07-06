const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// ============ CORS CONFIGURATION ============
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
}));

app.options('*', cors());

// ============ MIDDLEWARE ============
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.url}`);
  console.log(`📋 Authorization:`, req.headers.authorization ? 'Bearer [PRESENT]' : 'None');
  next();
});

// ============ ROOT ROUTES ============
app.get('/', (req, res) => {
  res.json({
    message: 'Leave Management API is running!',
    status: 'healthy',
    endpoints: {
      auth: '/api/auth',
      leaves: '/api/leaves',
      admin: '/api/admin',
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
    timestamp: new Date().toISOString()
  });
});

// ============ ROUTES ============
console.log('Registering routes...');

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/leaves', require('./routes/leave.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/ai', require('./routes/ai.routes'));

// ============ 404 Handler ============
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.url}`
  });
});

// ============ Error handler ============
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
    await createDefaultAccounts();
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.log('Retrying in 5 seconds...');
    setTimeout(connectDB, 5000);
  }
};

// ============ Create default accounts ============
const createDefaultAccounts = async () => {
  try {
    const User = require('./models/user.models');

    // Create admin if missing
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      // Pass RAW password — the UserSchema pre('save') hook will hash it
      const admin = new User({
        email: 'admin@nrolled.com',
        password: 'admin123',
        name: 'Admin',
        role: 'admin',
        leaveBalance: 0
      });
      await admin.save();
      console.log('✅ Default admin created: admin@nrolled.com / admin123');
    } else {
      console.log('✅ Admin already exists:', adminExists.email);
    }

    // Create a demo employee if missing
    const employeeExists = await User.findOne({ email: 'employee@nrolled.com' });
    if (!employeeExists) {
      const employee = new User({
        email: 'employee@nrolled.com',
        password: 'employee123',
        name: 'Rajesh Kumar',
        role: 'employee',
        department: 'Engineering',
        leaveBalance: 15
      });
      await employee.save();
      console.log('✅ Demo employee created: employee@nrolled.com / employee123 (balance: 15)');
    } else {
      console.log('✅ Employee already exists:', employeeExists.email, 'balance:', employeeExists.leaveBalance);
    }
  } catch (error) {
    console.error('❌ Error creating default accounts:', error.message);
  }
};

// ============ Start Server ============
connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Test: http://localhost:${PORT}/api/test`);
  console.log(`📡 Health: http://localhost:${PORT}/api/health`);
});

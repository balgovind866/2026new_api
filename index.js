require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./models');
const adminRoutes = require('./routes/admin');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/admin', adminRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date(),
    environment: process.env.NODE_ENV 
  });
});

// Root Route
app.get('/', (req, res) => {
  res.json({
    message: 'School Management System API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      admin_login: 'POST /api/admin/login',
      create_school: 'POST /api/admin/schools',
      list_schools: 'GET /api/admin/schools',
      dashboard: 'GET /api/admin/dashboard/stats'
    }
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    error: 'Route not found' 
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    success: false,
    error: 'Internal server error' 
  });
});

const PORT = process.env.PORT || 3000;

// Initialize Application
async function initializeApp() {
  try {
    console.log('🔄 Starting application...');
    
    await db.sequelize.authenticate();
    console.log('✅ Master database connected successfully');

    // 🔥 FIRST TIME ONLY
    await db.sequelize.sync({ force: true });
    console.log('✅ Database tables created');

    const adminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@myapp.com';
    const adminPassword = process.env.SUPER_ADMIN_PASSWORD || 'Admin@123456';

    const adminExists = await db.Admin.findOne({ where: { email: adminEmail } });

    if (!adminExists) {
      await db.Admin.create({
        email: adminEmail,
        password: adminPassword,
        name: 'Super Admin',
        role: 'super_admin',
        is_active: true
      });
      console.log('✅ Super admin created');
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error('❌ Application initialization failed:', error);
    process.exit(1);
  }
}


// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await db.sequelize.close();
  console.log('✅ Database connections closed');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await db.sequelize.close();
  console.log('✅ Database connections closed');
  process.exit(0);
});

// Start the application
initializeApp();

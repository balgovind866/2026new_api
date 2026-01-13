const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../models');
const { authenticateAdmin } = require('../middleware/auth');
const { createSchoolDatabase } = require('../utils/schoolDbSetup');

// ==================== AUTHENTICATION ====================

// Super Admin Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Email and password are required' 
      });
    }

    const admin = await db.Admin.findOne({ where: { email } });
    
    if (!admin) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid email or password' 
      });
    }

    if (!admin.is_active) {
      return res.status(401).json({ 
        success: false,
        error: 'Account is inactive. Please contact support.' 
      });
    }

    const isValid = await admin.validatePassword(password);
    
    if (!isValid) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid email or password' 
      });
    }

    const token = jwt.sign(
      { 
        id: admin.id, 
        email: admin.email,
        role: admin.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error. Please try again.' 
    });
  }
});

// ==================== SCHOOL MANAGEMENT ====================

// Create New School
router.post('/schools', authenticateAdmin, async (req, res) => {
  try {
    const { 
      code,
      name, 
      subdomain, 
      address,
      phone,
      email,
      logoPath,
      bannerPath,
      principalName,
      establishedYear,
      db_host, 
      schema_name,
      db_username, 
      db_password,
      db_port 
    } = req.body;

    // Validation
    if (!code || !name || !subdomain || !db_host || !db_username || !db_password) {
      return res.status(400).json({ 
        success: false,
        error: 'Code, name, subdomain, and database credentials are required' 
      });
    }

    // Check if code already exists
    const existingCode = await db.School.findOne({ 
      where: { code: code.toUpperCase() } 
    });
    
    if (existingCode) {
      return res.status(400).json({ 
        success: false,
        error: 'School code already exists. Please choose a different one.' 
      });
    }

    // Check if subdomain already exists
    const existingSubdomain = await db.School.findOne({ 
      where: { subdomain: subdomain.toLowerCase() } 
    });
    
    if (existingSubdomain) {
      return res.status(400).json({ 
        success: false,
        error: 'Subdomain already exists. Please choose a different one.' 
      });
    }

    // Generate database name
    const db_name = `school_${subdomain.toLowerCase()}_db`;

   // Create school record
   const school = await db.School.create({
  code: code.toUpperCase(),
  name,
  subdomain: subdomain.toLowerCase(),
  address,
  phone,
  email,
  logoPath,
  bannerPath,
  principalName,
  establishedYear: establishedYear ? parseInt(establishedYear) : null,
  db_name,
  db_host,
  db_port: db_port || 5432,
  db_username,
  db_password,
  is_active: true,
  setup_completed: false
});

    // Create school's database and tables
    try {
    

      // Update setup_completed flag
  await createSchoolDatabase({
  schema_name,
  db_host,
  db_port,
  db_username,
  db_password
});

school.setup_completed = true;
await school.save();

   res.status(201).json({
  success: true,
  message: 'School created successfully',
  school: {
    id: school.id,
    code: school.code,
    name: school.name,
    subdomain: school.subdomain,
    schema: schema_name,
    database: 'neondb',
    app_url: `https://${school.subdomain}.myapp.com`,
    setup_completed: true
  }
});
    } catch (dbError) {
      // Rollback: Delete school record if database creation fails
     // await school.destroy();
      throw new Error(`Database setup failed: ${dbError.message}`);
    }

  } catch (error) {
    console.error('Create school error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to create school' 
    });
  }
});

// Get All Schools (with pagination, search, and filters)
router.get('/schools', authenticateAdmin, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      is_active,
      setup_completed 
    } = req.query;
    
    const offset = (page - 1) * limit;
    const where = {};

    // Search filter
    if (search) {
      where[db.Sequelize.Op.or] = [
        { name: { [db.Sequelize.Op.iLike]: `%${search}%` } },
        { subdomain: { [db.Sequelize.Op.iLike]: `%${search}%` } },
        { code: { [db.Sequelize.Op.iLike]: `%${search}%` } },
        { principalName: { [db.Sequelize.Op.iLike]: `%${search}%` } }
      ];
    }

    // Active status filter
    if (is_active !== undefined) {
      where.is_active = is_active === 'true';
    }

    // Setup completion filter
    if (setup_completed !== undefined) {
      where.setup_completed = setup_completed === 'true';
    }

    const { count, rows: schools } = await db.School.findAndCountAll({
      where,
      attributes: [
        'id', 'code', 'name', 'subdomain', 'address', 'phone', 'email',
        'logoPath', 'bannerPath', 'principalName', 'establishedYear',
        'is_active', 'isActive', 'setup_completed', 'createdAt', 'updatedAt'
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        schools,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit),
          hasNextPage: offset + schools.length < count,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get schools error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch schools' 
    });
  }
});

// Get Single School by ID
router.get('/schools/:id', authenticateAdmin, async (req, res) => {
  try {
    const school = await db.School.findByPk(req.params.id, {
      attributes: { exclude: ['db_password'] }
    });

    if (!school) {
      return res.status(404).json({ 
        success: false,
        error: 'School not found' 
      });
    }

    res.json({
      success: true,
      school
    });
  } catch (error) {
    console.error('Get school error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch school details' 
    });
  }
});

// Get School by Code
router.get('/schools/code/:code', authenticateAdmin, async (req, res) => {
  try {
    const school = await db.School.findOne({ 
      where: { code: req.params.code.toUpperCase() },
      attributes: { exclude: ['db_password'] }
    });

    if (!school) {
      return res.status(404).json({ 
        success: false,
        error: 'School not found' 
      });
    }

    res.json({
      success: true,
      school
    });
  } catch (error) {
    console.error('Get school by code error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch school details' 
    });
  }
});

// Get School by Subdomain
router.get('/schools/subdomain/:subdomain', authenticateAdmin, async (req, res) => {
  try {
    const school = await db.School.findOne({ 
      where: { subdomain: req.params.subdomain.toLowerCase() },
      attributes: { exclude: ['db_password'] }
    });

    if (!school) {
      return res.status(404).json({ 
        success: false,
        error: 'School not found' 
      });
    }

    res.json({
      success: true,
      school
    });
  } catch (error) {
    console.error('Get school by subdomain error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch school details' 
    });
  }
});

// Update School (Full Update)
router.put('/schools/:id', authenticateAdmin, async (req, res) => {
  try {
    const { 
      name, 
      address,
      phone,
      email,
      logoPath,
      bannerPath,
      principalName,
      establishedYear
    } = req.body;
    
    const school = await db.School.findByPk(req.params.id);
    
    if (!school) {
      return res.status(404).json({ 
        success: false,
        error: 'School not found' 
      });
    }

    // Update only provided fields
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (address !== undefined) updateData.address = address;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (logoPath !== undefined) updateData.logoPath = logoPath;
    if (bannerPath !== undefined) updateData.bannerPath = bannerPath;
    if (principalName !== undefined) updateData.principalName = principalName;
    if (establishedYear !== undefined) updateData.establishedYear = parseInt(establishedYear);

    await school.update(updateData);

    res.json({
      success: true,
      message: 'School updated successfully',
      school
    });
  } catch (error) {
    console.error('Update school error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update school' 
    });
  }
});

// Partial Update (PATCH)
router.patch('/schools/:id', authenticateAdmin, async (req, res) => {
  try {
    const school = await db.School.findByPk(req.params.id);
    
    if (!school) {
      return res.status(404).json({ 
        success: false,
        error: 'School not found' 
      });
    }

    // Update only provided fields
    const allowedFields = [
      'name', 'address', 'phone', 'email', 'logoPath', 
      'bannerPath', 'principalName', 'establishedYear'
    ];
    
    const updateData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
    }

    await school.update(updateData);

    res.json({
      success: true,
      message: 'School updated successfully',
      school
    });
  } catch (error) {
    console.error('Patch school error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update school' 
    });
  }
});

// Toggle School Active Status
router.patch('/schools/:id/toggle-status', authenticateAdmin, async (req, res) => {
  try {
    const school = await db.School.findByPk(req.params.id);
    
    if (!school) {
      return res.status(404).json({ 
        success: false,
        error: 'School not found' 
      });
    }

    const newStatus = !school.is_active;
    
    await school.update({
      is_active: newStatus,
      isActive: newStatus
    });

    res.json({
      success: true,
      message: `School ${newStatus ? 'activated' : 'deactivated'} successfully`,
      school: {
        id: school.id,
        name: school.name,
        code: school.code,
        is_active: school.is_active,
        isActive: school.isActive
      }
    });
  } catch (error) {
    console.error('Toggle school status error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update school status' 
    });
  }
});

// Activate School
router.patch('/schools/:id/activate', authenticateAdmin, async (req, res) => {
  try {
    const school = await db.School.findByPk(req.params.id);
    
    if (!school) {
      return res.status(404).json({ 
        success: false,
        error: 'School not found' 
      });
    }

    await school.update({
      is_active: true,
      isActive: true
    });

    res.json({
      success: true,
      message: 'School activated successfully',
      school
    });
  } catch (error) {
    console.error('Activate school error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to activate school' 
    });
  }
});

// Deactivate School
router.patch('/schools/:id/deactivate', authenticateAdmin, async (req, res) => {
  try {
    const school = await db.School.findByPk(req.params.id);
    
    if (!school) {
      return res.status(404).json({ 
        success: false,
        error: 'School not found' 
      });
    }

    await school.update({
      is_active: false,
      isActive: false
    });

    res.json({
      success: true,
      message: 'School deactivated successfully',
      school
    });
  } catch (error) {
    console.error('Deactivate school error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to deactivate school' 
    });
  }
});

// Delete School (Soft delete - just deactivate)
router.delete('/schools/:id', authenticateAdmin, async (req, res) => {
  try {
    const { permanent } = req.query;
    const school = await db.School.findByPk(req.params.id);
    
    if (!school) {
      return res.status(404).json({ 
        success: false,
        error: 'School not found' 
      });
    }

    if (permanent === 'true') {
      // Permanent delete
      await school.destroy();
      res.json({
        success: true,
        message: 'School permanently deleted'
      });
    } else {
      // Soft delete (deactivate)
      await school.update({
        is_active: false,
        isActive: false
      });
      res.json({
        success: true,
        message: 'School deactivated successfully'
      });
    }
  } catch (error) {
    console.error('Delete school error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete school' 
    });
  }
});

// ==================== DASHBOARD & STATISTICS ====================

// Dashboard Stats
router.get('/dashboard/stats', authenticateAdmin, async (req, res) => {
  try {
    const totalSchools = await db.School.count();
    const activeSchools = await db.School.count({ where: { is_active: true } });
    const inactiveSchools = await db.School.count({ where: { is_active: false } });
    const completedSetup = await db.School.count({ where: { setup_completed: true } });
    const pendingSetup = await db.School.count({ where: { setup_completed: false } });

    // Get recent schools (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentSchools = await db.School.count({
      where: {
        createdAt: {
          [db.Sequelize.Op.gte]: sevenDaysAgo
        }
      }
    });

    res.json({
      success: true,
      stats: {
        total_schools: totalSchools,
        active_schools: activeSchools,
        inactive_schools: inactiveSchools,
        setup_completed: completedSetup,
        setup_pending: pendingSetup,
        recent_additions: recentSchools
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch dashboard stats' 
    });
  }
});

// Get Recent Schools
router.get('/dashboard/recent-schools', authenticateAdmin, async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    const recentSchools = await db.School.findAll({
      attributes: [
        'id', 'code', 'name', 'subdomain', 'principalName',
        'is_active', 'setup_completed', 'createdAt'
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      schools: recentSchools
    });
  } catch (error) {
    console.error('Recent schools error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch recent schools' 
    });
  }
});

module.exports = router;
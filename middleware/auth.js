const jwt = require('jsonwebtoken');
const db = require('../models');

const authenticateAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        error: 'No token provided. Please login first.' 
      });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid token format' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const admin = await db.Admin.findByPk(decoded.id);
    
    if (!admin || !admin.is_active) {
      return res.status(401).json({ 
        success: false,
        error: 'Admin account not found or inactive' 
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        error: 'Token expired. Please login again.' 
      });
    }
    return res.status(401).json({ 
      success: false,
      error: 'Invalid token' 
    });
  }
};

module.exports = { authenticateAdmin };
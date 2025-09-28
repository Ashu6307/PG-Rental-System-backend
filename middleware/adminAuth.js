import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';

// Admin Authentication Middleware
export const adminAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user has admin role
    if (decoded.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }
    
    // Get admin details
    const admin = await Admin.findById(decoded.id).select('-password');
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found.'
      });
    }
    
    // Check if admin is active
    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Admin account is deactivated.'
      });
    }
    
    // Add admin info to request
    req.user = {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      assignedCities: admin.assignedCities,
      permissions: admin.permissions
    };
    
    next();
    
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.'
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    
    console.error('Admin auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error.',
      error: error.message
    });
  }
};

// Super Admin Only Middleware
export const superAdminAuth = async (req, res, next) => {
  try {
    // First run admin auth
    await adminAuth(req, res, () => {});
    
    // Check if super admin
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Super admin privileges required.'
      });
    }
    
    next();
    
  } catch (error) {
    console.error('Super admin auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Super admin authentication error.',
      error: error.message
    });
  }
};

// City Access Middleware (check if admin has access to specific city)
export const cityAccessAuth = (cityField = 'city') => {
  return async (req, res, next) => {
    try {
      const requestedCity = req.params[cityField] || req.query[cityField] || req.body[cityField];
      
      if (!requestedCity) {
        return res.status(400).json({
          success: false,
          message: 'City parameter required.'
        });
      }
      
      // Super admin has access to all cities
      if (req.user.role === 'super_admin') {
        return next();
      }
      
      // Check if city admin has access to requested city
      const hasAccess = req.user.assignedCities.some(
        city => city.city === requestedCity && city.isActive
      );
      
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: `Access denied for city: ${requestedCity}`
        });
      }
      
      next();
      
    } catch (error) {
      console.error('City access auth error:', error);
      res.status(500).json({
        success: false,
        message: 'City access authentication error.',
        error: error.message
      });
    }
  };
};

// Permission-based Middleware
export const permissionAuth = (permission) => {
  return (req, res, next) => {
    try {
      // Super admin has all permissions
      if (req.user.role === 'super_admin') {
        return next();
      }
      
      // Check specific permission
      if (!req.user.permissions || !req.user.permissions[permission]) {
        return res.status(403).json({
          success: false,
          message: `Permission denied: ${permission} required.`
        });
      }
      
      next();
      
    } catch (error) {
      console.error('Permission auth error:', error);
      res.status(500).json({
        success: false,
        message: 'Permission authentication error.',
        error: error.message
      });
    }
  };
};

export default adminAuth;

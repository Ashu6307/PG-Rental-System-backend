import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export const authenticateJWT = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Alias for backward compatibility
export const authenticate = authenticateJWT;

// Authorization middleware
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    next();
  };
};

export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

export const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

export function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    next();
  };
}

// Location-based filtering middleware
export const addLocationFilter = (req, res, next) => {
  try {
    // Get city from query params
    const { city, state, lat, lng, radius = 5000 } = req.query;
    
    // Initialize location filter object
    req.locationFilter = {};
    
    // City-based filtering
    if (city && city.trim()) {
      req.locationFilter.city = new RegExp(city.trim(), 'i');
    }
    
    // State-based filtering  
    if (state && state.trim()) {
      req.locationFilter.state = new RegExp(state.trim(), 'i');
    }
    
    // Geo-location based filtering
    if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
      req.locationFilter.location = {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseInt(radius) || 5000
        }
      };
    }
    
    // Add location info to request for logging
    req.locationInfo = {
      city: city || null,
      state: state || null,
      coordinates: (lat && lng) ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null,
      radius: parseInt(radius) || 5000
    };
    
  // console.log('Location filter applied:', req.locationFilter);
    next();
  } catch (error) {
    console.error('Location filter middleware error:', error);
    // Don't fail the request, just continue without location filter
    req.locationFilter = {};
    req.locationInfo = { city: null, state: null, coordinates: null, radius: 5000 };
    next();
  }
};
// Owner authentication middleware
export function ownerAuth(req, res, next) {
  if (req.user && req.user.role === 'owner') {
    return next();
  }
  return res.status(403).json({ error: 'Owner access required' });
}

// Optional authentication middleware - doesn't fail if no token
export const optionalAuth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    // No token provided - continue as guest user
    req.user = null;
    return next();
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    // Invalid token - continue as guest user
    req.user = null;
    next();
  }
};



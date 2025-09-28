import jwt from 'jsonwebtoken';
const blacklist = new Set();

export function checkJwtExpiry(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  if (blacklist.has(token)) return res.status(401).json({ error: 'Token blacklisted' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token expired or invalid' });
  }
}

export function blacklistToken(token) {
  blacklist.add(token);
}

export function logSuspiciousActivity(req, reason) {
  // TODO: Save to AuditLog model
}
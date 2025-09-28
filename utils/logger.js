import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '../logs');
    this.isDev = process.env.NODE_ENV !== 'production';
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(meta).length > 0 ? ` | ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}`;
  }

  // Safe logging - no passwords
  info(message, meta = {}) {
    const formatted = this.formatMessage('info', message, meta);
    if (this.isDev) console.log(formatted);
    this.writeToFile('info', formatted);
  }

  error(message, meta = {}) {
    const formatted = this.formatMessage('error', message, meta);
    console.error(formatted);
    this.writeToFile('error', formatted);
  }

  warn(message, meta = {}) {
    const formatted = this.formatMessage('warn', message, meta);
    console.warn(formatted);
    this.writeToFile('warn', formatted);
  }

  debug(message, meta = {}) {
    if (this.isDev) {
      const formatted = this.formatMessage('debug', message, meta);
      console.log(formatted);
    }
  }

  writeToFile(level, message) {
    try {
      const logFile = path.join(this.logDir, `${level}.log`);
      fs.appendFileSync(logFile, message + '\n');
    } catch (error) {
      console.error('Logging error:', error.message);
    }
  }

  // Security-aware request logging
  logRequest(req, res, next) {
    const startTime = Date.now();
    
    // Skip spammy endpoints in dev
    if (this.isDev && req.path.includes('/auth/me')) {
      return next();
    }

    // Log important operations
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      this.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent')?.substring(0, 50)
      });
    }

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      if (res.statusCode >= 400) {
        this.error(`${req.method} ${req.path} - ${res.statusCode}`, {
          duration: `${duration}ms`,
          ip: req.ip
        });
      }
    });

    next();
  }
}

export default new Logger();

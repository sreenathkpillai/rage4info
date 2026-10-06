import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Admin credentials come from environment variables:
//   ADMIN_EMAIL          - login email
//   ADMIN_PASSWORD_HASH  - bcrypt hash of the password (preferred), or
//   ADMIN_PASSWORD       - plain password, hashed on first use
//
// They are resolved lazily (on first request), NOT at import time: this
// module is imported before dotenv.config() runs in server.ts, so reading
// process.env here at load time would silently ignore the .env file.

// Secrets that ship in this repo or its examples - never acceptable in production
const PLACEHOLDER_SECRETS = new Set([
  'fallback-secret-key',
  'your-super-secure-jwt-secret-minimum-32-characters',
  'your-very-secure-jwt-secret-key-here'
]);

const LEGACY_DEFAULT_EMAIL = 'admin@rage4info.org';
const LEGACY_DEFAULT_PASSWORD = 'manage2024';

interface AdminUser {
  id: string;
  email: string;
  passwordHash: string;
  role: 'admin';
  name: string;
}

let cachedUser: AdminUser | null = null;
let usingFallbackPassword = false;

const getAdminUser = (): AdminUser => {
  if (!cachedUser) {
    let passwordHash: string;
    if (process.env.ADMIN_PASSWORD_HASH) {
      passwordHash = process.env.ADMIN_PASSWORD_HASH;
    } else if (process.env.ADMIN_PASSWORD) {
      passwordHash = bcrypt.hashSync(process.env.ADMIN_PASSWORD, 10);
    } else {
      usingFallbackPassword = true;
      console.warn(
        'WARNING: ADMIN_PASSWORD / ADMIN_PASSWORD_HASH not set - using the default admin password. ' +
        'Set these in the server .env file before launch.'
      );
      passwordHash = bcrypt.hashSync(LEGACY_DEFAULT_PASSWORD, 10);
    }

    cachedUser = {
      id: 'admin-1',
      email: process.env.ADMIN_EMAIL || LEGACY_DEFAULT_EMAIL,
      passwordHash,
      role: 'admin',
      name: 'RAGE4INFO Administrator'
    };
  }
  return cachedUser;
};

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET || 'fallback-secret-key';
  return secret;
};

// In production, refuse admin auth entirely when secrets are missing or
// placeholders - otherwise anyone who has read this repo (or the old login
// page) can log in or forge tokens.
const authConfigError = (): string | null => {
  if (process.env.NODE_ENV !== 'production') return null;
  if (PLACEHOLDER_SECRETS.has(getJwtSecret())) {
    return 'JWT_SECRET is missing or still a placeholder';
  }
  getAdminUser();
  if (usingFallbackPassword) {
    return 'ADMIN_PASSWORD / ADMIN_PASSWORD_HASH is not set';
  }
  return null;
};

// Throttle login attempts to slow down password guessing
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    success: false,
    error: 'Too many login attempts. Please try again in 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Login
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const configError = authConfigError();
    if (configError) {
      console.error(`Login rejected: ${configError}`);
      return res.status(503).json({
        success: false,
        error: 'Admin login is disabled: the server is missing secure credentials. See v2/docs/HANDOVER.md section 4.'
      });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    const user = getAdminUser();
    if (email !== user.email) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      getJwtSecret(),
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
});

// Verify token
router.post('/verify', (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token is required'
      });
    }

    const decoded = jwt.verify(token, getJwtSecret()) as any;

    const user = getAdminUser();
    if (decoded.userId !== user.id) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name
        }
      }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
});

// Logout (client-side mainly, but we can track here)
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// Middleware to protect routes
export const authenticateToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // A placeholder JWT secret in production means any token could be forged
  // offline - refuse writes entirely rather than accept forgeable tokens.
  if (process.env.NODE_ENV === 'production' && PLACEHOLDER_SECRETS.has(getJwtSecret())) {
    return res.status(503).json({
      success: false,
      error: 'Admin actions are disabled: the server is missing secure credentials. See v2/docs/HANDOVER.md section 4.'
    });
  }

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access token required'
    });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as any;
    (req as any).user = decoded;
    next();
  } catch (error) {
    res.status(403).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
};

// Middleware to check admin role
export const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const user = (req as any).user;

  if (!user || user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }

  next();
};

export default router;

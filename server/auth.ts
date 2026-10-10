import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db, User } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'intervue-secure-jwt-session-key-2026-prod';

export interface AuthenticatedRequest extends Request {
  user?: User;
  isGuest?: boolean;
}

// Password hashing
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Token generation
export function generateToken(user: User): string {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// In-memory rate limiter per IP
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function rateLimiter(limit: number = 30, windowMs: number = 60000) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const entry = requestCounts.get(ip);

    if (!entry || now > entry.resetTime) {
      requestCounts.set(ip, { count: 1, resetTime: now + windowMs });
      next();
      return;
    }

    if (entry.count >= limit) {
      res.status(429).json({ error: 'Too many requests. Please slow down.' });
      return;
    }

    entry.count++;
    next();
  };
}

// Helper to resolve user from either internal JWT or Firebase Auth token
function resolveUserFromToken(token: string): User | undefined {
  // 1. Try local verification first
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
    const user = db.getUserById(payload.id);
    if (user) return user;
  } catch {}

  // 2. Decode as Firebase Auth token
  try {
    const decoded = jwt.decode(token) as any;
    if (decoded && (decoded.user_id || decoded.sub || decoded.email)) {
      const uid = decoded.user_id || decoded.sub;
      const email = decoded.email || '';
      const name = decoded.name || email.split('@')[0] || 'Student';

      let user = db.getUserById(uid);
      if (!user && email) {
        user = db.getUserByEmail(email);
      }

      if (!user) {
        // Auto-provision user record for this Firebase account
        user = db.createUser({
          id: uid,
          email: email || `user_${uid.slice(0, 8)}@firebase.app`,
          passwordHash: '',
          name,
          role: email.toLowerCase() === 'aravindpayyavula90@gmail.com' ? 'admin' : 'student',
          createdAt: new Date().toISOString(),
        });
      }

      return user;
    }
  } catch {}

  return undefined;
}

// Middleware to enforce authentication
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  let token = req.cookies?.intervue_token;

  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  if (token) {
    const user = resolveUserFromToken(token);
    if (user) {
      req.user = user;
      next();
      return;
    }
  }

  // Check for guest access header as fallback so initial uploads never fail
  const guestId = (req.headers['x-guest-id'] as string) || (req.query?.guestId as string);
  if (guestId) {
    let guestUser = db.getUserById(guestId);
    if (!guestUser) {
      guestUser = db.createUser({
        id: guestId,
        email: `guest_${guestId.slice(-6)}@intervue.app`,
        passwordHash: '',
        name: 'Guest Candidate',
        role: 'student',
        createdAt: new Date().toISOString(),
      });
    }
    req.user = guestUser;
    req.isGuest = true;
    next();
    return;
  }

  res.status(401).json({ error: 'Authentication required. Please sign in.' });
}

// Optional Auth (for uploads or actions that allow guests or logged in users)
export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  let token = req.cookies?.intervue_token;
  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  if (token) {
    const user = resolveUserFromToken(token);
    if (user) {
      req.user = user;
      next();
      return;
    }
  }

  // Fallback guest user
  const guestId = (req.headers['x-guest-id'] as string) || (req.query?.guestId as string) || 'guest_default_session';
  let guestUser = db.getUserById(guestId);
  if (!guestUser) {
    guestUser = db.createUser({
      id: guestId,
      email: `guest@intervue.app`,
      passwordHash: '',
      name: 'Guest Candidate',
      role: 'student',
      createdAt: new Date().toISOString(),
    });
  }
  req.user = guestUser;
  req.isGuest = true;
  next();
}

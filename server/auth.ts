import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db, User } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'intervue-secure-jwt-session-key-2026-prod';

export interface AuthenticatedRequest extends Request {
  user?: User;
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

export function rateLimiter(limit: number = 60, windowMs: number = 60000) {
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

// Helper to resolve user strictly from Authorization Bearer token (Firebase ID token or local JWT)
export function resolveUserFromToken(token: string): User | undefined {
  if (!token || typeof token !== 'string') return undefined;

  // 1. Try Firebase Auth token decode first (Firebase ID tokens are JWTs signed by Google with sub / user_id)
  try {
    const decoded = jwt.decode(token) as any;
    if (decoded && (decoded.user_id || decoded.sub)) {
      const uid = String(decoded.user_id || decoded.sub);
      const email = String(decoded.email || '').toLowerCase().trim();
      const displayName = decoded.name?.trim() || (email ? email.split('@')[0] : 'Candidate');

      let user = db.getUserById(uid);
      if (!user && email) {
        user = db.getUserByEmail(email);
        if (user) {
          // Keep ID synchronized with Firebase UID
          user.id = uid;
        }
      }

      if (!user) {
        // Auto-provision user record for this Firebase authenticated account
        user = db.createUser({
          id: uid,
          email: email || `user_${uid.slice(0, 8)}@intervue.app`,
          passwordHash: '',
          name: displayName,
          role: 'student',
          createdAt: new Date().toISOString(),
        });
      } else {
        // Keep name updated if Firebase supplied a fresh displayName
        if (decoded.name && user.name !== decoded.name.trim()) {
          db.updateUser(user.id, { name: decoded.name.trim() });
          user.name = decoded.name.trim();
        }
      }

      return user;
    }
  } catch {}

  // 2. Try local JWT token verification
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
    if (payload?.id) {
      const user = db.getUserById(payload.id);
      if (user) return user;
    }
  } catch {}

  return undefined;
}

// Middleware to enforce authentication
// CRITICAL: Must require Authorization Bearer header so no stale cookies cross-contaminate users!
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  let token: string | undefined;

  if (req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  if (!token) {
    res.status(401).json({
      error: 'Authentication required. Please sign in to practice interviews, upload resumes, and view your statistics.',
    });
    return;
  }

  const user = resolveUserFromToken(token);
  if (!user) {
    res.status(401).json({
      error: 'Session expired or invalid. Please sign in again with your account.',
    });
    return;
  }

  req.user = user;
  next();
}

// Optional Auth (for public informational endpoints if token provided)
export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  let token: string | undefined;

  if (req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  if (token) {
    const user = resolveUserFromToken(token);
    if (user) {
      req.user = user;
    }
  }

  next();
}

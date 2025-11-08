import { Request, Response, NextFunction } from 'express';
import { verifyToken, JWTPayload } from '../utils/jwt';
import { UserRole } from '../models/User';

// Extend Express Request to include user
export interface AuthRequest extends Request {
  user?: JWTPayload;
}

// Verify JWT token from cookies or Authorization header
export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Get token from cookie or Authorization header
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    // Verify token
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Authorize specific roles
export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role as UserRole)) {
      res.status(403).json({ 
        message: 'You do not have permission to perform this action' 
      });
      return;
    }

    next();
  };
};
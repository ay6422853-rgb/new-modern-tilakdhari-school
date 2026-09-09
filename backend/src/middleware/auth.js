import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';


/* =========================
   AUTHENTICATION
========================= */

export async function auth(req, res, next) {
  try {
    const header = req.headers.authorization || '';

    if (!header.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Authentication required'
      });
    }

    const token = header.slice(7).trim();

    if (!token) {
      return res.status(401).json({
        message: 'Authentication required'
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        message: 'User account not found'
      });
    }

    if (!user.active) {
      return res.status(401).json({
        message: 'Account is inactive'
      });
    }

    /*
      Logged-in user available everywhere as:
      req.user
    */

    req.user = user;

    next();

  } catch (error) {

    console.error('AUTH ERROR:', error.message);

    return res.status(401).json({
      message: 'Invalid or expired token'
    });
  }
}


/* =========================
   ROLE AUTHORIZATION
========================= */

export const roles = (...allowedRoles) => {
  return (req, res, next) => {

    if (!req.user) {
      return res.status(401).json({
        message: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'Access denied'
      });
    }

    next();
  };
};


/* =========================
   PROFILE AUTHORIZATION
========================= */

export const profileRole = (role) => {
  return (req, res, next) => {

    if (!req.user) {
      return res.status(401).json({
        message: 'Authentication required'
      });
    }

    if (req.user.role !== role) {
      return res.status(403).json({
        message: 'Access denied'
      });
    }

    next();
  };
};
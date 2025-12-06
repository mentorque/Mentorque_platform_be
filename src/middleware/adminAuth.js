const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Middleware to authenticate admin/mentor requests using JWT token
 * Checks cookie first, then Authorization header as fallback
 */
async function authenticateAdminToken(req, res, next) {
  try {
    // Try to get token from cookie first, then from Authorization header
    let token = req.cookies?.adminToken;
    
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split('Bearer ')[1];
      }
    }

    if (!token) {
      return res.status(401).json({
        error: 'Authorization token is required',
        message: 'Please provide a valid admin token',
      });
    }

    // Verify the JWT token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Verify admin/mentor exists and is not soft-deleted
    const adminMentor = await prisma.adminMentor.findFirst({
      where: {
        id: decoded.id,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        isAdmin: true,
      },
    });

    if (!adminMentor) {
      return res.status(401).json({
        error: 'Account disabled',
        message: 'Your account has been disabled',
      });
    }

    // Attach admin/mentor info to request
    req.adminMentor = adminMentor;

    next();
  } catch (error) {
    console.error('Admin token authentication error:', error);
    res.status(401).json({
      error: 'Invalid token',
      message: 'The provided token is invalid or expired',
    });
  }
}

module.exports = { authenticateAdminToken };



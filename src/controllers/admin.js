const prisma = require('../utils/prisma');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * POST /api/admin/signup
 * Admin/Mentor signup with email and password
 */
exports.signup = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        error: 'Email, password, and name are required',
      });
    }

    // Check if email already exists
    const existingAdminMentor = await prisma.adminMentor.findFirst({
      where: {
        email,
        deletedAt: null,
      },
    });

    if (existingAdminMentor) {
      return res.status(400).json({
        error: 'Email already registered',
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new admin/mentor (default: not admin, not verified)
    const newAdminMentor = await prisma.adminMentor.create({
      data: {
        email,
        password: hashedPassword,
        name,
        isAdmin: false,
        verifiedByAdmin: false,
      },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        verifiedByAdmin: true,
      },
    });

    // Generate JWT token
    const token = jwt.sign(
      {
        id: newAdminMentor.id,
        email: newAdminMentor.email,
        isAdmin: newAdminMentor.isAdmin,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set token in HTTP-only cookie (7 days expiration)
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    };

    res.cookie('adminToken', token, cookieOptions);

    res.status(201).json({
      success: true,
      adminMentor: {
        id: newAdminMentor.id,
        email: newAdminMentor.email,
        name: newAdminMentor.name,
        isAdmin: newAdminMentor.isAdmin,
        verifiedByAdmin: newAdminMentor.verifiedByAdmin,
      },
    });
  } catch (error) {
    console.error('Admin signup error:', error);
    res.status(500).json({
      error: 'Signup failed',
      message: error.message,
    });
  }
};

/**
 * POST /api/admin/login
 * Admin/Mentor login with email and password
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required',
      });
    }

    // Find admin/mentor by email (exclude soft-deleted)
    const adminMentor = await prisma.adminMentor.findFirst({
      where: { 
        email,
        deletedAt: null,
      },
    });

    if (!adminMentor) {
      return res.status(401).json({
        error: 'Invalid credentials',
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, adminMentor.password);

    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid credentials',
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: adminMentor.id,
        email: adminMentor.email,
        isAdmin: adminMentor.isAdmin,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set token in HTTP-only cookie (7 days expiration)
    const cookieOptions = {
      httpOnly: true, // Prevents JavaScript access (XSS protection)
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'lax', // CSRF protection
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
      path: '/', // Available for all paths
    };

    res.cookie('adminToken', token, cookieOptions);

    res.json({
      success: true,
      adminMentor: {
        id: adminMentor.id,
        email: adminMentor.email,
        name: adminMentor.name,
        picture: adminMentor.picture,
        expertise: adminMentor.expertise,
        background: adminMentor.background,
        availability: adminMentor.availability,
        isAdmin: adminMentor.isAdmin,
        verifiedByAdmin: adminMentor.verifiedByAdmin,
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: error.message,
    });
  }
};

/**
 * POST /api/admin/logout
 * Logout admin/mentor and clear cookie
 */
exports.logout = async (req, res) => {
  try {
    // Clear the adminToken cookie
    res.clearCookie('adminToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Logout failed',
      message: error.message,
    });
  }
};

/**
 * GET /api/admin/me
 * Get current admin/mentor info
 */
exports.getMe = async (req, res) => {
  try {
    const adminMentor = await prisma.adminMentor.findFirst({
      where: { 
        id: req.adminMentor.id,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        picture: true,
        company: true,
        role: true,
        expertise: true,
        background: true,
        availability: true,
        isAdmin: true,
        verifiedByAdmin: true,
        createdAt: true,
      },
    });

    res.json({ adminMentor });
  } catch (error) {
    console.error('Get admin/mentor error:', error);
    res.status(500).json({
      error: 'Failed to fetch admin/mentor info',
      message: error.message,
    });
  }
};

/**
 * GET /api/admin/stats
 * Get admin statistics (admin only)
 * Returns counts for users, mentors, and applied jobs
 */
exports.getAdminStats = async (req, res) => {
  try {
    if (!req.adminMentor.isAdmin) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only admins can access this endpoint',
      });
    }

    // Get counts in parallel
    const [totalUsers, totalMentors, totalJobs] = await Promise.all([
      prisma.user.count({
        where: {
          deletedAt: null,
        },
      }),
      prisma.adminMentor.count({
        where: {
          isAdmin: false,
          deletedAt: null,
        },
      }),
      prisma.appliedJob.count({
        where: {
          deletedAt: null,
        },
      }),
    ]);

    res.json({
      totalUsers,
      totalMentors,
      totalAppliedJobs: totalJobs,
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch admin stats',
      message: error.message,
    });
  }
};

/**
 * GET /api/admin/mentor/users
 * Get all users assigned to a mentor with pagination
 * Only loads essential data for list view (no AppliedJob or Progress)
 */
exports.getMentorUsers = async (req, res) => {
  try {
    const mentorId = req.adminMentor.id;

    // Get pagination parameters from query string
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100); // Max 100 per page, default 10
    const skip = (page - 1) * limit;

    // Get search and filter parameters
    const search = req.query.search || '';
    const verifiedFilter = req.query.verified; // 'true', 'false', or undefined

    // Build where clause
    const whereClause = {
      mentorId,
      deletedAt: null,
    };

    // Add search filter (search in email and fullName)
    if (search) {
      whereClause.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Add verification filter
    if (verifiedFilter !== undefined) {
      whereClause.verifiedByAdmin = verifiedFilter === 'true';
    }

    // Get total count for pagination
    const totalCount = await prisma.user.count({
      where: whereClause,
    });

    // Get paginated users (only essential fields for list view - no AppliedJob or Progress)
    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        fullName: true,
        goalPerDay: true,
        verifiedByAdmin: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(totalCount / limit);

    res.json({ 
      users,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error('Get mentor users error:', error);
    res.status(500).json({
      error: 'Failed to fetch users',
      message: error.message,
    });
  }
};

/**
 * GET /api/admin/all-users
 * Get all users (admin only) with pagination
 */
exports.getAllUsers = async (req, res) => {
  try {
    if (!req.adminMentor.isAdmin) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only admins can access this endpoint',
      });
    }

    // Get pagination parameters from query string
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 25, 100); // Max 100 per page
    const skip = (page - 1) * limit;

    // Get search and filter parameters
    const search = req.query.search || '';
    const verifiedFilter = req.query.verified; // 'true', 'false', or undefined
    const hasMentorFilter = req.query.hasMentor; // 'true', 'false', or undefined

    // Build where clause
    const whereClause = {
      deletedAt: null,
    };

    // Add search filter (search in email and fullName)
    if (search) {
      whereClause.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Add verification filter
    if (verifiedFilter !== undefined) {
      whereClause.verifiedByAdmin = verifiedFilter === 'true';
    }

    // Add mentor filter
    if (hasMentorFilter !== undefined) {
      if (hasMentorFilter === 'true') {
        whereClause.mentorId = { not: null };
      } else {
        whereClause.mentorId = null;
      }
    }

    // Get total count for pagination
    const totalCount = await prisma.user.count({
      where: whereClause,
    });

    // Get paginated users (only essential fields for list view)
    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        fullName: true,
        goalPerDay: true,
        createdAt: true,
        mentorId: true,
        verifiedByAdmin: true,
        mentor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(totalCount / limit);

    res.json({ 
      users,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      error: 'Failed to fetch users',
      message: error.message,
    });
  }
};

/**
 * GET /api/admin/mentors
 * Get all mentors (admin only) with pagination
 */
exports.getAllMentors = async (req, res) => {
  try {
    if (!req.adminMentor.isAdmin) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only admins can access this endpoint',
      });
    }

    // Get pagination parameters from query string
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 25, 100); // Max 100 per page
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const totalCount = await prisma.adminMentor.count({
      where: {
        isAdmin: false,
        deletedAt: null,
      },
    });

    // Get paginated mentors
    const mentors = await prisma.adminMentor.findMany({
      where: {
        isAdmin: false,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        picture: true,
        company: true,
        role: true,
        expertise: true,
        background: true,
        availability: true,
        verifiedByAdmin: true,
        createdAt: true,
        _count: {
          select: {
            users: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(totalCount / limit);

    res.json({ 
      mentors,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      }
    });
  } catch (error) {
    console.error('Get all mentors error:', error);
    res.status(500).json({
      error: 'Failed to fetch mentors',
      message: error.message,
    });
  }
};

/**
 * PATCH /api/admin/users/:userId/mentor
 * Assign or unassign mentor to user (admin only)
 */
exports.assignMentor = async (req, res) => {
  try {
    if (!req.adminMentor.isAdmin) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only admins can assign mentors',
      });
    }

    const { userId } = req.params;
    const { mentorId } = req.body; // null to unassign

    // Validate user exists (exclude soft-deleted)
    const user = await prisma.user.findFirst({
      where: { 
        id: userId,
        deletedAt: null,
      },
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    // Validate mentor exists if provided
    if (mentorId) {
      const mentor = await prisma.adminMentor.findFirst({
        where: { 
          id: mentorId,
          deletedAt: null,
        },
      });

      if (!mentor || mentor.isAdmin) {
        return res.status(404).json({
          error: 'Mentor not found',
        });
      }
    }

    // Update user's mentor
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        mentorId: mentorId || null,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        mentorId: true,
        mentor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.json({
      message: mentorId ? 'Mentor assigned successfully' : 'Mentor unassigned successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Assign mentor error:', error);
    res.status(500).json({
      error: 'Failed to assign mentor',
      message: error.message,
    });
  }
};

/**
 * GET /api/admin/users/:userId
 * Get user details with progress and jobs (admin or assigned mentor)
 */
exports.getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;
    const adminMentorId = req.adminMentor.id;
    const isAdmin = req.adminMentor.isAdmin;

    // Get user (exclude soft-deleted)
    const user = await prisma.user.findFirst({
      where: { 
        id: userId,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        goalPerDay: true,
        verifiedByAdmin: true,
        mentorId: true,
        mentor: {
          select: {
            id: true,
            name: true,
            email: true,
            picture: true,
            company: true,
            role: true,
          },
        },
        createdAt: true,
        Progress: {
          select: {
            id: true,
            weeks: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    // Check access: admin can see all, mentor can only see assigned users
    if (!isAdmin && user.mentorId !== adminMentorId) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only view your assigned users',
      });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({
      error: 'Failed to fetch user details',
      message: error.message,
    });
  }
};

/**
 * GET /api/admin/users/:userId/jobs
 * Get paginated applied jobs for a user (admin or assigned mentor)
 */
exports.getUserAppliedJobs = async (req, res) => {
  try {
    const { userId } = req.params;
    const adminMentorId = req.adminMentor.id;
    const isAdmin = req.adminMentor.isAdmin;

    // Get pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const skip = (page - 1) * limit;

    // Check if user exists and access
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
      select: {
        id: true,
        mentorId: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    // Check access
    if (!isAdmin && user.mentorId !== adminMentorId) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only view your assigned users',
      });
    }

    // Get total count
    const totalCount = await prisma.appliedJob.count({
      where: {
        userId,
        deletedAt: null,
      },
    });

    // Get paginated jobs
    const jobs = await prisma.appliedJob.findMany({
      where: {
        userId,
        deletedAt: null,
      },
          select: {
            id: true,
            title: true,
            company: true,
            location: true,
            url: true,
            status: true,
            appliedDate: true,
            createdAt: true,
          },
          orderBy: {
            appliedDate: 'desc',
          },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      jobs,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error('Get user applied jobs error:', error);
    res.status(500).json({
      error: 'Failed to fetch applied jobs',
      message: error.message,
    });
  }
};

/**
 * PATCH /api/admin/profile
 * Update mentor/admin profile (name, company, role, picture)
 */
exports.updateProfile = async (req, res) => {
  try {
    const adminMentorId = req.adminMentor.id;
    const { name, company, role, expertise, background, availability } = req.body;

    // Get current profile to handle picture deletion if needed
    const currentProfile = await prisma.adminMentor.findUnique({
      where: { id: adminMentorId },
      select: { picture: true },
    });

    let pictureUrl = currentProfile?.picture;

    // Handle image upload if provided
    if (req.file) {
      const { uploadImage, deleteImage, extractPublicId } = require('../utils/cloudinary');
      
      // Delete old image if exists
      if (currentProfile?.picture) {
        const oldPublicId = extractPublicId(currentProfile.picture);
        if (oldPublicId) {
          try {
            await deleteImage(oldPublicId);
          } catch (error) {
            console.error('Error deleting old image:', error);
            // Continue even if deletion fails
          }
        }
      }

      // Upload new image
      const uploadResult = await uploadImage(req.file.buffer, {
        public_id: `mentor_${adminMentorId}_${Date.now()}`,
      });
      pictureUrl = uploadResult.secure_url;
    }

    // Update profile
    const updatedProfile = await prisma.adminMentor.update({
      where: { id: adminMentorId },
      data: {
        ...(name && { name }),
        ...(company !== undefined && { company }),
        ...(role !== undefined && { role }),
        ...(expertise !== undefined && { expertise }),
        ...(background !== undefined && { background }),
        ...(availability !== undefined && { availability }),
        ...(pictureUrl && { picture: pictureUrl }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        company: true,
        role: true,
        picture: true,
        expertise: true,
        background: true,
        availability: true,
        isAdmin: true,
      },
    });

    res.json({
      message: 'Profile updated successfully',
      adminMentor: updatedProfile,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      error: 'Failed to update profile',
      message: error.message,
    });
  }
};

/**
 * GET /api/admin/approvals
 * Get all unverified users and mentors (admin only)
 */
exports.getPendingApprovals = async (req, res) => {
  try {
    if (!req.adminMentor.isAdmin) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only admins can access this endpoint',
      });
    }

    // Get unverified users and mentors in parallel
    const [unverifiedUsers, unverifiedMentors] = await Promise.all([
      prisma.user.findMany({
        where: {
          verifiedByAdmin: false,
          deletedAt: null,
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.adminMentor.findMany({
        where: {
          verifiedByAdmin: false,
          deletedAt: null,
        },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ]);

    res.json({
      unverifiedUsers,
      unverifiedMentors,
    });
  } catch (error) {
    console.error('Get pending approvals error:', error);
    res.status(500).json({
      error: 'Failed to fetch pending approvals',
      message: error.message,
    });
  }
};

/**
 * PATCH /api/admin/approvals/users/:userId
 * Verify a user (admin only)
 */
exports.verifyUser = async (req, res) => {
  try {
    if (!req.adminMentor.isAdmin) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only admins can verify users',
      });
    }

    const { userId } = req.params;

    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        verifiedByAdmin: true,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        verifiedByAdmin: true,
      },
    });

    res.json({
      message: 'User verified successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Verify user error:', error);
    res.status(500).json({
      error: 'Failed to verify user',
      message: error.message,
    });
  }
};

/**
 * GET /api/admin/users/:userId/eligible-calls
 * Get eligible mentor calls for a user (admin only)
 */
exports.getEligibleCalls = async (req, res) => {
  try {
    // Allow both admins and mentors to view eligible calls

    const { userId } = req.params;

    // Find user and their status
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
      include: {
        UserStatus: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    const status = user.UserStatus;
    if (!status) {
      return res.json({ eligibleCalls: [] });
    }

    // Determine eligible calls (eligible, not scheduled, not completed)
    const eligibleCalls = [];

    if (
      status.eligibleForFirstMentorCall &&
      !status.firstMentorCallScheduledAt &&
      !status.firstMentorCallCompletedAt
    ) {
      eligibleCalls.push(1);
    }

    if (
      status.eligibleForSecondMentorCall &&
      !status.secondMentorCallScheduledAt &&
      !status.secondMentorCallCompletedAt
    ) {
      eligibleCalls.push(2);
    }

    if (
      status.eligibleForThirdMentorCall &&
      !status.thirdMentorCallScheduledAt &&
      !status.thirdMentorCallCompletedAt
    ) {
      eligibleCalls.push(3);
    }

    if (
      status.eligibleForFourthMentorCall &&
      !status.fourthMentorCallScheduledAt &&
      !status.fourthMentorCallCompletedAt
    ) {
      eligibleCalls.push(4);
    }

    if (
      status.eligibleForFifthMentorCall &&
      !status.fifthMentorCallScheduledAt &&
      !status.fifthMentorCallCompletedAt
    ) {
      eligibleCalls.push(5);
    }

    res.json({ eligibleCalls });
  } catch (error) {
    console.error('Get eligible calls error:', error);
    res.status(500).json({
      error: 'Failed to get eligible calls',
      message: error.message,
    });
  }
};

/**
 * PATCH /api/admin/users/:userId/toggle-verification
 * Toggle user verification status (admin only, requires password confirmation)
 */
exports.toggleUserVerification = async (req, res) => {
  try {
    if (!req.adminMentor.isAdmin) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only admins can toggle user verification',
      });
    }

    const { userId } = req.params;
    const { password, verifiedByAdmin } = req.body;

    // Validate password
    if (!password) {
      return res.status(400).json({
        error: 'Password required',
        message: 'Please provide your password to confirm this action',
      });
    }

    // Verify admin password
    const adminMentor = await prisma.adminMentor.findFirst({
      where: {
        id: req.adminMentor.id,
        deletedAt: null,
      },
    });

    if (!adminMentor) {
      return res.status(404).json({
        error: 'Admin not found',
      });
    }

    const isValidPassword = await bcrypt.compare(password, adminMentor.password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid password',
        message: 'Password confirmation failed. Please try again.',
      });
    }

    // Find user
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    // Toggle verification status
    const newVerificationStatus = verifiedByAdmin !== undefined ? verifiedByAdmin : !user.verifiedByAdmin;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        verifiedByAdmin: newVerificationStatus,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        verifiedByAdmin: true,
      },
    });

    res.json({
      message: newVerificationStatus ? 'User verified successfully' : 'User verification revoked successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Toggle user verification error:', error);
    res.status(500).json({
      error: 'Failed to toggle user verification',
      message: error.message,
    });
  }
};

/**
 * PATCH /api/admin/approvals/mentors/:mentorId
 * Verify a mentor (admin only)
 */
exports.verifyMentor = async (req, res) => {
  try {
    if (!req.adminMentor.isAdmin) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only admins can verify mentors',
      });
    }

    const { mentorId } = req.params;

    const mentor = await prisma.adminMentor.findFirst({
      where: {
        id: mentorId,
        deletedAt: null,
      },
    });

    if (!mentor) {
      return res.status(404).json({
        error: 'Mentor not found',
      });
    }

    const updatedMentor = await prisma.adminMentor.update({
      where: { id: mentorId },
      data: {
        verifiedByAdmin: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        verifiedByAdmin: true,
      },
    });

    res.json({
      message: 'Mentor verified successfully',
      mentor: updatedMentor,
    });
  } catch (error) {
    console.error('Verify mentor error:', error);
    res.status(500).json({
      error: 'Failed to verify mentor',
      message: error.message,
    });
  }
};

/**
 * POST /api/admin/users/:userId/schedule-call
 * Schedule a mentor call for a user (admin only)
 */
exports.scheduleMentorCall = async (req, res) => {
  try {
    if (!req.adminMentor.isAdmin) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only admins can schedule mentor calls',
      });
    }

    const { userId } = req.params;
    const { callNumber, googleMeetLink, scheduledAt } = req.body;

    if (!callNumber || callNumber < 1 || callNumber > 5) {
      return res.status(400).json({
        error: 'Invalid call number',
        message: 'Call number must be between 1 and 5',
      });
    }

    if (!googleMeetLink || !scheduledAt) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Google Meet link and scheduled date/time are required',
      });
    }

    // Check if user exists
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    // Get or create user status
    let userStatus = await prisma.userStatus.findFirst({
      where: {
        userId,
        deletedAt: null,
      },
    });

    if (!userStatus) {
      userStatus = await prisma.userStatus.create({
        data: {
          userId,
        },
      });
    }

    // Map call number to fields
    const scheduledAtFieldMap = {
      1: 'firstMentorCallScheduledAt',
      2: 'secondMentorCallScheduledAt',
      3: 'thirdMentorCallScheduledAt',
      4: 'fourthMentorCallScheduledAt',
      5: 'fifthMentorCallScheduledAt',
    };

    const googleMeetFieldMap = {
      1: 'firstMentorCallGoogleMeetLink',
      2: 'secondMentorCallGoogleMeetLink',
      3: 'thirdMentorCallGoogleMeetLink',
      4: 'fourthMentorCallGoogleMeetLink',
      5: 'fifthMentorCallGoogleMeetLink',
    };

    const scheduledAtField = scheduledAtFieldMap[callNumber];
    const googleMeetField = googleMeetFieldMap[callNumber];

    // Update user status with scheduled call
    const updatedStatus = await prisma.userStatus.update({
      where: { id: userStatus.id },
      data: {
        [scheduledAtField]: new Date(scheduledAt),
        [googleMeetField]: googleMeetLink,
      },
    });

    res.json({
      message: `Mentor call ${callNumber} scheduled successfully`,
      userStatus: updatedStatus,
    });
  } catch (error) {
    console.error('Schedule mentor call error:', error);
    res.status(500).json({
      error: 'Failed to schedule mentor call',
      message: error.message,
    });
  }
};

/**
 * GET /api/admin/mentoring-sessions
 * Get all scheduled mentoring sessions (for mentors)
 */
exports.getMentoringSessions = async (req, res) => {
  try {
    const { isAdmin, id: mentorId } = req.adminMentor;

    console.log('📞 Fetching mentoring sessions:', { isAdmin, mentorId });

    // Get users assigned to this mentor (or all users if admin)
    const whereClause = isAdmin
      ? { deletedAt: null }
      : {
          mentorId,
          deletedAt: null,
        };

    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        UserStatus: true,
      },
    });

    console.log(`📊 Found ${users.length} users`);

    // Extract scheduled calls from user statuses
    const sessions = [];

    users.forEach((user) => {
      // Skip if no UserStatus or if it's deleted
      if (!user.UserStatus || user.UserStatus.deletedAt) return;

      const status = user.UserStatus;

      // Check each call (1-5)
      const callData = [
        {
          num: 1,
          scheduledAt: status.firstMentorCallScheduledAt,
          googleMeet: status.firstMentorCallGoogleMeetLink,
          completedAt: status.firstMentorCallCompletedAt,
        },
        {
          num: 2,
          scheduledAt: status.secondMentorCallScheduledAt,
          googleMeet: status.secondMentorCallGoogleMeetLink,
          completedAt: status.secondMentorCallCompletedAt,
        },
        {
          num: 3,
          scheduledAt: status.thirdMentorCallScheduledAt,
          googleMeet: status.thirdMentorCallGoogleMeetLink,
          completedAt: status.thirdMentorCallCompletedAt,
        },
        {
          num: 4,
          scheduledAt: status.fourthMentorCallScheduledAt,
          googleMeet: status.fourthMentorCallGoogleMeetLink,
          completedAt: status.fourthMentorCallCompletedAt,
        },
        {
          num: 5,
          scheduledAt: status.fifthMentorCallScheduledAt,
          googleMeet: status.fifthMentorCallGoogleMeetLink,
          completedAt: status.fifthMentorCallCompletedAt,
        },
      ];

      callData.forEach((call) => {
        if (call.scheduledAt && !call.completedAt) {
          sessions.push({
            id: `${user.id}-call-${call.num}`,
            userId: user.id,
            userEmail: user.email,
            userName: user.fullName,
            callNumber: call.num,
            scheduledAt: call.scheduledAt,
            googleMeetLink: call.googleMeet,
            completedAt: call.completedAt,
          });
        }
      });
    });

    // Sort by scheduled date
    sessions.sort(
      (a, b) =>
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
    );

    console.log(`✅ Found ${sessions.length} scheduled sessions`);
    res.json({ sessions });
  } catch (error) {
    console.error('Get mentoring sessions error:', error);
    res.status(500).json({
      error: 'Failed to fetch mentoring sessions',
      message: error.message,
    });
  }
};

/**
 * PATCH /api/admin/users/:userId/update-call
 * Update a scheduled mentor call (admin only)
 */
exports.updateScheduledCall = async (req, res) => {
  try {
    if (!req.adminMentor.isAdmin) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only admins can update scheduled calls',
      });
    }

    const { userId } = req.params;
    const { callNumber, googleMeetLink, scheduledAt } = req.body;

    if (!callNumber || callNumber < 1 || callNumber > 5) {
      return res.status(400).json({
        error: 'Invalid call number',
        message: 'Call number must be between 1 and 5',
      });
    }

    if (!googleMeetLink || !scheduledAt) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Google Meet link and scheduled date/time are required',
      });
    }

    // Check if user exists
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    // Get user status
    let userStatus = await prisma.userStatus.findFirst({
      where: {
        userId,
        deletedAt: null,
      },
    });

    if (!userStatus) {
      return res.status(404).json({
        error: 'User status not found',
      });
    }

    // Map call number to fields
    const scheduledAtFieldMap = {
      1: 'firstMentorCallScheduledAt',
      2: 'secondMentorCallScheduledAt',
      3: 'thirdMentorCallScheduledAt',
      4: 'fourthMentorCallScheduledAt',
      5: 'fifthMentorCallScheduledAt',
    };

    const googleMeetFieldMap = {
      1: 'firstMentorCallGoogleMeetLink',
      2: 'secondMentorCallGoogleMeetLink',
      3: 'thirdMentorCallGoogleMeetLink',
      4: 'fourthMentorCallGoogleMeetLink',
      5: 'fifthMentorCallGoogleMeetLink',
    };

    const scheduledAtField = scheduledAtFieldMap[callNumber];
    const googleMeetField = googleMeetFieldMap[callNumber];

    // Check if call is already scheduled
    if (!userStatus[scheduledAtField]) {
      return res.status(400).json({
        error: 'Call not scheduled',
        message: `Call ${callNumber} is not scheduled yet. Use the schedule endpoint instead.`,
      });
    }

    // Update scheduled call
    const updatedStatus = await prisma.userStatus.update({
      where: { id: userStatus.id },
      data: {
        [scheduledAtField]: new Date(scheduledAt),
        [googleMeetField]: googleMeetLink,
      },
    });

    res.json({
      message: `Mentor call ${callNumber} updated successfully`,
      userStatus: updatedStatus,
    });
  } catch (error) {
    console.error('Update scheduled call error:', error);
    res.status(500).json({
      error: 'Failed to update scheduled call',
      message: error.message,
    });
  }
};

/**
 * DELETE /api/admin/mentoring-sessions/:userId/:callNumber
 * Delete a scheduled mentor call (admin only)
 */
exports.deleteMentorCall = async (req, res) => {
  try {
    if (!req.adminMentor.isAdmin) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only admins can delete scheduled calls',
      });
    }

    const { userId, callNumber } = req.params;
    const callNum = parseInt(callNumber);

    if (!callNum || callNum < 1 || callNum > 5) {
      return res.status(400).json({
        error: 'Invalid call number',
        message: 'Call number must be between 1 and 5',
      });
    }

    // Check if user exists
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    // Get user status
    let userStatus = await prisma.userStatus.findFirst({
      where: {
        userId,
        deletedAt: null,
      },
    });

    if (!userStatus) {
      return res.status(404).json({
        error: 'User status not found',
      });
    }

    // Map call number to fields
    const scheduledAtFieldMap = {
      1: 'firstMentorCallScheduledAt',
      2: 'secondMentorCallScheduledAt',
      3: 'thirdMentorCallScheduledAt',
      4: 'fourthMentorCallScheduledAt',
      5: 'fifthMentorCallScheduledAt',
    };

    const googleMeetFieldMap = {
      1: 'firstMentorCallGoogleMeetLink',
      2: 'secondMentorCallGoogleMeetLink',
      3: 'thirdMentorCallGoogleMeetLink',
      4: 'fourthMentorCallGoogleMeetLink',
      5: 'fifthMentorCallGoogleMeetLink',
    };

    const scheduledAtField = scheduledAtFieldMap[callNum];
    const googleMeetField = googleMeetFieldMap[callNum];

    // Check if call is scheduled
    if (!userStatus[scheduledAtField]) {
      return res.status(400).json({
        error: 'Call not scheduled',
        message: `Call ${callNum} is not scheduled.`,
      });
    }

    // Delete scheduled call (set to null)
    const updatedStatus = await prisma.userStatus.update({
      where: { id: userStatus.id },
      data: {
        [scheduledAtField]: null,
        [googleMeetField]: null,
      },
    });

    res.json({
      message: `Mentor call ${callNum} deleted successfully`,
      userStatus: updatedStatus,
    });
  } catch (error) {
    console.error('Delete mentor call error:', error);
    res.status(500).json({
      error: 'Failed to delete mentor call',
      message: error.message,
    });
  }
};


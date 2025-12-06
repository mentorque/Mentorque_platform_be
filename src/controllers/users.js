const prisma = require('../utils/prisma');

/**
 * GET /api/users/me/mentor
 * Get current user's assigned mentor
 */
exports.getMyMentor = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('🔍 Fetching mentor for user ID:', userId);

    const user = await prisma.user.findFirst({
      where: { 
        id: userId,
        deletedAt: null,
      },
      include: {
        mentor: {
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
            deletedAt: true,
          },
        },
      },
    });

    if (!user) {
      console.log('❌ User not found:', userId);
      return res.status(404).json({
        error: 'User not found',
      });
    }

    if (!user.mentor) {
      console.log('⚠️ No mentor assigned for user:', userId);
      return res.status(404).json({
        error: 'No mentor assigned',
        message: 'You don\'t have a mentor assigned yet',
      });
    }

    // Check if mentor is soft-deleted
    if (user.mentor.deletedAt) {
      console.log('⚠️ Mentor is soft-deleted for user:', userId);
      return res.status(404).json({
        error: 'No mentor assigned',
        message: 'Your assigned mentor is no longer available',
      });
    }

    // Remove deletedAt from response
    const { deletedAt, ...mentorData } = user.mentor;

    console.log('✅ Found mentor:', mentorData.name, 'for user:', userId);
    res.json({
      mentor: mentorData,
    });
  } catch (error) {
    console.error('❌ Get my mentor error:', error);
    res.status(500).json({
      error: 'Failed to fetch mentor',
      message: error.message,
    });
  }
};

/**
 * GET /api/users/mentors
 * Get all mentors for users to view
 */
exports.getAllMentors = async (req, res) => {
  try {
    console.log('🔍 Fetching all mentors for users');
    
    const mentors = await prisma.adminMentor.findMany({
      where: {
        isAdmin: false,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        picture: true,
        company: true,
        role: true,
        expertise: true,
        background: true,
        availability: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    console.log(`✅ Found ${mentors.length} mentors`);
    res.json({ mentors });
  } catch (error) {
    console.error('❌ Get all mentors error:', error);
    res.status(500).json({
      error: 'Failed to fetch mentors',
      message: error.message,
    });
  }
};

/**
 * GET /api/users/me/verification
 * Get current user's verification status
 */
exports.getMyVerification = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
      select: {
        id: true,
        verifiedByAdmin: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    res.json({
      verifiedByAdmin: user.verifiedByAdmin,
    });
  } catch (error) {
    console.error('Get my verification error:', error);
    res.status(500).json({
      error: 'Failed to fetch verification status',
      message: error.message,
    });
  }
};



// hello
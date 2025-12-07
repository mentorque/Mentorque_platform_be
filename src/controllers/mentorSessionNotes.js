const prisma = require('../utils/prisma');

/**
 * GET /api/mentor-session-notes/:userId
 * Get all mentor session notes for a user
 */
exports.getSessionNotes = async (req, res) => {
  try {
    const { userId } = req.params;
    const mentorId = req.adminMentor?.id;

    // Verify the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, mentorId: true },
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    // Get all session notes for the user (calls 1-4)
    const notes = await prisma.mentorSessionNote.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      orderBy: {
        callNumber: 'asc',
      },
    });

    // Return all 4 calls with their notes (even if notes don't exist yet)
    const callsData = [
      {
        callNumber: 1,
        title: 'Resume Finalisation, Preparation Tips and Job Application Strategy',
        notes: notes.find(n => n.callNumber === 1)?.notes || '',
        updatedAt: notes.find(n => n.callNumber === 1)?.updatedAt || null,
      },
      {
        callNumber: 2,
        title: 'Progress Review and Strategy Adjustment',
        notes: notes.find(n => n.callNumber === 2)?.notes || '',
        updatedAt: notes.find(n => n.callNumber === 2)?.updatedAt || null,
      },
      {
        callNumber: 3,
        title: 'Mock Interview',
        notes: notes.find(n => n.callNumber === 3)?.notes || '',
        updatedAt: notes.find(n => n.callNumber === 3)?.updatedAt || null,
      },
      {
        callNumber: 4,
        title: 'Mock Interview',
        notes: notes.find(n => n.callNumber === 4)?.notes || '',
        updatedAt: notes.find(n => n.callNumber === 4)?.updatedAt || null,
      },
    ];

    res.json({ calls: callsData });
  } catch (error) {
    console.error('Get session notes error:', error);
    res.status(500).json({
      error: 'Failed to fetch session notes',
      message: error.message,
    });
  }
};

/**
 * PUT /api/mentor-session-notes/:userId/:callNumber
 * Update or create session notes for a specific call
 */
exports.updateSessionNotes = async (req, res) => {
  try {
    const { userId, callNumber } = req.params;
    const { notes } = req.body;
    const mentorId = req.adminMentor?.id;

    const callNum = parseInt(callNumber);

    if (isNaN(callNum) || callNum < 1 || callNum > 4) {
      return res.status(400).json({
        error: 'Invalid call number',
        message: 'Call number must be between 1 and 4',
      });
    }

    // Verify the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, mentorId: true },
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    // Upsert the session note
    const sessionNote = await prisma.mentorSessionNote.upsert({
      where: {
        userId_callNumber: {
          userId,
          callNumber: callNum,
        },
      },
      update: {
        notes: notes || '',
        mentorId,
        updatedAt: new Date(),
      },
      create: {
        userId,
        callNumber: callNum,
        notes: notes || '',
        mentorId,
      },
    });

    res.json({
      success: true,
      note: sessionNote,
    });
  } catch (error) {
    console.error('Update session notes error:', error);
    res.status(500).json({
      error: 'Failed to update session notes',
      message: error.message,
    });
  }
};

/**
 * DELETE /api/mentor-session-notes/:userId/:callNumber
 * Delete session notes for a specific call
 */
exports.deleteSessionNotes = async (req, res) => {
  try {
    const { userId, callNumber } = req.params;
    const callNum = parseInt(callNumber);

    if (isNaN(callNum) || callNum < 1 || callNum > 4) {
      return res.status(400).json({
        error: 'Invalid call number',
        message: 'Call number must be between 1 and 4',
      });
    }

    // Soft delete by setting deletedAt
    await prisma.mentorSessionNote.updateMany({
      where: {
        userId,
        callNumber: callNum,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'Session notes deleted',
    });
  } catch (error) {
    console.error('Delete session notes error:', error);
    res.status(500).json({
      error: 'Failed to delete session notes',
      message: error.message,
    });
  }
};


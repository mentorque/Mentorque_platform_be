const prisma = require('../utils/prisma');

/**
 * GET /api/admin/users/:userId/status
 * Get user status (for admin and mentor)
 */
exports.getUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;

    let userStatus = await prisma.userStatus.findFirst({
      where: {
        userId,
        deletedAt: null,
      },
    });

    // If no status exists, create default one
    if (!userStatus) {
      userStatus = await prisma.userStatus.create({
        data: {
          userId,
        },
      });
    }

    // Auto-calculate and update eligibility based on prerequisites
    await exports.updateMentorCallEligibility(userId, userStatus);

    // Fetch updated status after eligibility updates
    const finalStatus = await prisma.userStatus.findUnique({
      where: { id: userStatus.id },
    });

    res.json({ userStatus: finalStatus });
  } catch (error) {
    console.error('Get user status error:', error);
    res.status(500).json({
      error: 'Failed to fetch user status',
      message: error.message,
    });
  }
};

/**
 * PATCH /api/admin/users/:userId/status
 * Update user status (admin only)
 */
exports.updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;

    // Check if status exists
    let userStatus = await prisma.userStatus.findFirst({
      where: {
        userId,
        deletedAt: null,
      },
    });

    // Define step order and their field names
    const stepOrder = [
      { step: 1, field: 'orientation' },
      { step: 2, field: 'resumeRebuilding' },
      { step: 3, field: 'resumeConfirmed' },
      { step: 4, field: 'portfolioBuildingAndConfirmed' },
      { step: 5, field: 'paymentMade' },
      { step: 6, field: 'techDistributionAndExtension' },
      { step: 7, field: 'cheatSheetBuiltOut' },
      { step: 8, field: 'hasAppliedEnoughJobs' },
      { step: 9, field: 'finalReview' },
    ];

    // Check if any step is being unchecked and cascade uncheck subsequent steps
    for (const stepInfo of stepOrder) {
      if (updates.hasOwnProperty(stepInfo.field) && updates[stepInfo.field] === false) {
        // This step is being unchecked, uncheck all subsequent steps
        const currentStepIndex = stepOrder.findIndex(s => s.field === stepInfo.field);
        for (let i = currentStepIndex + 1; i < stepOrder.length; i++) {
          updates[stepOrder[i].field] = false;
        }
        break; // Only process the first unchecked step in the order
      }
    }

    // Create if doesn't exist
    if (!userStatus) {
      userStatus = await prisma.userStatus.create({
        data: {
          userId,
          ...updates,
        },
      });
    } else {
      // Update existing
      userStatus = await prisma.userStatus.update({
        where: { id: userStatus.id },
        data: updates,
      });
    }

    // Fetch updated status first
    const updatedStatus = await prisma.userStatus.findUnique({
      where: { id: userStatus.id },
    });

    // Auto-update mentor call eligibility flags
    await exports.updateMentorCallEligibility(userId, updatedStatus);

    // Fetch final updated status after eligibility updates
    const finalStatus = await prisma.userStatus.findUnique({
      where: { id: userStatus.id },
    });

    res.json({
      message: 'User status updated successfully',
      userStatus: finalStatus,
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      error: 'Failed to update user status',
      message: error.message,
    });
  }
};

/**
 * Auto-update mentor call eligibility based on status
 * Based on the step table:
 * - Step 2 (Resume Rebuilding) → First call unlocked
 * - Step 5 (Payment Done) → Second call unlocked
 * - Step 6 (Tech Distribution) → Third call unlocked
 * - Step 8 (Jobs Applied) → Fourth call unlocked
 * - Step 9 (Final Review) → Fifth call unlocked
 */
exports.updateMentorCallEligibility = async function updateMentorCallEligibility(userId, userStatus) {
  const updates = {};

  // First mentor call: after Resume Rebuilding (Step 2)
  if (userStatus.resumeRebuilding) {
    updates.eligibleForFirstMentorCall = true;
  } else {
    updates.eligibleForFirstMentorCall = false;
  }

  // Second mentor call: after Payment Done (Step 5)
  if (userStatus.paymentMade) {
    updates.eligibleForSecondMentorCall = true;
  } else {
    updates.eligibleForSecondMentorCall = false;
  }

  // Third mentor call: after Tech Distribution (Step 6)
  if (userStatus.techDistributionAndExtension) {
    updates.eligibleForThirdMentorCall = true;
  } else {
    updates.eligibleForThirdMentorCall = false;
  }

  // Fourth mentor call: after Jobs Applied (Step 8)
  if (userStatus.hasAppliedEnoughJobs) {
    updates.eligibleForFourthMentorCall = true;
  } else {
    updates.eligibleForFourthMentorCall = false;
  }

  // Fifth mentor call: after Final Review (Step 9)
  if (userStatus.finalReview) {
    updates.eligibleForFifthMentorCall = true;
  } else {
    updates.eligibleForFifthMentorCall = false;
  }

  if (Object.keys(updates).length > 0) {
    await prisma.userStatus.update({
      where: { id: userStatus.id },
      data: updates,
    });
  }
}

/**
 * POST /api/users/me/book-call
 * Book a mentor call (user only)
 */
exports.bookCall = async (req, res) => {
  try {
    const userId = req.user.id;
    const { callNumber } = req.body;

    if (!callNumber || callNumber < 1 || callNumber > 5) {
      return res.status(400).json({
        error: 'Invalid call number',
        message: 'Call number must be between 1 and 5',
      });
    }

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

    const completionFieldMap = {
      1: 'firstMentorCallCompletedAt',
      2: 'secondMentorCallCompletedAt',
      3: 'thirdMentorCallCompletedAt',
      4: 'fourthMentorCallCompletedAt',
      5: 'fifthMentorCallCompletedAt',
    };

    const eligibleFieldMap = {
      1: 'eligibleForFirstMentorCall',
      2: 'eligibleForSecondMentorCall',
      3: 'eligibleForThirdMentorCall',
      4: 'eligibleForFourthMentorCall',
      5: 'eligibleForFifthMentorCall',
    };

    const completionField = completionFieldMap[callNumber];
    const eligibleField = eligibleFieldMap[callNumber];

    if (!userStatus[eligibleField]) {
      return res.status(400).json({
        error: 'Not eligible',
        message: `You are not eligible for the ${callNumber}${callNumber === 1 ? 'st' : callNumber === 2 ? 'nd' : callNumber === 3 ? 'rd' : 'th'} mentor call yet`,
      });
    }

    const updates = {
      [completionField]: new Date(),
    };

    userStatus = await prisma.userStatus.update({
      where: { id: userStatus.id },
      data: updates,
    });

    await exports.updateMentorCallEligibility(userId, userStatus);

    const finalStatus = await prisma.userStatus.findUnique({
      where: { id: userStatus.id },
    });

    res.json({
      message: `Mentor call ${callNumber} booked successfully`,
      userStatus: finalStatus,
    });
  } catch (error) {
    console.error('Book call error:', error);
    res.status(500).json({
      error: 'Failed to book call',
      message: error.message,
    });
  }
};

/**
 * GET /api/users/me/status
 * Get current user's status (for users)
 */
exports.getMyStatus = async (req, res) => {
  try {
    const userId = req.user.id;

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

    await exports.updateMentorCallEligibility(userId, userStatus);

    const finalStatus = await prisma.userStatus.findUnique({
      where: { id: userStatus.id },
    });

    res.json({ userStatus: finalStatus });
  } catch (error) {
    console.error('Get my status error:', error);
    res.status(500).json({
      error: 'Failed to fetch status',
      message: error.message,
    });
  }
};


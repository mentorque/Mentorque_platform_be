const prisma = require('../utils/prisma');

/**
 * GET /progress
 * Get current user's progress (weeks array)
 */
exports.getProgress = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get or create progress record
    let progress = await prisma.progress.findFirst({
      where: {
        userId,
        deletedAt: null,
      },
    });

    // If no progress exists, create default one
    if (!progress) {
      const defaultWeeks = [
        { week: 1, title: "Resume Review & Analysis", description: "Get your resume reviewed and analysed by your personal mentor", done: false, completedAt: null, notes: "", color: "bg-blue-50 border-blue-200" },
        { week: 2, title: "Resume Rebuild & Optimization", description: "Completely rebuild your resume with expert guidance and ATS optimization", done: false, completedAt: null, notes: "", color: "bg-green-50 border-green-200" },
        { week: 3, title: "AI Assistant & Job Tracker Setup, Portfolio Building", description: "Get your AI assistant setup and build a stunning portfolio that showcases your skills and projects", done: false, completedAt: null, notes: "", color: "bg-purple-50 border-purple-200" },
        { week: 4, title: "Cheat Sheet & Mock Interview Prep Plan", description: "Get your cheat sheets and comprehensive mock interview preparation plan", done: false, completedAt: null, notes: "", color: "bg-orange-50 border-orange-200" },
        { week: 5, title: "Elevator Pitch", description: "Perfect your 30-second introduction", done: false, completedAt: null, notes: "", color: "bg-green-100 border-green-200" },
        { week: 6, title: "Competency Interview", description: "Behavioral questions and soft skills assessment", done: false, completedAt: null, notes: "", color: "bg-yellow-100 border-yellow-200" },
        { week: 7, title: "Technical Interview", description: "Coding challenges and technical deep-dives", done: false, completedAt: null, notes: "", color: "bg-orange-100 border-orange-200" },
        { week: 8, title: "Final Behavioral Round", description: "Executive-level behavioral assessment", done: false, completedAt: null, notes: "", color: "bg-red-100 border-red-200" },
      ];

      progress = await prisma.progress.create({
        data: {
          userId,
          weeks: defaultWeeks,
        },
      });
    }

    res.json({ weeks: progress.weeks });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({
      error: 'Failed to fetch progress',
      message: error.message,
    });
  }
};

/**
 * PUT /progress/week/:index/done
 * Update week done status
 */
exports.updateWeekDone = async (req, res) => {
  try {
    const userId = req.user.id;
    const index = parseInt(req.params.index);
    const { done } = req.body;

    if (isNaN(index) || index < 0) {
      return res.status(400).json({
        error: 'Invalid week index',
      });
    }

    // Get current progress
    let progress = await prisma.progress.findFirst({
      where: {
        userId,
        deletedAt: null,
      },
    });

    if (!progress) {
      return res.status(404).json({
        error: 'Progress not found',
      });
    }

    // Update the specific week
    const weeks = Array.isArray(progress.weeks) ? [...progress.weeks] : [];
    if (weeks[index]) {
      weeks[index] = {
        ...weeks[index],
        done: done === true,
        completedAt: done === true ? new Date().toISOString() : null,
      };
    } else {
      return res.status(404).json({
        error: 'Week not found',
      });
    }

    // Save updated progress
    progress = await prisma.progress.update({
      where: { id: progress.id },
      data: { weeks },
    });

    res.json({ weeks: progress.weeks });
  } catch (error) {
    console.error('Update week done error:', error);
    res.status(500).json({
      error: 'Failed to update week status',
      message: error.message,
    });
  }
};

/**
 * PUT /progress/week/:index/notes
 * Update week notes
 */
exports.updateWeekNotes = async (req, res) => {
  try {
    const userId = req.user.id;
    const index = parseInt(req.params.index);
    const { notes } = req.body;

    if (isNaN(index) || index < 0) {
      return res.status(400).json({
        error: 'Invalid week index',
      });
    }

    // Get current progress
    let progress = await prisma.progress.findFirst({
      where: {
        userId,
        deletedAt: null,
      },
    });

    if (!progress) {
      return res.status(404).json({
        error: 'Progress not found',
      });
    }

    // Update the specific week notes
    const weeks = Array.isArray(progress.weeks) ? [...progress.weeks] : [];
    if (weeks[index]) {
      weeks[index] = {
        ...weeks[index],
        notes: notes || '',
      };
    } else {
      return res.status(404).json({
        error: 'Week not found',
      });
    }

    // Save updated progress
    progress = await prisma.progress.update({
      where: { id: progress.id },
      data: { weeks },
    });

    res.json({ weeks: progress.weeks });
  } catch (error) {
    console.error('Update week notes error:', error);
    res.status(500).json({
      error: 'Failed to update week notes',
      message: error.message,
    });
  }
};


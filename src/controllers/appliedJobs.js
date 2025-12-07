const prisma = require('../utils/prisma');

/**
 * Get all applied jobs for the authenticated user
 * Supports filtering by time period via query parameter: ?period=7|10|30|all
 */
async function getAppliedJobs(req, res) {
  try {
    const userId = req.user.id;
    const { period } = req.query;

    // Build date filter based on period
    let dateFilter = {};
    if (period && period !== 'all') {
      const days = parseInt(period);
      if ([7, 10, 30].includes(days)) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        startDate.setHours(0, 0, 0, 0);
        
        dateFilter = {
          appliedDate: {
            gte: startDate,
          },
        };
      }
    }

    const jobs = await prisma.appliedJob.findMany({
      where: {
        userId,
        deletedAt: null,
        ...dateFilter,
      },
      orderBy: {
        appliedDate: 'desc',
      },
    });

    // Calculate statistics
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last10Days = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get all jobs for stats calculation
    const allJobs = await prisma.appliedJob.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      select: {
        appliedDate: true,
      },
    });

    const stats = {
      last7Days: allJobs.filter(j => new Date(j.appliedDate) >= last7Days).length,
      last10Days: allJobs.filter(j => new Date(j.appliedDate) >= last10Days).length,
      last30Days: allJobs.filter(j => new Date(j.appliedDate) >= last30Days).length,
      total: allJobs.length,
    };

    res.json({
      jobs,
      stats,
      period: period || 'all',
    });
  } catch (error) {
    console.error('Error fetching applied jobs:', error);
    res.status(500).json({
      error: 'Failed to fetch applied jobs',
      message: error.message,
    });
  }
}

/**
 * Get user's daily goal
 */
async function getDailyGoal(req, res) {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { goalPerDay: true },
    });

    res.json({
      goalPerDay: user?.goalPerDay || 3,
    });
  } catch (error) {
    console.error('Error fetching daily goal:', error);
    res.status(500).json({
      error: 'Failed to fetch daily goal',
      message: error.message,
    });
  }
}

/**
 * Update user's daily goal
 */
async function updateDailyGoal(req, res) {
  try {
    const userId = req.user.id;
    const { goalPerDay } = req.body;

    if (!goalPerDay || goalPerDay < 1 || goalPerDay > 100) {
      return res.status(400).json({
        error: 'Invalid goal',
        message: 'Goal must be between 1 and 100',
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { goalPerDay: parseInt(goalPerDay) },
      select: { goalPerDay: true },
    });

    res.json({
      goalPerDay: updatedUser.goalPerDay,
    });
  } catch (error) {
    console.error('Error updating daily goal:', error);
    res.status(500).json({
      error: 'Failed to update daily goal',
      message: error.message,
    });
  }
}

/**
 * Create a new applied job
 */
async function createAppliedJob(req, res) {
  try {
    const userId = req.user.id;
    const { id, title, company, location, url, appliedDate, status, type } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        error: 'Title is required',
        message: 'Please provide a job title',
      });
    }

    // Create the job with provided ID or generate one
    const jobData = {
      id: id || `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      title: title.trim(),
      company: company?.trim() || null,
      location: location?.trim() || null,
      url: url || '#',
      appliedDate: appliedDate ? new Date(appliedDate) : new Date(),
      status: status || 'Applied',
      type: type || 'Website',
      updatedAt: new Date(),
    };

    const job = await prisma.appliedJob.create({
      data: jobData,
    });

    res.status(201).json({
      job,
    });
  } catch (error) {
    console.error('Error creating applied job:', error);
    
    // Handle duplicate ID error
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Job already exists',
        message: 'A job with this ID already exists',
      });
    }

    res.status(500).json({
      error: 'Failed to create applied job',
      message: error.message,
    });
  }
}

/**
 * Update job status
 */
async function updateJobStatus(req, res) {
  try {
    const userId = req.user.id;
    const { jobId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        error: 'Status is required',
        message: 'Please provide a status',
      });
    }

    // Verify the job belongs to the user
    const job = await prisma.appliedJob.findFirst({
      where: {
        id: jobId,
        userId,
        deletedAt: null,
      },
    });

    if (!job) {
      return res.status(404).json({
        error: 'Job not found',
        message: 'The job does not exist or has been deleted',
      });
    }

    // Update the job status
    const updatedJob = await prisma.appliedJob.update({
      where: { id: jobId },
      data: {
        status,
        updatedAt: new Date(),
      },
    });

    res.json({
      job: updatedJob,
    });
  } catch (error) {
    console.error('Error updating job status:', error);
    res.status(500).json({
      error: 'Failed to update job status',
      message: error.message,
    });
  }
}

/**
 * Delete an applied job
 */
async function deleteAppliedJob(req, res) {
  try {
    const userId = req.user.id;
    const { jobId } = req.params;

    // Verify the job belongs to the user
    const job = await prisma.appliedJob.findFirst({
      where: {
        id: jobId,
        userId,
        deletedAt: null,
      },
    });

    if (!job) {
      return res.status(404).json({
        error: 'Job not found',
        message: 'The job does not exist or has already been deleted',
      });
    }

    // Soft delete the job
    await prisma.appliedJob.update({
      where: { id: jobId },
      data: { deletedAt: new Date() },
    });

    res.json({
      message: 'Job deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting applied job:', error);
    res.status(500).json({
      error: 'Failed to delete job',
      message: error.message,
    });
  }
}

module.exports = {
  getAppliedJobs,
  getDailyGoal,
  updateDailyGoal,
  createAppliedJob,
  updateJobStatus,
  deleteAppliedJob,
};


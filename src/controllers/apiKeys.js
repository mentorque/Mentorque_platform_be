const prisma = require('../utils/prisma');
const crypto = require('crypto');

/**
 * Get all API keys for the authenticated user
 */
async function getUserAPIKeys(req, res) {
  try {
    const userId = req.user.id;

    const apiKeys = await prisma.apiKey.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        key: true,
        name: true,
        createdAt: true,
        lastUsedAt: true,
        isActive: true,
      },
    });

    res.json({
      keys: apiKeys.map(key => ({
        id: key.id,
        key: key.key,
        name: key.name,
        createdAt: key.createdAt,
        lastUsed: key.lastUsedAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching API keys:', error);
    res.status(500).json({
      error: 'Failed to fetch API keys',
      message: error.message,
    });
  }
}

/**
 * Create a new API key for the authenticated user
 */
async function createAPIKey(req, res) {
  try {
    const userId = req.user.id;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        error: 'Name is required',
        message: 'Please provide a name for the API key',
      });
    }

    // Check if user already has 5 or more active API keys
    const existingKeysCount = await prisma.apiKey.count({
      where: {
        userId,
        deletedAt: null,
      },
    });

    if (existingKeysCount >= 5) {
      return res.status(400).json({
        error: 'Maximum API keys reached',
        message: 'You can only have up to 5 active API keys',
      });
    }

    // Generate a secure random API key
    const apiKey = `mqk_${crypto.randomBytes(32).toString('hex')}`;

    const newKey = await prisma.apiKey.create({
      data: {
        key: apiKey,
        name: name.trim(),
        userId,
      },
      select: {
        id: true,
        key: true,
        name: true,
        createdAt: true,
        lastUsedAt: true,
      },
    });

    res.status(201).json({
      key: {
        id: newKey.id,
        key: newKey.key,
        name: newKey.name,
        createdAt: newKey.createdAt,
        lastUsed: newKey.lastUsedAt,
      },
    });
  } catch (error) {
    console.error('Error creating API key:', error);
    res.status(500).json({
      error: 'Failed to create API key',
      message: error.message,
    });
  }
}

/**
 * Delete an API key
 */
async function deleteAPIKey(req, res) {
  try {
    const userId = req.user.id;
    const { keyId } = req.params;

    // Verify the key belongs to the user
    const apiKey = await prisma.apiKey.findFirst({
      where: {
        id: keyId,
        userId,
        deletedAt: null,
      },
    });

    if (!apiKey) {
      return res.status(404).json({
        error: 'API key not found',
        message: 'The API key does not exist or has already been deleted',
      });
    }

    // Soft delete the API key
    await prisma.apiKey.update({
      where: { id: keyId },
      data: { deletedAt: new Date() },
    });

    res.json({
      message: 'API key deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting API key:', error);
    res.status(500).json({
      error: 'Failed to delete API key',
      message: error.message,
    });
  }
}

module.exports = {
  getUserAPIKeys,
  createAPIKey,
  deleteAPIKey,
};


const prisma = require('./prisma');
const admin = require('firebase-admin');

/**
 * Get or create user in PostgreSQL database
 * Syncs with Firebase user and updates name from Firebase if available
 * 
 * @param {string} firebaseUid - Firebase user ID
 * @param {string} email - User email
 * @param {string|null} fullName - Optional name to set/update
 * @returns {Promise<Object>} User object
 */
async function getOrCreateUser(firebaseUid, email, fullName = null) {
  try {
    // Try to find existing user (exclude soft-deleted)
    let user = await prisma.user.findFirst({
      where: { 
        firebaseUid,
        deletedAt: null,
      },
    });

    // Try to get name from Firebase if not provided
    let firebaseName = fullName;
    if (!firebaseName) {
      try {
        const firebaseUser = await admin.auth().getUser(firebaseUid);
        // Firebase stores displayName from OAuth providers (Google, GitHub, etc.)
        firebaseName = firebaseUser.displayName || null;
      } catch (error) {
        // If we can't fetch from Firebase, continue with null - will use existing name if user exists
        console.log(`Could not fetch user from Firebase for name sync: ${error.message}`);
      }
    }
    
    // If we still don't have a name but user exists, keep existing name
    if (!firebaseName && user) {
      firebaseName = user.fullName;
    }

    if (!user) {
      // Create new user
      console.log(`Creating new user for Firebase UID: ${firebaseUid}`);
      user = await prisma.user.create({
        data: {
          firebaseUid,
          email,
          fullName: firebaseName,
        },
      });
      console.log(`✅ User created: ${user.email}${firebaseName ? ` (${firebaseName})` : ''}`);
    } else {
      // Update user's name if we have a new name from Firebase and it's different
      if (firebaseName && user.fullName !== firebaseName) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { fullName: firebaseName },
        });
        console.log(`✅ Synced user name from Firebase: ${user.email} -> ${firebaseName}`);
      }
    }

    return user;
  } catch (error) {
    console.error('Error in getOrCreateUser:', error);
    throw error;
  }
}

module.exports = { getOrCreateUser };


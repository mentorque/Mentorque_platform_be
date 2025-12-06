const admin = require('firebase-admin');
const { getOrCreateUser } = require('../src/utils/userSync');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    const serviceAccount = require('../firebase-service-account.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
    // In production, you might want to use environment variables instead
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
  }
}

/**
 * Middleware to authenticate Firebase token and sync user
 */
async function authenticateFirebaseToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authorization required',
        message: 'Please provide a valid Firebase token',
      });
    }

    const token = authHeader.split('Bearer ')[1];

    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Get or create user in database
    const user = await getOrCreateUser(
      decodedToken.uid,
      decodedToken.email,
      decodedToken.name || decodedToken.displayName || null
    );

    // Attach user info to request
    req.user = user;
    req.firebaseUid = decodedToken.uid;

    next();
  } catch (error) {
    console.error('Firebase token authentication error:', error);
    res.status(401).json({
      error: 'Invalid token',
      message: 'The provided token is invalid or expired',
    });
  }
}

module.exports = { authenticateFirebaseToken };


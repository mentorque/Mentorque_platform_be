const cloudinary = require('cloudinary').v2;
const multer = require('multer');

// Configure Cloudinary
// Support both CLOUDINARY_URL and individual environment variables
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({
    url: process.env.CLOUDINARY_URL,
  });
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Memory storage for multer (we'll upload to Cloudinary manually)
const storage = multer.memoryStorage();

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

// Upload image to Cloudinary from buffer
async function uploadImage(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: 'mentorque/mentors',
      resource_type: 'image',
      transformation: [
        { width: 500, height: 500, crop: 'fill', gravity: 'face' },
        { quality: 'auto' },
      ],
      ...options,
    };

    cloudinary.uploader
      .upload_stream(uploadOptions, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      })
      .end(buffer);
  });
}

// Helper function to delete image from Cloudinary
async function deleteImage(publicId) {
  try {
    if (!publicId) return;
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    throw error;
  }
}

// Helper function to extract public ID from Cloudinary URL
function extractPublicId(url) {
  if (!url) return null;
  try {
    // Cloudinary URLs format: https://res.cloudinary.com/{cloud_name}/image/upload/{version}/{folder}/{public_id}.{format}
    const urlParts = url.split('/');
    const uploadIndex = urlParts.findIndex((part) => part === 'upload');
    if (uploadIndex === -1) return null;

    const afterUpload = urlParts.slice(uploadIndex + 1);
    // Skip version if present (v1234567890)
    const startIndex = afterUpload[0]?.match(/^v\d+$/) ? 1 : 0;
    const pathParts = afterUpload.slice(startIndex);
    const path = pathParts.join('/');
    // Remove file extension
    return path.replace(/\.(jpg|jpeg|png|webp)$/i, '');
  } catch (error) {
    console.error('Error extracting public ID:', error);
    return null;
  }
}

module.exports = {
  cloudinary,
  upload,
  uploadImage,
  deleteImage,
  extractPublicId,
};

const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// Configure Cloudinary if credentials provided
const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log('[Storage] Cloudinary configured successfully.');
} else {
  console.log('[Storage] Cloudinary credentials not detected. Falling back to local disk storage (/uploads).');
}

/**
 * Uploads a file (from multer disk storage or buffer) to Cloudinary or returns local URL
 * @param {Object} file - Multer file object
 * @param {String} folder - Cloudinary folder name
 */
const uploadMedia = async (file, folder = 'animal_rescue') => {
  if (!file) return null;

  if (isCloudinaryConfigured) {
    try {
      // If file was saved to disk by multer
      if (file.path) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder,
          resource_type: 'auto',
        });
        // Remove temp local file after cloudinary upload
        try { fs.unlinkSync(file.path); } catch (e) {}
        return {
          url: result.secure_url,
          publicId: result.public_id,
          mediaType: result.resource_type === 'video' ? 'video' : 'image',
        };
      }
    } catch (err) {
      console.error('[Cloudinary Upload Error]:', err.message);
      // Fall through to local fallback if upload fails
    }
  }

  // Local fallback: Return static URL for locally stored file
  const filename = file.filename || file.originalname;
  const isVideo = file.mimetype && file.mimetype.startsWith('video');
  return {
    url: `/uploads/${filename}`,
    publicId: filename,
    mediaType: isVideo ? 'video' : 'image',
  };
};

module.exports = {
  cloudinary,
  isCloudinaryConfigured,
  uploadMedia,
};

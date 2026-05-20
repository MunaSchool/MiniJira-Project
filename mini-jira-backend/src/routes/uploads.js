const express = require('express');
const router = express.Router();

const { v4: uuidv4 } = require('uuid');

const {
  generateUploadUrl,
  deleteImage,
  deleteResizedImage
} = require('../services/s3');

const { authMiddleware } = require('../middleware/auth');

router.post('/presigned-url', authMiddleware, async (req, res) => {
  try {
    const { fileName, contentType } = req.body;

    if (!fileName || !contentType) {
      return res.status(400).json({
        error: 'fileName and contentType are required'
      });
    }

    // Security check
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp'
    ];

    if (!allowedTypes.includes(contentType)) {
      return res.status(400).json({
        error: 'Only jpeg/png/webp images are allowed'
      });
    }

    // Unique secure filename
    const extension = fileName.split('.').pop();

    const key = `tasks/${req.user.userId}/${uuidv4()}.${extension}`;

    const uploadUrl = await generateUploadUrl({
      key,
      contentType
    });
    
  const CLOUDFRONT_URL =
    process.env.CLOUDFRONT_URL || "https://d2tb1dxlwmny4q.cloudfront.net";

    res.json({
      uploadUrl,
      key,
      imageUrl: `${CLOUDFRONT_URL}/${key}`,
      resizedImageUrl: `${CLOUDFRONT_URL}/resized-${key}`
});


  } catch (error) {
    console.error('Presigned URL error:', error);

    res.status(500).json({
      error: 'Failed to generate upload URL'
    });
  }
});

router.delete('/:key(*)', authMiddleware, async (req, res) => {
  try {
    const key = req.params.key;

    await deleteImage(key);
    await deleteResizedImage(key);

    res.json({
      message: 'Image deleted successfully'
    });

  } catch (error) {
    console.error('Delete image error:', error);

    res.status(500).json({
      error: 'Failed to delete image'
    });
  }
});

module.exports = router;
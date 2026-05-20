const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { authMiddleware, requireRole } = require('../middleware/auth');

router.get('/:taskId', authMiddleware, commentController.getCommentsByTaskId);
router.post('/', authMiddleware, requireRole(['Manager']), commentController.createComment);

module.exports = router;

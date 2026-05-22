const express = require('express');
const router = express.Router();
const CommentModel = require('../models/comments');
const TaskModel = require('../models/tasksModel');
const { authMiddleware } = require('../middleware/auth');

router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const { taskId } = req.query;
    if (!taskId) {
      return res.status(400).json({ error: 'taskId query parameter is required' });
    }

    const task = await TaskModel.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (req.user.role !== 'Manager' && task.teamId !== req.user.teamId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const comments = await CommentModel.findByTaskId(taskId);
    comments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    res.json(comments);
  } catch (err) {
    next(err);
  }
});

router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { taskId, text } = req.body;
    if (!taskId || !text) {
      return res.status(400).json({ error: 'taskId and text are required' });
    }

    const task = await TaskModel.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (req.user.role !== 'Manager' && task.teamId !== req.user.teamId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const comment = await CommentModel.create({ taskId, text }, req.user.sub);
    await TaskModel.update(taskId, { commentCount: (task.commentCount || 0) + 1 }, req.user);
    res.status(201).json(comment);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

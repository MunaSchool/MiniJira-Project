const commentModel = require('../models/comments');
const taskModel = require('../models/tasksModel');

// Helper: check if user is manager
const isManager = (user) => user && user.role === 'Manager';

// Helper: ensure the user (employee or manager) can access the task's team
const canAccessTask = async (taskId, user) => {
  const task = await taskModel.findById(taskId);
  if (!task) return false;               // task doesn't exist
  if (isManager(user)) return true;      // manager can see any task
  // Employee: task's team must match user's team
  return task.teamId === user.teamId;
};

// GET /tasks/:taskId/comments
exports.getCommentsByTaskId = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { user } = req;

    //verify user has permission to see task
    const authorized = await canAccessTask(taskId, user);
    if (!authorized) {
      return res.status(403).json({ error: 'Access denied :( you cannot view comments for this task' });
    }

    const comments = await commentModel.findByTaskId(taskId);
    res.json(comments);
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
};

// POST /tasks/:taskId/comments
exports.createComment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { text } = req.body;
    const { user } = req;

    if (!text || text.trim() === '') {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    // Verify the user has permission to comment on this task
    const authorized = await canAccessTask(taskId, user);
    if (!authorized) {
      return res.status(403).json({ error: 'Access denied :( you cannot comment on this task' });
    }

    // Create comment – the model will likely generate commentId, createdAt, authorId
    const comment = await commentModel.create({
      taskId,
      text,
      authorId: user.userId,
    }, user.sub);          
    res.status(201).json(comment);
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
};
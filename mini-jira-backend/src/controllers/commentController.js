const commentModel = require('../models/commentModel');

//GET COMMENTS BY TASK ID
exports.getCommentsByTaskId = async (req, res) => {
    try {
      const { taskId } = req.params;
      const comments = await commentModel.findByTaskId(taskId);
      res.json(comments);
    } catch (error) {
      console.error('Get comments error:', error);
      res.status(500).json({ error: 'Failed to fetch comments' });
    }
  };

//POST COMMENT
exports.createComment = async (req, res) => {
    try {
      const { taskId } = req.params;
      const { text } = req.body;
  
      const comment = await commentModel.create({ taskId, text }, req.user.sub);
  
      res.status(201).json(comment);
    } catch (error) {
      console.error('Create comment error:', error);
      res.status(500).json({ error: 'Failed to create comment' });
    }
  };
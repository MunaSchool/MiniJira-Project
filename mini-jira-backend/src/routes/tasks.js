const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskcontroller');
const { authMiddleware, requireRole } = require('../middleware/auth');

router.post('/', authMiddleware, requireRole(['Manager']), taskController.createTask);
router.get('/', authMiddleware, taskController.getTasks);
router.patch('/:id/status', authMiddleware, taskController.updateTaskStatus);
router.get('/:id', authMiddleware, taskController.getTaskById);
router.put('/:id', authMiddleware, taskController.updateTask);
router.delete('/:id', authMiddleware, requireRole(['Manager']), taskController.deleteTask);

module.exports = router;

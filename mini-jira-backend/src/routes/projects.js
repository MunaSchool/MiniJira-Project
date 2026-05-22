const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { authMiddleware, requireRole } = require('../middleware/auth');

router.get('/', authMiddleware, projectController.getProjects);
router.get('/:id', authMiddleware, projectController.getProjectById);
router.post('/', authMiddleware, requireRole(['Manager']), projectController.createProject);
router.put('/:id', authMiddleware, requireRole(['Manager']), projectController.updateProject);
router.delete('/:id', authMiddleware, requireRole(['Manager']), projectController.deleteProject);

module.exports = router;

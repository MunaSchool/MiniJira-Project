const express = require('express');
const router = express.Router();
const ProjectModel = require('../models/projects');
const { authMiddleware, requireRole } = require('../middleware/auth');

router.get('/', async (req, res, next) => {
  try {
    const { teamId } = req.query;

    let projects;
    if (req.user.role === 'Manager') {
      if (teamId) {
        projects = await ProjectModel.findByTeamId(teamId);
      } else {
        projects = await ProjectModel.findAll();
      }
    } else {
      projects = await ProjectModel.findByTeamId(req.user.teamId);
    }

    res.json(projects);
  } catch (err) {
    next(err);
  }
});

router.post('/', authMiddleware, requireRole(['Manager']), async (req, res, next) => {
  try {
    const { name, description, teamId, deadline } = req.body;

    if (!name || !teamId) {
      return res.status(400).json({ error: 'name and teamId are required' });
    }

    const project = await ProjectModel.create({ name, description, teamId, deadline, managerId: req.user.userId }, req.user.userId);
    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const project = await ProjectModel.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    if (req.user.role !== 'Manager' && project.teamId !== req.user.teamId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(project);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', authMiddleware, requireRole(['Manager']), async (req, res, next) => {
  try {
    const updates = req.body;
    const project = await ProjectModel.update(req.params.id, updates);
    if (!project) return res.status(400).json({ error: 'No valid fields to update or project not found' });
    res.json(project);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authMiddleware, requireRole(['Manager']), async (req, res, next) => {
  try {
    const deletedProject = await ProjectModel.delete(req.params.id);
    if (!deletedProject) return res.status(404).json({ error: 'Project not found' });
    res.json({ message: 'Project deleted successfully', project: deletedProject });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

const projModel = require('../models/projects');
///////////////////////////////////dont forgetttttt///////////////////////
// Helper to check if user is manager
const isManager = (user) => user && user.role === 'Manager';

// GET /projects
exports.getProjects = async (req, res) => {
  try {
    const { role, teamId } = req.user;  // from your Cognito auth middleware

    let projects;
    if (isManager(req.user)) {
      // Manager sees all projects 
      projects = await projModel.findAll();
    } else {

      // Employee sees only projects belonging to their own team
      if (!teamId) {
        return res.status(403).json({ error: 'Employee account missing teamId' });
      }
      projects = await projModel.findByTeamId(teamId);  // uses GSI TeamIdIndex
    }

    res.json(projects);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
};

// GET /projects/:id
exports.getProjectById = async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const project = await projModel.findById(projectId);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Team isolation: employees can only see projects of their own team
    if (!isManager(req.user) && project.teamId !== req.user.teamId) {
      return res.status(403).json({ error: 'Access denied – project belongs to another team' });
    }

    res.json(project);
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
};

// POST /projects
exports.createProject = async (req, res) => {
  try {
    // Only managers can create projects
    if (!isManager(req.user)) {
      return res.status(403).json({ error: 'Only managers can create projects' });
    }

    const { name, description, teamId } = req.body;
    if (!name || !teamId) {
      return res.status(400).json({ error: 'name and teamId are required' });
    }

    // managerId should be the logged‑in user, not something from the body (security)
    const managerId = req.user.userId;  // or req.user.sub – depends on your middleware

    const project = await projModel.create({
      name,
      description,
      teamId,
      managerId,
    }, req.user.sub);  // keep your existing call signature

    res.status(201).json(project);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
};

// PUT /projects/:projectId
exports.updateProject = async (req, res) => {
  try {
    // Only managers can update projects
    if (!isManager(req.user)) {
      return res.status(403).json({ error: 'Only managers can update projects' });
    }

    const { id: projectId } = req.params;
    const { name, description, teamId, managerId } = req.body;

    if (!projectId) {
      return res.status(400).json({ error: 'Project id is required' });
    }

    const existing = await projModel.findById(projectId);
    if (!existing) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = await projModel.update(projectId, { name, description, teamId, managerId }, req.user);
    res.json(project);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
};

// DELETE /projects/:projectId
exports.deleteProject = async (req, res) => {
  try {
    // Only managers can delete projects
    if (!isManager(req.user)) {
      return res.status(403).json({ error: 'Only managers can delete projects' });
    }

    const { id: projectId } = req.params;

    if (!projectId) {
      return res.status(400).json({ error: 'Project id is required' });
    }

    const existing = await projModel.findById(projectId);
    if (!existing) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const success = await projModel.delete(projectId, req.user);
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
};
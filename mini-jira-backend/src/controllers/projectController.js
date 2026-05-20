const projModel = require('../models/projectModel');


//GET/ALL PROJS
exports.getProjects = async (req, res) => {
    try {
      const projects = await projModel.findAll();
      res.json(projects);
    } catch (error) {
      console.error('Get projects error:', error);
      res.status(500).json({ error: 'Failed to fetch projects' });
    }
  };   
  
  //GET PROJ BY ID
exports.getProjectById = async (req, res) => {
    try {
      const { projectId } = req.params;
      const project = await projModel.findById(projectId);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
      res.json(project);
    } catch (error) {
      console.error('Get project error:', error);
      res.status(500).json({ error: 'Failed to fetch project' });
    }
  };

   //POST PROJ
exports.createProject = async (req, res) => {
  try {
    const { name, description, teamId, managerId } = req.body;
    if (!name || !teamId || !managerId) {
        return res.status(400).json({ error: 'name, teamId, and managerId are required' });
    }
    const project = await projModel.create({ name, description, teamId, managerId }, req.user.sub);
    res.status(201).json(project);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
};

  //PUT PROJ ID
exports.updateProject = async (req, res) => {
    try {
      const { projectId } = req.params;
      const { name, description, teamId, managerId } = req.body;
        const project = await projModel.update(projectId, { name, description, teamId, managerId }, req.user);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.json(project);
    } catch (error) {
        console.error('Update project error:', error);
        res.status(500).json({ error: 'Failed to update project' });
    }
};

//DELETE PROJ ID
exports.deleteProject = async (req, res) => {
    try {
      const { projectId } = req.params;
      const success = await projModel.delete(projectId, req.user);  
        if (!success) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.json({ message: 'Project deleted successfully' });
    } catch (error) {
        console.error('Delete project error:', error);
        res.status(500).json({ error: 'Failed to delete project' });
    }
};
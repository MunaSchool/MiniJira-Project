const TaskModel = require('../models/tasksModel');

// Helper: Check if user can access a task
async function canAccessTask(taskId, user) {
  const task = await TaskModel.findById(taskId);
  if (!task) return { allowed: false, task: null };
  if (user.role === 'Manager') return { allowed: true, task };
  if (task.teamId === user.teamId) return { allowed: true, task };
  return { allowed: false, task: null };
}

exports.createTask = async (req, res) => {
  try {
    const { title, description, priority, deadline, assigneeId, teamId, imageKey } = req.body;
    
    if (!title || !assigneeId || !teamId) {
      return res.status(400).json({ error: 'title, assigneeId, and teamId are required' });
    }
    
    const task = await TaskModel.create({
      title, description, priority, deadline, assigneeId, teamId, imageKey
    }, req.user.sub);
    
    // TODO: Trigger SNS for assignment (Person 5)
    // await snsService.publishAssignment(task);
    
    res.status(201).json(task);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
};

// src/controllers/taskController.js
exports.getTasks = async (req, res) => {
  try {
    const { role, teamId, userId } = req.user;
    const { status, priority, assigneeId, limit } = req.query;
    
    let tasks;
    
    if (role === 'Manager') {
      // Manager sees all tasks (optionally filtered by assignee)
      tasks = await TaskModel.findAll({
        assigneeId,
        role,
        status,
        priority,
        limit
      });
    } else {
      // Employee: only see their team's tasks
      // Security: can only filter by their own assigneeId
      if (assigneeId && assigneeId !== userId) {
        return res.status(403).json({ error: 'Cannot view other employees tasks' });
      }
      
      tasks = await TaskModel.findByTeam(teamId, {
        status,
        priority,
        assigneeId: assigneeId || undefined,
        limit
      });
    }
    
    res.json({ tasks, count: tasks.length });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};

exports.getTaskById = async (req, res) => {
  try {
    const { allowed, task } = await canAccessTask(req.params.id, req.user);
    
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (!allowed) return res.status(403).json({ error: 'Access denied - task belongs to different team' });
    
    res.json(task);
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { allowed, task: existingTask } = await canAccessTask(req.params.id, req.user);
    
    if (!existingTask) return res.status(404).json({ error: 'Task not found' });
    if (!allowed) return res.status(403).json({ error: 'Access denied' });
    
    let updates = {};
    
    if (req.user.role === 'Employee') {
      // Employees: only status update allowed
      if (!req.body.status) {
        return res.status(400).json({ error: 'Employees can only update task status' });
      }
      const allowedStatuses = ['To Do', 'In Progress', 'In Review', 'Done'];
      if (!allowedStatuses.includes(req.body.status)) {
        return res.status(400).json({ error: 'Invalid status value' });
      }
      
      // Log status change
      if (existingTask.status !== req.body.status) {
        await TaskModel.logStatusChange(req.params.id, existingTask.status, req.body.status, req.user);
      }
      updates.status = req.body.status;
      
    } else {
      // Manager: can update any field
      updates = { ...req.body };
      
      // Log status change if status changed
      if (updates.status && existingTask.status !== updates.status) {
        await TaskModel.logStatusChange(req.params.id, existingTask.status, updates.status, req.user);
      }
    }
    
    const updatedTask = await TaskModel.update(req.params.id, updates, req.user);
    if (!updatedTask) return res.status(400).json({ error: 'No valid fields to update' });
    
    res.json(updatedTask);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const { allowed, task } = await canAccessTask(req.params.id, req.user);
    
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (!allowed) return res.status(403).json({ error: 'Access denied' });
    if (req.user.role !== 'Manager') {
      return res.status(403).json({ error: 'Only managers can delete tasks' });
    }
    
    const deletedTask = await TaskModel.delete(req.params.id);
    res.json({ message: 'Task deleted successfully', task: deletedTask });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
};
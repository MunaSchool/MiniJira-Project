//ana
const CLOUDFRONT_URL = process.env.CLOUDFRONT_URL ||
  "https://d2tb1dxlwmny4q.cloudfront.net";

const TaskModel = require('../models/tasksModel');
const snsService = require('../services/sns');
const cloudWatchService = require('../services/cloudwatch');

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

    await cloudWatchService.publishTaskCreated(task.teamId);
    
    // TODO: Trigger SNS for assignment (Person 5)
    // await snsService.publishAssignment(task); //Done here
    try {
      await snsService.publishTaskAssignment(task, req.user.sub || req.user.userId);
    } catch (snsError) {
      console.error('SNS publish failed, but task was created:', snsError);
    }
    
    //res.status(201).json(task);
    // ana replaced res.status(201).json(task); with
    
      const taskWithImages = {
        ...task,
        imageUrl: task.imageKey
          ? `${CLOUDFRONT_URL}/${task.imageKey}`
          : null,
        resizedImageUrl: task.imageKey
          ? `${CLOUDFRONT_URL}/resized-${task.imageKey}`
          : null
};

res.status(201).json(taskWithImages);

  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
};

// src/controllers/taskController.js
exports.getTasks = async (req, res) => {
  try {
    const { role, teamId, userId } = req.user;
    const { status, priority, assigneeId, limit, teamId: queryTeamId } = req.query;
    
    let tasks;
    
    if (role === 'Manager') {
      tasks = await TaskModel.findAll({
        assigneeId,
        role,
        status,
        priority,
        limit,
        teamId: queryTeamId
      });
    } else {
      // Employee: only see their team's tasks
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
    
    const tasksWithImages = tasks.map(task => ({
      ...task,
      imageUrl: task.imageKey
          ? `${CLOUDFRONT_URL}/${task.imageKey}`
          : null,
      resizedImageUrl: task.imageKey
        ? `${CLOUDFRONT_URL}/resized-${task.imageKey}`
        : null
    }));

    res.json({ tasks: tasksWithImages, count: tasks.length });
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
    
    const taskWithImages = {
      ...task,
      imageUrl: task.imageKey
        ? `${CLOUDFRONT_URL}/${task.imageKey}`
        : null,
      resizedImageUrl: task.imageKey
        ? `${CLOUDFRONT_URL}/resized-${task.imageKey}`
        : null
    };

    res.json(taskWithImages);
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
};

exports.updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const allowedStatuses = ['To Do', 'In Progress', 'In Review', 'Done'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const { allowed, task: existingTask } = await canAccessTask(req.params.id, req.user);
    if (!existingTask) return res.status(404).json({ error: 'Task not found' });
    if (!allowed) return res.status(403).json({ error: 'Access denied' });

    if (req.user.role === 'Employee' && existingTask.assigneeId !== req.user.userId && existingTask.teamId !== req.user.teamId) {
      return res.status(403).json({ error: 'Employees can only update tasks assigned to their team' });
    }

    if (existingTask.status !== status) {
      await TaskModel.logStatusChange(req.params.id, existingTask.status, status, req.user);
    }

    const updatedTask = await TaskModel.update(req.params.id, { status }, req.user);
    if (!updatedTask) return res.status(400).json({ error: 'Failed to update status' });
    res.json(updatedTask);
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Failed to update task status' });
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

      // If manager replaces task image, keep old + new image keys
    if (req.body.imageKey && req.body.imageKey !== existingTask.imageKey) {
    const oldHistory = existingTask.imageHistory || [];

    updates.imageHistory = [
      ...new Set([
        ...oldHistory,
        existingTask.imageKey,
        req.body.imageKey
      ].filter(Boolean))
    ];
  }
      
      // Log status change if status changed
      if (updates.status && existingTask.status !== updates.status) {
        await TaskModel.logStatusChange(req.params.id, existingTask.status, updates.status, req.user);
      }
    }

    const isClosingTask = updates.status === 'Done' && existingTask.status !== 'Done';

    if (isClosingTask) {
      updates.closedAt = new Date().toISOString();
    }
    
    const updatedTask = await TaskModel.update(req.params.id, updates, req.user);
    if (!updatedTask) return res.status(400).json({ error: 'No valid fields to update' });

    if (isClosingTask) {
      await cloudWatchService.publishTaskClosed(updatedTask.teamId);

      if (updatedTask.createdAt && updatedTask.closedAt) {
        const createdTime = new Date(updatedTask.createdAt).getTime();
        const closedTime = new Date(updatedTask.closedAt).getTime();
        const timeToCloseSeconds = Math.round((closedTime - createdTime) / 1000);

        if (timeToCloseSeconds >= 0) {
          await cloudWatchService.publishTimeToClose(timeToCloseSeconds, updatedTask.teamId);
        }
      }
    }
    
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

    //importing S3 helpers
    const { deleteImage, deleteResizedImage } = require('../services/s3');

    // deleting from DB FIRST (we still have the old task object)
    const deletedTask = await TaskModel.delete(req.params.id);

    // deleting all images linked to this task from S3
    const imageKeys = [
      ...(deletedTask?.imageHistory || []),
      deletedTask?.imageKey
    ].filter(Boolean);

    const uniqueImageKeys = [...new Set(imageKeys)];

    for (const key of uniqueImageKeys) {
      await deleteImage(key);
      await deleteResizedImage(key);
    }

    res.json({ 
      message: 'Task deleted successfully', 
      task: deletedTask 
    });

  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
};
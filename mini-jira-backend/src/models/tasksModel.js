const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, DeleteCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

const TASKS_TABLE = process.env.DYNAMODB_TASKS_TABLE || process.env.TASKS_TABLE || 'Tasks';
const AUDIT_TABLE =
  process.env.DYNAMODB_TASK_AUDIT_TABLE ||
  process.env.DYNAMODB_ACTIVITY_LOG_TABLE ||
  process.env.AUDIT_TABLE ||
  null;

class TaskModel {
  // Create
  static async create(taskData, userId) {
    const taskId = uuidv4();
    const now = new Date().toISOString();
    
  const task = {
    taskId,
    ...taskData,
    imageHistory: taskData.imageKey ? [taskData.imageKey] : [],
    status: taskData.status || 'To Do',
    priority: taskData.priority || 'Medium',
    createdAt: now,
    updatedAt: now,
    createdBy: userId,
    commentCount: 0
  };
    
    const command = new PutCommand({ TableName: TASKS_TABLE, Item: task });
    await docClient.send(command);
    return task;
  }
  
  // Find all (with filters)
  static async findAll({ teamId, role, status, priority, assigneeId, limit = 50 }) {
    let params = { TableName: TASKS_TABLE, Limit: parseInt(limit) };

    if (teamId) {
      params.IndexName = 'teamId-index';
      params.KeyConditionExpression = 'teamId = :teamId';
      params.ExpressionAttributeValues = { ':teamId': teamId };
      const filterExpressions = [];

      if (assigneeId) {
        filterExpressions.push('assigneeId = :assigneeId');
        params.ExpressionAttributeValues[':assigneeId'] = assigneeId;
      }
      if (status) {
        filterExpressions.push('status = :status');
        params.ExpressionAttributeValues[':status'] = status;
      }
      if (priority) {
        filterExpressions.push('priority = :priority');
        params.ExpressionAttributeValues[':priority'] = priority;
      }
      if (filterExpressions.length > 0) {
        params.FilterExpression = filterExpressions.join(' AND ');
      }

      const result = await docClient.send(new QueryCommand(params));
      return result.Items || [];
    }

    if (assigneeId) {
      params.IndexName = 'assigneeId-index';
      params.KeyConditionExpression = 'assigneeId = :assigneeId';
      params.ExpressionAttributeValues = { ':assigneeId': assigneeId };
      if (status) {
        params.FilterExpression = 'status = :status';
        params.ExpressionAttributeValues[':status'] = status;
      }
      if (priority) {
        params.FilterExpression = params.FilterExpression
          ? `${params.FilterExpression} AND priority = :priority`
          : 'priority = :priority';
        params.ExpressionAttributeValues[':priority'] = priority;
      }
      const result = await docClient.send(new QueryCommand(params));
      return result.Items || [];
    }

    const { ScanCommand } = require('@aws-sdk/lib-dynamodb');
    const result = await docClient.send(new ScanCommand(params));
    return result.Items || [];
  }

  static async findByTeam(teamId, { status, priority, assigneeId, limit = 50 }) {
    const params = {
      TableName: TASKS_TABLE,
      IndexName: 'teamId-index',
      KeyConditionExpression: 'teamId = :teamId',
      ExpressionAttributeValues: {
        ':teamId': teamId
      },
      Limit: parseInt(limit)
    };

    const filterExpressions = [];
    if (assigneeId) {
      filterExpressions.push('assigneeId = :assigneeId');
      params.ExpressionAttributeValues[':assigneeId'] = assigneeId;
    }
    if (status) {
      filterExpressions.push('status = :status');
      params.ExpressionAttributeValues[':status'] = status;
    }
    if (priority) {
      filterExpressions.push('priority = :priority');
      params.ExpressionAttributeValues[':priority'] = priority;
    }

    if (filterExpressions.length > 0) {
      params.FilterExpression = filterExpressions.join(' AND ');
    }

    const result = await docClient.send(new QueryCommand(params));
    return result.Items || [];
  }
  
  // Find one by ID
  static async findById(taskId) {
    const command = new GetCommand({ TableName: TASKS_TABLE, Key: { taskId } });
    const { Item } = await docClient.send(command);
    return Item;
  }
  
  // Update
  static async update(taskId, updates, user) {
    // Build update expression dynamically
    const allowedFields = [
      'title',
      'description',
      'status',
      'priority',
      'deadline',
      'assigneeId',
      'teamId',
      'imageKey',
      'imageHistory',
      'closedAt',
      'commentCount'
    ];
    const updateParts = [];
    const expressionValues = {};
    const expressionNames = {};
    
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        updateParts.push(`#${key} = :${key}`);
        expressionValues[`:${key}`] = value;
        expressionNames[`#${key}`] = key;
      }
    }
    
    if (updateParts.length === 0) return null;
    
    updateParts.push('#updatedAt = :updatedAt');
    expressionValues[':updatedAt'] = new Date().toISOString();
    expressionNames['#updatedAt'] = 'updatedAt';
    
    const command = new UpdateCommand({
      TableName: TASKS_TABLE,
      Key: { taskId },
      UpdateExpression: 'SET ' + updateParts.join(', '),
      ExpressionAttributeValues: expressionValues,
      ExpressionAttributeNames: expressionNames,
      ReturnValues: 'ALL_NEW'
    });
    
    const { Attributes } = await docClient.send(command);
    return Attributes;
  }
  
  // Delete
  static async delete(taskId) {
    const command = new DeleteCommand({
      TableName: TASKS_TABLE,
      Key: { taskId },
      ReturnValues: 'ALL_OLD'
    });
    const { Attributes } = await docClient.send(command);
    return Attributes;
  }
  
  // Log status change to audit
  static async logStatusChange(taskId, oldStatus, newStatus, user) {
    if (!AUDIT_TABLE) {
      return;
    }

    const command = new PutCommand({
      TableName: AUDIT_TABLE,
      Item: {
        taskId,
        changedAt: new Date().toISOString(),
        oldStatus,
        newStatus,
        changedBy: user.sub || user.userId,
        changedByRole: user.role,
        changedByName: user.email
      }
    });

    try {
      await docClient.send(command);
    } catch (error) {
      console.error('Status audit write skipped:', error);
    }
  }
}

module.exports = TaskModel;
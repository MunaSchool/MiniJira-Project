const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  BatchGetCommand
} = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

const TASKS_TABLE = process.env.DYNAMODB_TASKS_TABLE || process.env.TASKS_TABLE || 'Tasks';
const USERS_TABLE = process.env.DYNAMODB_USERS_TABLE || 'Users';

const AUDIT_TABLE =
  process.env.DYNAMODB_TASK_AUDIT_TABLE ||
  process.env.DYNAMODB_ACTIVITY_LOG_TABLE ||
  process.env.AUDIT_TABLE ||
  null;

class TaskModel {
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

  static async addAssigneeNames(tasks) {
    if (!tasks || tasks.length === 0) return tasks;

    const assigneeIds = [...new Set(tasks.map(task => task.assigneeId).filter(Boolean))];
    if (assigneeIds.length === 0) return tasks;

    try {
      const result = await docClient.send(new BatchGetCommand({
        RequestItems: {
          [USERS_TABLE]: {
            Keys: assigneeIds.map(userId => ({ userId }))
          }
        }
      }));

      const users = result.Responses?.[USERS_TABLE] || [];
      const userMap = new Map(users.map(user => [user.userId, user]));

      return tasks.map(task => {
        const user = userMap.get(task.assigneeId);

        return {
          ...task,
          assigneeName: user?.name || user?.email || task.assigneeId,
          assigneeEmail: user?.email || null
        };
      });
    } catch (error) {
      console.error('Failed to add assignee names:', error);
      return tasks;
    }
  }

  static async findAll({ teamId, role, status, priority, assigneeId, limit = 50 }) {
    let params = { TableName: TASKS_TABLE, Limit: parseInt(limit) || 50 };

    if (teamId && role !== 'Manager') {
      params.IndexName = 'GSI_TeamId';
      params.KeyConditionExpression = 'teamId = :teamId';
      params.ExpressionAttributeValues = { ':teamId': teamId };

      const result = await docClient.send(new QueryCommand(params));
      return await this.addAssigneeNames(result.Items || []);
    }

    if (assigneeId) {
      params.IndexName = 'GSI_AssigneeId';
      params.KeyConditionExpression = 'assigneeId = :assigneeId';
      params.ExpressionAttributeValues = { ':assigneeId': assigneeId };

      const result = await docClient.send(new QueryCommand(params));
      return await this.addAssigneeNames(result.Items || []);
    }

    const { ScanCommand } = require('@aws-sdk/lib-dynamodb');
    const result = await docClient.send(new ScanCommand(params));
    return await this.addAssigneeNames(result.Items || []);
  }

  static async findById(taskId) {
    const command = new GetCommand({ TableName: TASKS_TABLE, Key: { taskId } });
    const { Item } = await docClient.send(command);
    return Item;
  }

  static async update(taskId, updates, user) {
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
      'closedAt'
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

  static async delete(taskId) {
    const command = new DeleteCommand({
      TableName: TASKS_TABLE,
      Key: { taskId },
      ReturnValues: 'ALL_OLD'
    });

    const { Attributes } = await docClient.send(command);
    return Attributes;
  }

  static async logStatusChange(taskId, oldStatus, newStatus, user) {
    if (!AUDIT_TABLE) return;

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

  static async findByTeam(teamId, { status, priority, assigneeId, limit = 50 } = {}) {
    const params = {
      TableName: TASKS_TABLE,
      IndexName: 'GSI_TeamId',
      KeyConditionExpression: 'teamId = :teamId',
      ExpressionAttributeValues: {
        ':teamId': teamId
      },
      Limit: parseInt(limit) || 50
    };

    const result = await docClient.send(new QueryCommand(params));
    let items = result.Items || [];

    if (status) {
      items = items.filter(task => task.status === status);
    }

    if (priority) {
      items = items.filter(task => task.priority === priority);
    }

    if (assigneeId) {
      items = items.filter(task => task.assigneeId === assigneeId);
    }

    return await this.addAssigneeNames(items);
  }
}

module.exports = TaskModel;
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, DeleteCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

const COMMENTS_TABLE = process.env.DYNAMODB_TASKS_TABLE || process.env.TASKS_TABLE || 'Comments';
const AUDIT_TABLE = process.env.DYNAMODB_TASK_AUDIT_TABLE || process.env.AUDIT_TABLE || null;

class CommentModel {
    // Creating comments
    static async create(commentData, userId) {
      const commentId = uuidv4();
      const now = new Date().toISOString();
      
      const comment = {
        commentId,
        ...commentData,
        taskId: commentData.taskId,
        text: commentData.text,
        createdAt: now,
        updatedAt: now,
        createdBy: userId,
        commentCount: 0
      };
      
      const command = new PutCommand({ TableName: COMMENTS_TABLE, Item: comment });
      await docClient.send(command);
      return comment;
    }
  }
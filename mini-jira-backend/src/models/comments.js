const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, DeleteCommand, QueryCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

const COMMENTS_TABLE = process.env.DYNAMODB_COMMENTS_TABLE || process.env.COMMENTS_TABLE || 'Comments';
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

    static async findByTaskId(taskId) {
      const queryParams = {
        TableName: COMMENTS_TABLE,
        IndexName: 'GSI_TeamId',
        KeyConditionExpression: 'taskId = :taskId',
        ExpressionAttributeValues: {
          ':taskId': taskId
        }
      };

      try {
        const result = await docClient.send(new QueryCommand(queryParams));
        return result.Items || [];
      } catch (err) {
        if (err.name === 'ValidationException' && err.message.includes('taskId-index')) {
          const scanParams = {
            TableName: COMMENTS_TABLE,
            FilterExpression: 'taskId = :taskId',
            ExpressionAttributeValues: {
              ':taskId': taskId
            }
          };
          const scanResult = await docClient.send(new ScanCommand(scanParams));
          return scanResult.Items || [];
        }
        throw err;
      }
    }
  }

  module.exports = CommentModel;
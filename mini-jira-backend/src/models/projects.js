const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, DeleteCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

const PROJ_TABLE = process.env.DYNAMODB_TASKS_TABLE || process.env.TASKS_TABLE || 'Projects';
const AUDIT_TABLE = process.env.DYNAMODB_TASK_AUDIT_TABLE || process.env.AUDIT_TABLE || null;

class ProjectModel {

    //creating proj
    static async create(projectData, userId) {
    const projectId = uuidv4();
    const now = new Date().toISOString();
    const project = {
      projectId,
      ...projectData,
      //name: projectData.name,
      //description: projectData.description,
      //teamId: projectData.teamId,
      //managerId: projectData.managerId,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      commentCount: 0
    };




    const command = new PutCommand({ TableName: PROJ_TABLE, Item: project });
    await docClient.send(command);
    return project;
  }
}
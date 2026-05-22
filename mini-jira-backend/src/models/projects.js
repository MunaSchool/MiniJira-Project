const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, DeleteCommand, QueryCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

const PROJ_TABLE = process.env.DYNAMODB_PROJECTS_TABLE || process.env.PROJECTS_TABLE || 'Projects';
const AUDIT_TABLE = process.env.DYNAMODB_TASK_AUDIT_TABLE || process.env.AUDIT_TABLE || null;

class ProjectModel {

    //creating proj
    static async create(projectData, userId) {
    const projectId = uuidv4();
    const now = new Date().toISOString();
    const project = {
      projectId,
      ...projectData,
      //improv 
      name: projectData.name,
      description: projectData.description,
      teamId: projectData.teamId,
      managerId: projectData.managerId,
      deadline: projectData.deadline,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      commentCount: 0
    };




    const command = new PutCommand({ TableName: PROJ_TABLE, Item: project });
    await docClient.send(command);
    return project;
  }

  static async findAll() {
    const command = new ScanCommand({ TableName: PROJ_TABLE });
    const result = await docClient.send(command);
    return result.Items || [];
  }

  static async findByTeamId(teamId) {
    const params = {
      TableName: PROJ_TABLE,
      IndexName: 'teamId-index',
      KeyConditionExpression: 'teamId = :teamId',
      ExpressionAttributeValues: {
        ':teamId': teamId
      }
    };
    const result = await docClient.send(new QueryCommand(params));
    return result.Items || [];
  }

  static async findById(projectId) {
    if (!projectId) {
      throw new Error('Missing projectId for findById');
    }

    const command = new ScanCommand({
      TableName: PROJ_TABLE,
      FilterExpression: 'projectId = :projectId',
      ExpressionAttributeValues: {
        ':projectId': projectId
      },
      Limit: 1
    });
    const result = await docClient.send(command);
    return (result.Items && result.Items[0]) || null;
  }

  static async update(projectId, updates) {
    const allowedFields = ['name', 'description', 'teamId', 'managerId', 'deadline'];
    const updateParts = [];
    const expressionValues = {};
    const expressionNames = {};

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updateParts.push(`#${key} = :${key}`);
        expressionValues[`:${key}`] = value;
        expressionNames[`#${key}`] = key;
      }
    }

    if (updateParts.length === 0) {
      return null;
    }

    updateParts.push('#updatedAt = :updatedAt');
    expressionValues[':updatedAt'] = new Date().toISOString();
    expressionNames['#updatedAt'] = 'updatedAt';

    const command = new UpdateCommand({
      TableName: PROJ_TABLE,
      Key: { projectId },
      UpdateExpression: 'SET ' + updateParts.join(', '),
      ExpressionAttributeNames: expressionNames,
      ExpressionAttributeValues: expressionValues,
      ReturnValues: 'ALL_NEW'
    });

    const { Attributes } = await docClient.send(command);
    return Attributes;
  }

  static async delete(projectId) {
    const command = new DeleteCommand({
      TableName: PROJ_TABLE,
      Key: { projectId },
      ReturnValues: 'ALL_OLD'
    });
    const { Attributes } = await docClient.send(command);
    return Attributes;
  }
}

module.exports = ProjectModel;
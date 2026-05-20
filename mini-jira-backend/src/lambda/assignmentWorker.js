const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { CloudWatchClient, PutMetricDataCommand } = require('@aws-sdk/client-cloudwatch');
const { randomUUID } = require('crypto');

const region = process.env.AWS_REGION;
const dynamoClient = new DynamoDBClient({ region });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const cloudWatchClient = new CloudWatchClient({ region });

const ACTIVITY_LOG_TABLE = process.env.DYNAMODB_ACTIVITY_LOG_TABLE || 'ActivityLogs';
const CLOUDWATCH_NAMESPACE = process.env.CLOUDWATCH_NAMESPACE || 'MiniJira';

exports.handler = async (event) => {
  console.log('Received SQS event:', JSON.stringify(event, null, 2));

  for (const record of event.Records) {
    const snsMessage = JSON.parse(record.body);
    const assignmentEvent = JSON.parse(snsMessage.Message);

    const now = new Date().toISOString();

    await docClient.send(new PutCommand({
      TableName: ACTIVITY_LOG_TABLE,
      Item: {
        logId: randomUUID(),
        taskId: assignmentEvent.taskId,
        eventType: assignmentEvent.eventType,
        title: assignmentEvent.title,
        assigneeId: assignmentEvent.assigneeId,
        teamId: assignmentEvent.teamId,
        assignedBy: assignmentEvent.assignedBy,
        createdAt: now
      }
    }));

    await cloudWatchClient.send(new PutMetricDataCommand({
      Namespace: CLOUDWATCH_NAMESPACE,
      MetricData: [
        {
          MetricName: 'TasksAssignedPerTeam',
          Dimensions: [
            {
              Name: 'TeamId',
              Value: assignmentEvent.teamId
            }
          ],
          Unit: 'Count',
          Value: 1
        }
      ]
    }));

    console.log(`Processed assignment for task ${assignmentEvent.taskId}`);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Assignment events processed successfully' })
  };
};
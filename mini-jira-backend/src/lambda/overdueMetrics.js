const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { CloudWatchClient, PutMetricDataCommand } = require('@aws-sdk/client-cloudwatch');

const region = process.env.AWS_REGION;

const dynamoClient = new DynamoDBClient({ region });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const cloudWatchClient = new CloudWatchClient({ region });

const TASKS_TABLE = process.env.DYNAMODB_TASKS_TABLE || 'Tasks';
const CLOUDWATCH_NAMESPACE = process.env.CLOUDWATCH_NAMESPACE || 'MiniJira';

function getTodayDateOnly() {
  return new Date().toISOString().split('T')[0];
}

exports.handler = async () => {
  const today = getTodayDateOnly();

  console.log('Checking overdue tasks before:', today);

  const result = await docClient.send(new ScanCommand({
    TableName: TASKS_TABLE,
    FilterExpression: 'deadline < :today AND #status <> :done',
    ExpressionAttributeNames: {
      '#status': 'status'
    },
    ExpressionAttributeValues: {
      ':today': today,
      ':done': 'Done'
    }
  }));

  const overdueTasks = result.Items || [];
  const overdueCount = overdueTasks.length;

  await cloudWatchClient.send(new PutMetricDataCommand({
    Namespace: CLOUDWATCH_NAMESPACE,
    MetricData: [
      {
        MetricName: 'OverdueTasksCount',
        Unit: 'Count',
        Value: overdueCount
      }
    ]
  }));

  console.log(`Published OverdueTasksCount = ${overdueCount}`);

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Overdue metric published',
      overdueCount
    })
  };
};
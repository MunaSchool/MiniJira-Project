const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

const region = process.env.AWS_REGION;

const dynamoClient = new DynamoDBClient({ region });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const snsClient = new SNSClient({ region });

const TASKS_TABLE = process.env.DYNAMODB_TASKS_TABLE || 'Tasks';
const DAILY_DIGEST_TOPIC_ARN = process.env.DAILY_DIGEST_TOPIC_ARN;

function getTodayDateOnly() {
  return new Date().toISOString().split('T')[0];
}

exports.handler = async () => {
  if (!DAILY_DIGEST_TOPIC_ARN) {
    throw new Error('DAILY_DIGEST_TOPIC_ARN is missing');
  }

  const today = getTodayDateOnly();

  const result = await docClient.send(new ScanCommand({
    TableName: TASKS_TABLE,
    FilterExpression: 'begins_with(deadline, :today) AND #status <> :done',
    ExpressionAttributeNames: {
      '#status': 'status'
    },
    ExpressionAttributeValues: {
      ':today': today,
      ':done': 'Done'
    }
  }));

  const tasksDueToday = result.Items || [];

  if (tasksDueToday.length === 0) {
    console.log('No tasks due today.');
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'No tasks due today' })
    };
  }

  const tasksByAssignee = {};

  for (const task of tasksDueToday) {
    if (!tasksByAssignee[task.assigneeId]) {
      tasksByAssignee[task.assigneeId] = [];
    }
    tasksByAssignee[task.assigneeId].push(task);
  }

  for (const [assigneeId, tasks] of Object.entries(tasksByAssignee)) {
    const message = tasks.map((task, index) => {
      return `${index + 1}. ${task.title}
Priority: ${task.priority}
Status: ${task.status}
Deadline: ${task.deadline}
Team: ${task.teamId}`;
    }).join('\n\n');

    await snsClient.send(new PublishCommand({
      TopicArn: DAILY_DIGEST_TOPIC_ARN,
      Subject: `Mini-Jira Daily Digest - Tasks due today`,
      Message: `Assignee ID: ${assigneeId}

Tasks due today:

${message}`
    }));
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Daily digest sent',
      count: tasksDueToday.length
    })
  };
};
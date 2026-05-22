const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

const region = process.env.AWS_REGION;

const dynamoClient = new DynamoDBClient({ region });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const snsClient = new SNSClient({ region });

const TASKS_TABLE = process.env.DYNAMODB_TASKS_TABLE || 'Tasks';

function getTodayDateOnly() {
  return new Date().toISOString().split('T')[0];
}

function getDailyDigestTopicArn(assigneeId) {
  const topicsByAssignee = {
    "40eca9bc-30d1-70d4-bc1e-657bc062e1b1": process.env.SARA_DAILY_DIGEST_TOPIC_ARN,
    "50ccd9dc-2061-703f-48d2-ade1bda28ec3": process.env.OMAR_DAILY_DIGEST_TOPIC_ARN
  };

  return topicsByAssignee[assigneeId];
}

exports.handler = async () => {
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

  let sentDigestCount = 0;

  for (const [assigneeId, tasks] of Object.entries(tasksByAssignee)) {
    const topicArn = getDailyDigestTopicArn(assigneeId);

    if (!topicArn) {
      console.warn(`No daily digest topic configured for assignee ${assigneeId}. Skipping digest.`);
      continue;
    }

    const message = tasks.map((task, index) => {
      return `${index + 1}. ${task.title}
Priority: ${task.priority}
Status: ${task.status}
Deadline: ${task.deadline}
Team: ${task.teamId}`;
    }).join('\n\n');

    await snsClient.send(new PublishCommand({
      TopicArn: topicArn,
      Subject: 'Mini-Jira Daily Digest - Tasks due today',
      Message: `Assignee ID: ${assigneeId}

Tasks due today:

${message}`
    }));

    sentDigestCount++;
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Daily digest sent',
      totalDueTasks: tasksDueToday.length,
      sentDigestCount
    })
  };
};
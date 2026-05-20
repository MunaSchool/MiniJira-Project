const { PublishCommand } = require('@aws-sdk/client-sns');
const { snsClient } = require('./aws');

const TASK_ASSIGNMENT_TOPIC_ARN = process.env.TASK_ASSIGNMENT_TOPIC_ARN;

async function publishTaskAssignment(task, assignedBy) {
  if (!TASK_ASSIGNMENT_TOPIC_ARN) {
    console.warn('TASK_ASSIGNMENT_TOPIC_ARN is missing. SNS publish skipped.');
    return null;
  }

  const event = {
    eventType: 'TASK_ASSIGNED',
    taskId: task.taskId,
    title: task.title,
    description: task.description || '',
    priority: task.priority,
    deadline: task.deadline,
    assigneeId: task.assigneeId,
    teamId: task.teamId,
    assignedBy,
    createdAt: task.createdAt
  };

  const command = new PublishCommand({
    TopicArn: TASK_ASSIGNMENT_TOPIC_ARN,
    Subject: `New task assigned: ${task.title}`,
    Message: JSON.stringify(event),
    MessageAttributes: {
      eventType: {
        DataType: 'String',
        StringValue: 'TASK_ASSIGNED'
      },
      teamId: {
        DataType: 'String',
        StringValue: task.teamId
      }
    }
  });

  return snsClient.send(command);
}

module.exports = {
  publishTaskAssignment
};
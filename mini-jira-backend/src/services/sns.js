const { PublishCommand } = require('@aws-sdk/client-sns');
const { snsClient } = require('./aws');

function getAssignmentTopicArn(assigneeId) {
  const topicsByAssignee = {
    // Replace the keys with your real Cognito user IDs / assigneeIds
    "40eca9bc-30d1-70d4-bc1e-657bc062e1b1": process.env.SARA_ASSIGNMENT_TOPIC_ARN,
    "50ccd9dc-2061-703f-48d2-ade1bda28ec3": process.env.OMAR_ASSIGNMENT_TOPIC_ARN,
  };

  return topicsByAssignee[assigneeId];
}

async function publishTaskAssignment(task, assignedBy) {
  const topicArn = getAssignmentTopicArn(task.assigneeId);

  if (!topicArn) {
    console.warn(`No SNS topic configured for assignee ${task.assigneeId}. SNS publish skipped.`);
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
    TopicArn: topicArn,
    Subject: `New task assigned: ${task.title}`,
    Message: JSON.stringify(event),
    MessageAttributes: {
      eventType: {
        DataType: 'String',
        StringValue: 'TASK_ASSIGNED'
      },
      assigneeId: {
        DataType: 'String',
        StringValue: task.assigneeId
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
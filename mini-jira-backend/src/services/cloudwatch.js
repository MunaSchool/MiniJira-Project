const { PutMetricDataCommand } = require('@aws-sdk/client-cloudwatch');
const { cloudWatchClient } = require('./aws');

const CLOUDWATCH_NAMESPACE = process.env.CLOUDWATCH_NAMESPACE || 'MiniJira';

async function putMetric(metricName, value, unit = 'Count', dimensions = []) {
  try {
    const command = new PutMetricDataCommand({
      Namespace: CLOUDWATCH_NAMESPACE,
      MetricData: [
        {
          MetricName: metricName,
          Value: value,
          Unit: unit,
          Dimensions: dimensions
        }
      ]
    });

    await cloudWatchClient.send(command);
  } catch (error) {
    console.error(`CloudWatch metric failed: ${metricName}`, error);
  }
}

async function publishTaskCreated(teamId) {
  return putMetric('TasksCreatedPerDay', 1, 'Count', [
    {
      Name: 'TeamId',
      Value: teamId
    }
  ]);
}

async function publishTaskClosed(teamId) {
  return putMetric('TasksClosedPerDayPerTeam', 1, 'Count', [
    {
      Name: 'TeamId',
      Value: teamId
    }
  ]);
}

async function publishTimeToClose(seconds, teamId) {
  return putMetric('AverageTimeToClose', seconds, 'Seconds', [
    {
      Name: 'TeamId',
      Value: teamId
    }
  ]);
}

async function publishOverdueTasksCount(count) {
  return putMetric('OverdueTasksCount', count, 'Count');
}

module.exports = {
  publishTaskCreated,
  publishTaskClosed,
  publishTimeToClose,
  publishOverdueTasksCount
};
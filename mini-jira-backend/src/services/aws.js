const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { S3Client } = require('@aws-sdk/client-s3');
const { SNSClient } = require('@aws-sdk/client-sns');
const { SQSClient } = require('@aws-sdk/client-sqs');
const { CloudWatchClient } = require('@aws-sdk/client-cloudwatch');

const REGION = process.env.AWS_REGION;

function getCredentials() {
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    return {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    };
  }
  return undefined;
}

const creds = getCredentials();
const clientConfig = { region: REGION, credentials: creds };

const dynamoClient = new DynamoDBClient(clientConfig);
const s3Client = new S3Client(clientConfig);
const snsClient = new SNSClient(clientConfig);
const sqsClient = new SQSClient(clientConfig);
const cloudWatchClient = new CloudWatchClient(clientConfig);

module.exports = { dynamoClient, s3Client, snsClient, sqsClient, cloudWatchClient };

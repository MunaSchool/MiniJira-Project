const express = require('express');
const { GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const router = express.Router();
const { getDocumentClient } = require('../services/dynamodb');
const { updateCognitoUserAttributes } = require('../services/cognito');

router.get('/profile', async (req, res, next) => {
  try {
    const docClient = getDocumentClient();
    const result = await docClient.send(
      new GetCommand({
        TableName: process.env.DYNAMODB_USERS_TABLE,
        Key: { userId: req.user.userId }
      })
    );

    if (!result.Item) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.Item);
  } catch (err) {
    next(err);
  }
});

router.put('/profile', async (req, res, next) => {
  try {
    const { name, email } = req.body;
    const updates = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    if (name) {
      updates.push('#name = :name');
      expressionAttributeNames['#name'] = 'name';
      expressionAttributeValues[':name'] = name;
    }

    if (email && email !== req.user.email) {
      updates.push('email = :email');
      expressionAttributeValues[':email'] = email;
      await updateCognitoUserAttributes(process.env.COGNITO_USER_POOL_ID, req.user.userId, [
        { Name: 'email', Value: email }
      ]);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const docClient = getDocumentClient();
    const result = await docClient.send(
      new UpdateCommand({
        TableName: process.env.DYNAMODB_USERS_TABLE,
        Key: { userId: req.user.userId },
        UpdateExpression: `SET ${updates.join(', ')}`,
        ExpressionAttributeNames: Object.keys(expressionAttributeNames).length
          ? expressionAttributeNames
          : undefined,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW'
      })
    );

    res.json(result.Attributes);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

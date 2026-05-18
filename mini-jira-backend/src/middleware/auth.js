const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const { GetCommand } = require('@aws-sdk/lib-dynamodb');
const { getDocumentClient } = require('../services/dynamodb');

const userPoolId = process.env.COGNITO_USER_POOL_ID;
const region = process.env.COGNITO_REGION || process.env.AWS_REGION;
const jwksUri = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`;

const client = jwksClient({ jwksUri });

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    callback(null, key.getPublicKey());
  });
}

async function getUserFromDb(sub) {
  const docClient = getDocumentClient();
  const result = await docClient.send(
    new GetCommand({
      TableName: process.env.DYNAMODB_USERS_TABLE,
      Key: { userId: sub }
    })
  );
  return result.Item;
}

function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${req.user.role}`
      });
    }

    next();
  };
}

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];

    const issuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;
    const verifyOptions = {
      algorithms: ['RS256'],
      issuer
    };
    if (process.env.COGNITO_CLIENT_ID) {
      verifyOptions.audience = process.env.COGNITO_CLIENT_ID;
    }

    const decoded = await new Promise((resolve, reject) => {
      jwt.verify(token, getKey, verifyOptions, (err, payload) => {
        if (err) return reject(err);
        resolve(payload);
      });
    });

    const sub = decoded.sub;
    const user = await getUserFromDb(sub);

    if (!user) {
      return res.status(401).json({ error: 'User not found in DynamoDB' });
    }

    req.user = {
      sub,
      userId: sub,
      email: user.email,
      role: user.role,
      teamId: user.teamId || null
    };

    next();
  } catch (err) {
    console.error('Auth error:', err);
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    if (err.name === 'UnrecognizedClientException' || err.name === 'InvalidSignatureException') {
      return res.status(500).json({ error: 'AWS credentials in .env are invalid' });
    }
    if (!err.message?.includes('User not found')) {
      return res.status(500).json({ error: err.message || 'Authentication failed' });
    }
    return res.status(401).json({ error: 'User not found in DynamoDB' });
  }
}

module.exports = authMiddleware;
module.exports.authMiddleware = authMiddleware;
module.exports.requireRole = requireRole;

const {
  CognitoIdentityProviderClient,
  AdminUpdateUserAttributesCommand
} = require('@aws-sdk/client-cognito-identity-provider');

function getCredentials() {
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    return {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    };
  }
  return undefined;
}

const client = new CognitoIdentityProviderClient({
  region: process.env.COGNITO_REGION || process.env.AWS_REGION,
  credentials: getCredentials()
});

async function updateCognitoUserAttributes(userPoolId, username, attributes) {
  const command = new AdminUpdateUserAttributesCommand({
    UserPoolId: userPoolId,
    Username: username,
    UserAttributes: attributes
  });
  return client.send(command);
}

module.exports = { updateCognitoUserAttributes };

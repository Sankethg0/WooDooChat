const AWS = require("aws-sdk");
const dynamoDb = new AWS.DynamoDB.DocumentClient();

// 1. Create a new user profile
module.exports.createUser = async (event) => {
  const { userId, name, email } = JSON.parse(event.body);
  await dynamoDb
    .put({
      TableName: process.env.USERS_TABLE,
      Item: { userId, name, email },
    })
    .promise();
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "User created successfully." }),
  };
};

// 2. Get a user profile
module.exports.getUser = async (event) => {
  const { userId } = event.pathParameters;
  const user = await dynamoDb
    .get({
      TableName: process.env.USERS_TABLE,
      Key: { userId },
    })
    .promise();
  return {
    statusCode: 200,
    body: JSON.stringify(user.Item || {}),
  };
};

// 3. Update a user profile
module.exports.updateUser = async (event) => {
  const { userId } = event.pathParameters;
  const { name, email } = JSON.parse(event.body);
  await dynamoDb
    .update({
      TableName: process.env.USERS_TABLE,
      Key: { userId },
      UpdateExpression: "SET #name = :name, #email = :email",
      ExpressionAttributeNames: { "#name": "name", "#email": "email" },
      ExpressionAttributeValues: { ":name": name, ":email": email },
    })
    .promise();
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "User updated successfully." }),
  };
};
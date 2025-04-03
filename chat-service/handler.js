const AWS = require("aws-sdk");
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const apiGateway = new AWS.ApiGatewayManagementApi({
  endpoint: process.env.WEBSOCKET_API_ENDPOINT,
});

// 1. Handle new WebSocket connection
module.exports.connect = async (event) => {
  const { connectionId } = event.requestContext;
  await dynamoDb
    .put({
      TableName: process.env.CONNECTIONS_TABLE,
      Item: { connectionId },
    })
    .promise();
  return { statusCode: 200, body: "Connected." };
};

// 2. Handle WebSocket disconnection
module.exports.disconnect = async (event) => {
  const { connectionId } = event.requestContext;
  await dynamoDb
    .delete({
      TableName: process.env.CONNECTIONS_TABLE,
      Key: { connectionId },
    })
    .promise();
  return { statusCode: 200, body: "Disconnected." };
};

// 3. Send a message to all connected clients
module.exports.sendMessage = async (event) => {
  const { connectionId } = event.requestContext;
  const { message } = JSON.parse(event.body);

  // Save message to DynamoDB
  await dynamoDb
    .put({
      TableName: process.env.MESSAGES_TABLE,
      Item: {
        messageId: Date.now().toString(),
        createdAt: Date.now(),
        message,
        sender: connectionId,
      },
    })
    .promise();

  // Broadcast message to all connected clients
  const connections = await dynamoDb
    .scan({ TableName: process.env.CONNECTIONS_TABLE })
    .promise();

  await Promise.all(
    connections.Items.map(async ({ connectionId: targetConnectionId }) => {
      await apiGateway
        .postToConnection({
          ConnectionId: targetConnectionId,
          Data: JSON.stringify({ message, sender: connectionId }),
        })
        .promise();
    })
  );

  return { statusCode: 200, body: "Message sent." };
};

// 4. Get all messages (REST API)
module.exports.getMessages = async () => {
  const messages = await dynamoDb
    .scan({ TableName: process.env.MESSAGES_TABLE })
    .promise();
  return {
    statusCode: 200,
    body: JSON.stringify(messages.Items),
  };
};
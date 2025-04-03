const { CognitoIdentityProviderClient, SignUpCommand } = require("@aws-sdk/client-cognito-identity-provider");

const client = new CognitoIdentityProviderClient({ region: process.env.REGION});

module.exports.signup = async (event) => {
  const { email, password } = JSON.parse(event.body);

  const params = {
    ClientId: process.env.CLIENT_ID,
    Username: email,
    Password: password,
    UserAttributes: [
      {
        Name: "email",
        Value: email,
      },
    ],
  };

  try {
    const response = await client.send(new SignUpCommand(params));
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "User registered successfully",
        userSub: response.UserSub,
      }),
    };
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "Error registering user",
        error: error.message,
      }),
    };
  }
};

module.exports.login = async (event) => {
  const { email, password } = JSON.parse(event.body);

  const params = {
    AuthFlow: "USER_PASSWORD_AUTH",
    ClientId: process.env.CLIENT_ID,
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password,
    },
  };

  try {
    const response = await client.send(new InitiateAuthCommand(params));
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Login successful",
        accessToken: response.AuthenticationResult.AccessToken,
        refreshToken: response.AuthenticationResult.RefreshToken,
        idToken: response.AuthenticationResult.IdToken,
      }),
    };
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "Error logging in",
        error: error.message,
      }),
    };
  }
};

module.exports.validateToken = async (event) => {
  const { accessToken } = JSON.parse(event.body);

  try {
    const response = await client.send(new GetUserCommand({ AccessToken: accessToken }));
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Token is valid",
        user: response.Username,
        email: response.UserAttributes.find((attr) => attr.Name === "email").Value,
      }),
    };
  } catch (error) {
    return {
      statusCode: 401,
      body: JSON.stringify({
        message: "Invalid token",
        error: error.message,
      }),
    };
  }
};
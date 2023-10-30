require("dotenv").config();

const axios = require("axios");

const { EMAIL_TOKEN } = process.env;

exports.handler = async (event) => {
  const { email } = JSON.parse(event.body);

  // Bail if email is missing
  if (!email) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: "missing email"
      })
    };
  }

  try {
    const response = await axios({
      method: "POST",
      headers: {
        Authorization: `Token ${EMAIL_TOKEN}`,
        "Content-Type": "application/json"
      },
      data: JSON.stringify({ email }),
      url: "https://api.buttondown.email/v1/subscribers"
    });
    if (response.data) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          emailAdded: true
        })
      };
    }
  } catch (error) {
    return {
      statusCode: 422,
      body: JSON.stringify({ message: JSON.stringify(error.response.data) })
    };
  }
};

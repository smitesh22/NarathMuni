import otpGenerator from "otp-generator";
import nodemailer from "nodemailer";
import {EMAIL, EMAIL_HOST, PASSWORD} from "../secrets/secrets";

const createExtensions = () => {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + 5);
  return {
    otp: otpGenerator.generate(6, {
      specialChars: false,
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
    }),
    expiry: expiry.toISOString(),
    userTypes: {
      subscriptionType: null,
      subscriptionStartDate: null,
      customerId: null,
      subscriptionEndDate: null,
    },
  };
};

const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: 465,
  secure: true,
  auth: {
    user: EMAIL,
    pass: PASSWORD,
  },
});

const otpEmailTemplate = (otp: string, firstName: string) => `
 <!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      body {
        font-family: 'Arial', sans-serif;
        background-color: #181818;
        color: white;
        padding: 20px;
      }
      .container {
        display: flex;
        align-items: center;
        max-width: 600px;
        margin: 0 auto;
        background-color: #222;
        border-radius: 8px;
        padding: 20px;
      }
      .logo {
        margin-right: 20px;
        flex-shrink: 0;
      }
      .logo img {
        width: 60px;
        height: 60px;
      }
      .content {
        flex: 1;
      }
      .footer {
        margin-top: 20px;
        font-size: 12px;
        color: #aaa;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="logo">
        <img src="https://via.placeholder.com/60" alt="Logo" />
      </div>
      <div class="content">
        <p>Hello Smitesh,</p>
        <p><strong>145100</strong> is your one-time password (OTP) for the LedgeFast app.</p>
        <p>
          Please use this code to complete your action. If it doesn't work, you
          can manually enter the code when prompted in the app.
        </p>
        <p>The code was requested from the LedgeFast website. It will expire in 5 minutes.</p>
        <p>
          If you did not request this code, please disregard this email or
          contact LedgeFast support immediately for assistance.
        </p>
        <p>Enjoy using LedgeFast!</p>
        <p>Best regards,<br />The LedgeFast Team</p>
      </div>
    </div>
  </body>
</html>
`;

export { createExtensions, transporter, otpEmailTemplate };


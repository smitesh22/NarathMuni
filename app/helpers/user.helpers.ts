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
    <meta charset="UTF-8">
    <meta name="viewport" content="width=devicxe-width, initial-scale=1.0">
    <title>OTP Verification</title>
  </head>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="margin-bottom: 20px; text-align: left;">
      <img src="https://i.imgur.com/tFY6FA0.png" alt="LedgeFast Logo" style="max-width: 150px; height: auto;">
    </div>
    <p>Hello ${firstName},</p>
    <p><strong>${otp}</strong> is your one-time password (OTP) for the LedgeFast app.</p>
    <p>Please use this code to complete your action. If it doesn't work, you can manually enter the code when prompted in the app.</p>
    <p>The code was requested from the LedgeFast website. It will expire in <strong>5 minutes</strong>.</p>
    <p>If you did not request this code, please disregard this email or contact LedgeFast support immediately for assistance.</p>
    <p>Enjoy using LedgeFast!</p>
    <p>Best regards,<br>The LedgeFast Team</p>
  </body>
  </html>
`;


export { createExtensions, transporter, otpEmailTemplate };


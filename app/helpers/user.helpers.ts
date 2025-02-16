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
  <div style="font-family: Arial, sans-serif; line-height: 1.6;">
    <div style="text-align: center; margin-bottom: 20px;">
      <img src="https://dev.ledgefast.com/logo.svg" alt="LedgeFast Logo" style="max-width: 150px; height: auto;">
    </div>
    <p>Hello ${firstName},</p>
    <p>${otp} is your one-time password (OTP) for the LedgeFast app.</p>
    <p>Please use this code to complete your action. If it doesn't work, you can manually enter the code when prompted in the app.</p>
    <p>The code was requested from the ZenPay website. It will expire in 5 minutes.</p>
    <p>If you did not request this code, please disregard this email or contact LedgeFast support immediately for assistance.</p>
    <p>Enjoy using LedgeFast!</p>
    <p>Best regards,<br>The LedgeFast Team</p>
  </div>
`;

export { createExtensions, transporter, otpEmailTemplate };


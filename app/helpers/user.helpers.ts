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
  service: EMAIL_HOST,
  auth: {
    user: EMAIL,
    pass: PASSWORD,
  },
});

const otpEmailTemplate = (otp: string, firstName: string) => `
Hello ${firstName},

${otp} is your one-time password (OTP) for the ZenPay app.

Please use this code to complete your action. If it doesn't work, you can manually enter the code when prompted in the app.

The code was requested from the ZenPay website. It will expire in 5 minutes.

If you did not request this code, please disregard this email or contact ZenPay support immediately for assistance.

Enjoy using ZenPay!

Best regards,  
The ZenPay Team
`;

export { createExtensions, transporter, otpEmailTemplate };


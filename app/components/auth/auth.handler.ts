import express from "express";
import { User } from "../../database/models/user";
import { userService } from "../user/user.service";
import {
  createExtensions,
  otpEmailTemplate,
  transporter,
} from "../../helpers/user.helpers";
import { EMAIL } from "../../secrets/secrets";
import bcrypt from "bcryptjs";

const handler = async (
  req: express.Request,
  res: express.Response,
): Promise<void> => {
  try {
    switch (req.method) {
      case "POST": {
        if (req.url === "/verify-token") {
          const { email, code } = req.body;

          const user: User|null = await userService.getUserByEmail(email);
          if (!user) {
            res
              .status(400)
              .send({ message: `User with email ${email} not found` });
            return;
          }

          if (
            user.extensions &&
            user.extensions["expiry"] &&
            user.extensions["otp"]
          ) {
            const expiryDate = new Date(user.extensions.expiry);
            if (expiryDate < new Date()) {
              const extensions = createExtensions();
              await userService.updateUser(user.id, { extensions: extensions });

              const mailOptions = {
                from: EMAIL,
                to: email,
                subject: "Your ZenPay One-Time Password (OTP)",
                text: otpEmailTemplate(extensions.otp, user.firstName),
              };

              await transporter.sendMail(mailOptions);

              res.status(408).json({
                message: `Your token has expired, we send you a new token, please try again.`,
              });
            } else {
              if (user.extensions["otp"] === code) {
                await userService.updateUser(user.id, { verified: true });
                res.status(201).json({
                  message: "User is verified",
                });
              } else {
                res.status(401).send({ message: `Incorrect OTP entered` });
              }
            }
          }
          return;
        } else if (req.url === "/resend-token") {
          const { email } = req.body;

          const user: User|null = await userService.getUserByEmail(email);

          if (!user) {
            res
              .status(400)
              .send({ message: `User with email ${email} not found` });
            return;
          }
          const extensions = createExtensions();
          await userService.updateUser(user.id, { extensions: extensions });
          const mailOptions = {
            from: EMAIL,
            to: email,
            subject: "Your ZenPay One-Time Password (OTP)",
            text: otpEmailTemplate(extensions.otp, user.firstName),
          };

          await transporter.sendMail(mailOptions);

          res.status(201).json({ message: "We have send you a new token" });
          return;
        } else if (req.url === "/reset-password") {
          const { newPassword, email } = req.body;

          const user: User|null = await userService.getUserByEmail(email);

          if (!user) {
            res
              .status(400)
              .send({ message: `User with email ${email} not found` });
            return;
          }

          const hashedPassword = await bcrypt.hash(newPassword, 10);
          await userService.updateUser(user.id, {
            hashedPassword: hashedPassword,
            extensions: { otp: null, expiryDate: null },
          });

          res.status(201).json({
            message: "Password updated",
          });
        }
        return;
      }
      default:
        res.status(400).send({
          error: "Provided method doesn't work on this endpoint",
        });
        return;
    }
  } catch (e) {
    console.error(e);
  }
};

export default handler;

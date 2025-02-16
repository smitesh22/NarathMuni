import { userService } from "./user.service";
import express from "express";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import otpGenerator from "otp-generator";
import { User } from "../../database/models/user";
import {
  createExtensions,
  otpEmailTemplate,
  transporter,
} from "../../helpers/user.helpers";
import { EMAIL } from "../../secrets/secrets";
import {fileService} from "../files/file.service";

const handler = async (
    req: express.Request,
    res: express.Response
): Promise<void> => {
  try {
    switch (req.method) {
      case "GET": {
        const id = req.query.id?.toString();
        const email = req.query.email?.toString();
        let users;
        if (id) {
          try {
            users = await userService.getUserById(id);
            res.json(users);
          } catch (e) {
            res.status(404).send({ message: `User with id ${id} not found` });
          }
        } else if (email) {
          try {
            users = await userService.getUserByEmail(email);
            res.json(users);
          } catch (e) {
            res
                .status(404)
                .send({ message: `User with email ${email} not found` });
          }
        } else {
          users = await userService.getAllUsers();
          res.json(users);
        }
        break;
      }
      case "POST": {
        if (req.url === "/user") {
          res.status(422).json({
            message:
                "Cannot send POST request on /user endpoint. Please use /register",
          });
          break;
        }

        if (req.url === "/register") {
          try {
            const { email, firstName, lastName, password } = req.body;
            if (!email || !firstName || !lastName || !password) {
              res.status(400).json({ message: "All fields are required" });
              return;
            }
            const user = await userService.getUserByEmail(email);

            if (user) {
              res.status(400).json({ message: "Email already exists" });
              return;
            }
            const hashedPassword = await bcrypt.hash(password, 10);
            const extensions = createExtensions();
            const newUser = await userService.createUser({
              id: uuidv4(),
              email,
              firstName,
              lastName,
              hashedPassword: hashedPassword,
              extensions: extensions,
            });

            const mailOptions = {
              from: EMAIL,
              to: email,
              subject: "Your ZenPay One-Time Password (OTP)",
              text: otpEmailTemplate(extensions.otp, firstName),
            };
            console.log(mailOptions);
            console.log(transporter);
            await transporter.sendMail(mailOptions);

            res.status(201).json(newUser);
          } catch (error) {
            console.error("Error during registration:", error);
            res.status(500).json({
              message: "Failed to register user. Please try again later.",
              error: error instanceof Error ? error.message : "Unknown error",
            });
          }
          return;
        }
        return;
      }
      case "PUT": {
        const { id, email, firstName, lastName, privileged } = req.body;
        const updatedUser = await userService.updateUser(id, {
          email,
          firstName,
          lastName,
          privileged,
        });
        res.status(200).json(updatedUser);
        break;
      }
      case "DELETE": {
        const { id } = req.query;
        if (typeof id === "string") {
          await userService.deleteUser(id);
        }
        res.status(204).end();
        break;
      }
      default: {
        res.status(405).json({ error: "Method not allowed" });
        break;
      }
    }
  } catch (error: unknown) {
    console.error("Error:", error);
    res.status(500).json({
      message: "An unexpected error occurred.",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export default handler;

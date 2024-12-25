import { userService } from './user.service';
import express from "express";
import bcrypt from "bcryptjs";
import {v4 as uuidv4} from "uuid";
import otpGenerator from "otp-generator";
import {User} from "../../database/models/user";

const handler = async (req: express.Request, res: express.Response): Promise<void> => {
    try {
        switch (req.method) {
            case 'GET': {
                const id  = req.query.id?.toString();
                const email  = req.query.email?.toString();
                let users;
                if(id){
                    try {
                        users = await userService.getUserById(id);
                        res.json(users);
                    }catch (e) {
                        res.status(404).send({message: `User with id ${id} not found`});
                    }
                }else if (email){
                    try {
                        users = await userService.getUserByEmail(email);
                        res.json(users);
                    }catch (e) {
                        res.status(404).send({message: `User with email ${email} not found`});
                    }
                }else {
                    users = await userService.getAllUsers();
                    res.json(users); // No return here
                }

                break;
            }
            case 'POST': {
                const createExtensions = () => {
                    const expiry = new Date();
                    expiry.setMinutes(expiry.getMinutes() + 1);
                    return {
                        otp: otpGenerator.generate(6, {
                            specialChars: false,
                            lowerCaseAlphabets: false,
                            upperCaseAlphabets: false
                        }),
                        expiry: expiry.toISOString(),
                    }
                }
                if (req.url === "/user") {
                    res.status(422).json({
                        message: "Cannot send POST request on /user endpoint. Please use /register",
                    });
                    break;
                }

                if(req.url === "/register") {
;
                    const {email, firstName, lastName, password} = req.body;
                    const users = await userService.getAllUsers();

                    if (users.some((user) => user.email === email)) {
                        res.status(400).json({message: "Email already exists"});
                        break;
                    }

                    const hashedPassword = await bcrypt.hash(password, 10);

                    const newUser = await userService.createUser({
                        id: uuidv4(),
                        email,
                        firstName,
                        lastName,
                        hashedPassword: hashedPassword,
                        extensions: createExtensions()
                    });
                    res.status(201).json(newUser);
                    return;
                }else if(req.url === "/verify-user") {
                    const {email, code} = req.body;

                    const user: User = await userService.getUserByEmail(email);
                    if(!user){
                        res.status(400).send({message: `User with email ${email} not found`});
                    }

                    if(user.extensions && user.extensions['expiry'] && user.extensions["otp"]){
                        const expiryDate = new Date(user.extensions.expiry);
                        if(expiryDate < new Date()){
                            res.status(408).json({
                                message: `Your token has expired, we send you a new token, please try again.`,
                            })
                        }else{
                            if(user.extensions['otp'] === code){
                                await userService.updateUser(user.id, {verified: true});
                                res.status(201).json({
                                    message: 'User is verified'
                                });
                            }else{
                                res.status(401).send({message: `Unauthorized access token`});
                            }
                        }
                    }
                    return;
                }else if(req.url === "/resend-token") {
                    const {email} = req.body;

                    const user: User = await userService.getUserByEmail(email);

                    if(!user){
                        res.status(400).send({message: `User with email ${email} not found`});
                    }

                    await userService.updateUser(user.id, {extensions: createExtensions()});
                    res.status(201).json({message: "We have send you a new token"});
                }
                return;
            }
            case 'PUT': {
                const { id, email, firstName, lastName } = req.body;
                const updatedUser = await userService.updateUser(id, { email, firstName, lastName });
                res.status(200).json(updatedUser); // No return here
                break;
            }
            case 'DELETE': {
                const { id } = req.body;
                await userService.deleteUser(id);
                res.status(204).end(); // No return here
                break;
            }
            default: {
                res.status(405).json({ error: "Method not allowed" }); // No return here
                break;
            }
        }
    } catch (error: unknown) {
        console.error("Error:", error);
        res.status(500).json({ error: "An unexpected error occurred", message: error });
    }
};

export default handler;

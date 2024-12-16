import { userService } from './user.service';
import express from "express";
import bcrypt from "bcryptjs";
import {v4 as uuidv4} from "uuid";

const handler = async (req: express.Request, res: express.Response): Promise<void> => {
    try {
        switch (req.method) {
            case 'GET': {
                const id  = req.query.id?.toString();
                if(id){
                    const user = await userService.getUserById(id);
                    res.json(user);
                }else {
                    const users = await userService.getAllUsers();
                    res.json(users); // No return here
                }
                break;
            }
            case 'POST': {
                //register endpoint for creating a new user
                if (req.url === "/user") {
                    res.status(422).json({
                        message: "Cannot send POST request on /user endpoint. Please use /register",
                    });
                    break;
                }
                const { email,firstName, lastName, password } = req.body;
                const  users = await userService.getAllUsers();

                if(users.some((user) => user.email === email)){
                    res.status(400).json({message: "Email already exists"});
                    break;
                }

                const hashedPassword = await bcrypt.hash(password, 10);

                const newUser = await userService.createUser({ id: uuidv4(), email, firstName, lastName, hashedPassword: hashedPassword });
                res.status(201).json(newUser);
                break;

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

import { userService } from './user.service';
import express from "express";

const handler = async (req: express.Request, res: express.Response): Promise<void> => {
    try {
        switch (req.method) {
            case 'GET': {
                const users = await userService.getAllUsers();
                res.json(users); // No return here
                break;
            }
            case 'POST': {
                const { email, firstName, lastName } = req.body;
                const newUser = await userService.createUser({ email, firstName, lastName });
                res.status(201).json(newUser); // No return here
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

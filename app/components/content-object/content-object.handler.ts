import express from "express";
import { contentObjectService } from "./content-object.service";
import { v4 as uuidv4 } from "uuid";

export default async function handler(req: express.Request, res: express.Response): Promise<void> {
    try {
        switch (req.method) {
            case "POST": {
                const { type, extensions } = req.body;

                if (!type || !extensions) {
                    res.status(400).json({ message: "Type and extensions are required" });
                    return;
                }

                const contentObject = await contentObjectService.createContentObject({
                    id: uuidv4(),
                    type: type.toString(),
                    extensions: extensions,
                    createdOn: new Date(),
                    updatedOn: new Date(),
                });

                res.status(201).json(contentObject);
                break;
            }

            case "GET":
                if(req.query.id) {
                    const id = req.query.id as string;
                    const user = await contentObjectService.getContentObjectById(id);
                    if (!user) {
                        res.status(404).json({message: `No content found with id ${id}`});
                    }
                    res.status(200).json([user]);
                }else{
                    const user = await contentObjectService.getContentObjects();
                    res.status(200).json(user);
                }
                break;

            case "DELETE":
                const id = req.query.id as string;
                if(!id){
                    res.status(400).json({message: "id is required"});
                }
                const user = await contentObjectService.deleteContentObjectById(id);
                res.status(204).json({user, message: "Content Object deleted successfully."});
                break;
            default:
                res.status(405).json({ message: "Method not allowed" });
                break;
        }
    } catch (error: unknown) {
        console.error("Error:", error);
        res.status(500).json({ message: "An unexpected error occurred", error: error });
    }
}

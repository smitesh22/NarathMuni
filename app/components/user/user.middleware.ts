import passport from "./user.strategy";
import express from "express";
import jwt from "jsonwebtoken";


const JWT_SECRET : string = process.env.JWT_SECRET as string;

export async function authenticate(req: express.Request, res: express.Response, next: express.NextFunction) {
    passport.authenticate("local", { session: false }, (err: any, user: { id: any; email: any; }, info: { message: any; }) => {
        if (err) {
            return next(err);
        }
        const JWT_SECRET : string = process.env.JWT_SECRET as string;

        if(!JWT_SECRET){
            return res.status(500).send({message:"Secret key is missing on the server."});
        }

        if(!user) {
            return res.status(401).json({message:info?.message || "Unauthorized"});
        }

        const token = jwt.sign({id: user.id, email: user.email}, JWT_SECRET );

        return res.status(200).json({
            token: token,
            message: "Authenticated successfully"
        });
    })(req, res, next);
}

export function verifyToken(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
): void {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ message: "Access denied. No token provided." });
        return;
    }

    const token = authHeader.split(" ")[1];

    try {
        (req as any).user = jwt.verify(token, JWT_SECRET);
        next();
    } catch (error) {
        res.status(403).json({ message: "Invalid token." });
    }
}
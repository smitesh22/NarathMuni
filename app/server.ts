import express from "express";
import routes from "./routes/routes";
import passport from "passport";
import cors from 'cors';
const app = express();
app.use(express.json());
app.use(cors());
app.use(passport.initialize());
app.use("/", routes);
app.get("/", (req: express.Request, res: express.Response) => {
    res.end("Hello World");
});

export default app;

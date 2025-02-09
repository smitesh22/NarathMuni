import express from "express";
import routes from "./routes/routes";
import passport from "passport";
import cors from "cors";
import Stripe from "stripe";
import {ENV, STRIPE_KEY} from "./secrets/secrets";

const stripe = new Stripe(STRIPE_KEY);
const app = express();
app.use((req, res, next) => {
  if (req.originalUrl === "/stripe-webhook") {
    next();
  } else {
    express.json()(req, res, next);
  }
});
app.use(cors());
app.use(passport.initialize());
app.use("/", routes);
app.get("/", (req: express.Request, res: express.Response) => {
  res.status(200).json(`Hello fom ${ENV} environment`);
});

export { stripe };
export default app;

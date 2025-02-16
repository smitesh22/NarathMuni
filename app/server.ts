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
const corsOptions = {
  origin: (origin: string | undefined, callback: Function) => {
    const allowedOrigins = [
      /^https:\/\/.*\.ledgefast\.com$/,
      /^https:\/\/ledgefast\.com$/,
      /^http:\/\/localhost(:\d+)?$/
    ];
    if (!origin || allowedOrigins.some((regex) => regex.test(origin))) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: "GET,POST,PUT,DELETE",
  allowedHeaders: "Content-Type,Authorization",
  credentials: true,  // Add this if you need cookies or authorization headers
};

app.use(cors(corsOptions));
app.set('trust proxy', 1);
app.use(passport.initialize());
app.use("/", routes);
app.get("/check", async (req: express.Request, res: express.Response, next: express.NextFunction,) => {
  res.status(200).send(`Hello fom ${ENV} environment`);
});

export { stripe };
export default app;

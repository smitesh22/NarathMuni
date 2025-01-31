import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { UserModel } from "../../database/models/user";
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, JWT_SECRET } from "../../secrets/secrets";
import jwt from "jsonwebtoken";
import {v4 as uuidv4} from "uuid";

passport.use(
    new GoogleStrategy(
        {
            clientID: GOOGLE_CLIENT_ID,
            clientSecret: GOOGLE_CLIENT_SECRET,
            callbackURL: "/google/redirect",
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const email = profile.emails?.[0]?.value;
                if (!email) return done(new Error("Email not provided by Google"), false);
                let user = await UserModel.getUserByEmailIfExists(email);

                if (!user) {
                    user = await UserModel.createUser({
                        id: uuidv4(),
                        firstName: profile.name?.givenName || "",
                        lastName: profile.name?.familyName || "",
                        email,
                        verified: true,
                        hashedPassword: "google"
                    });
                }

                const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });

                return done(null, { user, token });
            } catch (error) {
                return done(error, false);
            }
        }
    )
);

export default passport;

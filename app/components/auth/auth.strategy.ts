import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import { userService } from "../user/user.service";

passport.use(
  new LocalStrategy(
    { usernameField: "email", passwordField: "password" },
    async (email, password, done) => {
      try {
        const user = await userService.getUserByEmail(email);
        if (!user) {
          return done(null, false, { message: "User not found" });
        }

        const isPasswordValid = await bcrypt.compare(
          password,
          user.hashedPassword,
        );
        if (user.hashedPassword === "google") {
          return done(null, false, {
            message: "Please sign in with your Google Account",
          });
        }
        if (!isPasswordValid) {
          return done(null, false, { message: "Invalid password" });
        }

        return done(null, user);
      } catch (error: unknown) {
        return done(error);
      }
    },
  ),
);

export default passport;

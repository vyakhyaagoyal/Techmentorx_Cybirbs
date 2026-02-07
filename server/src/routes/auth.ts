import type { Request, Response, NextFunction } from "express";
import type { RouterObject } from "../../types/router.js";
import { User } from "../models/User.js";
import { generateJwt } from "../lib/generateJwt.js";
import { BadRequestError } from "../errors/httpErrors.js";

const authRouter: RouterObject = {
  path: "/auth",
  functions: [
    {
      method: "post",
      props: "/register",
      authorization: "none",
      rateLimit: "strict",
      keyType: "default",
      handler: async (req: Request, res: Response, next: NextFunction) => {
        try {
          const { email, password } = req.body;

          if (!email || !password) {
            throw new BadRequestError("Email and password are required");
          }

          // Check if user already exists
          const existingUser = await User.findOne({ email });
          if (existingUser) {
            throw new BadRequestError("User already exists");
          }

          // Create new user
          const user = new User({
            email,
            password,
            role: "user",
          });

          await user.save();

          // Generate JWT
          const token = await generateJwt(user._id.toString(), user.email, user.role);

          res.status(201).json({
            message: "User registered successfully",
            token,
            user: {
              id: user._id.toString(),
              email: user.email,
              role: user.role,
            },
          });
        } catch (err) {
          next(err);
        }
      },
    },
    {
      method: "post",
      props: "/login",
      authorization: "none",
      rateLimit: "strict",
      keyType: "default",
      handler: async (req: Request, res: Response, next: NextFunction) => {
        try {
          const { email, password } = req.body;

          if (!email || !password) {
            throw new BadRequestError("Email and password are required");
          }

          // Find user by email
          const user = await User.findOne({ email });
          if (!user) {
            throw new BadRequestError("Invalid email or password");
          }

          // Compare passwords
          const isPasswordValid = await user.comparePassword(password);
          if (!isPasswordValid) {
            throw new BadRequestError("Invalid email or password");
          }

          // Generate JWT
          const token = await generateJwt(user._id.toString(), user.email, user.role);

          res.status(200).json({
            message: "Login successful",
            token,
            user: {
              id: user._id.toString(),
              email: user.email,
              role: user.role,
            },
          });
        } catch (err) {
          next(err);
        }
      },
    },
  ],
};

export default authRouter;

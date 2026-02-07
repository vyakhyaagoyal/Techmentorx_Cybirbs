import type { Request, Response, NextFunction } from "express";
import type { RouterObject } from "../../types/router.js";
import { User } from "../models/User.js";
import { generateJwt } from "../lib/generateJwt.js";
import { BadRequestError } from "../errors/httpErrors.js";

const authRouter: RouterObject = {
  path: "/auth",
  functions: [
    // POST /auth/register - Register a new student or teacher
    {
      method: "post",
      props: "/register",
      authorization: "none",
      rateLimit: "strict",
      keyType: "default",
      handler: async (req: Request, res: Response, next: NextFunction) => {
        try {
          const { name, email, password, role, department, enrollmentId, semester, employeeId } = req.body;

          if (!name || !email || !password || !role || !department) {
            throw new BadRequestError("name, email, password, role, and department are required");
          }

          if (!["student", "teacher"].includes(role)) {
            throw new BadRequestError("role must be 'student' or 'teacher'");
          }

          if (role === "student" && (!enrollmentId || semester === undefined)) {
            throw new BadRequestError("enrollmentId and semester are required for students");
          }

          if (role === "teacher" && !employeeId) {
            throw new BadRequestError("employeeId is required for teachers");
          }

          const existingUser = await User.findOne({ email });
          if (existingUser) {
            throw new BadRequestError("User already exists with this email");
          }

          const user = new User({
            name,
            email,
            password,
            role,
            department,
            ...(role === "student" && { enrollmentId, semester }),
            ...(role === "teacher" && { employeeId }),
          });

          await user.save();

          const token = await generateJwt(user._id.toString(), user.email, user.role);

          res.status(201).json({
            message: "Registration successful",
            token,
            user: {
              id: user._id.toString(),
              name: user.name,
              email: user.email,
              role: user.role,
              department: user.department,
            },
          });
        } catch (err) {
          next(err);
        }
      },
    },
    // POST /auth/login - Login for students and teachers
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

          const user = await User.findOne({ email });
          if (!user) {
            throw new BadRequestError("Invalid email or password");
          }

          const isPasswordValid = await user.comparePassword(password);
          if (!isPasswordValid) {
            throw new BadRequestError("Invalid email or password");
          }

          const token = await generateJwt(user._id.toString(), user.email, user.role);

          res.status(200).json({
            message: "Login successful",
            token,
            user: {
              id: user._id.toString(),
              name: user.name,
              email: user.email,
              role: user.role,
              department: user.department,
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

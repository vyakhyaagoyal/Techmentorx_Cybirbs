import type { Request, Response } from "express";
import type { RouterObject } from "../../types/router.js";
import { User } from "../models/User.js";

/* GET current user profile. */
const meRouter: RouterObject = {
  path: "/me",
  functions: [
    {
      method: "get",
      authorization: "required",
      rateLimit: "strict",
      keyType: "default",
      handler: async (req: Request, res: Response) => {
        const user = await User.findById(req.user.id)
          .select("-password")
          .populate("subjects", "name code")
          .populate("teachingSubjects", "name code");

        res.status(200).json({
          id: req.user.id,
          email: req.user.email,
          role: req.user.role,
          ...(user ? {
            name: user.name,
            department: user.department,
            enrollmentId: user.enrollmentId,
            semester: user.semester,
            employeeId: user.employeeId,
            subjects: user.subjects,
            teachingSubjects: user.teachingSubjects,
          } : {}),
        });
      },
    },
  ],
};

export default meRouter;

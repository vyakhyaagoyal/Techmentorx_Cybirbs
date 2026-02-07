import type { RequestHandler, Request, Response, NextFunction } from "express";
import { ForbiddenError } from "../errors/httpErrors.js";

/**
 * Middleware to restrict access based on user role.
 * Must be used after authHandler("required").
 */
export function requireRole(...roles: string[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !req.user.role) {
      throw new ForbiddenError("Access denied");
    }
    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError(
        `Access denied. Required role: ${roles.join(" or ")}`,
      );
    }
    next();
  };
}

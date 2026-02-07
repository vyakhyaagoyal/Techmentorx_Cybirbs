import type { RequestHandler } from "express";

export interface RouterObject {
  path: string;
  functions: APIObject[];
}

export interface APIObject {
  method: method;
  props?: string;
  authorization: authorization;
  rateLimit: rateLimit;
  keyType: keyType;
  middlewares?: RequestHandler[];  // extra middlewares (e.g. requireRole)
  handler: RequestHandler;
}

export type method = "get" | "post" | "put" | "patch" | "delete";
export type authorization = "required" | "optional" | "none";
export type rateLimit = "strict" | "gameplay" | "read";
export type keyType = "ip" | "user" | "default";
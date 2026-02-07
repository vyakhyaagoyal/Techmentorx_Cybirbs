import { jwtVerify } from "jose";
import { UnauthorizedError } from "../errors/httpErrors.js";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export default async function verifyJwt(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);

    if (typeof payload.sub != "string") {
      throw new UnauthorizedError();
    }

    return {
      id: payload.sub as string,
      email: payload.email as string | undefined,
      role: payload.role as string | undefined,
    };
  } catch (error) {
    throw new UnauthorizedError("Invalid or expired token");
  }
}

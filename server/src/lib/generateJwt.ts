import { SignJWT } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
const JWT_EXPIRY = "7d";

export async function generateJwt(
  userId: string,
  email: string,
  role: string = "user",
) {
  const token = await new SignJWT({
    email,
    role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setExpirationTime(JWT_EXPIRY)
    .sign(JWT_SECRET);

  return token;
}

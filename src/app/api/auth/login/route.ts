import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken, setAuthCookie } from "@/lib/auth";
import { ok, error, unauthorized } from "@/lib/response";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail || !password) return error("Email and password are required");

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) return unauthorized();

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return unauthorized();

    const role = user.role as "ADMIN" | "MEMBER";
    const token = signToken({ userId: user.id, email: user.email, role });
    await setAuthCookie(token);

    return ok({ id: user.id, name: user.name, email: user.email, role });
  } catch (e) {
    console.error("Auth login error:", e);
    const message = e instanceof Error && e.message.includes("JWT_SECRET")
      ? "Server configuration error. JWT_SECRET is missing."
      : "Internal server error";
    return error(message, 500);
  }
}

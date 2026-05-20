import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken, setAuthCookie } from "@/lib/auth";
import { ok, error } from "@/lib/response";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();
    const normalizedName = name?.trim();
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedName || !normalizedEmail || !password) {
      return error("Name, email, and password are required");
    }
    if (password.length < 6) {
      return error("Password must be at least 6 characters");
    }

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) return error("Email already in use");

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name: normalizedName, email: normalizedEmail, password: hashed },
      select: { id: true, name: true, email: true, role: true },
    });

    const role = user.role as "ADMIN" | "MEMBER";
    const token = await signToken({ userId: user.id, email: user.email, role });
    await setAuthCookie(token);

    return ok(user, 201);
  } catch (e) {
    console.error("Auth signup error:", e);
    const message = e instanceof Error && e.message.includes("JWT_SECRET")
      ? "Server configuration error. JWT_SECRET is missing."
      : "Internal server error";
    return error(message, 500);
  }
}

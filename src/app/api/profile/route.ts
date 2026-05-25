import { NextRequest } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { error, ok, unauthorized } from "@/lib/response";

export async function PUT(req: NextRequest) {
  try {
    const auth = await getAuthFromRequest(req);
    if (!auth) return unauthorized();

    const body = await req.json().catch(() => null);
    if (!body || !body.name || typeof body.name !== "string" || body.name.trim() === "") {
      return error("Name is required and cannot be empty", 400);
    }

    const updatedUser = await prisma.user.update({
      where: { id: auth.userId },
      data: { name: body.name.trim() },
      select: { id: true, name: true, email: true, role: true },
    });

    return ok(updatedUser);
  } catch (e) {
    console.error("Profile update error:", e);
    return error("Failed to update profile", 500);
  }
}

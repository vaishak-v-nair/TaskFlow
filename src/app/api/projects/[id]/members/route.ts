import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromRequest } from "@/lib/auth";
import { ok, error, unauthorized, forbidden, notFound } from "@/lib/response";

type Params = { params: { id: string } };

async function requireAdmin(projectId: string, userId: string) {
  const m = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  return m?.role === "ADMIN" ? m : null;
}

// POST /api/projects/[id]/members - add a member (admin only)
export async function POST(req: NextRequest, { params }: Params) {
  const auth = getAuthFromRequest(req);
  if (!auth) return unauthorized();

  const admin = await requireAdmin(params.id, auth.userId);
  if (!admin) return forbidden();

  const { email, role = "MEMBER" } = await req.json();
  if (!email) return error("Email is required");
  if (!["ADMIN", "MEMBER"].includes(role)) return error("Invalid role");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return notFound("User with that email");

  const existing = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: params.id, userId: user.id } },
  });
  if (existing) return error("User is already a member");

  const member = await prisma.projectMember.create({
    data: { projectId: params.id, userId: user.id, role },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return ok(member, 201);
}

// DELETE /api/projects/[id]/members - remove a member (admin only)
export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = getAuthFromRequest(req);
  if (!auth) return unauthorized();

  const admin = await requireAdmin(params.id, auth.userId);
  if (!admin) return forbidden();

  const { userId } = await req.json();
  if (!userId) return error("userId is required");
  if (userId === auth.userId) return error("Cannot remove yourself");

  await prisma.projectMember.delete({
    where: { projectId_userId: { projectId: params.id, userId } },
  });

  return ok({ message: "Member removed" });
}

// PATCH /api/projects/[id]/members - update member role (admin only)
export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = getAuthFromRequest(req);
  if (!auth) return unauthorized();

  const admin = await requireAdmin(params.id, auth.userId);
  if (!admin) return forbidden();

  const { userId, role } = await req.json();
  if (!userId || !role) return error("userId and role are required");
  if (!["ADMIN", "MEMBER"].includes(role)) return error("Invalid role");

  const updated = await prisma.projectMember.update({
    where: { projectId_userId: { projectId: params.id, userId } },
    data: { role },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return ok(updated);
}

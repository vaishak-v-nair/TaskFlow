import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromRequest } from "@/lib/auth";
import { ok, error, unauthorized, forbidden, notFound } from "@/lib/response";

type Params = { params: Promise<{ id: string }> };

async function getProjectMembership(projectId: string, userId: string) {
  return prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
}

// GET /api/projects/[id]
export async function GET(req: NextRequest, { params }: Params) {
  const auth = await getAuthFromRequest(req);
  if (!auth) return unauthorized();

  const { id } = await params;
  const membership = await getProjectMembership(id, auth.userId);
  if (!membership) return forbidden();

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      members: {
        include: { user: { select: { id: true, name: true, email: true, role: true } } },
      },
      tasks: {
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          createdBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!project) return notFound("Project");
  return ok({ project, userRole: membership.role, currentUserId: auth.userId });
}

// PUT /api/projects/[id] - update (admin only)
export async function PUT(req: NextRequest, { params }: Params) {
  const auth = await getAuthFromRequest(req);
  if (!auth) return unauthorized();

  const { id } = await params;
  const membership = await getProjectMembership(id, auth.userId);
  if (!membership) return forbidden();
  if (membership.role !== "ADMIN") return forbidden();

  const { name, description } = await req.json();
  if (!name?.trim()) return error("Project name is required");

  const updated = await prisma.project.update({
    where: { id },
    data: { name: name.trim(), description: description?.trim() },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      _count: { select: { tasks: true } },
    },
  });

  return ok(updated);
}

// DELETE /api/projects/[id] - admin only
export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = await getAuthFromRequest(req);
  if (!auth) return unauthorized();

  const { id } = await params;
  const membership = await getProjectMembership(id, auth.userId);
  if (!membership) return forbidden();
  if (membership.role !== "ADMIN") return forbidden();

  await prisma.project.delete({ where: { id } });
  return ok({ message: "Project deleted" });
}

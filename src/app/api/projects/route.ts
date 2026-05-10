import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromRequest } from "@/lib/auth";
import { ok, error, unauthorized } from "@/lib/response";

// GET /api/projects - list projects the user belongs to
export async function GET(req: NextRequest) {
  const auth = getAuthFromRequest(req);
  if (!auth) return unauthorized();

  const projects = await prisma.project.findMany({
    where: {
      members: { some: { userId: auth.userId } },
    },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      _count: { select: { tasks: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return ok(projects);
}

// POST /api/projects - create a project (any authenticated user can create)
export async function POST(req: NextRequest) {
  const auth = getAuthFromRequest(req);
  if (!auth) return unauthorized();

  const { name, description } = await req.json();
  if (!name?.trim()) return error("Project name is required");
  const trimmedDescription = description?.trim();

  const project = await prisma.$transaction(async (tx) => {
    const p = await tx.project.create({
      data: {
        name: name.trim(),
        description: trimmedDescription || null,
        createdById: auth.userId,
      },
    });
    // Creator becomes ADMIN of the project
    await tx.projectMember.create({
      data: { projectId: p.id, userId: auth.userId, role: "ADMIN" },
    });
    return p;
  });

  const full = await prisma.project.findUnique({
    where: { id: project.id },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      _count: { select: { tasks: true } },
    },
  });

  return ok(full, 201);
}

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromRequest } from "@/lib/auth";
import { ok, error, unauthorized, forbidden } from "@/lib/response";

type Params = { params: { id: string } };

async function getMembership(projectId: string, userId: string) {
  return prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
}

// GET /api/projects/[id]/tasks
export async function GET(req: NextRequest, { params }: Params) {
  const auth = getAuthFromRequest(req);
  if (!auth) return unauthorized();

  const membership = await getMembership(params.id, auth.userId);
  if (!membership) return forbidden();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const assigneeId = searchParams.get("assigneeId");

  const tasks = await prisma.task.findMany({
    where: {
      projectId: params.id,
      ...(status && { status: status as any }),
      ...(priority && { priority: priority as any }),
      ...(assigneeId && { assigneeId }),
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return ok(tasks);
}

// POST /api/projects/[id]/tasks
export async function POST(req: NextRequest, { params }: Params) {
  const auth = getAuthFromRequest(req);
  if (!auth) return unauthorized();

  const membership = await getMembership(params.id, auth.userId);
  if (!membership) return forbidden();

  const { title, description, priority = "MEDIUM", assigneeId, dueDate } = await req.json();
  if (!title?.trim()) return error("Task title is required");

  // Validate assignee is in project
  if (assigneeId) {
    const assigneeMembership = await getMembership(params.id, assigneeId);
    if (!assigneeMembership) return error("Assignee is not a project member");
  }

  const task = await prisma.task.create({
    data: {
      title: title.trim(),
      description: description?.trim(),
      priority,
      assigneeId: assigneeId || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      projectId: params.id,
      createdById: auth.userId,
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });

  return ok(task, 201);
}

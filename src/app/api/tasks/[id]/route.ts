import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromRequest } from "@/lib/auth";
import { ok, error, unauthorized, forbidden, notFound } from "@/lib/response";

type Params = { params: Promise<{ id: string }> };

async function getTaskWithAccess(taskId: string, userId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { project: { include: { members: true } } },
  });
  if (!task) return { task: null, membership: null };

  const membership = task.project.members.find((m) => m.userId === userId);
  return { task, membership: membership || null };
}

// GET /api/tasks/[id]
export async function GET(req: NextRequest, { params }: Params) {
  const auth = getAuthFromRequest(req);
  if (!auth) return unauthorized();

  const { id } = await params;
  const { task, membership } = await getTaskWithAccess(id, auth.userId);
  if (!task) return notFound("Task");
  if (!membership) return forbidden();

  const full = await prisma.task.findUnique({
    where: { id },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
    },
  });

  return ok(full);
}

// PUT /api/tasks/[id] - update task
export async function PUT(req: NextRequest, { params }: Params) {
  const auth = getAuthFromRequest(req);
  if (!auth) return unauthorized();

  const { id } = await params;
  const { task, membership } = await getTaskWithAccess(id, auth.userId);
  if (!task) return notFound("Task");
  if (!membership) return forbidden();

  const body = await req.json();
  const { title, description, status, priority, assigneeId, dueDate } = body;

  // Members can only update status of tasks assigned to them
  // Admins can update everything
  if (membership.role === "MEMBER") {
    const keys = Object.keys(body);
    const isOwnAssignedTask = task.assigneeId === auth.userId;
    const onlyStatusUpdate = keys.length > 0 && keys.every((key) => key === "status");

    if (!isOwnAssignedTask || !onlyStatusUpdate) {
      return forbidden();
    }
  }

  if (status && !["TODO", "IN_PROGRESS", "DONE"].includes(status)) {
    return error("Invalid status");
  }
  if (priority && !["LOW", "MEDIUM", "HIGH"].includes(priority)) {
    return error("Invalid priority");
  }
  if (dueDate !== undefined && dueDate && Number.isNaN(new Date(dueDate).getTime())) {
    return error("Invalid due date");
  }
  if (title !== undefined && !title.trim()) {
    return error("Task title is required");
  }
  if (assigneeId) {
    const assigneeMembership = task.project.members.find((member) => member.userId === assigneeId);
    if (!assigneeMembership) return error("Assignee is not a project member");
  }

  const updated = await prisma.task.update({
    where: { id },
    data: {
      ...(title !== undefined && { title: title.trim() }),
      ...(description !== undefined && { description: description?.trim() }),
      ...(status && { status }),
      ...(priority && { priority }),
      ...(assigneeId !== undefined && { assigneeId: assigneeId || null }),
      ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });

  return ok(updated);
}

// DELETE /api/tasks/[id] - admin or task creator
export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = getAuthFromRequest(req);
  if (!auth) return unauthorized();

  const { id } = await params;
  const { task, membership } = await getTaskWithAccess(id, auth.userId);
  if (!task) return notFound("Task");
  if (!membership) return forbidden();

  if (membership.role !== "ADMIN" && task.createdById !== auth.userId) {
    return forbidden();
  }

  await prisma.task.delete({ where: { id } });
  return ok({ message: "Task deleted" });
}

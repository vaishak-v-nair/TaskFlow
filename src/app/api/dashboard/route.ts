import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromRequest } from "@/lib/auth";
import { ok, unauthorized } from "@/lib/response";

export async function GET(req: NextRequest) {
  const auth = getAuthFromRequest(req);
  if (!auth) return unauthorized();

  const userId = auth.userId;
  const now = new Date();

  // Projects the user is in
  const projectIds = (
    await prisma.projectMember.findMany({
      where: { userId },
      select: { projectId: true },
    })
  ).map((m) => m.projectId);

  // Aggregate task counts
  const [total, todo, inProgress, done, overdue] = await Promise.all([
    prisma.task.count({ where: { projectId: { in: projectIds } } }),
    prisma.task.count({ where: { projectId: { in: projectIds }, status: "TODO" } }),
    prisma.task.count({ where: { projectId: { in: projectIds }, status: "IN_PROGRESS" } }),
    prisma.task.count({ where: { projectId: { in: projectIds }, status: "DONE" } }),
    prisma.task.count({
      where: {
        projectId: { in: projectIds },
        status: { not: "DONE" },
        dueDate: { lt: now },
      },
    }),
  ]);

  // My assigned tasks (upcoming)
  const myTasks = await prisma.task.findMany({
    where: {
      assigneeId: userId,
      status: { not: "DONE" },
    },
    include: {
      project: { select: { id: true, name: true } },
    },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    take: 10,
  });

  // Recent tasks across all projects
  const recentTasks = await prisma.task.findMany({
    where: { projectId: { in: projectIds } },
    include: {
      project: { select: { id: true, name: true } },
      assignee: { select: { id: true, name: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 8,
  });

  // Projects with task counts
  const projects = await prisma.project.findMany({
    where: { id: { in: projectIds } },
    include: {
      _count: { select: { tasks: true } },
      members: { select: { role: true, userId: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return ok({
    stats: { total, todo, inProgress, done, overdue },
    myTasks,
    recentTasks,
    projects,
  });
}

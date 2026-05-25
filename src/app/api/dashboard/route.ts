import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromRequest } from "@/lib/auth";
import { ok, unauthorized } from "@/lib/response";

export async function GET(req: NextRequest) {
  const auth = await getAuthFromRequest(req);
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

  const projectFilter = { projectId: { in: projectIds } };

  // Aggregate task counts and load dashboard data in parallel
  const [statusCounts, overdueCount, myTasks, recentTasks, projects] = await Promise.all([
    prisma.task.groupBy({
      by: ["status"],
      where: { projectId: { in: projectIds } },
      _count: true,
    }),
    prisma.task.count({
      where: {
        projectId: { in: projectIds },
        status: { not: "DONE" },
        dueDate: { lt: now },
      },
    }),
    prisma.task.findMany({
      where: {
        ...projectFilter,
        assigneeId: userId,
        status: { not: "DONE" },
      },
      include: {
        project: { select: { id: true, name: true } },
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      take: 10,
    }),
    prisma.task.findMany({
      where: projectFilter,
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
    prisma.project.findMany({
      where: { id: { in: projectIds } },
      include: {
        _count: { select: { tasks: true } },
        members: { select: { role: true, userId: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  let todo = 0, inProgress = 0, done = 0;
  statusCounts.forEach((s) => {
    if (s.status === "TODO") todo = s._count;
    if (s.status === "IN_PROGRESS") inProgress = s._count;
    if (s.status === "DONE") done = s._count;
  });
  const total = todo + inProgress + done;

  return ok({
    stats: { total, todo, inProgress, done, overdue: overdueCount },
    myTasks,
    recentTasks,
    projects,
  });
}

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const adminPass = await bcrypt.hash("admin123", 12);
  const memberPass = await bcrypt.hash("member123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@demo.com" },
    update: {},
    create: { name: "Admin User", email: "admin@demo.com", password: adminPass, role: "ADMIN" },
  });

  const member = await prisma.user.upsert({
    where: { email: "member@demo.com" },
    update: {},
    create: { name: "Team Member", email: "member@demo.com", password: memberPass },
  });

  const project = await prisma.project.upsert({
    where: { id: "demo-project-1" },
    update: {},
    create: {
      id: "demo-project-1",
      name: "Demo Project",
      description: "A sample project to get you started",
      createdById: admin.id,
    },
  });

  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: project.id, userId: admin.id } },
    update: {},
    create: { projectId: project.id, userId: admin.id, role: "ADMIN" },
  });

  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: project.id, userId: member.id } },
    update: {},
    create: { projectId: project.id, userId: member.id, role: "MEMBER" },
  });

  const tasks = [
    { title: "Set up project infrastructure", status: "DONE" as const, priority: "HIGH" as const, assigneeId: admin.id },
    { title: "Design system architecture", status: "IN_PROGRESS" as const, priority: "HIGH" as const, assigneeId: member.id },
    { title: "Write API documentation", status: "TODO" as const, priority: "MEDIUM" as const, assigneeId: member.id },
    { title: "Deploy to staging", status: "TODO" as const, priority: "LOW" as const, assigneeId: null },
  ];

  for (const t of tasks) {
    await prisma.task.create({
      data: { ...t, projectId: project.id, createdById: admin.id },
    });
  }

  console.log("Seed complete!");
  console.log("Admin: admin@demo.com / admin123");
  console.log("Member: member@demo.com / member123");
}

main().catch(console.error).finally(() => prisma.$disconnect());

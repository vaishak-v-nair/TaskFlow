"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format, isPast } from "date-fns";
import clsx from "clsx";
import { fetchJson } from "@/lib/api-client";

interface Stats { total: number; todo: number; inProgress: number; done: number; overdue: number; }
interface Task { id: string; title: string; status: string; priority: string; dueDate: string | null; project: { id: string; name: string }; assignee?: { name: string } | null; }
interface Project { id: string; name: string; description: string | null; _count: { tasks: number }; members: { role: string; userId: string }[]; }
interface DashboardData { stats: Stats; myTasks: Task[]; recentTasks: Task[]; projects: Project[]; }

const statusStyles: Record<string, string> = {
  TODO: "badge-todo",
  IN_PROGRESS: "badge-in-progress",
  DONE: "badge-done",
};
const priorityStyles: Record<string, string> = {
  LOW: "badge-low",
  MEDIUM: "badge-medium",
  HIGH: "badge-high",
};
const statusLabel: Record<string, string> = { TODO: "To Do", IN_PROGRESS: "In Progress", DONE: "Done" };

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="card p-5 animated-card fade-in">
      <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider mb-1">{label}</p>
      <p className={clsx("text-3xl font-bold", color)}>{value}</p>
    </div>
  );
}

function TaskRow({ task }: { task: Task }) {
  const overdue = task.dueDate && task.status !== "DONE" && isPast(new Date(task.dueDate));

  return (
    <div className="flex items-center gap-3 py-3 border-b border-zinc-800 last:border-0 hover:bg-zinc-800/30 px-2 -mx-2 rounded-lg transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-zinc-200 font-medium truncate">{task.title}</p>
        <p className="text-xs text-zinc-500 mt-0.5">{task.project.name}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {task.dueDate && (
          <span className={clsx("text-xs", overdue ? "text-red-400" : "text-zinc-500")}>
            {overdue ? "Overdue | " : ""}
            {format(new Date(task.dueDate), "MMM d")}
          </span>
        )}
        <span className={clsx("badge", statusStyles[task.status])}>{statusLabel[task.status]}</span>
        <span className={clsx("badge border-0", priorityStyles[task.priority])}>{task.priority}</span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      const response = await fetchJson<DashboardData>("/api/dashboard", {
        credentials: "include",
        redirectOnUnauthorized: true,
      });

      if (response.success) {
        setData(response.data);
        setError("");
      } else {
        setError(response.error);
      }

      setLoading(false);
    }

    void loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="p-6 md:p-10 space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-zinc-800 rounded-lg" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => <div key={i} className="h-24 bg-zinc-800 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 md:p-10 max-w-3xl">
        <div className="card p-6 text-center">
          <p className="text-red-400 text-sm">{error || "Unable to load the dashboard right now."}</p>
        </div>
      </div>
    );
  }

  const { stats, myTasks, recentTasks, projects } = data;

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-zinc-500 text-sm mt-1">Your team&apos;s activity at a glance</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Total Tasks" value={stats.total} color="text-white" />
        <StatCard label="To Do" value={stats.todo} color="text-zinc-300" />
        <StatCard label="In Progress" value={stats.inProgress} color="text-blue-400" />
        <StatCard label="Done" value={stats.done} color="text-emerald-400" />
        <StatCard label="Overdue" value={stats.overdue} color="text-red-400" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card p-5 animated-card fade-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">My Tasks</h2>
            <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded-md">{myTasks.length} open</span>
          </div>
          {myTasks.length === 0 ? (
            <p className="text-zinc-500 text-sm py-4 text-center">No tasks assigned to you</p>
          ) : (
            <div>{myTasks.map((task) => <TaskRow key={task.id} task={task} />)}</div>
          )}
        </div>

        <div className="card p-5 animated-card fade-in">
          <h2 className="font-semibold text-white mb-4">Recent Activity</h2>
          {recentTasks.length === 0 ? (
            <p className="text-zinc-500 text-sm py-4 text-center">No tasks yet</p>
          ) : (
            <div>{recentTasks.map((task) => <TaskRow key={task.id} task={task} />)}</div>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white">Projects</h2>
          <Link href="/projects" className="text-indigo-400 hover:text-indigo-300 text-sm transition-colors">
            View all -&gt;
          </Link>
        </div>
        {projects.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-zinc-400 mb-3">No projects yet</p>
            <Link href="/projects" className="btn-primary inline-flex">Create your first project</Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`} className="card p-5 animated-card fade-in hover:border-zinc-700 transition-all duration-150 group block">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-zinc-200 group-hover:text-white transition-colors">{project.name}</h3>
                  <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">{project._count.tasks} tasks</span>
                </div>
                {project.description && <p className="text-zinc-500 text-sm line-clamp-2">{project.description}</p>}
                <p className="text-zinc-600 text-xs mt-3">{project.members.length} member{project.members.length !== 1 ? "s" : ""}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format, isPast } from "date-fns";
import clsx from "clsx";

type Status = "TODO" | "IN_PROGRESS" | "DONE";
type Priority = "LOW" | "MEDIUM" | "HIGH";
type Role = "ADMIN" | "MEMBER";

interface User { id: string; name: string; email: string; }
interface Member { userId: string; role: Role; user: User; }
interface Task {
  id: string; title: string; description: string | null;
  status: Status; priority: Priority; dueDate: string | null;
  assignee: User | null; createdBy: { id: string; name: string };
  createdAt: string;
}
interface Project {
  id: string; name: string; description: string | null;
  createdBy: User; members: Member[]; tasks: Task[]; createdAt: string;
}

const STATUS_FLOW: Status[] = ["TODO", "IN_PROGRESS", "DONE"];
const STATUS_LABEL: Record<Status, string> = { TODO: "To Do", IN_PROGRESS: "In Progress", DONE: "Done" };
const STATUS_CLASS: Record<Status, string> = { TODO: "badge-todo", IN_PROGRESS: "badge-in-progress", DONE: "badge-done" };
const PRIORITY_CLASS: Record<Priority, string> = { LOW: "badge-low", MEDIUM: "badge-medium", HIGH: "badge-high" };

function TaskCard({ task, userRole, userId, members, onUpdate, onDelete }: {
  task: Task; userRole: Role; userId: string;
  members: Member[]; onUpdate: (id: string, data: Partial<Task>) => void;
  onDelete: (id: string) => void;
}) {
  const overdue = task.dueDate && task.status !== "DONE" && isPast(new Date(task.dueDate));
  const canEdit = userRole === "ADMIN" || task.createdBy.id === userId;
  const canAdvanceStatus = userRole === "ADMIN" || task.assignee?.id === userId;

  const nextStatus = STATUS_FLOW[STATUS_FLOW.indexOf(task.status) + 1];

  return (
    <div className={clsx("card p-4 group transition-all duration-150", overdue && "border-red-600/20")}>
      <div className="flex items-start gap-3">
        <button
          onClick={() => canAdvanceStatus && nextStatus && onUpdate(task.id, { status: nextStatus })}
          className={clsx(
            "mt-0.5 w-4 h-4 rounded border flex-shrink-0 transition-all",
            task.status === "DONE"
              ? "bg-emerald-600 border-emerald-600"
              : "border-zinc-600 hover:border-indigo-500",
            !canAdvanceStatus && "cursor-default"
          )}
          title={nextStatus ? `Mark as ${STATUS_LABEL[nextStatus]}` : "Completed"}
        >
          {task.status === "DONE" && (
            <svg className="w-full h-full text-white p-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <p className={clsx("text-sm font-medium", task.status === "DONE" ? "line-through text-zinc-500" : "text-zinc-200")}>
            {task.title}
          </p>
          {task.description && <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{task.description}</p>}

          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className={clsx("badge", STATUS_CLASS[task.status])}>{STATUS_LABEL[task.status]}</span>
            <span className={clsx("badge border-0", PRIORITY_CLASS[task.priority])}>{task.priority}</span>
            {task.assignee && (
              <span className="text-xs text-zinc-500">→ {task.assignee.name}</span>
            )}
            {task.dueDate && (
              <span className={clsx("text-xs", overdue ? "text-red-400 font-medium" : "text-zinc-500")}>
                {overdue ? "⚠ " : ""}Due {format(new Date(task.dueDate), "MMM d")}
              </span>
            )}
          </div>
        </div>

        {canEdit && (
          <button onClick={() => onDelete(task.id)}
            className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [userRole, setUserRole] = useState<Role>("MEMBER");
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"tasks" | "members">("tasks");
  const [filter, setFilter] = useState<Status | "ALL">("ALL");
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: "", description: "", priority: "MEDIUM", assigneeId: "", dueDate: "" });
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState<Role>("MEMBER");
  const [modalError, setModalError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/projects/${id}`, { credentials: "include" }).then((r) => r.json()),
      fetch("/api/auth/me", { credentials: "include" }).then((r) => r.json()),
    ]).then(([projData, meData]) => {
      if (!projData.success) { router.push("/projects"); return; }
      setProject(projData.data.project);
      setUserRole(projData.data.userRole);
      if (meData.success) setUserId(meData.data.id);
      setLoading(false);
    });
  }, [id]);

  async function createTask() {
    if (!taskForm.title.trim()) { setModalError("Title is required"); return; }
    setSubmitting(true);
    const res = await fetch(`/api/projects/${id}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        title: taskForm.title,
        description: taskForm.description || undefined,
        priority: taskForm.priority,
        assigneeId: taskForm.assigneeId || undefined,
        dueDate: taskForm.dueDate || undefined,
      }),
    });
    const data = await res.json();
    if (data.success) {
      setProject((p) => p ? { ...p, tasks: [data.data, ...p.tasks] } : p);
      setShowTaskModal(false);
      setTaskForm({ title: "", description: "", priority: "MEDIUM", assigneeId: "", dueDate: "" });
      setModalError("");
    } else {
      setModalError(data.error);
    }
    setSubmitting(false);
  }

  async function addMember() {
    if (!memberEmail.trim()) { setModalError("Email is required"); return; }
    setSubmitting(true);
    const res = await fetch(`/api/projects/${id}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email: memberEmail, role: memberRole }),
    });
    const data = await res.json();
    if (data.success) {
      setProject((p) => p ? { ...p, members: [...p.members, data.data] } : p);
      setShowMemberModal(false);
      setMemberEmail("");
      setModalError("");
    } else {
      setModalError(data.error);
    }
    setSubmitting(false);
  }

  async function updateTask(taskId: string, updates: Partial<Task>) {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (data.success) {
      setProject((p) => p ? { ...p, tasks: p.tasks.map((t) => t.id === taskId ? data.data : t) } : p);
    }
  }

  async function deleteTask(taskId: string) {
    if (!confirm("Delete this task?")) return;
    const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE", credentials: "include" });
    const data = await res.json();
    if (data.success) {
      setProject((p) => p ? { ...p, tasks: p.tasks.filter((t) => t.id !== taskId) } : p);
    }
  }

  async function removeMember(uid: string) {
    if (!confirm("Remove this member?")) return;
    const res = await fetch(`/api/projects/${id}/members`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ userId: uid }),
    });
    const data = await res.json();
    if (data.success) {
      setProject((p) => p ? { ...p, members: p.members.filter((m) => m.userId !== uid) } : p);
    }
  }

  async function deleteProject() {
    if (!confirm("Delete this project and all its tasks? This cannot be undone.")) return;
    const res = await fetch(`/api/projects/${id}`, { method: "DELETE", credentials: "include" });
    const data = await res.json();
    if (data.success) router.push("/projects");
  }

  if (loading) {
    return <div className="p-6 md:p-10 space-y-4 animate-pulse">
      <div className="h-8 w-64 bg-zinc-800 rounded-lg" />
      <div className="h-4 w-40 bg-zinc-800 rounded-lg" />
    </div>;
  }
  if (!project) return null;

  const filteredTasks = filter === "ALL" ? project.tasks : project.tasks.filter((t) => t.status === filter);
  const taskCounts = { ALL: project.tasks.length, TODO: 0, IN_PROGRESS: 0, DONE: 0 };
  project.tasks.forEach((t) => taskCounts[t.status]++);

  return (
    <div className="p-6 md:p-10 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-zinc-500 text-sm mb-2">
            <a href="/projects" className="hover:text-zinc-300 transition-colors">Projects</a>
            <span>/</span>
            <span className="text-zinc-300">{project.name}</span>
          </div>
          <h1 className="text-2xl font-bold text-white">{project.name}</h1>
          {project.description && <p className="text-zinc-500 text-sm mt-1">{project.description}</p>}
        </div>
        <div className="flex items-center gap-2">
          {userRole === "ADMIN" && (
            <>
              <button onClick={() => { setShowMemberModal(true); setModalError(""); }} className="btn-ghost text-sm flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Add Member
              </button>
              <button onClick={deleteProject} className="btn-danger text-sm">Delete</button>
            </>
          )}
          <button onClick={() => { setShowTaskModal(true); setModalError(""); }} className="btn-primary text-sm flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Task
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-zinc-800 pb-0">
        {(["tasks", "members"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={clsx("px-4 py-2.5 text-sm font-medium capitalize transition-all border-b-2 -mb-px",
              activeTab === tab ? "border-indigo-500 text-white" : "border-transparent text-zinc-500 hover:text-zinc-300")}>
            {tab} {tab === "tasks" ? `(${project.tasks.length})` : `(${project.members.length})`}
          </button>
        ))}
      </div>

      {activeTab === "tasks" && (
        <div>
          {/* Filter */}
          <div className="flex gap-2 mb-5">
            {(["ALL", "TODO", "IN_PROGRESS", "DONE"] as const).map((s) => (
              <button key={s} onClick={() => setFilter(s)}
                className={clsx("px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  filter === s ? "bg-indigo-600 text-white" : "bg-zinc-800 text-zinc-400 hover:text-zinc-200")}>
                {s === "ALL" ? "All" : STATUS_LABEL[s]} ({taskCounts[s]})
              </button>
            ))}
          </div>

          {filteredTasks.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-zinc-500 text-sm">No tasks{filter !== "ALL" ? ` with status "${STATUS_LABEL[filter as Status]}"` : ""}</p>
              <button onClick={() => setShowTaskModal(true)} className="btn-primary mt-4">Add first task</button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTasks.map((task) => (
                <TaskCard key={task.id} task={task} userRole={userRole} userId={userId}
                  members={project.members} onUpdate={updateTask} onDelete={deleteTask} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "members" && (
        <div className="space-y-2">
          {project.members.map((m) => (
            <div key={m.userId} className="card p-4 flex items-center gap-4">
              <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300 text-sm font-bold flex-shrink-0">
                {m.user.name[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-zinc-200 font-medium text-sm">{m.user.name}</p>
                <p className="text-zinc-500 text-xs">{m.user.email}</p>
              </div>
              <span className={clsx("badge", m.role === "ADMIN" ? "badge-in-progress" : "badge-todo")}>
                {m.role}
              </span>
              {userRole === "ADMIN" && m.userId !== userId && (
                <button onClick={() => removeMember(m.userId)}
                  className="text-zinc-600 hover:text-red-400 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-white mb-5">New Task</h2>
            {modalError && <p className="text-red-400 text-sm mb-4 bg-red-600/10 border border-red-600/20 px-3 py-2 rounded-lg">{modalError}</p>}
            <div className="space-y-4">
              <div>
                <label className="label">Title *</label>
                <input className="input" placeholder="e.g. Design landing page" value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input resize-none" rows={2} value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Priority</label>
                  <select className="input" value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
                <div>
                  <label className="label">Due Date</label>
                  <input type="date" className="input" value={taskForm.dueDate}
                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="label">Assign To</label>
                <select className="input" value={taskForm.assigneeId}
                  onChange={(e) => setTaskForm({ ...taskForm, assigneeId: e.target.value })}>
                  <option value="">Unassigned</option>
                  {project.members.map((m) => (
                    <option key={m.userId} value={m.userId}>{m.user.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowTaskModal(false); setModalError(""); }} className="btn-ghost flex-1">Cancel</button>
              <button onClick={createTask} disabled={submitting} className="btn-primary flex-1">
                {submitting ? "Adding..." : "Add Task"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-white mb-5">Add Member</h2>
            {modalError && <p className="text-red-400 text-sm mb-4 bg-red-600/10 border border-red-600/20 px-3 py-2 rounded-lg">{modalError}</p>}
            <div className="space-y-4">
              <div>
                <label className="label">Email Address</label>
                <input type="email" className="input" placeholder="member@example.com" value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)} />
              </div>
              <div>
                <label className="label">Role</label>
                <select className="input" value={memberRole}
                  onChange={(e) => setMemberRole(e.target.value as Role)}>
                  <option value="MEMBER">Member</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowMemberModal(false); setModalError(""); }} className="btn-ghost flex-1">Cancel</button>
              <button onClick={addMember} disabled={submitting} className="btn-primary flex-1">
                {submitting ? "Adding..." : "Add Member"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

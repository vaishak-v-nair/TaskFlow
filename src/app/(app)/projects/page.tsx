"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import clsx from "clsx";

interface Project {
  id: string; name: string; description: string | null; createdAt: string;
  createdBy: { id: string; name: string; email: string };
  members: { role: string; userId: string; user: { id: string; name: string } }[];
  _count: { tasks: number };
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProjects() {
      const res = await fetch("/api/projects", { credentials: "include" });
      const data = await res.json();
      if (data.success) setProjects(data.data);
      setLoading(false);
    }
    void loadProjects();
  }, []);

  async function createProject() {
    if (!form.name.trim()) { setError("Name is required"); return; }
    setCreating(true);
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.success) {
      setProjects([data.data, ...projects]);
      setShowModal(false);
      setForm({ name: "", description: "" });
      setError("");
    } else {
      setError(data.error);
    }
    setCreating(false);
  }

  return (
    <div className="p-6 md:p-10 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="text-zinc-500 text-sm mt-1">{projects.length} project{projects.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Project
        </button>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-40 bg-zinc-800 rounded-xl animate-pulse" />)}
        </div>
      ) : projects.length === 0 ? (
        <div className="card p-16 text-center animated-card fade-in">
          <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p className="text-zinc-300 font-medium mb-1">No projects yet</p>
          <p className="text-zinc-500 text-sm mb-5">Create a project and invite your team</p>
          <button onClick={() => setShowModal(true)} className="btn-primary">Create your first project</button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`}
              className="card p-5 animated-card fade-in hover:border-zinc-700 transition-all duration-150 group block">
              <div className="flex items-start justify-between mb-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/15 border border-indigo-600/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-indigo-400 text-xs font-bold">{p.name[0].toUpperCase()}</span>
                </div>
                <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">{p._count.tasks} tasks</span>
              </div>
              <h3 className="font-semibold text-zinc-200 group-hover:text-white transition-colors mb-1">{p.name}</h3>
              {p.description && <p className="text-zinc-500 text-sm line-clamp-2 mb-3">{p.description}</p>}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-800">
                <div className="flex -space-x-1.5">
                  {p.members.slice(0, 4).map((m) => (
                    <div key={m.userId}
                      className="w-6 h-6 rounded-full bg-zinc-700 border border-zinc-900 flex items-center justify-center text-zinc-300 text-xs font-medium"
                      title={m.user.name}>
                      {m.user.name[0].toUpperCase()}
                    </div>
                  ))}
                  {p.members.length > 4 && (
                    <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-900 flex items-center justify-center text-zinc-400 text-xs">
                      +{p.members.length - 4}
                    </div>
                  )}
                </div>
                <span className="text-zinc-600 text-xs">{format(new Date(p.createdAt), "MMM d")}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card w-full max-w-md p-6 animate-[fadeIn_0.15s_ease-out]">
            <h2 className="text-lg font-bold text-white mb-5">New Project</h2>
            {error && <p className="text-red-400 text-sm mb-4 bg-red-600/10 border border-red-600/20 px-3 py-2 rounded-lg">{error}</p>}
            <div className="space-y-4">
              <div>
                <label className="label">Project Name *</label>
                <input className="input" placeholder="e.g. Marketing Website" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input resize-none" rows={3} placeholder="What is this project about?"
                  value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowModal(false); setError(""); setForm({ name: "", description: "" }); }}
                className="btn-ghost flex-1">Cancel</button>
              <button onClick={createProject} disabled={creating} className="btn-primary flex-1">
                {creating ? "Creating..." : "Create Project"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

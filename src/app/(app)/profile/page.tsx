"use client";

import { useEffect, useState, FormEvent } from "react";
import { fetchJson } from "@/lib/api-client";
import clsx from "clsx";

interface User { id: string; name: string; email: string; role: string; }

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    async function loadUser() {
      const data = await fetchJson<User>("/api/auth/me", {
        credentials: "include",
        redirectOnUnauthorized: true,
      });
      if (data.success) {
        setUser(data.data);
        setName(data.data.name);
      }
      setLoading(false);
    }
    void loadUser();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    setMessage(null);

    const response = await fetchJson<User>("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    if (response.success) {
      setMessage({ text: "Profile updated successfully!", type: "success" });
      setUser(response.data);
      // Optional: We can trigger a re-render of the layout by using router.refresh() if needed
    } else {
      setMessage({ text: response.error || "Failed to update profile", type: "error" });
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="p-6 md:p-10 max-w-3xl animate-pulse space-y-6">
        <div className="h-8 w-48 bg-zinc-800 rounded-lg" />
        <div className="card p-6 h-64" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 md:p-10 max-w-3xl">
        <div className="card p-6 text-center text-red-400">Unable to load profile data.</div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Your Profile</h1>
        <p className="text-zinc-500 text-sm mt-1">Manage your account settings and personal information.</p>
      </div>

      <div className="card animated-card fade-in overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-zinc-800/50 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-24 h-24 rounded-full bg-indigo-600/20 border-2 border-indigo-600/30 flex items-center justify-center text-indigo-400 text-4xl font-bold flex-shrink-0">
            {user.name[0]?.toUpperCase()}
          </div>
          <div className="text-center sm:text-left pt-2">
            <h2 className="text-xl font-bold text-white">{user.name}</h2>
            <p className="text-zinc-400 text-sm">{user.email}</p>
            <span className="inline-block mt-3 badge badge-low">{user.role}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {message && (
            <div className={clsx("p-4 rounded-lg text-sm border", message.type === "success" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20")}>
              {message.text}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-zinc-300 mb-1.5">Full Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input w-full"
                required
                placeholder="Jane Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-500 mb-1.5">Email Address</label>
              <input
                type="email"
                value={user.email}
                disabled
                className="input w-full opacity-50 cursor-not-allowed"
              />
              <p className="text-xs text-zinc-500 mt-2">Email addresses cannot be changed right now.</p>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-800/50 flex justify-end">
            <button
              type="submit"
              disabled={saving || name.trim() === "" || name === user.name}
              className="btn-primary"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import Link from "next/link";

type ProjectCardProps = {
  id: string;
  name: string;
  description?: string;
  memberCount?: number;
  taskCount?: number;
};

export default function ProjectCard({
  id,
  name,
  description,
  memberCount = 0,
  taskCount = 0,
}: ProjectCardProps) {
  return (
    <Link
      href={`/projects/${id}`}
      className="block overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 p-5 transition hover:border-sky-500 hover:bg-zinc-900"
    >
      <h3 className="text-xl font-semibold text-white">{name}</h3>
      {description ? (
        <p className="mt-3 text-sm text-zinc-400">{description}</p>
      ) : (
        <p className="mt-3 text-sm text-zinc-500">No description yet.</p>
      )}
      <div className="mt-4 flex flex-wrap gap-3 text-xs text-zinc-400">
        <span>{memberCount} members</span>
        <span>{taskCount} tasks</span>
      </div>
    </Link>
  );
}

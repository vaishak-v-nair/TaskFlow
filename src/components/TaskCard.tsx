type TaskCardProps = {
  id: string;
  title: string;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  priority: "low" | "medium" | "high";
  assignee?: string;
  dueDate?: string;
};

const statusStyles: Record<TaskCardProps["status"], string> = {
  TODO: "bg-zinc-800 text-zinc-200",
  IN_PROGRESS: "bg-sky-900 text-sky-200",
  DONE: "bg-emerald-950 text-emerald-200",
};

export default function TaskCard({
  title,
  status,
  priority,
  assignee,
  dueDate,
}: TaskCardProps) {
  return (
    <article className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5 shadow-sm transition hover:border-sky-500">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className="text-lg font-semibold text-white">{title}</h4>
          <p className="mt-2 text-sm text-zinc-400">Priority: {priority}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[status]}`}>
          {status.replace("_", " ")}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-xs text-zinc-400">
        {assignee && <span>Assigned to {assignee}</span>}
        {dueDate && <span>Due {dueDate}</span>}
      </div>
    </article>
  );
}

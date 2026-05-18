import { useState } from "react";

interface HookEntry {
  type?: string;
  command?: string;
  url?: string;
  prompt?: string;
}

interface HookGroupCardProps {
  group: { matcher: string; hooks: HookEntry[] };
  onEdit: () => void;
  onDelete: () => void;
}

export const HookGroupCard = ({ group, onEdit, onDelete }: HookGroupCardProps) => {
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  return (
    <div className="flex items-start gap-3 px-4 py-3 rounded-lg border border-(--border-subtle) bg-(--bg-surface) group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[11px] font-semibold text-(--text-muted) uppercase tracking-widest">
            Matcher
          </span>
          <span
            className={[
              "text-[12px] font-['Fira_Code',monospace]",
              group.matcher
                ? "text-(--text-primary)"
                : "text-(--text-muted) italic",
            ].join(" ")}
          >
            {group.matcher || "matches all"}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          {group.hooks.map((h, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-(--accent) shrink-0">
                {h.type ?? "command"}
              </span>
              <span className="text-[12px] font-['Fira_Code',monospace] text-(--text-secondary) truncate">
                {h.command ?? h.url ?? h.prompt ?? ""}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="shrink-0 flex items-center gap-1">
        {deleteConfirm ? (
          <>
            <button
              type="button"
              onClick={onDelete}
              className="text-[12px] text-red-400 font-medium bg-transparent border-none cursor-pointer px-2 py-1 hover:text-red-300 transition-colors"
            >
              Confirm
            </button>
            <button
              type="button"
              onClick={() => setDeleteConfirm(false)}
              className="text-[12px] text-(--text-muted) font-medium bg-transparent border-none cursor-pointer px-2 py-1 hover:text-(--text-secondary) transition-colors"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={onEdit}
              className="text-[12px] text-(--text-muted) bg-transparent border-none cursor-pointer px-2 py-1 rounded hover:text-(--text-secondary) transition-colors opacity-0 group-hover:opacity-100"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => setDeleteConfirm(true)}
              className="text-[12px] text-(--text-muted) bg-transparent border-none cursor-pointer px-2 py-1 rounded hover:text-(--text-secondary) transition-colors opacity-0 group-hover:opacity-100"
            >
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  );
};

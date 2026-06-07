import { useState } from "react";
import { ShellHighlight } from "../Shared/ShellHighlight";

interface HookEntry {
  type?: string;
  command?: string;
  url?: string;
  prompt?: string;
  if?: string;
}

interface HookGroupCardProps {
  group: { matcher?: string; hooks?: HookEntry[]; command?: string; type?: string };
  onEdit: () => void;
  onDelete: () => void;
}

// Normalise legacy flat entries so the rest of the component always sees HookEntry[]
function resolveEntries(group: HookGroupCardProps["group"]): HookEntry[] {
  if (group.hooks && group.hooks.length > 0) return group.hooks;
  if (group.command) return [{ type: group.type ?? "command", command: group.command }];
  return [];
}

function entryValue(h: HookEntry): string {
  return h.command ?? h.url ?? h.prompt ?? "";
}

// ── Detail modal ──────────────────────────────────────────────────────────────

interface DetailModalProps {
  group: { matcher?: string; hooks?: HookEntry[]; command?: string; type?: string };
  entries: HookEntry[];
  onEdit: () => void;
  onClose: () => void;
}

const DetailModal = ({ group, entries, onEdit, onClose }: DetailModalProps) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
    onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
  >
    <div className="bg-(--bg-elevated) border border-(--border-default) rounded-2xl p-6 w-full max-w-lg mx-4 shadow-2xl flex flex-col gap-4 animate-[modalFadeIn_200ms_ease-out_both]">
      <div className="flex items-start justify-between gap-4">
        <h2 className='m-0 text-lg font-["Bricolage_Grotesque",sans-serif] font-bold text-(--text-primary)'>
          Hook detail
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="text-(--text-muted) hover:text-(--text-primary) bg-transparent border-none cursor-pointer text-[20px] leading-none transition-colors"
        >
          ×
        </button>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-[11px] font-semibold text-(--text-muted) uppercase tracking-widest">
          Matcher
        </span>
        <span className={[
          "text-[13px] font-['Fira_Code',monospace]",
          group.matcher ? "text-(--text-primary)" : "text-(--text-muted) italic",
        ].join(" ")}>
          {group.matcher || "matches all"}
        </span>
      </div>

      {entries.map((h, i) => (
        <div key={i} className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-semibold text-(--accent) uppercase tracking-widest">
              {h.type ?? "command"}
            </span>
            {h.if && (
              <span className="text-[11px] font-['Fira_Code',monospace] px-1.5 py-0.5 rounded border border-(--border-subtle) bg-(--bg-surface) text-(--text-muted)">
                if: {h.if}
              </span>
            )}
          </div>
          <div className="p-3 rounded-lg bg-(--bg-surface) border border-(--border-subtle) overflow-y-auto max-h-64">
            {entryValue(h)
              ? <ShellHighlight code={entryValue(h)} />
              : <span className="text-[12px] font-['Fira_Code',monospace] text-(--text-muted) italic">empty</span>
            }
          </div>
        </div>
      ))}

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onClose}
          className="text-[13px] font-medium px-4 py-2 rounded-lg border border-(--border-subtle) bg-transparent text-(--text-secondary) hover:text-(--text-primary) cursor-pointer transition-colors"
        >
          Close
        </button>
        <button
          type="button"
          onClick={() => { onClose(); onEdit(); }}
          className="text-[13px] font-medium px-4 py-2 rounded-lg border border-(--border-subtle) bg-(--bg-elevated) text-(--text-primary) hover:bg-(--bg-hover) cursor-pointer transition-colors"
        >
          Edit
        </button>
      </div>
    </div>
  </div>
);

// ── HookGroupCard ─────────────────────────────────────────────────────────────

export const HookGroupCard = ({ group, onEdit, onDelete }: HookGroupCardProps) => {
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  const entries = resolveEntries(group);

  return (
    <>
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-lg border border-(--border-subtle) bg-(--bg-surface) group cursor-pointer hover:border-(--border-default) transition-colors overflow-hidden"
        onClick={() => { if (!deleteConfirm) setShowDetail(true); }}
      >
        {/* Matcher badge */}
        <span className={[
          "shrink-0 text-[11px] font-['Fira_Code',monospace] px-2 py-0.5 rounded border",
          group.matcher
            ? "text-(--text-primary) border-(--border-default) bg-(--bg-elevated)"
            : "text-(--text-muted) italic border-(--border-subtle) bg-transparent",
        ].join(" ")}>
          {group.matcher || "all tools"}
        </span>

        {/* Command preview — takes remaining width, truncated */}
        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
          {entries.length === 0 ? (
            <span className="text-[12px] text-(--text-muted) italic">no commands</span>
          ) : entries.map((h, i) => (
            <div key={i} className="flex items-center gap-2 min-w-0">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-(--accent) shrink-0">
                {h.type ?? "command"}
              </span>
              {h.if && (
                <span className="shrink-0 text-[10px] font-['Fira_Code',monospace] px-1.5 py-0.5 rounded border border-(--border-subtle) bg-(--bg-elevated) text-(--text-muted) truncate max-w-[120px]">
                  if: {h.if}
                </span>
              )}
              <span className="flex-1 min-w-0 text-[12px] font-['Fira_Code',monospace] text-(--text-secondary) truncate">
                {entryValue(h)}
              </span>
            </div>
          ))}
        </div>

        {/* Action buttons — stop propagation so clicks don't open the modal */}
        <div
          className="shrink-0 flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
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

      {showDetail && (
        <DetailModal
          group={group}
          entries={entries}
          onEdit={onEdit}
          onClose={() => setShowDetail(false)}
        />
      )}
    </>
  );
};

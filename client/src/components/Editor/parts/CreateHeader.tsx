import type { ViewMode } from "./types";
import { ViewModeToggle } from "./ViewModeToggle";

type CreateStatus = "idle" | "creating" | "error";

type EditorType = "agent" | "skill" | "mcp-server" | "project";

interface CreateHeaderProps {
  type: EditorType;
  pathPrefix: string;
  draftName: string;
  onDraftNameChange: (val: string) => void;
  createStatus: CreateStatus;
  onCreate: () => void;
  viewMode: ViewMode;
  onViewModeToggle: (mode: ViewMode) => void;
  contentEmpty?: boolean;
}

export const CreateHeader = ({
  type,
  pathPrefix,
  draftName,
  onDraftNameChange,
  createStatus,
  onCreate,
  viewMode,
  onViewModeToggle,
  contentEmpty = false,
}: CreateHeaderProps) => {
  const creating = createStatus === "creating";
  const isError = createStatus === "error";
  const needsBody = type === "mcp-server" && contentEmpty;
  const disabled = draftName.trim() === "" || creating || needsBody;

  const label = creating ? "Creating…" : isError ? "Error" : "Create";

  return (
    <div className="px-5 flex items-center justify-between shrink-0 min-h-12 bg-(--bg-sidebar)">
      <div className="flex items-center gap-1.5">
        <span className='font-["Fira_Code",monospace] text-[12px] text-(--text-secondary)'>
          {pathPrefix}
        </span>
        <input
          type="text"
          value={draftName}
          onChange={(e) => onDraftNameChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !disabled) onCreate();
          }}
          placeholder="name"
          className='bg-transparent font-["Fira_Code",monospace] text-[12px] text-(--text-secondary) outline-none border-none border-b border-(--border-subtle) w-48 transition-colors duration-150 focus:border-b-(--border-strong)'
          autoFocus
          spellCheck={false}
        />
      </div>
      <div className="flex items-center gap-3">
        {type === "agent" && (
          <ViewModeToggle viewMode={viewMode} onToggle={onViewModeToggle} />
        )}
        {needsBody && (
          <span className='font-["Fira_Code",monospace] text-[11px] text-(--text-muted) opacity-60'>
            add JSON body below first
          </span>
        )}
        <button
          onClick={onCreate}
          disabled={disabled}
          aria-label="Create file"
          className={[
            "text-[13px] px-3 py-1 rounded-md border-none transition-colors duration-150",
            isError
              ? "text-(--error) bg-transparent cursor-pointer"
              : !disabled
                ? "text-(--accent) font-semibold cursor-pointer hover:bg-(--accent)/8 bg-transparent"
                : "bg-transparent text-(--text-muted) cursor-not-allowed opacity-40",
          ].join(" ")}
        >
          {label}
        </button>
      </div>
    </div>
  );
};

import type { ViewMode } from "./types";
import { BackArrowIcon } from "../../Icons";
import { ViewModeToggle } from "./ViewModeToggle";

type SaveStatus = "idle" | "saving" | "saved" | "error";

type EditorType = "agent" | "skill" | "mcp-server" | "project";

interface EditHeaderProps {
  filePath: string;
  type: EditorType;
  saveStatus: SaveStatus;
  saveDisabled: boolean;
  onSave: () => void;
  viewMode: ViewMode;
  onViewModeToggle: (mode: ViewMode) => void;
  showViewToggle?: boolean;
  onBack?: () => void;
  previewMode?: boolean;
  onTogglePreview?: () => void;
}

export const EditHeader = ({
  filePath,
  type,
  saveStatus,
  saveDisabled,
  onSave,
  viewMode,
  onViewModeToggle,
  showViewToggle = true,
  onBack,
  previewMode,
  onTogglePreview,
}: EditHeaderProps) => {
  const isSaved = saveStatus === "saved";
  const saveLabel =
    saveStatus === "saving"
      ? "Saving…"
      : isSaved
        ? "Saved ✓"
        : saveDisabled
          ? "Up to date"
          : "Save";

  const isDisabled = saveDisabled && !isSaved;

  return (
    <div className="px-5 flex items-center justify-between shrink-0 min-h-14 bg-(--bg-sidebar)">
      {/* Left: optional Back button + file path */}
      <div className="flex items-center gap-0 min-w-0">
        {onBack && (
          <>
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1.5 text-[14px] text-(--text-secondary) hover:text-(--text-primary) bg-transparent border-none cursor-pointer transition-colors duration-150 p-0 pr-3 shrink-0"
            >
              <BackArrowIcon /> Back
            </button>
            <span className="w-px h-4 bg-(--border-subtle) mx-3 shrink-0" />
          </>
        )}
        <span className='font-["Fira_Code",monospace] text-[12px] text-(--text-secondary) truncate'>
          {filePath}
        </span>
      </div>

      {/* Right: view toggle + preview toggle + save */}
      <div className="flex items-center gap-3 shrink-0 ml-3">
        {type === "agent" && showViewToggle && (
          <ViewModeToggle viewMode={viewMode} onToggle={onViewModeToggle} />
        )}
        {onTogglePreview && (
          <div className="flex items-center bg-(--bg-surface) border border-(--border-subtle) rounded-md p-0.5">
            <button
              type="button"
              onClick={() => previewMode && onTogglePreview()}
              className={[
                "text-[13px] px-2.5 py-0.5 rounded cursor-pointer border-none transition-colors duration-150",
                !previewMode
                  ? "bg-(--bg-elevated) text-(--text-primary)"
                  : "bg-transparent text-(--text-muted) hover:text-(--text-secondary)",
              ].join(" ")}
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => !previewMode && onTogglePreview()}
              className={[
                "text-[13px] px-2.5 py-0.5 rounded cursor-pointer border-none transition-colors duration-150",
                previewMode
                  ? "bg-(--bg-elevated) text-(--text-primary)"
                  : "bg-transparent text-(--text-muted) hover:text-(--text-secondary)",
              ].join(" ")}
            >
              Preview
            </button>
          </div>
        )}
        <button
          onClick={isDisabled ? undefined : onSave}
          disabled={isDisabled}
          aria-label="Save file"
          className={[
            "text-[13px] px-3 py-1 rounded-md border-none transition-colors duration-150",
            isDisabled
              ? "bg-(--bg-surface) text-(--text-muted) opacity-50 cursor-not-allowed"
              : "text-(--accent) font-semibold cursor-pointer hover:bg-(--accent)/8 bg-transparent",
          ].join(" ")}
        >
          {saveLabel}
        </button>
      </div>
    </div>
  );
};

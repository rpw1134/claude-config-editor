import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { BackArrowIcon } from "../Icons";
import { Editor } from "./Editor";
import { VCHistoryTab } from "../VersionControl/VCHistoryTab";

type Tab = "edit" | "history";
type SaveStatus = "idle" | "saving" | "saved" | "error";

interface ClaudeMdEditorProps {
  content: string;
  onChange: (content: string) => void;
  onSave: () => void;
  saveStatus: SaveStatus;
  saveDisabled: boolean;
  onBack?: () => void;
  filePath?: string;
  projectPath?: string;
}

export const ClaudeMdEditor = ({
  content,
  onChange,
  onSave,
  saveStatus,
  saveDisabled,
  onBack,
  filePath,
  projectPath,
}: ClaudeMdEditorProps) => {
  const [activeTab, setActiveTab] = useState<Tab>("edit");
  const [previewMode, setPreviewMode] = useState(false);

  const tabs: { id: Tab; label: string }[] = [
    { id: "edit", label: "Edit" },
    { id: "history", label: "History" },
  ];

  const isSaved = saveStatus === "saved";
  const isDisabled = saveDisabled && !isSaved;
  const saveLabel =
    saveStatus === "saving"
      ? "Saving…"
      : isSaved
        ? "Saved ✓"
        : saveDisabled
          ? "Up to date"
          : "Save";

  return (
    <div className="h-full flex flex-col bg-(--bg-base)">
      {/* Tab bar + actions — mirrors AgentFormEditor header */}
      <div className="shrink-0 flex items-stretch justify-between px-4">
        {/* Left: Back + tabs */}
        <div className="flex items-stretch gap-1">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1.5 pt-6 pb-5 text-[14px] text-(--text-secondary) hover:text-(--text-primary) bg-transparent border-none cursor-pointer transition-colors duration-150 pr-3 mr-2"
            >
              <BackArrowIcon /> Back
            </button>
          )}
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={[
                "pt-6 pb-5 px-3 bg-transparent border-none cursor-pointer transition-colors duration-150 relative",
                activeTab === id
                  ? "text-[15px] font-semibold text-(--text-primary) after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-(--accent)"
                  : "text-[14px] font-medium text-(--text-secondary) hover:text-(--text-primary)",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Right: file path + Save */}
        <div className="flex items-center gap-3">
          {filePath && (
            <span className='font-["Fira_Code",monospace] text-[11px] text-(--text-muted) truncate max-w-48 hidden sm:block'>
              {filePath}
            </span>
          )}
          <button
            onClick={isDisabled ? undefined : onSave}
            disabled={isDisabled}
            className={[
              "text-[13px] font-medium px-3 py-1 rounded-lg border-none transition-colors duration-150",
              isDisabled
                ? "bg-(--bg-surface) text-(--text-muted) opacity-50 cursor-not-allowed"
                : "text-(--accent) font-semibold cursor-pointer hover:bg-(--accent)/8 bg-transparent",
            ].join(" ")}
          >
            {saveLabel}
          </button>
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0">
        {activeTab === "edit" && (
          <div className="flex flex-col h-full min-h-0">
            {/* Inner header — matches PromptTab exactly */}
            <div className="px-7 pt-8 pb-4 shrink-0 flex items-start justify-between">
              <div>
                <h2 className="m-0 mb-1 text-2xl font-['Bricolage_Grotesque',sans-serif] font-bold tracking-[-0.015em] text-(--text-primary)">
                  CLAUDE.md
                </h2>
                <p className="m-0 text-[13px] text-(--text-secondary)">
                  Project-level instructions and context for Claude Code.
                </p>
              </div>
              <div className="flex items-center bg-(--bg-surface) border border-(--border-subtle) rounded-md p-0.5 shrink-0 mt-1">
                <button
                  type="button"
                  onClick={() => setPreviewMode(false)}
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
                  onClick={() => setPreviewMode(true)}
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
            </div>

            {previewMode ? (
              <div className="flex-1 min-h-0 overflow-y-auto px-7 py-6 prose prose-invert prose-sm max-w-none">
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            ) : (
              <div className="flex-1 min-h-0">
                <Editor
                  value={content}
                  onChange={(val) => onChange(val ?? "")}
                  language="markdown"
                />
              </div>
            )}
          </div>
        )}

        {activeTab === "history" && projectPath && (
          <div className="h-full overflow-y-auto">
            <VCHistoryTab
              projectPath={projectPath}
              filePath="CLAUDE.md"
              onRestored={onChange}
            />
          </div>
        )}
      </div>
    </div>
  );
};

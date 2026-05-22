import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Editor } from "../Editor";

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface TabConfig {
  label: string;
  active: boolean;
  onClick: () => void;
}

interface MarkdownEditorViewProps {
  title: string;
  description: string;
  resolvedFilePath: string;
  content: string;
  onChange: (val: string) => void;
  saveStatus: SaveStatus;
  saveDisabled: boolean;
  onSave: () => void;
  tabs?: TabConfig[];
}

export const MarkdownEditorView = ({
  title,
  description,
  resolvedFilePath: _resolvedFilePath,
  content,
  onChange,
  saveStatus,
  saveDisabled,
  onSave,
  tabs,
}: MarkdownEditorViewProps) => {
  const [previewMode, setPreviewMode] = useState(false);

  const saveLabel =
    saveStatus === "saving"
      ? "Saving…"
      : saveStatus === "saved"
        ? "Saved ✓"
        : "Save";

  const showSaveButton = !saveDisabled || saveStatus === "saved";

  return (
    <div className="flex flex-col h-full bg-(--bg-base)">
      {/* Page header — matches LandingPage / HooksLanding pattern */}
      <div className="shrink-0 w-full px-14 pt-16 pb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-['Bricolage_Grotesque',sans-serif] text-[40px] font-bold text-(--text-primary) tracking-[-0.03em] leading-[1.05] m-0">
            {title}
          </h1>

          <div className="flex items-center gap-3 shrink-0">
            {/* Edit / Preview toggle — pill style */}
            <div className="flex items-center bg-(--bg-surface) border border-(--border-subtle) rounded-md p-0.5">
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

            {/* Save button — only when there are unsaved changes */}
            {showSaveButton && (
              <button
                type="button"
                onClick={saveDisabled ? undefined : onSave}
                disabled={saveDisabled}
                className={[
                  "flex items-center gap-1.75 px-4 py-2 rounded-lg border-none text-[14px] font-semibold transition-all duration-150",
                  saveStatus === "saved"
                    ? "bg-white/70 text-gray-900 cursor-default"
                    : saveDisabled
                      ? "bg-white/40 text-gray-900/50 cursor-not-allowed"
                      : "bg-white text-gray-900 cursor-pointer hover:bg-white/90",
                ].join(" ")}
              >
                {saveLabel}
              </button>
            )}
          </div>
        </div>

        {/* Optional description */}
        {description && (
          <p className="m-0 mt-1 text-[13px] text-(--text-secondary)">
            {description}
          </p>
        )}

        {/* Optional underline tabs (e.g. Edit | History for project CLAUDE.md) */}
        {tabs && tabs.length > 0 && (
          <div className="flex items-stretch mt-6 border-b border-(--border-faint) -mx-14 px-14">
            {tabs.map((tab) => (
              <button
                key={tab.label}
                type="button"
                onClick={tab.onClick}
                className={[
                  "pt-3 pb-3 px-3 bg-transparent border-none relative transition-colors duration-150 capitalize",
                  tab.active
                    ? "cursor-default text-[14px] font-semibold text-(--text-primary) after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-(--accent)"
                    : "cursor-pointer text-[14px] text-(--text-secondary) hover:text-(--text-primary)",
                ].join(" ")}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Editor or preview */}
      {previewMode ? (
        <div className="flex-1 min-h-0 overflow-y-auto px-14 py-6 prose prose-invert prose-sm max-w-none">
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
  );
};

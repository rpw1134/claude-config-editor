import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Editor } from "../Editor";
import { BackArrowIcon } from "./BackArrowIcon";

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface MarkdownEditorViewProps {
  title: string;
  description: string;
  resolvedFilePath: string;
  content: string;
  onChange: (val: string) => void;
  saveStatus: SaveStatus;
  saveDisabled: boolean;
  onSave: () => void;
  onBack: () => void;
}

export const MarkdownEditorView = ({
  title,
  description,
  resolvedFilePath,
  content,
  onChange,
  saveStatus,
  saveDisabled,
  onSave,
  onBack,
}: MarkdownEditorViewProps) => {
  const [previewMode, setPreviewMode] = useState(false);
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
    <div className="flex flex-col h-full bg-(--bg-base)">
      {/* Thin top bar */}
      <div className="px-5 border-b border-(--border-faint) flex items-center justify-between shrink-0 min-h-14 bg-(--bg-sidebar)">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-[14px] text-(--text-secondary) hover:text-(--text-primary) bg-transparent border-none cursor-pointer transition-colors duration-150 p-0"
        >
          <BackArrowIcon /> Back
        </button>
        <div className="flex items-center gap-3">
          <span className='font-["Fira_Code",monospace] text-[11px] text-(--text-secondary) truncate max-w-64 hidden sm:block'>
            {resolvedFilePath}
          </span>
          <button
            onClick={isDisabled ? undefined : onSave}
            disabled={isDisabled}
            className={[
              "text-[13px] px-3 py-1 rounded-md border-none transition-colors duration-150",
              isDisabled
                ? "bg-(--bg-surface) text-(--text-muted) opacity-50 cursor-not-allowed"
                : "bg-(--accent) cursor-pointer text-white hover:bg-(--accent-hover)",
            ].join(" ")}
          >
            {saveLabel}
          </button>
        </div>
      </div>

      {/* Rich content header */}
      <div className="px-7 pt-8 pb-4 shrink-0 flex items-start justify-between">
        <div>
          <h2 className="m-0 mb-1 text-2xl font-['Bricolage_Grotesque',sans-serif] font-bold tracking-[-0.015em] text-(--text-primary)">
            {title}
          </h2>
          <p className="m-0 text-[13px] text-(--text-secondary)">
            {description}
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

      {/* Editor or preview */}
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
  );
};

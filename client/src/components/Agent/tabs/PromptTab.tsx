import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Editor } from "../../Editor/Editor";

interface PromptTabProps {
  body: string;
  onBodyChange: (val: string) => void;
  disabled?: boolean;
}

export const PromptTab = ({ body, onBodyChange, disabled }: PromptTabProps) => {
  const [previewMode, setPreviewMode] = useState(false);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-7 pt-8 pb-4 shrink-0 flex items-start justify-between">
        <div>
          <h2 className="m-0 mb-1 text-2xl font-['Bricolage_Grotesque',sans-serif] font-bold tracking-[-0.015em] text-(--text-primary)">
            System Prompt
          </h2>
          <p className="m-0 text-[13px] text-(--text-secondary)">
            Markdown supported. Defines how this agent thinks and behaves.
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
          <ReactMarkdown>{body}</ReactMarkdown>
        </div>
      ) : (
        <div className="flex-1 min-h-0">
          <Editor
            value={body}
            onChange={onBodyChange}
            language="markdown"
            readOnly={disabled}
          />
        </div>
      )}
    </div>
  );
};

import ReactMarkdown from "react-markdown";
import { Editor } from "../../Editor/Editor";

interface InstructionsTabProps {
  body: string;
  onBodyChange: (val: string) => void;
  previewMode: boolean;
  disabled?: boolean;
}

export const InstructionsTab = ({
  body,
  onBodyChange,
  previewMode,
  disabled,
}: InstructionsTabProps) => (
  <div className="flex flex-col h-full min-h-0">
    <div className="px-7 pt-8 pb-4 shrink-0">
      <div>
        <h2 className="m-0 mb-1 text-2xl font-['Bricolage_Grotesque',sans-serif] font-bold tracking-[-0.015em] text-(--text-primary)">
          Instructions
        </h2>
        <p className="m-0 text-[13px] text-(--text-secondary)">
          Markdown body sent to Claude when this skill is invoked.
        </p>
      </div>
    </div>

    <div className="mx-7 mb-4 px-4 py-3 rounded-xl bg-(--bg-surface) border border-(--border-subtle) text-[12px] text-(--text-secondary) leading-relaxed shrink-0">
      Use{" "}
      <code className='font-["Fira_Code",monospace] text-[11px] bg-white/6 px-1.5 py-0.5 rounded text-(--text-primary)'>
        $ARGUMENTS
      </code>{" "}
      in the body to reference user-provided arguments. The skill body is sent
      to Claude as context when invoked.
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

import { Editor } from "../Editor/Editor";

// ── Language detection ────────────────────────────────────────────────────────

const EXT_TO_MONACO: Record<string, string> = {
  sh: "shell",
  py: "python",
  js: "javascript",
  ts: "typescript",
};

const EXT_TO_BADGE: Record<string, string> = {
  sh: "BASH",
  py: "PYTHON",
  js: "JAVASCRIPT",
  ts: "TYPESCRIPT",
};

function detectLanguage(file: string): string {
  const ext = file.split(".").pop()?.toLowerCase() ?? "";
  return EXT_TO_MONACO[ext] ?? "plaintext";
}

function detectBadge(file: string): string {
  const ext = file.split(".").pop()?.toLowerCase() ?? "";
  return EXT_TO_BADGE[ext] ?? "PLAIN";
}

// ── ScriptFileEditor ──────────────────────────────────────────────────────────

export interface ScriptFileEditorProps {
  file: string;
  content: string;
  onChange: (next: string) => void;
}

export const ScriptFileEditor = ({
  file,
  content,
  onChange,
}: ScriptFileEditorProps) => {
  const language = detectLanguage(file);
  const badge = detectBadge(file);

  return (
    <div className="flex flex-1 flex-col min-h-0 overflow-hidden relative">
      {/* Language badge */}
      <div className="absolute top-3 right-4 z-10 pointer-events-none">
        <span className='font-["Fira_Code",monospace] text-[10px] uppercase tracking-wider text-(--text-muted) bg-(--bg-elevated) px-2 py-0.5 rounded border border-(--border-faint)'>
          {badge}
        </span>
      </div>

      {/* Monaco editor */}
      <div className="flex-1 min-h-0">
        <Editor value={content} onChange={onChange} language={language} />
      </div>
    </div>
  );
};

import ReactMarkdown from "react-markdown";
import { Editor } from "../Editor/Editor";

const DocumentIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
    <path
      d="M3 2.5C3 1.67 3.67 1 4.5 1H9.09l3.41 3.41V12.5c0 .83-.67 1.5-1.5 1.5h-7C3.67 14 3 13.33 3 12.5v-10Z"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinejoin="round"
    />
    <path
      d="M9 1v3.5H12.5"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M5.5 7.5h4M5.5 10h4"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
    />
  </svg>
);

const ExamplesIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
    <path
      d="M2 3.5C2 2.67 2.67 2 3.5 2H11.5C12.33 2 13 2.67 13 3.5V11.5C13 12.33 12.33 13 11.5 13H3.5C2.67 13 2 12.33 2 11.5V3.5Z"
      stroke="currentColor"
      strokeWidth="1.25"
    />
    <path
      d="M5 5.5L6.5 7L9.5 4"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M5 9h5"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
    />
  </svg>
);

// ── File description banner ────────────────────────────────────────────────────

const FILE_META: Record<
  string,
  { icon: React.ReactNode; title: string; subtitle: string }
> = {
  "reference.md": {
    icon: <DocumentIcon />,
    title: "References",
    subtitle:
      "Optional. Background knowledge Claude consults during skill execution.",
  },
  "examples.md": {
    icon: <ExamplesIcon />,
    title: "Examples",
    subtitle:
      "Optional. Sample inputs and outputs that shape Claude's behavior.",
  },
};

// ── Helper ─────────────────────────────────────────────────────────────────────

function shortenHome(p: string): string {
  return p.replace(/^(\/Users\/[^/]+|\/home\/[^/]+)/, "~");
}

export function resolvedFilePath(
  projectPath: string,
  skillName: string,
  file: string,
): string {
  const isGlobal = projectPath?.endsWith("/.claude") ?? true;
  const configDir = isGlobal
    ? "~/.claude"
    : shortenHome(projectPath) + "/.claude";
  return `${configDir}/skills/${skillName}/${file}`;
}

// ── PlainFileEditor ────────────────────────────────────────────────────────────

export interface PlainFileEditorProps {
  file: string;
  skillName: string;
  projectPath: string;
  content: string;
  onChange: (val: string) => void;
  previewMode: boolean;
  onSetPreviewMode?: (val: boolean) => void;
}

export const PlainFileEditor = ({
  file,
  content,
  onChange,
  previewMode,
  onSetPreviewMode,
}: PlainFileEditorProps) => {
  return (
    <div className="flex flex-1 flex-col min-h-0">
      <div className="px-7 pt-8 pb-4 shrink-0 flex items-start justify-between gap-4">
        <div>
          <h2 className="m-0 mb-1 text-2xl font-['Bricolage_Grotesque',sans-serif] font-bold tracking-[-0.015em] text-(--text-primary)">
            {(FILE_META[file] ?? FILE_META["reference.md"]).title}
          </h2>
          <p className="m-0 text-[13px] text-(--text-secondary)">
            {(FILE_META[file] ?? FILE_META["reference.md"]).subtitle}
          </p>
        </div>
        {onSetPreviewMode && (
          <div className="flex items-center bg-(--bg-surface) border border-(--border-subtle) rounded-md p-0.5 shrink-0">
            <button
              type="button"
              onClick={() => onSetPreviewMode(false)}
              className={[
                "text-[13px] px-2.5 py-0.5 rounded cursor-pointer border-none transition-colors duration-150",
                !previewMode ? "bg-(--bg-elevated) text-(--text-primary)" : "bg-transparent text-(--text-muted) hover:text-(--text-secondary)",
              ].join(" ")}
            >Edit</button>
            <button
              type="button"
              onClick={() => onSetPreviewMode(true)}
              className={[
                "text-[13px] px-2.5 py-0.5 rounded cursor-pointer border-none transition-colors duration-150",
                previewMode ? "bg-(--bg-elevated) text-(--text-primary)" : "bg-transparent text-(--text-muted) hover:text-(--text-secondary)",
              ].join(" ")}
            >Preview</button>
          </div>
        )}
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
  );
};

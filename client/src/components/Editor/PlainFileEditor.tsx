import ReactMarkdown from 'react-markdown';
import { Editor } from './Editor';

const DocumentIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
    <path
      d="M3 2.5C3 1.67 3.67 1 4.5 1H9.09l3.41 3.41V12.5c0 .83-.67 1.5-1.5 1.5h-7C3.67 14 3 13.33 3 12.5v-10Z"
      stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"
    />
    <path d="M9 1v3.5H12.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5.5 7.5h4M5.5 10h4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
  </svg>
);

const ExamplesIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
    <path
      d="M2 3.5C2 2.67 2.67 2 3.5 2H11.5C12.33 2 13 2.67 13 3.5V11.5C13 12.33 12.33 13 11.5 13H3.5C2.67 13 2 12.33 2 11.5V3.5Z"
      stroke="currentColor" strokeWidth="1.25"
    />
    <path d="M5 5.5L6.5 7L9.5 4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5 9h5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
  </svg>
);

// ── File description banner ────────────────────────────────────────────────────

interface FileBannerProps {
  file: string;
  inline?: boolean;
}

const FILE_META: Record<string, { icon: React.ReactNode; title: string; subtitle: string }> = {
  'reference.md': {
    icon: <DocumentIcon />,
    title: 'Reference material',
    subtitle: 'Optional. Background knowledge Claude consults during skill execution.',
  },
  'examples.md': {
    icon: <ExamplesIcon />,
    title: 'Examples',
    subtitle: 'Optional. Sample inputs and outputs that shape Claude\'s behavior.',
  },
};

const FileBanner = ({ file, inline }: FileBannerProps) => {
  const meta = FILE_META[file] ?? {
    icon: <DocumentIcon />,
    title: 'Supporting file',
    subtitle: 'Optional supplementary content for this skill.',
  };

  if (inline) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-(--text-muted) shrink-0">{meta.icon}</span>
        <span className="text-(--text-secondary) text-[13px] font-medium shrink-0">{meta.title}</span>
        <span className="text-(--text-muted) text-[12px] truncate hidden sm:block">{meta.subtitle}</span>
      </div>
    );
  }

  return (
    <div className="bg-(--bg-surface) border-b border-(--border-faint) px-7 py-3 flex items-center gap-3 shrink-0">
      <span className="text-(--text-muted) shrink-0">{meta.icon}</span>
      <div className="flex items-baseline gap-2 min-w-0">
        <span className="text-(--text-primary) text-[13px] font-medium shrink-0">{meta.title}</span>
        <span className="text-(--text-secondary) text-[12px] truncate">{meta.subtitle}</span>
      </div>
    </div>
  );
};

// ── Helper ─────────────────────────────────────────────────────────────────────

function shortenHome(p: string): string {
  return p.replace(/^(\/Users\/[^/]+|\/home\/[^/]+)/, '~');
}

export function resolvedFilePath(projectPath: string, skillName: string, file: string): string {
  const isGlobal = projectPath?.endsWith('/.claude') ?? true;
  const configDir = isGlobal ? '~/.claude' : shortenHome(projectPath) + '/.claude';
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
}

export const PlainFileEditor = ({
  file,
  content,
  onChange,
  previewMode,
}: PlainFileEditorProps) => {
  return (
    <div className="flex flex-1 flex-col min-h-0">
      <div className="px-7 pt-6 pb-3">
        <FileBanner file={file} />
      </div>

      {previewMode ? (
        <div className="flex-1 min-h-0 overflow-y-auto px-7 py-6 prose prose-invert prose-sm max-w-none">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      ) : (
        <div className="flex-1 min-h-0">
          <Editor value={content} onChange={(val) => onChange(val ?? '')} language="markdown" />
        </div>
      )}
    </div>
  );
};

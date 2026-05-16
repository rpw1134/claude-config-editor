import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Editor } from './Editor';

// ── Icons ─────────────────────────────────────────────────────────────────────

const BackArrowIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M8.5 2.5L4 7L8.5 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

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

const FileBanner = ({ file }: FileBannerProps) => {
  const meta = FILE_META[file] ?? {
    icon: <DocumentIcon />,
    title: 'Supporting file',
    subtitle: 'Optional supplementary content for this skill.',
  };

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

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface PlainFileEditorProps {
  file: string;
  skillName: string;
  projectPath: string;
  content: string;
  onChange: (val: string) => void;
  saveStatus: SaveStatus;
  saveDisabled: boolean;
  onSave: () => void;
  onBack: () => void;
}

export const PlainFileEditor = ({
  file,
  skillName,
  projectPath,
  content,
  onChange,
  saveStatus,
  saveDisabled,
  onSave,
  onBack,
}: PlainFileEditorProps) => {
  const [previewMode, setPreviewMode] = useState(false);
  const isSaved = saveStatus === 'saved';
  const isDisabled = saveDisabled && !isSaved;
  const saveLabel =
    saveStatus === 'saving' ? 'Saving…' : isSaved ? 'Saved ✓' : saveDisabled ? 'Up to date' : 'Save';

  return (
    <div className="flex flex-1 flex-col h-full w-full bg-(--bg-base) border-l border-(--border-faint)">
      {/* Action bar */}
      <div className="px-5 border-b border-(--border-faint) flex items-center justify-between shrink-0 min-h-12 bg-(--bg-sidebar)">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-[13px] text-(--text-muted) hover:text-(--text-primary) bg-transparent border-none cursor-pointer transition-colors duration-150 p-0"
        >
          <BackArrowIcon /> Back
        </button>
        <div className="flex items-center gap-3">
          <span className='font-["Fira_Code",monospace] text-[11px] text-(--text-muted) truncate max-w-64 hidden sm:block'>
            {resolvedFilePath(projectPath, skillName, file)}
          </span>
          <button
            onClick={isDisabled ? undefined : onSave}
            disabled={isDisabled}
            className={[
              'text-[13px] px-3 py-1 rounded-md border-none transition-colors duration-150',
              isDisabled
                ? 'bg-(--bg-surface) text-(--text-muted) opacity-50 cursor-not-allowed'
                : 'bg-(--accent) cursor-pointer text-white hover:bg-(--accent-hover)',
            ].join(' ')}
          >
            {saveLabel}
          </button>
        </div>
      </div>

      {/* Description banner */}
      <FileBanner file={file} />

      {/* Title + Edit/Preview toggle */}
      <div className="px-7 pt-7 pb-4 shrink-0 flex items-start justify-between">
        <div>
          <h2 className="m-0 mb-1 text-2xl font-['Bricolage_Grotesque',sans-serif] font-bold tracking-[-0.015em] text-(--text-primary)">
            {file}
          </h2>
          <p className="m-0 text-[13px] text-(--text-muted)">
            Supporting file in <span className='font-["Fira_Code",monospace]'>{skillName}/</span>
          </p>
        </div>
        <div className="flex items-center bg-(--bg-surface) border border-(--border-subtle) rounded-md p-0.5 shrink-0 mt-1">
          <button
            type="button"
            onClick={() => setPreviewMode(false)}
            className={[
              'text-[13px] px-2.5 py-0.5 rounded cursor-pointer border-none transition-colors duration-150',
              !previewMode
                ? 'bg-(--bg-elevated) text-(--text-primary)'
                : 'bg-transparent text-(--text-muted) hover:text-(--text-secondary)',
            ].join(' ')}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => setPreviewMode(true)}
            className={[
              'text-[13px] px-2.5 py-0.5 rounded cursor-pointer border-none transition-colors duration-150',
              previewMode
                ? 'bg-(--bg-elevated) text-(--text-primary)'
                : 'bg-transparent text-(--text-muted) hover:text-(--text-secondary)',
            ].join(' ')}
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
          <Editor value={content} onChange={(val) => onChange(val ?? '')} language="markdown" />
        </div>
      )}
    </div>
  );
};

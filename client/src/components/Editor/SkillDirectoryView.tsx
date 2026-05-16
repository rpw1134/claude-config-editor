import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  fetchSkillContent,
  fetchSkillFiles,
  fetchSkillFile,
  updateSkillContent,
  updateSkillFile,
  createSkillFile,
  deleteSkillFile,
  deleteSkill,
} from '../../lib/api';
import { parseSkillFrontmatter, serializeSkillFrontmatter } from '../../lib/frontmatter';
import { SkillFormEditor } from './SkillFormEditor';
import { Editor } from './Editor';

// ── Icons ─────────────────────────────────────────────────────────────────────

const BackArrowIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M8.5 2.5L4 7L8.5 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const FolderIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path
      d="M2 5.5C2 4.67 2.67 4 3.5 4H7.09l1.5 1.5H14.5C15.33 5.5 16 6.17 16 7V13.5C16 14.33 15.33 15 14.5 15H3.5C2.67 15 2 14.33 2 13.5V5.5Z"
      stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"
    />
  </svg>
);


const XIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M2 2L10 10M10 2L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M6 1V11M1 6H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

// ── Static file manifest ───────────────────────────────────────────────────────

const OPTIONAL_FILES = ['reference.md', 'examples.md'] as const;

// ── Helper ─────────────────────────────────────────────────────────────────────

function shortenHome(p: string): string {
  return p.replace(/^(\/Users\/[^/]+|\/home\/[^/]+)/, '~');
}

function resolvedFilePath(projectPath: string, skillName: string, file: string): string {
  const isGlobal = projectPath?.endsWith('/.claude') ?? true;
  const configDir = isGlobal ? '~/.claude' : shortenHome(projectPath) + '/.claude';
  return `${configDir}/skills/${skillName}/${file}`;
}

// ── SkillDirectoryView ─────────────────────────────────────────────────────────

export interface SkillDirectoryViewProps {
  skillName: string;
  projectPath: string;
  onBack: () => void;
  onDeleted: () => void;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
type DeleteStatus = 'idle' | 'confirm' | 'deleting' | 'error';

export const SkillDirectoryView = ({
  skillName,
  projectPath,
  onBack,
  onDeleted,
}: SkillDirectoryViewProps) => {
  // Which files actually exist on disk (fetched once on mount)
  const [existingFiles, setExistingFiles] = useState<Set<string>>(new Set(['SKILL.md']));

  // File editor state
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState('');
  const [savedContent, setSavedContent] = useState('');
  const [contentLoading, setContentLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [deleteStatus, setDeleteStatus] = useState<DeleteStatus>('idle');

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deleteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dirty = selectedFile !== null && !contentLoading && fileContent !== savedContent;

  // Fetch which files exist — used only for create-on-click logic, not for display
  useEffect(() => {
    fetchSkillFiles(projectPath, skillName)
      .then((files) => setExistingFiles(new Set(['SKILL.md', ...files])))
      .catch(() => {/* existingFiles stays as {SKILL.md} */});
  }, [projectPath, skillName]);

  const handleSave = async () => {
    if (!selectedFile || !dirty || saveStatus === 'saving') return;
    setSaveStatus('saving');
    try {
      if (selectedFile === 'SKILL.md') {
        await updateSkillContent(projectPath, skillName, fileContent);
      } else {
        await updateSkillFile(projectPath, skillName, selectedFile, fileContent);
      }
      setSavedContent(fileContent);
      setSaveStatus('saved');
      saveTimer.current = setTimeout(() => setSaveStatus('idle'), 1500);
    } catch {
      setSaveStatus('error');
      saveTimer.current = setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  // Load file content when selectedFile changes
  useEffect(() => {
    if (selectedFile === null) return;
    const loadFile = async () => {
      setContentLoading(true);
      setFileContent('');
      setSavedContent('');
      setSaveStatus('idle');
      try {
        const c = selectedFile === 'SKILL.md'
          ? await fetchSkillContent(projectPath, skillName)
          : await fetchSkillFile(projectPath, skillName, selectedFile);
        if (selectedFile === 'SKILL.md') {
          const { frontmatter, body } = parseSkillFrontmatter(c);
          if (!frontmatter.name) {
            const filled = serializeSkillFrontmatter({ ...frontmatter, name: skillName }, body);
            setFileContent(filled);
            setSavedContent(c);
            return;
          }
        }
        setFileContent(c);
        setSavedContent(c);
      } catch {
        setFileContent('');
        setSavedContent('');
      } finally {
        setContentLoading(false);
      }
    };
    loadFile();
  }, [selectedFile, projectPath, skillName]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (dirty) handleSave();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  });

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      if (deleteTimer.current) clearTimeout(deleteTimer.current);
    };
  }, []);

  // Open a file — create it first if it doesn't exist yet
  const handleOpenFile = async (file: string) => {
    if (!existingFiles.has(file)) {
      try {
        await createSkillFile(projectPath, skillName, file);
        setExistingFiles((prev) => new Set([...prev, file]));
      } catch {
        // File may have been created externally — proceed anyway
      }
    }
    setSelectedFile(file);
  };

  const handleDeleteSkill = async () => {
    if (deleteStatus === 'deleting') return;
    if (deleteStatus !== 'confirm') {
      setDeleteStatus('confirm');
      deleteTimer.current = setTimeout(() => setDeleteStatus('idle'), 3000);
      return;
    }
    if (deleteTimer.current) clearTimeout(deleteTimer.current);
    setDeleteStatus('deleting');
    try {
      await deleteSkill(projectPath, skillName);
      onDeleted();
    } catch {
      setDeleteStatus('error');
      deleteTimer.current = setTimeout(() => setDeleteStatus('idle'), 2000);
    }
  };

  const handleDeleteExtraFile = async (file: string) => {
    try {
      await deleteSkillFile(projectPath, skillName, file);
      setExistingFiles((prev) => { const next = new Set(prev); next.delete(file); return next; });
      if (selectedFile === file) setSelectedFile(null);
    } catch {/* silently fail */}
  };

  // ── File editor views ──────────────────────────────────────────────────────

  if (selectedFile !== null) {
    if (contentLoading) {
      return <div className="flex flex-1 flex-col h-full w-full bg-(--bg-base) border-l border-(--border-faint)" />;
    }

    if (selectedFile === 'SKILL.md') {
      return (
        <div className="flex flex-1 flex-col h-full w-full bg-(--bg-base) border-l border-(--border-faint)">
          <SkillFormEditor
            content={fileContent}
            onChange={setFileContent}
            onDelete={handleDeleteSkill}
            deleteStatus={deleteStatus}
            onSave={handleSave}
            saveStatus={saveStatus}
            saveDisabled={!dirty || saveStatus === 'saving'}
            disabled={saveStatus === 'saving'}
            onBack={() => setSelectedFile(null)}
            filePath={resolvedFilePath(projectPath, skillName, 'SKILL.md')}
          />
        </div>
      );
    }

    return (
      <PlainFileEditor
        file={selectedFile}
        skillName={skillName}
        projectPath={projectPath}
        content={fileContent}
        onChange={setFileContent}
        saveStatus={saveStatus}
        saveDisabled={!dirty || saveStatus === 'saving'}
        onSave={handleSave}
        onBack={() => setSelectedFile(null)}
      />
    );
  }

  // ── Directory view ─────────────────────────────────────────────────────────

  return (
    <div className="flex flex-1 flex-col h-full w-full bg-(--bg-base) border-l border-(--border-faint)">
      {/* Top bar */}
      <div className="px-5 border-b border-(--border-faint) flex items-center justify-between shrink-0 min-h-12 bg-(--bg-sidebar)">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-[13px] text-(--text-muted) hover:text-(--text-primary) bg-transparent border-none cursor-pointer transition-colors duration-150 p-0"
        >
          <BackArrowIcon /> Back
        </button>
        <span className='font-["Fira_Code",monospace] text-[12px] text-(--text-muted)'>
          {skillName}/
        </span>
        <div className="w-20" />
      </div>

      {/* Centered card */}
      <div className="flex-1 overflow-y-auto flex items-center justify-center p-16">
        <div className="w-full max-w-xl bg-(--bg-surface) border border-(--border-subtle) rounded-2xl shadow-2xl shadow-black/40">
          {/* Card header */}
          <div className="px-8 pt-7 pb-5 border-b border-(--border-faint) flex items-center gap-3">
            <span className="text-(--text-muted)"><FolderIcon /></span>
            <span className='font-["Bricolage_Grotesque",sans-serif] font-bold text-[22px] tracking-tight text-(--text-primary)'>
              {skillName}
            </span>
            <span className='font-["Fira_Code",monospace] text-[15px] text-(--text-muted)'>/</span>
          </div>

          {/* Tree rows */}
          <div className="px-2 py-3">
            <FileRow
              file="SKILL.md"
              connector="├"
              onClick={() => handleOpenFile('SKILL.md')}
            />

            {OPTIONAL_FILES.map((file) => (
              <FileRow
                key={file}
                file={file}
                connector="├"
                onClick={() => handleOpenFile(file)}
                onDelete={existingFiles.has(file) ? () => handleDeleteExtraFile(file) : undefined}
              />
            ))}

            <ScriptsRow />
          </div>
        </div>
      </div>
    </div>
  );
};

// ── FileRow ────────────────────────────────────────────────────────────────────

interface FileRowProps {
  file: string;
  connector: '├' | '└';
  onClick: () => void;
  onDelete?: () => void;
}

const FileRow = ({ file, connector, onClick, onDelete }: FileRowProps) => (
  <button
    type="button"
    onClick={onClick}
    className='group relative w-full flex items-center gap-0 px-6 py-2.5 rounded-lg bg-transparent border-none cursor-pointer hover:bg-(--bg-hover) transition-colors duration-100 text-left'
  >
    <span className='font-["Fira_Code",monospace] text-[15px] text-(--text-muted) select-none shrink-0 pr-2'>
      {connector}──
    </span>
    <span className='font-["Fira_Code",monospace] text-[15px] text-(--text-primary) flex-1 min-w-0 group-hover:text-white transition-colors duration-100'>
      {file}
    </span>
    {onDelete && (
      <span
        className="opacity-0 group-hover:opacity-100 text-(--text-muted) hover:text-red-400 p-1 transition-all duration-100 shrink-0"
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        role="button"
        aria-label={`Delete ${file}`}
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); onDelete(); } }}
      >
        <XIcon />
      </span>
    )}
  </button>
);

// ── ScriptsRow ─────────────────────────────────────────────────────────────────

const ScriptsRow = () => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="pb-1">
      {/* scripts/ folder line */}
      <div className="w-full flex items-center gap-0 px-6 py-2.5">
        <span className='font-["Fira_Code",monospace] text-[15px] text-(--text-muted) select-none shrink-0 pr-2'>
          └──
        </span>
        <span className='font-["Fira_Code",monospace] text-[15px] text-(--text-primary)'>
          scripts/
        </span>
      </div>

      {/* Child line: indented green + button */}
      <div className="w-full flex items-center gap-0 px-6 py-1.5">
        <span className='font-["Fira_Code",monospace] text-[15px] text-(--text-muted) select-none shrink-0' style={{ paddingRight: '0.5rem', paddingLeft: '2.1ch' }}>
          └──
        </span>
        <div className="relative">
          <button
            type="button"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            aria-label="Add script"
            className="flex items-center justify-center w-6 h-6 rounded-md border-none cursor-pointer transition-colors duration-150 bg-(--accent) text-white hover:bg-(--accent-hover)"
          >
            <PlusIcon />
          </button>
          {showTooltip && (
            <div className="absolute left-0 bottom-full mb-2 w-44 px-3 py-2 rounded-lg bg-(--bg-elevated) border border-(--border-subtle) text-[11px] text-(--text-secondary) leading-relaxed shadow-lg z-50 whitespace-normal pointer-events-none">
              Script support coming soon
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── PlainFileEditor ────────────────────────────────────────────────────────────

interface PlainFileEditorProps {
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

const PlainFileEditor = ({
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
  const saveLabel = saveStatus === 'saving' ? 'Saving…' : isSaved ? 'Saved ✓' : saveDisabled ? 'Up to date' : 'Save';

  return (
    <div className="flex flex-1 flex-col h-full w-full bg-(--bg-base) border-l border-(--border-faint)">
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

      <div className="px-7 pt-8 pb-4 shrink-0 flex items-start justify-between">
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
              !previewMode ? 'bg-(--bg-elevated) text-(--text-primary)' : 'bg-transparent text-(--text-muted) hover:text-(--text-secondary)',
            ].join(' ')}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => setPreviewMode(true)}
            className={[
              'text-[13px] px-2.5 py-0.5 rounded cursor-pointer border-none transition-colors duration-150',
              previewMode ? 'bg-(--bg-elevated) text-(--text-primary)' : 'bg-transparent text-(--text-muted) hover:text-(--text-secondary)',
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

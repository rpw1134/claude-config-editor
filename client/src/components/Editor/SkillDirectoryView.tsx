import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  fetchSkillFiles,
  createSkillFile,
  deleteSkillFile,
} from '../../lib/api';

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

// ── SkillDirectoryView ─────────────────────────────────────────────────────────

export interface SkillDirectoryViewProps {
  skillName: string;
  projectPath: string;
  onBack: () => void;
  onDeleted: () => void;
}

export const SkillDirectoryView = ({
  skillName,
  projectPath,
  onBack,
}: SkillDirectoryViewProps) => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();

  // Which files actually exist on disk (fetched once on mount)
  const [existingFiles, setExistingFiles] = useState<Set<string>>(new Set(['SKILL.md']));

  useEffect(() => {
    fetchSkillFiles(projectPath, skillName)
      .then((files) => setExistingFiles(new Set(['SKILL.md', ...files])))
      .catch(() => {/* existingFiles stays as {SKILL.md} */});
  }, [projectPath, skillName]);

  // Open a file — create it first if it doesn't exist yet, then navigate
  const handleOpenFile = async (file: string) => {
    if (!existingFiles.has(file)) {
      try {
        await createSkillFile(projectPath, skillName, file);
        setExistingFiles((prev) => new Set([...prev, file]));
      } catch {
        // File may have been created externally — proceed anyway
      }
    }
    if (projectId) {
      navigate(
        `/${encodeURIComponent(projectId)}/skills/${encodeURIComponent(skillName)}/${encodeURIComponent(file)}`
      );
    }
  };

  const handleDeleteExtraFile = async (file: string) => {
    try {
      await deleteSkillFile(projectPath, skillName, file);
      setExistingFiles((prev) => { const next = new Set(prev); next.delete(file); return next; });
    } catch {/* silently fail */}
  };

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
        <div className="w-full max-w-3xl bg-(--bg-surface) border border-(--border-subtle) rounded-2xl shadow-2xl shadow-black/40">
          {/* Card header */}
          <div className="px-10 pt-9 pb-7 border-b border-(--border-faint) flex items-center gap-3">
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
              badge="core"
            />

            {OPTIONAL_FILES.map((file) => (
              <FileRow
                key={file}
                file={file}
                connector="├"
                onClick={() => handleOpenFile(file)}
                onDelete={existingFiles.has(file) ? () => handleDeleteExtraFile(file) : undefined}
                badge={file === 'reference.md' ? 'reference · optional' : 'examples · optional'}
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
  badge?: string;
}

const FileRow = ({ file, connector, onClick, onDelete, badge }: FileRowProps) => (
  <button
    type="button"
    onClick={onClick}
    className='group relative w-full flex items-center gap-0 px-6 py-3.5 rounded-lg bg-transparent border-none cursor-pointer hover:bg-(--bg-hover) transition-colors duration-100 text-left'
  >
    <span className='font-["Fira_Code",monospace] text-[15px] text-(--text-muted) select-none shrink-0 pr-2 leading-[1.4]'>
      {connector}──
    </span>
    <span className='font-["Fira_Code",monospace] text-[15px] text-(--text-primary) group-hover:text-white transition-colors duration-100 leading-[1.4] flex-1 min-w-0'>
      {file}
    </span>
    {badge && (
      <span className='text-[11px] text-(--text-secondary) group-hover:text-(--text-primary) bg-white/5 border border-(--border-faint) rounded-full px-2.5 py-0.5 shrink-0 transition-colors duration-100 ml-3'>
        {badge}
      </span>
    )}
    {onDelete && (
      <span
        className="opacity-0 group-hover:opacity-100 text-(--text-muted) hover:text-red-400 p-1 transition-all duration-100 shrink-0 ml-1"
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
      <div className="w-full flex items-center gap-0 px-6 py-3.5">
        <span className='font-["Fira_Code",monospace] text-[15px] text-(--text-muted) select-none shrink-0 pr-2 leading-[1.4]'>
          └──
        </span>
        <span className='font-["Fira_Code",monospace] text-[15px] text-(--text-primary) leading-[1.4] flex-1 min-w-0'>
          scripts/
        </span>
        <span className='text-[11px] text-(--text-secondary) bg-white/5 border border-(--border-faint) rounded-full px-2.5 py-0.5 shrink-0 ml-3'>
          scripts · optional
        </span>
      </div>

      {/* Child line: indented + button */}
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

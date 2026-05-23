import { useEffect, useState } from 'react';
import { deleteGrid, getGrid, updateGrid } from '../../lib/api';
import type { GridData } from '../../lib/api';

interface SettingsTabProps {
  projectPath: string;
  gridName: string;
  createdAt: string;
  onDeleted: () => void;
  showToast: (msg: string) => void;
}

const GridInfoIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-(--text-muted) shrink-0">
    <rect x="1.5" y="1.5" width="11" height="11" rx="2.5" stroke="currentColor" strokeWidth="1.3" />
    <path d="M7 6v4M7 4.5v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

const CalendarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-(--text-muted) shrink-0">
    <rect x="1.5" y="2.5" width="11" height="10" rx="2" stroke="currentColor" strokeWidth="1.3" />
    <path d="M1.5 6h11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    <path d="M4.5 1v3M9.5 1v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

const FileIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-(--text-muted) shrink-0">
    <path d="M3 1.5h5.5L11 4v8.5H3V1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    <path d="M8.5 1.5V4.5H11" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
  </svg>
);

const CopyIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="text-(--text-muted)">
    <rect x="4.5" y="4.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
    <path d="M2 8.5V2.5A1 1 0 0 1 3 1.5h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="text-emerald-400">
    <path d="M2.5 6.5L5.5 9.5L10.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

interface CopyButtonProps {
  value: string;
}

const CopyButton = ({ value }: CopyButtonProps) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="p-1 rounded-md bg-transparent border-none cursor-pointer hover:bg-(--bg-elevated) transition-colors duration-100 shrink-0"
      title="Copy to clipboard"
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
    </button>
  );
};

interface FilePathRowProps {
  label: string;
  path: string;
}

const FilePathRow = ({ label, path }: FilePathRowProps) => (
  <div className="flex items-start gap-3 px-4 py-3">
    <FileIcon />
    <div className="flex flex-col gap-1 flex-1 min-w-0">
      <span className="text-[12px] text-(--text-muted) uppercase tracking-wide font-semibold">{label}</span>
      <div className="flex items-center gap-2 min-w-0">
        <code className="text-[12px] text-(--text-secondary) font-mono bg-(--bg-elevated) px-2 py-1 rounded-md flex-1 min-w-0 break-all leading-relaxed">
          {path}
        </code>
        <CopyButton value={path} />
      </div>
    </div>
  </div>
);

export const SettingsTab = ({
  projectPath,
  gridName,
  createdAt,
  onDeleted,
  showToast,
}: SettingsTabProps) => {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Description editing
  const [gridData, setGridData] = useState<GridData | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [description, setDescription] = useState('');
  const [savedDescription, setSavedDescription] = useState('');
  const [savingDescription, setSavingDescription] = useState(false);
  const descriptionDirty = description !== savedDescription;

  useEffect(() => {
    let cancelled = false;
    setLoadingData(true);
    getGrid(projectPath, gridName)
      .then((data) => {
        if (cancelled) return;
        setGridData(data);
        setDescription(data.description ?? '');
        setSavedDescription(data.description ?? '');
        setLoadingData(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoadingData(false);
      });
    return () => { cancelled = true; };
  }, [projectPath, gridName]);

  const handleSaveDescription = async () => {
    if (!gridData) return;
    setSavingDescription(true);
    try {
      await updateGrid(projectPath, gridName, { ...gridData, description });
      setGridData((d) => d ? { ...d, description } : d);
      setSavedDescription(description);
      showToast('Description saved');
    } catch {
      showToast('Save failed');
    } finally {
      setSavingDescription(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteGrid(projectPath, gridName);
      showToast('Grid deleted');
      onDeleted();
    } catch {
      showToast('Delete failed');
      setDeleting(false);
      setConfirming(false);
    }
  };

  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '—';

  const gridFilePath = `${projectPath}/.stryde/grids/${gridName}.json`;
  const configDir = projectPath.endsWith('/.claude') ? projectPath : `${projectPath}/.claude`;
  const agentFilePath = `${configDir}/agents/grids/${gridName}.md`;

  return (
    <div className="flex-1 overflow-y-auto bg-(--bg-base) p-8">
      <div className="max-w-2xl mx-auto flex flex-col gap-8">

        {/* Header */}
        <div>
          <h2 className="text-[18px] font-semibold text-(--text-primary) m-0 mb-1">Settings</h2>
          <p className="text-[13px] text-(--text-secondary) leading-relaxed m-0">
            Configure this grid's metadata and manage its lifecycle.
          </p>
        </div>

        {/* Description */}
        <section>
          <h3 className="text-[13px] font-semibold text-(--text-muted) uppercase tracking-wider mb-3">
            Description
          </h3>
          <div className="rounded-xl bg-(--bg-surface) border border-(--border-subtle) p-4 flex flex-col gap-3">
            {loadingData ? (
              <div className="flex items-center gap-2 py-2">
                <div className="w-4 h-4 rounded-full border-2 border-(--accent)/30 border-t-(--accent) animate-spin shrink-0" />
                <span className="text-[13px] text-(--text-muted)">Loading…</span>
              </div>
            ) : (
              <>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Describe what this grid orchestrates…"
                  className="w-full bg-(--bg-elevated) border border-(--border-faint) rounded-lg px-3.5 py-2.5 text-[13px] text-(--text-primary) outline-none focus:border-(--accent) transition-colors duration-120 placeholder:text-(--text-muted) resize-none"
                />
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[12px] text-(--text-muted)">
                    {descriptionDirty ? 'Unsaved changes' : 'Up to date'}
                  </span>
                  <button
                    type="button"
                    onClick={handleSaveDescription}
                    disabled={!descriptionDirty || savingDescription}
                    className="px-3.5 py-1.5 rounded-lg text-[13px] font-semibold text-(--bg-base) bg-(--accent) border-none cursor-pointer hover:bg-(--accent-hover) transition-colors duration-120 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {savingDescription ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Grid Info */}
        <section>
          <h3 className="text-[13px] font-semibold text-(--text-muted) uppercase tracking-wider mb-3">
            Grid Info
          </h3>
          <div className="rounded-xl bg-(--bg-surface) border border-(--border-subtle) divide-y divide-(--border-faint)">
            <div className="flex items-center gap-3 px-4 py-3">
              <GridInfoIcon />
              <span className="text-[13px] text-(--text-secondary) flex-1">Name</span>
              <span className="text-[13px] text-(--text-primary) font-medium font-mono">{gridName}</span>
            </div>
            <div className="flex items-center gap-3 px-4 py-3">
              <CalendarIcon />
              <span className="text-[13px] text-(--text-secondary) flex-1">Created</span>
              <span className="text-[13px] text-(--text-primary)">{formattedDate}</span>
            </div>
          </div>
        </section>

        {/* File Locations */}
        <section>
          <h3 className="text-[13px] font-semibold text-(--text-muted) uppercase tracking-wider mb-3">
            File Locations
          </h3>
          <div className="rounded-xl bg-(--bg-surface) border border-(--border-subtle) divide-y divide-(--border-faint)">
            <FilePathRow label="Grid file" path={gridFilePath} />
            <FilePathRow label="Agent file" path={agentFilePath} />
          </div>
        </section>

        {/* Danger Zone */}
        <section>
          <h3 className="text-[13px] font-semibold text-red-500 uppercase tracking-wider mb-3">
            Danger Zone
          </h3>
          <div className="rounded-xl border border-red-500/25 bg-red-500/4 p-4">
            {!confirming ? (
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <p className="text-[13px] text-(--text-primary) font-medium m-0">Delete this grid</p>
                  <p className="text-[12px] text-(--text-muted) m-0 leading-relaxed">
                    Permanently removes the grid file and its generated agent. This cannot be undone.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirming(true)}
                  className="px-3.5 py-1.5 rounded-lg text-[13px] font-medium text-red-400 border border-red-500/35 bg-transparent hover:bg-red-500/10 cursor-pointer transition-colors duration-150 shrink-0"
                >
                  Delete Grid
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-[13px] text-(--text-primary) font-medium m-0">
                  Delete <span className="font-mono">{gridName}</span>?
                </p>
                <p className="text-[12px] text-(--text-muted) m-0 leading-relaxed">
                  This action is permanent and cannot be reversed.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="px-3.5 py-1.5 rounded-lg text-[13px] font-semibold text-white bg-red-500 hover:bg-red-600 border-none cursor-pointer transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deleting ? 'Deleting…' : 'Yes, delete it'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirming(false)}
                    disabled={deleting}
                    className="px-3.5 py-1.5 rounded-lg text-[13px] font-medium text-(--text-secondary) bg-transparent border border-(--border-subtle) hover:text-(--text-primary) cursor-pointer transition-colors duration-150 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
};

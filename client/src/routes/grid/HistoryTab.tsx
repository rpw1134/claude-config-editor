import { useEffect, useState } from 'react';
import { fetchVcStatus, fetchVcLog, postVcInit } from '../../lib/api';
import type { Commit } from '../../lib/api';
import { VCDiffViewer } from '../../components/VersionControl/VCDiffViewer';

interface HistoryTabProps {
  projectPath: string;
  gridName: string;
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      + ' · ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

const ClockIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-(--text-muted)">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
    <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const GitIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-(--text-muted)">
    <circle cx="6" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="18" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="6" cy="18" r="2.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M6 8.5v7M8.5 6h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M15.5 6C15.5 10 8.5 13 8.5 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// ── Not-initialized state ─────────────────────────────────────────────────────

interface VCInitBlockProps {
  projectPath: string;
  onInitialized: () => void;
}

const VCInitBlock = ({ projectPath, onInitialized }: VCInitBlockProps) => {
  const [initing, setIniting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInit = async () => {
    setIniting(true);
    setError(null);
    try {
      await postVcInit(projectPath);
      onInitialized();
    } catch (err) {
      const e = err as { code?: string; message?: string };
      if (e.code === 'GIT_NOT_FOUND') {
        setError('git is not installed. Please install git to use version control.');
      } else {
        setError(e.message ?? 'Failed to initialize version control.');
      }
      setIniting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 bg-(--bg-surface) border border-(--border-subtle) rounded-xl p-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-(--bg-elevated) border border-(--border-subtle) flex items-center justify-center shrink-0">
          <GitIcon />
        </div>
        <div>
          <p className="text-[14px] font-semibold text-(--text-primary) m-0">Version control not enabled</p>
          <p className="text-[12px] text-(--text-muted) m-0 mt-0.5">
            Initialize a git repository to track changes to this grid.
          </p>
        </div>
      </div>

      <p className="text-[13px] text-(--text-secondary) leading-relaxed m-0">
        Grid history uses git to snapshot the canvas. Each save creates a commit you can restore later.
        Enable version control on this project to start tracking.
      </p>

      {error && (
        <p className="text-[13px] text-(--error) m-0">{error}</p>
      )}

      <button
        onClick={handleInit}
        disabled={initing}
        className="self-start px-4 py-2 rounded-lg text-[13px] font-semibold text-(--accent) bg-(--accent)/10 border border-(--accent)/20 cursor-pointer hover:bg-(--accent)/15 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {initing ? 'Initializing…' : 'Initialize Repository'}
      </button>
    </div>
  );
};

// ── Commit row ────────────────────────────────────────────────────────────────

interface CommitRowProps {
  commit: Commit;
  projectPath: string;
  gridFilePath: string;
}

const CommitRow = ({ commit, projectPath, gridFilePath }: CommitRowProps) => {
  const [showDiff, setShowDiff] = useState(false);
  const shortHash = commit.hash.slice(0, 7);
  return (
    <div className="flex flex-col border-b border-(--border-faint) last:border-b-0">
      <div className="flex items-start gap-4 py-3">
        <div className="mt-2 w-2 h-2 rounded-full bg-(--border-subtle) shrink-0" />
        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
          <p className="text-[13px] text-(--text-primary) m-0 truncate">{commit.message}</p>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-(--text-muted)">{shortHash}</span>
            <span className="text-[11px] text-(--border-subtle)">·</span>
            <span className="text-[11px] text-(--text-muted)">{formatDate(commit.date)}</span>
          </div>
        </div>
        <button
          onClick={() => setShowDiff((v) => !v)}
          className="text-(--accent) bg-transparent border-none cursor-pointer text-[12px] font-medium px-2 py-1 rounded hover:bg-(--accent)/8 shrink-0 transition-colors duration-150"
        >
          {showDiff ? 'Hide diff' : 'View diff'}
        </button>
      </div>
      {showDiff && (
        <div className="pb-3">
          <VCDiffViewer
            projectPath={projectPath}
            filePath={gridFilePath}
            hash={commit.hash}
          />
        </div>
      )}
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────

export const HistoryTab = ({ projectPath, gridName }: HistoryTabProps) => {
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const gridFilePath = `${projectPath}/.stryde/grids/${gridName}.json`;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchVcStatus(projectPath)
      .then((status) => {
        if (cancelled) return;
        if (!status.initialized) {
          setInitialized(false);
          setLoading(false);
          return;
        }
        setInitialized(true);
        return fetchVcLog(projectPath, gridFilePath);
      })
      .then((log) => {
        if (cancelled || log === undefined) return;
        setCommits(log);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [projectPath, gridFilePath, refreshKey]);

  return (
    <div className="flex-1 overflow-y-auto bg-(--bg-base) p-8">
      <div className="max-w-2xl mx-auto">

        <div className="mb-8">
          <h2 className="text-[18px] font-semibold text-(--text-primary) m-0 mb-1">Version History</h2>
          <p className="text-[13px] text-(--text-secondary) leading-relaxed m-0">
            Git commits that include changes to this grid file. Each save triggers a commit when
            version control is enabled.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center gap-2.5 py-4">
            <div className="w-4 h-4 rounded-full border-2 border-(--accent)/30 border-t-(--accent) animate-spin shrink-0" />
            <span className="text-[13px] text-(--text-muted)">Loading history…</span>
          </div>
        ) : !initialized ? (
          <VCInitBlock
            projectPath={projectPath}
            onInitialized={() => setRefreshKey((k) => k + 1)}
          />
        ) : commits.length === 0 ? (
          <div className="flex flex-col items-start gap-3 py-8">
            <div className="w-10 h-10 rounded-xl bg-(--bg-surface) border border-(--border-subtle) flex items-center justify-center">
              <ClockIcon />
            </div>
            <div>
              <p className="text-[14px] font-medium text-(--text-secondary) m-0">No commits yet</p>
              <p className="text-[13px] text-(--text-muted) m-0 mt-0.5 leading-relaxed">
                Save the grid to create the first version history entry.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-xl overflow-hidden px-4">
            {commits.map((commit) => (
              <CommitRow
                key={commit.hash}
                commit={commit}
                projectPath={projectPath}
                gridFilePath={gridFilePath}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

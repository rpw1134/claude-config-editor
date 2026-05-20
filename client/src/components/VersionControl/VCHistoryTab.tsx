import { useEffect, useState } from "react";
import { useVersionControl } from "../../contexts/VersionControlContext";
import { fetchVcLog, fetchVcDiffFiles, postVcRestore } from "../../lib/api";
import type { Commit } from "../../lib/api";
import { VCDiffViewer } from "./VCDiffViewer";


interface VCHistoryTabProps {
  projectPath: string;
  // When filePath ends with "/", it's treated as a directory: commits are fetched
  // for the whole directory, and diffs show a file picker before the Monaco diff.
  filePath: string;
  jsonPath?: string;
  onRestored?: (content: string) => void;
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }) + " " + d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

// Strip the directory prefix from a file path for display
function shortFileName(file: string, dirPrefix: string): string {
  return file.startsWith(dirPrefix) ? file.slice(dirPrefix.length) : file;
}

// ── Directory diff picker ─────────────────────────────────────────────────────

interface DirDiffPickerProps {
  projectPath: string;
  dirPath: string;
  hash: string;
}

const DirDiffPicker = ({ projectPath, dirPath, hash }: DirDiffPickerProps) => {
  const [files, setFiles] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchVcDiffFiles(projectPath, dirPath, hash)
      .then((result) => {
        if (!cancelled) {
          setFiles(result);
          if (result.length === 1) setSelectedFile(result[0]);
        }
      })
      .catch(() => { if (!cancelled) setFiles([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [projectPath, dirPath, hash]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <span className="text-[12px] text-(--text-muted)">Loading files…</span>
      </div>
    );
  }

  if (!files || files.length === 0) {
    return (
      <p className="text-[12px] text-(--text-muted) px-3 py-3">No files changed in this commit.</p>
    );
  }

  return (
    <div className="flex flex-col gap-1 mt-1.5">
      {/* File list */}
      <div className="flex flex-wrap gap-1.5 px-1">
        {files.map((file) => (
          <button
            key={file}
            onClick={() => setSelectedFile((prev) => (prev === file ? null : file))}
            className={[
              "font-['Fira_Code',monospace] text-[11px] px-2 py-1 rounded border transition-colors duration-150 cursor-pointer bg-transparent",
              selectedFile === file
                ? "border-(--accent)/40 text-(--accent) bg-(--accent)/8"
                : "border-white/10 text-(--text-secondary) hover:border-white/20 hover:text-(--text-primary)",
            ].join(" ")}
          >
            {shortFileName(file, dirPath)}
          </button>
        ))}
      </div>

      {/* Diff for selected file */}
      {selectedFile && (
        <VCDiffViewer
          projectPath={projectPath}
          filePath={selectedFile}
          hash={hash}
        />
      )}
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────

export const VCHistoryTab = ({
  projectPath,
  filePath,
  jsonPath,
  onRestored,
}: VCHistoryTabProps) => {
  const { refresh, historyKey } = useVersionControl();
  const [commits, setCommits] = useState<Commit[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedHash, setExpandedHash] = useState<string | null>(null);
  const [restoreConfirm, setRestoreConfirm] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);

  const isDirectory = filePath.endsWith("/");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchVcLog(projectPath, filePath)
      .then((result) => {
        if (!cancelled) setCommits(result);
      })
      .catch(() => {
        if (!cancelled) setCommits([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [projectPath, filePath, historyKey]);

  const handleRestore = async (hash: string) => {
    if (isDirectory) return; // can't restore a whole directory
    setRestoring(true);
    try {
      const result = await postVcRestore(projectPath, filePath, hash);
      refresh();
      onRestored?.(result.content);
      setRestoreConfirm(null);
    } catch {
      // leave confirm open so user can retry
    } finally {
      setRestoring(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <span className="text-[13px] text-(--text-muted)">Loading history…</span>
      </div>
    );
  }

  if (commits.length === 0) {
    return (
      <p className="text-(--text-muted) text-[13px] px-4 py-8 text-center">
        No version history yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col overflow-y-auto px-4 py-4 gap-1">
      {commits.map((commit) => {
        const isExpanded = expandedHash === commit.hash;
        const isConfirming = restoreConfirm === commit.hash;
        const shortHash = commit.hash.slice(0, 7);

        return (
          <div key={commit.hash} className="flex flex-col border-b border-(--border-faint) last:border-b-0 pb-3 pt-2">
            <div className="flex items-start gap-3">
              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-(--text-muted) shrink-0">
                    {shortHash}
                  </span>
                  <span className="text-[12px] text-(--text-secondary) shrink-0">
                    {formatDate(commit.date)}
                  </span>
                </div>
                <p className="m-0 text-[13px] text-(--text-primary) truncate">
                  {commit.message}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setExpandedHash(isExpanded ? null : commit.hash)}
                  className="text-(--accent) bg-transparent border-none cursor-pointer text-[12px] font-medium px-2 py-1 rounded hover:bg-(--accent)/8 transition-colors duration-150"
                >
                  {isExpanded ? "Hide diff" : "View diff"}
                </button>
                {!isDirectory && (
                  <button
                    onClick={() => setRestoreConfirm(isConfirming ? null : commit.hash)}
                    className="text-(--text-secondary) bg-transparent border-none cursor-pointer text-[12px] font-medium px-2 py-1 rounded hover:bg-(--bg-hover) hover:text-(--text-primary) transition-colors duration-150"
                  >
                    Restore
                  </button>
                )}
              </div>
            </div>

            {isConfirming && (
              <div className="mt-2 px-3 py-2.5 rounded-lg bg-(--bg-elevated) border border-(--border-subtle) flex flex-col gap-2">
                <p className="m-0 text-[13px] text-(--text-secondary)">
                  Restore this version? Current changes will be overwritten.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRestore(commit.hash)}
                    disabled={restoring}
                    className="text-[12px] font-semibold text-(--accent) bg-(--accent)/10 border border-(--accent)/20 px-3 py-1 rounded cursor-pointer hover:bg-(--accent)/15 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {restoring ? "Restoring…" : "Confirm"}
                  </button>
                  <button
                    onClick={() => setRestoreConfirm(null)}
                    className="text-[12px] text-(--text-muted) bg-transparent border-none cursor-pointer hover:text-(--text-secondary) transition-colors duration-150"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {isExpanded && (
              <div className="mt-2">
                {isDirectory ? (
                  <DirDiffPicker
                    projectPath={projectPath}
                    dirPath={filePath}
                    hash={commit.hash}
                  />
                ) : (
                  <VCDiffViewer
                    projectPath={projectPath}
                    filePath={filePath}
                    hash={commit.hash}
                    jsonPath={jsonPath}
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

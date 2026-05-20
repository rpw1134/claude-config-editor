import { useEffect, useState } from "react";
import { DiffEditor } from "@monaco-editor/react";
import { fetchVcDiff } from "../../lib/api";

interface VCDiffViewerProps {
  projectPath: string;
  filePath: string;
  hash: string;
  jsonPath?: string;
  onClose?: () => void;
}

function extractJsonPath(content: string, path: string): string | null {
  try {
    const obj = JSON.parse(content) as Record<string, unknown>;
    const parts = path.split(".");
    let cursor: unknown = obj;
    for (const part of parts) {
      if (cursor == null || typeof cursor !== "object") return null;
      cursor = (cursor as Record<string, unknown>)[part];
    }
    return JSON.stringify(cursor, null, 2);
  } catch {
    return null;
  }
}

export const VCDiffViewer = ({
  projectPath,
  filePath,
  hash,
  jsonPath,
  onClose,
}: VCDiffViewerProps) => {
  const [before, setBefore] = useState<string>("");
  const [after, setAfter] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchVcDiff(projectPath, filePath, hash)
      .then(({ before: rawBefore, after: rawAfter }) => {
        if (cancelled) return;

        if (jsonPath) {
          const extractedBefore = extractJsonPath(rawBefore, jsonPath);
          const extractedAfter = extractJsonPath(rawAfter, jsonPath);
          if (extractedBefore !== null && extractedAfter !== null) {
            setBefore(extractedBefore);
            setAfter(extractedAfter);
          } else {
            setBefore(rawBefore);
            setAfter(rawAfter);
          }
        } else {
          setBefore(rawBefore);
          setAfter(rawAfter);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [projectPath, filePath, hash, jsonPath]);

  if (loading) {
    return (
      <div
        className="flex items-center justify-center bg-(--bg-surface) rounded-lg border border-(--border-faint)"
        style={{ height: "clamp(200px, 40vh, 500px)" }}
      >
        <span className="text-[12px] text-(--text-muted)">Loading diff…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex items-center justify-center bg-(--bg-surface) rounded-lg border border-(--border-faint)"
        style={{ height: "clamp(200px, 40vh, 500px)" }}
      >
        <span className="text-[12px] text-(--error)">{error}</span>
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden border border-(--border-faint)">
      {onClose && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-(--bg-surface) border-b border-(--border-faint)">
          <span className="text-[11px] text-(--text-muted) font-['Fira_Code',monospace] truncate">
            {filePath}
          </span>
          <button
            onClick={onClose}
            className="text-[11px] text-(--text-muted) bg-transparent border-none cursor-pointer hover:text-(--text-secondary) shrink-0 ml-3"
          >
            Close
          </button>
        </div>
      )}
      <DiffEditor
        original={before}
        modified={after}
        language={filePath.endsWith(".json") ? "json" : "markdown"}
        theme="vs-dark"
        options={{
          readOnly: true,
          renderSideBySide: false,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 12,
        }}
        height="clamp(200px, 40vh, 500px)"
      />
    </div>
  );
};

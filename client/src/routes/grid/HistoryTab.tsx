import type { HistorySnapshot } from '../../hooks/useGridEditor';

interface HistoryTabProps {
  snapshots: HistorySnapshot[];
  currentNodeCount: number;
  currentEdgeCount: number;
  onRestore: (index: number) => void;
}

function formatRelativeTime(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

export const HistoryTab = ({
  snapshots,
  currentNodeCount,
  currentEdgeCount,
  onRestore,
}: HistoryTabProps) => (
  <div className="flex-1 overflow-y-auto bg-(--bg-base) p-6">
    <div className="max-w-lg mx-auto">
      <h2 className="text-[13px] font-semibold text-(--text-muted) uppercase tracking-wider mb-4">
        Undo History
      </h2>

      {/* Current state */}
      <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-(--bg-surface) border border-(--border-subtle) mb-2">
        <div className="text-[13px] text-(--text-primary) font-medium">
          Current
        </div>
        <div className="text-[12px] text-(--text-muted)">
          {currentNodeCount} node{currentNodeCount !== 1 ? 's' : ''}, {currentEdgeCount} edge{currentEdgeCount !== 1 ? 's' : ''}
        </div>
      </div>

      {snapshots.length === 0 ? (
        <p className="text-[13px] text-(--text-muted) text-center py-8">
          No history yet — make changes to the canvas
        </p>
      ) : (
        <div className="flex flex-col gap-0.5 mt-1">
          {[...snapshots].reverse().map((snap, reversedIndex) => {
            const index = snapshots.length - 1 - reversedIndex;
            return (
              <div
                key={snap.timestamp}
                className="flex items-center justify-between px-4 py-3 rounded-lg hover:bg-(--bg-surface) group transition-colors duration-100"
              >
                <div className="text-[13px] text-(--text-secondary)">
                  {snap.nodes.length} node{snap.nodes.length !== 1 ? 's' : ''},{' '}
                  {snap.edges.length} edge{snap.edges.length !== 1 ? 's' : ''}
                  <span className="text-(--text-muted) ml-2">— {formatRelativeTime(snap.timestamp)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onRestore(index)}
                  className="text-[12px] text-(--accent) font-medium bg-transparent border-none cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-100 hover:underline"
                >
                  Restore
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  </div>
);

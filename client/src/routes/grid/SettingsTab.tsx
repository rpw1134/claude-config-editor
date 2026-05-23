import { useState } from 'react';
import { deleteGrid } from '../../lib/api';

interface SettingsTabProps {
  projectPath: string;
  gridName: string;
  createdAt: string;
  onDeleted: () => void;
  showToast: (msg: string) => void;
}

export const SettingsTab = ({
  projectPath,
  gridName,
  createdAt,
  onDeleted,
  showToast,
}: SettingsTabProps) => {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  return (
    <div className="flex-1 overflow-y-auto bg-(--bg-base) p-6">
      <div className="max-w-lg mx-auto flex flex-col gap-6">

        {/* Info */}
        <section>
          <h2 className="text-[13px] font-semibold text-(--text-muted) uppercase tracking-wider mb-3">
            Grid Info
          </h2>
          <div className="rounded-lg bg-(--bg-surface) border border-(--border-subtle) divide-y divide-(--border-faint)">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-[13px] text-(--text-secondary)">Name</span>
              <span className="text-[13px] text-(--text-primary) font-medium">{gridName}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-[13px] text-(--text-secondary)">Created</span>
              <span className="text-[13px] text-(--text-primary)">{formattedDate}</span>
            </div>
          </div>
        </section>

        {/* Danger zone */}
        <section>
          <h2 className="text-[13px] font-semibold text-red-500 uppercase tracking-wider mb-3">
            Danger Zone
          </h2>
          <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4">
            {!confirming ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[13px] text-(--text-primary) font-medium">Delete this grid</p>
                  <p className="text-[12px] text-(--text-muted) mt-0.5">
                    Permanently removes the grid file. This cannot be undone.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirming(true)}
                  className="px-3 py-1.5 rounded-lg text-[13px] font-medium text-red-500 border border-red-500/40 bg-transparent hover:bg-red-500/10 cursor-pointer transition-colors duration-150 shrink-0 ml-4"
                >
                  Delete Grid
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-[13px] text-(--text-primary)">
                  Are you sure? This cannot be undone.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="px-3 py-1.5 rounded-lg text-[13px] font-semibold text-white bg-red-500 hover:bg-red-600 border-none cursor-pointer transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deleting ? 'Deleting…' : 'Delete'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirming(false)}
                    disabled={deleting}
                    className="px-3 py-1.5 rounded-lg text-[13px] font-medium text-(--text-secondary) bg-transparent border border-(--border-subtle) hover:text-(--text-primary) cursor-pointer transition-colors duration-150 disabled:opacity-50"
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

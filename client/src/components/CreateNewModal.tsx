import { useEffect, useRef, useState } from 'react';
import { createAgent, createSkill, createMcpServer } from '../lib/api';

type CreateType = 'agent' | 'skill' | 'mcp-server';

interface CreateNewModalProps {
  type: CreateType;
  projectPath: string;
  onSuccess: (name: string) => void;
  onClose: () => void;
}

const TYPE_LABELS: Record<CreateType, string> = {
  agent: 'Agent',
  skill: 'Skill',
  'mcp-server': 'MCP Server',
};

export const CreateNewModal = ({ type, projectPath, onSuccess, onClose }: CreateNewModalProps) => {
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    setSubmitting(true);
    setError(null);

    try {
      if (type === 'agent') await createAgent(projectPath, trimmed, '');
      else if (type === 'skill') await createSkill(projectPath, trimmed, '');
      else await createMcpServer(projectPath, trimmed, '');

      onSuccess(trimmed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setSubmitting(false);
    }
  };

  const label = TYPE_LABELS[type];
  const canSubmit = name.trim().length > 0 && !submitting;

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-95 mx-4 bg-(--bg-elevated) border border-(--border-default) rounded-2.5 overflow-hidden"
        style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-(--border-faint)">
          <h2 className="text-[16px] font-semibold text-(--text-primary) m-0">
            New {label}
          </h2>
          <p className="mt-1.5 text-[13px] text-(--text-secondary) leading-normal">
            Give your {label.toLowerCase()} a name — you can rename it later.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 pt-5 pb-6">
          <label className="block text-[13px] font-medium text-(--text-secondary) mb-2">
            Name
          </label>
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={`e.g. ${type === 'agent' ? 'coworker' : type === 'skill' ? 'ship-pr' : 'filesystem'}`}
            disabled={submitting}
            className={[
              'w-full px-3 py-2.5 rounded-lg text-[14px] font-["Fira_Code",monospace]',
              'bg-(--bg-surface) text-(--text-primary) outline-none transition-colors duration-150 box-border',
              'focus:border-(--border-default)',
              error
                ? 'border border-[rgba(248,113,113,0.5)]'
                : 'border border-(--border-subtle)',
            ].join(' ')}
          />

          {error && (
            <p className="mt-2 text-[12px] text-(--error) font-['Fira_Code',monospace]">{error}</p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 mt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-4 py-2 rounded-lg text-[14px] font-normal text-(--text-muted) bg-transparent border-none cursor-pointer transition-colors duration-150 hover:text-(--text-secondary)"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className={[
                'flex-1 px-4 py-2 rounded-lg text-[14px] font-medium text-white transition-colors duration-150',
                canSubmit
                  ? 'bg-(--accent) border-none cursor-pointer hover:bg-(--accent-hover)'
                  : 'bg-(--bg-surface) border border-(--border-subtle) cursor-not-allowed',
              ].join(' ')}
            >
              {submitting ? 'Creating…' : `Create ${label}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

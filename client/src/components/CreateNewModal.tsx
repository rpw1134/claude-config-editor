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

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-sm mx-4 bg-[#111114] border border-white/10 rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.6)] overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-white/6">
          <h2 className="text-[14px] font-semibold text-white/90 tracking-tight">
            New {label}
          </h2>
          <p className="mt-1 text-[12px] text-white/35">
            Give your {label.toLowerCase()} a name — you can rename it later.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5">
          <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-white/25 mb-2">
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
              'w-full px-3 py-2.5 rounded-lg text-[13px] font-mono',
              'bg-white/[0.04] border text-white/90 placeholder:text-white/20',
              'focus:outline-none focus:ring-1 transition-colors',
              error
                ? 'border-rose-500/50 focus:ring-rose-500/30'
                : 'border-white/10 focus:border-orange-500/50 focus:ring-orange-500/20',
            ].join(' ')}
          />

          {error && (
            <p className="mt-2 text-[11px] text-rose-400 font-mono">{error}</p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 mt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-4 py-2 rounded-lg text-[13px] font-medium text-white/45 hover:text-white/70 hover:bg-white/5 border border-white/8 transition-all duration-150"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || name.trim().length === 0}
              className={[
                'flex-1 px-4 py-2 rounded-lg text-[13px] font-semibold transition-all duration-150',
                name.trim().length === 0 || submitting
                  ? 'bg-orange-500/30 text-orange-300/50 cursor-not-allowed'
                  : 'bg-orange-500 text-white hover:bg-orange-400 shadow-[0_0_16px_rgba(249,115,22,0.3)]',
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

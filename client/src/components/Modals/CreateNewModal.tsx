import { useEffect, useRef, useState } from 'react';
import { createAgent, createSkill, createMcpServer } from '../../lib/api';

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

const TYPE_SUBTITLES: Record<CreateType, string> = {
  agent: 'Give your agent a name — you can rename it later.',
  skill: 'Give your skill a name — you can rename it later.',
  'mcp-server': 'Give your server a name, then configure its JSON body.',
};

const TYPE_PLACEHOLDERS: Record<CreateType, string> = {
  agent: 'e.g. coworker',
  skill: 'e.g. ship-pr',
  'mcp-server': 'e.g. filesystem',
};

const validateBody = (val: string, setBodyError: (e: string | null) => void): boolean => {
  if (!val.trim()) { setBodyError(null); return false; }
  try { JSON.parse(val); setBodyError(null); return true; }
  catch { setBodyError('Invalid JSON'); return false; }
};

export const CreateNewModal = ({ type, projectPath, onSuccess, onClose }: CreateNewModalProps) => {
  const [name, setName] = useState('');
  const [step, setStep] = useState<'name' | 'body'>('name');
  const [body, setBody] = useState('');
  const [bodyError, setBodyError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (step === 'body') {
      textareaRef.current?.focus();
    }
  }, [step]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    if (type === 'mcp-server') {
      setStep('body');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (type === 'agent') await createAgent(projectPath, trimmed, '');
      else await createSkill(projectPath, trimmed, '');
      onSuccess(trimmed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setSubmitting(false);
    }
  };

  const handleBodySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isValid = validateBody(body, setBodyError);
    if (!isValid || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      await createMcpServer(projectPath, name.trim(), body);
      onSuccess(name.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    setStep('name');
    setBodyError(null);
  };

  const label = TYPE_LABELS[type];
  const isMcp = type === 'mcp-server';
  const canSubmitName = name.trim().length > 0 && !submitting;
  const bodyIsValid = body.trim().length > 0 && !bodyError;
  const canSubmitBody = bodyIsValid && !submitting;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md mx-4 bg-(--bg-surface) border border-(--border-subtle) rounded-2xl p-8 shadow-2xl">

        {/* Header */}
        <div className="flex items-start justify-between mb-1">
          <div className="flex-1 min-w-0 pr-4">
            {/* Step indicator — only shown for MCP server (2-step flow) */}
            {isMcp && (
              <span className="block text-[11px] font-medium text-(--text-muted) tracking-widest uppercase mb-2">
                {step === 'name' ? '1 / 2' : '2 / 2'}
              </span>
            )}
            <h2 className="text-[22px] font-semibold text-(--text-primary) leading-tight font-['Bricolage_Grotesque',sans-serif] m-0">
              {step === 'body' ? 'Configure Server' : `New ${label}`}
            </h2>
            <p className="mt-2 text-[13px] text-(--text-muted) leading-relaxed">
              {step === 'body'
                ? <>
                    Paste the <strong className="text-(--text-secondary) font-medium">value object</strong> for{' '}
                    <code className="font-['Fira_Code',monospace] text-(--text-secondary) text-[12px]">{name.trim()}</code>.
                    The key is the name you just entered.
                  </>
                : TYPE_SUBTITLES[type]
              }
            </p>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-(--text-muted) hover:text-(--text-primary) hover:bg-(--bg-elevated) transition-colors duration-150 cursor-pointer border-none bg-transparent"
            aria-label="Close"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <path d="M1.293 1.293a1 1 0 0 1 1.414 0L7 5.586l4.293-4.293a1 1 0 1 1 1.414 1.414L8.414 7l4.293 4.293a1 1 0 0 1-1.414 1.414L7 8.414l-4.293 4.293a1 1 0 0 1-1.414-1.414L5.586 7 1.293 2.707a1 1 0 0 1 0-1.414z" />
            </svg>
          </button>
        </div>

        {/* Divider */}
        <div className="border-t border-(--border-subtle) my-6" />

        {/* Step: Name */}
        {step === 'name' && (
          <form onSubmit={handleNameSubmit}>
            <label className="block text-[11px] font-medium text-(--text-muted) tracking-widest uppercase mb-3">
              Name
            </label>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={TYPE_PLACEHOLDERS[type]}
              disabled={submitting}
              className={[
                'w-full px-4 py-3 rounded-xl text-[16px] font-["Fira_Code",monospace]',
                'bg-(--bg-elevated) text-(--text-primary) outline-none transition-colors duration-150 box-border',
                'focus:border-(--accent)',
                error
                  ? 'border border-(--error)'
                  : 'border border-(--border-subtle)',
              ].join(' ')}
            />

            {error && (
              <p className="mt-2 text-[12px] text-(--error) font-['Fira_Code',monospace]">{error}</p>
            )}

            <button
              type="submit"
              disabled={!canSubmitName}
              className={[
                'w-full mt-6 py-3 rounded-xl text-[14px] font-semibold transition-colors duration-150',
                canSubmitName
                  ? 'bg-(--accent) text-white cursor-pointer hover:bg-(--accent-hover) border-none'
                  : 'bg-(--bg-elevated) text-(--text-muted) border border-(--border-subtle) cursor-not-allowed',
              ].join(' ')}
            >
              {submitting
                ? 'Creating…'
                : isMcp
                  ? 'Continue →'
                  : `Create ${label}`
              }
            </button>
          </form>
        )}

        {/* Step: Body (MCP only) */}
        {step === 'body' && (
          <form onSubmit={handleBodySubmit}>
            <label className="block text-[11px] font-medium text-(--text-muted) tracking-widest uppercase mb-3">
              Value object
            </label>
            <textarea
              ref={textareaRef}
              rows={10}
              value={body}
              onChange={(e) => {
                setBody(e.target.value);
                validateBody(e.target.value, setBodyError);
              }}
              onBlur={() => validateBody(body, setBodyError)}
              placeholder={'{\n  "command": "npx",\n  "args": ["-y", "@modelcontextprotocol/server-filesystem", "/"]\n}'}
              disabled={submitting}
              className={[
                'w-full font-["Fira_Code",monospace] text-[13px] text-(--text-primary)',
                'bg-(--bg-elevated) rounded-xl px-4 py-3 resize-none outline-none transition-colors leading-relaxed box-border',
                'focus:border-(--accent)',
                bodyError
                  ? 'border border-(--error)'
                  : 'border border-(--border-subtle)',
              ].join(' ')}
            />

            {bodyError && (
              <p className="mt-2 text-[12px] text-(--error) font-['Fira_Code',monospace]">{bodyError}</p>
            )}

            {error && (
              <p className="mt-2 text-[12px] text-(--error) font-['Fira_Code',monospace]">{error}</p>
            )}

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={handleBack}
                disabled={submitting}
                className="px-5 py-3 rounded-xl text-[14px] font-medium text-(--text-muted) bg-(--bg-elevated) border border-(--border-subtle) cursor-pointer hover:text-(--text-secondary) hover:border-(--border-default) transition-colors duration-150"
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={!canSubmitBody}
                className={[
                  'flex-1 py-3 rounded-xl text-[14px] font-semibold transition-colors duration-150',
                  canSubmitBody
                    ? 'bg-(--accent) text-white cursor-pointer hover:bg-(--accent-hover) border-none'
                    : 'bg-(--bg-elevated) text-(--text-muted) border border-(--border-subtle) cursor-not-allowed',
                ].join(' ')}
              >
                {submitting ? 'Creating…' : 'Create MCP Server'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

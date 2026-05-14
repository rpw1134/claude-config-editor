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
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.6)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: '100%',
        maxWidth: '380px',
        margin: '0 16px',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-default)',
        borderRadius: '10px',
        boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '24px 24px 16px',
          borderBottom: '1px solid var(--border-faint)',
        }}>
          <h2 style={{
            fontSize: '16px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            margin: 0,
          }}>
            New {label}
          </h2>
          <p style={{
            marginTop: '6px',
            fontSize: '13px',
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
          }}>
            Give your {label.toLowerCase()} a name — you can rename it later.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '20px 24px 24px' }}>
          <label style={{
            display: 'block',
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--text-secondary)',
            marginBottom: '8px',
          }}>
            Name
          </label>
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={`e.g. ${type === 'agent' ? 'coworker' : type === 'skill' ? 'ship-pr' : 'filesystem'}`}
            disabled={submitting}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              fontSize: '14px',
              fontFamily: 'Fira Code, monospace',
              background: 'var(--bg-surface)',
              border: `1px solid ${error ? 'rgba(248,113,113,0.5)' : 'var(--border-subtle)'}`,
              color: 'var(--text-primary)',
              outline: 'none',
              transition: 'border-color 150ms ease',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => {
              if (!error) {
                (e.target as HTMLInputElement).style.borderColor = 'var(--border-default)';
              }
            }}
            onBlur={(e) => {
              (e.target as HTMLInputElement).style.borderColor = error ? 'rgba(248,113,113,0.5)' : 'var(--border-subtle)';
            }}
          />

          {error && (
            <p style={{
              marginTop: '8px',
              fontSize: '12px',
              color: 'var(--error)',
              fontFamily: 'Fira Code, monospace',
            }}>{error}</p>
          )}

          {/* Actions */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '20px',
          }}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={{
                flex: 1,
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 400,
                color: 'var(--text-muted)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'color 150ms ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              style={{
                flex: 1,
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                color: 'white',
                background: canSubmit ? 'var(--accent)' : 'var(--bg-surface)',
                border: canSubmit ? 'none' : '1px solid var(--border-subtle)',
                cursor: canSubmit ? 'pointer' : 'not-allowed',
                transition: 'background 150ms ease',
              }}
              onMouseEnter={(e) => {
                if (canSubmit) {
                  (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent-hover)';
                }
              }}
              onMouseLeave={(e) => {
                if (canSubmit) {
                  (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent)';
                }
              }}
            >
              {submitting ? 'Creating…' : `Create ${label}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

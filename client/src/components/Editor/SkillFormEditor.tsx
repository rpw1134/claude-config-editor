import { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { parseSkillFrontmatter, serializeSkillFrontmatter, type SkillFrontmatter } from '../../lib/frontmatter';
import { Editor } from './Editor';

// ── Shared style tokens ───────────────────────────────────────────────────────

const fieldLabel = 'text-[13px] text-(--text-secondary) mb-2 block';
const fieldInput =
  'bg-(--bg-surface) border border-(--border-subtle) rounded-xl text-[14px] text-(--text-primary) px-4 py-2.5 focus:outline-none focus:border-(--border-default) w-full transition-colors duration-150 placeholder:text-(--text-muted)';
const clusterLabel =
  'text-[12px] uppercase tracking-wide text-(--text-secondary) font-semibold mb-4 mt-2';
const tagPillClass =
  'bg-white/8 text-(--text-secondary) text-[12px] font-mono px-2.5 py-1 rounded-lg flex items-center gap-1.5';

// ── FieldHelp ─────────────────────────────────────────────────────────────────

const FieldHelp = ({ text }: { text: string }) => (
  <span className="relative group inline-flex items-center ml-1.5">
    <span className="w-3.5 h-3.5 rounded-full border border-(--border-subtle) text-(--text-muted) text-[9px] font-medium inline-flex items-center justify-center cursor-default leading-none select-none">?</span>
    <span className="absolute bottom-full left-0 mb-1.5 w-56 px-3 py-2 rounded-lg bg-(--bg-elevated) border border-(--border-default) text-[12px] text-(--text-secondary) leading-relaxed shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 text-left whitespace-normal">
      {text}
    </span>
  </span>
);

// ── TagInput ──────────────────────────────────────────────────────────────────

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

const TagInput = ({ value, onChange, placeholder = 'Add…', disabled }: TagInputProps) => {
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const commit = () => {
    const trimmed = draft.trim().replace(/,+$/, '');
    if (!trimmed) return;
    const parts = trimmed.split(',').map((s) => s.trim()).filter(Boolean);
    const next = [...value, ...parts.filter((p) => !value.includes(p))];
    onChange(next);
    setDraft('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commit();
    } else if (e.key === 'Backspace' && draft === '' && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const removeTag = (index: number) => onChange(value.filter((_, i) => i !== index));

  return (
    <div
      className="bg-(--bg-surface) border border-(--border-subtle) rounded-xl px-3 py-2 flex flex-wrap gap-2 cursor-text min-h-11 transition-colors duration-150"
      onClick={() => inputRef.current?.focus()}
    >
      {value.map((tag, i) => (
        <span key={i} className={tagPillClass}>
          {tag}
          {!disabled && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeTag(i); }}
              className="text-(--text-muted) hover:text-(--text-secondary) leading-none transition-colors"
              aria-label={`Remove ${tag}`}
            >
              ×
            </button>
          )}
        </span>
      ))}
      {!disabled && (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={commit}
          placeholder={value.length === 0 ? placeholder : ''}
          className="bg-transparent text-[13px] text-(--text-primary) outline-none placeholder:text-(--text-muted) min-w-20 flex-1"
        />
      )}
    </div>
  );
};

// ── Toggle ────────────────────────────────────────────────────────────────────

interface ToggleProps {
  checked: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
}

const Toggle = ({ checked, onChange, disabled }: ToggleProps) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={[
      'relative inline-flex h-5 w-9 shrink-0 rounded-full border-none transition-colors duration-150',
      disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
    ].join(' ')}
    style={{ background: checked ? 'var(--accent)' : 'var(--border-default)', transition: 'background 150ms' }}
  >
    <span
      className="absolute top-0.75 w-3.5 h-3.5 rounded-full bg-white"
      style={{ left: checked ? 19 : 3, transition: 'left 150ms' }}
    />
  </button>
);

// ── ModelSelect ───────────────────────────────────────────────────────────────

const KNOWN_MODELS = ['sonnet', 'opus', 'haiku'];

interface ModelSelectProps {
  value: string | undefined;
  onChange: (val: string | undefined) => void;
  disabled?: boolean;
}

const ModelSelect = ({ value, onChange, disabled }: ModelSelectProps) => {
  const isCustom = value !== undefined && value !== '' && !KNOWN_MODELS.includes(value);
  const selectValue = isCustom ? '__custom__' : (value ?? '');

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    if (v === '') onChange(undefined);
    else if (v === '__custom__') onChange('');
    else onChange(v);
  };

  return (
    <div className="flex flex-col gap-2">
      <select value={selectValue} onChange={handleSelectChange} disabled={disabled} className={fieldInput}>
        <option value="">Inherit — default</option>
        <option value="sonnet">sonnet</option>
        <option value="opus">opus</option>
        <option value="haiku">haiku</option>
        <option value="__custom__">Custom…</option>
      </select>
      {(selectValue === '__custom__' || isCustom) && (
        <input
          type="text"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value || undefined)}
          placeholder="e.g. claude-opus-4-5"
          disabled={disabled}
          className={fieldInput}
        />
      )}
    </div>
  );
};

// ── Tab types ─────────────────────────────────────────────────────────────────

type Tab = 'identity' | 'instructions' | 'settings';

// ── IdentityTab ───────────────────────────────────────────────────────────────

interface IdentityTabProps {
  fm: SkillFrontmatter;
  onFieldChange: <K extends keyof SkillFrontmatter>(key: K, value: SkillFrontmatter[K]) => void;
  disabled?: boolean;
}

const IdentityTab = ({ fm, onFieldChange, disabled }: IdentityTabProps) => (
  <div className="px-7 py-8 flex flex-col gap-6 overflow-y-auto h-full">
    <div>
      <h2 className="m-0 mb-1 text-2xl font-['Bricolage_Grotesque',sans-serif] font-bold tracking-[-0.015em] text-(--text-primary)">
        Identity
      </h2>
      <p className="m-0 text-[13px] text-(--text-secondary)">
        Name, description, and invocation trigger for this skill.
      </p>
    </div>

    <div className="flex flex-col gap-5">
      <div>
        <label className={fieldLabel}>
          Name
          <FieldHelp text="The skill's slug identifier. Used as /skill-name when invoked by users." />
        </label>
        <input
          type="text"
          value={fm.name ?? ''}
          onChange={(e) => onFieldChange('name', e.target.value || undefined)}
          disabled={disabled}
          placeholder="my-skill"
          className={fieldInput}
        />
      </div>

      <div>
        <label className={fieldLabel}>
          Description
          <FieldHelp text="Describes what this skill does. Shown in the skill list and used by Claude Code to decide when to invoke it." />
        </label>
        <textarea
          rows={4}
          value={fm.description ?? ''}
          onChange={(e) => onFieldChange('description', e.target.value || undefined)}
          disabled={disabled}
          placeholder="What this skill does…"
          className={fieldInput + ' resize-none leading-relaxed'}
        />
      </div>

      <div>
        <label className={fieldLabel}>
          When to use
          <FieldHelp text="Tell Claude Code precisely when it should invoke this skill. The more specific, the better routing decisions Claude makes." />
        </label>
        <textarea
          rows={4}
          value={fm.when_to_use ?? ''}
          onChange={(e) => onFieldChange('when_to_use', e.target.value || undefined)}
          disabled={disabled}
          placeholder="Describe the exact conditions that should trigger this skill…"
          className={fieldInput + ' resize-none leading-relaxed'}
        />
      </div>
    </div>
  </div>
);

// ── InstructionsTab ───────────────────────────────────────────────────────────

interface InstructionsTabProps {
  body: string;
  onBodyChange: (val: string) => void;
  disabled?: boolean;
}

const InstructionsTab = ({ body, onBodyChange, disabled }: InstructionsTabProps) => {
  const [previewMode, setPreviewMode] = useState(false);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-7 pt-8 pb-4 shrink-0 flex items-start justify-between">
        <div>
          <h2 className="m-0 mb-1 text-2xl font-['Bricolage_Grotesque',sans-serif] font-bold tracking-[-0.015em] text-(--text-primary)">
            Instructions
          </h2>
          <p className="m-0 text-[13px] text-(--text-secondary)">
            Markdown body sent to Claude when this skill is invoked.
          </p>
        </div>
        <div className="flex items-center bg-(--bg-surface) border border-(--border-subtle) rounded-md p-0.5 shrink-0 mt-1">
          <button
            type="button"
            onClick={() => setPreviewMode(false)}
            className={[
              'text-[13px] px-2.5 py-0.5 rounded cursor-pointer border-none transition-colors duration-150',
              !previewMode
                ? 'bg-(--bg-elevated) text-(--text-primary)'
                : 'bg-transparent text-(--text-muted) hover:text-(--text-secondary)',
            ].join(' ')}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => setPreviewMode(true)}
            className={[
              'text-[13px] px-2.5 py-0.5 rounded cursor-pointer border-none transition-colors duration-150',
              previewMode
                ? 'bg-(--bg-elevated) text-(--text-primary)'
                : 'bg-transparent text-(--text-muted) hover:text-(--text-secondary)',
            ].join(' ')}
          >
            Preview
          </button>
        </div>
      </div>

      {/* $ARGUMENTS callout */}
      <div className="mx-7 mb-4 px-4 py-3 rounded-xl bg-(--bg-surface) border border-(--border-subtle) text-[12px] text-(--text-secondary) leading-relaxed shrink-0">
        Use{' '}
        <code className='font-["Fira_Code",monospace] text-[11px] bg-white/6 px-1.5 py-0.5 rounded text-(--text-primary)'>
          $ARGUMENTS
        </code>{' '}
        in the body to reference user-provided arguments. The skill body is sent to Claude as context when invoked.
      </div>

      {previewMode ? (
        <div className="flex-1 min-h-0 overflow-y-auto px-7 py-6 prose prose-invert prose-sm max-w-none">
          <ReactMarkdown>{body}</ReactMarkdown>
        </div>
      ) : (
        <div className="flex-1 min-h-0">
          <Editor
            value={body}
            onChange={onBodyChange}
            language="markdown"
            readOnly={disabled}
          />
        </div>
      )}
    </div>
  );
};

// ── SettingsTab ───────────────────────────────────────────────────────────────

interface SkillSettingsTabProps {
  fm: SkillFrontmatter;
  onFieldChange: <K extends keyof SkillFrontmatter>(key: K, value: SkillFrontmatter[K]) => void;
  onDelete: () => void;
  deleteStatus: 'idle' | 'confirm' | 'deleting' | 'error';
  disabled?: boolean;
}

const SkillSettingsTab = ({ fm, onFieldChange, onDelete, deleteStatus, disabled }: SkillSettingsTabProps) => (
  <div className="px-7 py-8 flex flex-col gap-8 overflow-y-auto h-full">
    <div>
      <h2 className="m-0 mb-1 text-2xl font-['Bricolage_Grotesque',sans-serif] font-bold tracking-[-0.015em] text-(--text-primary)">
        Settings
      </h2>
      <p className="m-0 text-[13px] text-(--text-secondary)">
        Invocation behavior, model, and tool access for this skill.
      </p>
    </div>

    {/* Cluster: Invocation */}
    <div>
      <p className={clusterLabel}>Invocation</p>
      <div className="flex flex-col gap-4">

        <div>
          <label className={fieldLabel}>
            Argument hint
            <FieldHelp text="Shown to the user when they invoke the skill. Describes what arguments to pass." />
          </label>
          <input
            type="text"
            value={fm['argument-hint'] ?? ''}
            onChange={(e) => onFieldChange('argument-hint', e.target.value || undefined)}
            disabled={disabled}
            placeholder="e.g. file path to analyze"
            className={fieldInput}
          />
        </div>

        <div>
          <label className={fieldLabel}>User-invocable</label>
          <div className="flex items-center gap-3 mt-1">
            <Toggle
              checked={fm['user-invocable'] ?? false}
              onChange={(v) => onFieldChange('user-invocable', v || undefined)}
              disabled={disabled}
            />
            <span className="text-[13px] text-(--text-secondary)">Invocable by user with /skill-name</span>
          </div>
        </div>

        <div>
          <label className={fieldLabel}>Disable model invocation</label>
          <div className="flex items-center gap-3 mt-1">
            <Toggle
              checked={fm['disable-model-invocation'] ?? false}
              onChange={(v) => onFieldChange('disable-model-invocation', v || undefined)}
              disabled={disabled}
            />
            <span className="text-[13px] text-(--text-secondary)">Disable model invocation (run as script only)</span>
          </div>
        </div>

        <div>
          <label className={fieldLabel}>
            Context
            <FieldHelp text="fork creates a new context window isolated from the parent session." />
          </label>
          <select
            value={fm.context ?? ''}
            onChange={(e) => onFieldChange('context', e.target.value || undefined)}
            disabled={disabled}
            className={fieldInput}
          >
            <option value="">Default</option>
            <option value="fork">fork</option>
          </select>
        </div>
      </div>
    </div>

    {/* Cluster: Model */}
    <div>
      <p className={clusterLabel}>Model</p>
      <div className="flex flex-col gap-4">

        <div>
          <label className={fieldLabel}>
            Model
            <FieldHelp text="Which Claude model this skill runs on. Inherit uses the parent session's model." />
          </label>
          <ModelSelect
            value={fm.model}
            onChange={(v) => onFieldChange('model', v)}
            disabled={disabled}
          />
        </div>

        <div>
          <label className={fieldLabel}>
            Effort
            <FieldHelp text="Thinking budget for the model. Higher effort = more reasoning = slower and more expensive." />
          </label>
          <select
            value={fm.effort ?? ''}
            onChange={(e) => onFieldChange('effort', e.target.value || undefined)}
            disabled={disabled}
            className={fieldInput}
          >
            <option value=""></option>
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
            <option value="xhigh">xhigh</option>
            <option value="max">max</option>
          </select>
        </div>
      </div>
    </div>

    {/* Cluster: Tools */}
    <div>
      <p className={clusterLabel}>Tools</p>
      <div>
        <label className={fieldLabel}>
          Allowed tools
          <FieldHelp text="Allowlist of tools this skill can use. Leave empty to inherit the default tool set." />
        </label>
        <TagInput
          value={fm['allowed-tools'] ?? []}
          onChange={(v) => onFieldChange('allowed-tools', v.length > 0 ? v : undefined)}
          placeholder="Add tool…"
          disabled={disabled}
        />
      </div>
    </div>

    {/* Danger Zone */}
    <div className="border border-red-500/30 rounded-xl p-5">
      <div className="mb-3">
        <p className="m-0 mb-1 text-[13px] font-semibold text-red-400">&#9888; Danger Zone</p>
        <p className="m-0 text-[12px] text-(--text-muted)">Permanent actions that cannot be undone.</p>
      </div>
      <button
        type="button"
        onClick={onDelete}
        disabled={deleteStatus === 'deleting'}
        className={[
          'text-[13px] font-medium px-3 py-1.5 rounded-lg border transition-colors duration-150 cursor-pointer',
          deleteStatus === 'confirm'
            ? 'bg-red-500/20 border-red-500/50 text-red-300 hover:bg-red-500/30'
            : deleteStatus === 'deleting'
            ? 'bg-transparent border-red-500/20 text-red-500/50 cursor-not-allowed'
            : 'bg-transparent border-red-500/30 text-red-400 hover:bg-red-500/10',
        ].join(' ')}
      >
        {deleteStatus === 'confirm'
          ? 'Are you sure? Click again to confirm.'
          : deleteStatus === 'deleting'
          ? 'Deleting…'
          : 'Delete skill'}
      </button>
    </div>
  </div>
);

// ── SkillFormEditor ───────────────────────────────────────────────────────────

export interface SkillFormEditorProps {
  content: string;
  onChange: (content: string) => void;
  onDelete?: () => void;
  deleteStatus?: 'idle' | 'confirm' | 'deleting' | 'error';
  disabled?: boolean;
  onSave?: () => void;
  saveStatus?: 'idle' | 'saving' | 'saved' | 'error';
  saveDisabled?: boolean;
  onBack?: () => void;
  filePath?: string;
  activeSection?: Tab;
  onSectionChange?: (section: Tab) => void;
}

export const SkillFormEditor = ({
  content,
  onChange,
  onDelete,
  deleteStatus = 'idle',
  disabled,
  onSave,
  saveStatus,
  saveDisabled,
  filePath,
  activeSection,
}: SkillFormEditorProps) => {
  const { frontmatter: initialFm, body: initialBody } = useMemo(
    () => parseSkillFrontmatter(content),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [fm, setFm] = useState<SkillFrontmatter>(initialFm);
  const [body, setBody] = useState(initialBody);
  const activeTab = activeSection ?? 'identity';
  const lastExternalContent = useRef(content);

  useEffect(() => {
    if (content !== lastExternalContent.current) {
      lastExternalContent.current = content;
      const { frontmatter, body: newBody } = parseSkillFrontmatter(content);
      setFm(frontmatter);
      setBody(newBody);
    }
  }, [content]);

  const emit = (nextFm: SkillFrontmatter, nextBody: string) => {
    const serialized = serializeSkillFrontmatter(nextFm, nextBody);
    lastExternalContent.current = serialized;
    onChange(serialized);
  };

  const handleFieldChange = <K extends keyof SkillFrontmatter>(
    key: K,
    value: SkillFrontmatter[K]
  ) => {
    const nextFm = { ...fm, [key]: value };
    setFm(nextFm);
    emit(nextFm, body);
  };

  const handleBodyChange = (val: string) => {
    setBody(val);
    emit(fm, val);
  };

  return (
    <div className="h-full flex flex-col bg-(--bg-base)">
      {/* Actions header */}
      {(filePath || onSave) && (
        <div className="shrink-0 flex items-center justify-end border-b border-(--border-faint) px-4 py-3 gap-3">
          {filePath && (
            <span className='font-["Fira_Code",monospace] text-[11px] text-(--text-muted) truncate max-w-48 hidden sm:block'>
              {filePath}
            </span>
          )}
          {onSave && (() => {
            const isSaved = saveStatus === 'saved';
            const isDisabled = saveDisabled && !isSaved;
            const label = saveStatus === 'saving'
              ? 'Saving…'
              : isSaved
              ? 'Saved ✓'
              : saveDisabled
              ? 'Up to date'
              : 'Save';
            return (
              <button
                onClick={saveDisabled ? undefined : onSave}
                disabled={saveDisabled}
                className={[
                  'text-[13px] font-medium px-3 py-1 rounded-lg border-none transition-colors duration-150',
                  isDisabled
                    ? 'bg-(--bg-surface) text-(--text-muted) opacity-50 cursor-not-allowed'
                    : 'bg-(--accent) text-white cursor-pointer hover:bg-(--accent-hover)',
                ].join(' ')}
              >
                {label}
              </button>
            );
          })()}
        </div>
      )}

      {/* Tab content */}
      <div className="flex-1 min-h-0">
        {activeTab === 'identity' && (
          <IdentityTab fm={fm} onFieldChange={handleFieldChange} disabled={disabled} />
        )}
        {activeTab === 'instructions' && (
          <InstructionsTab body={body} onBodyChange={handleBodyChange} disabled={disabled} />
        )}
        {activeTab === 'settings' && (
          <SkillSettingsTab
            fm={fm}
            onFieldChange={handleFieldChange}
            onDelete={onDelete ?? (() => {})}
            deleteStatus={deleteStatus}
            disabled={disabled}
          />
        )}
      </div>
    </div>
  );
};

import { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { parseFrontmatter, serializeFrontmatter, type AgentFrontmatter } from '../../lib/frontmatter';
import { Editor } from '../Editor/Editor';

// ── Shared style tokens ───────────────────────────────────────────────────────

const fieldLabel = 'text-[13px] text-(--text-secondary) mb-2 block';
const fieldInput =
  'bg-(--bg-surface) border border-(--border-subtle) rounded-xl text-[14px] text-(--text-primary) px-4 py-2.5 focus:outline-none focus:border-(--border-default) w-full transition-colors duration-150 placeholder:text-(--text-muted)';

// Fix 3: cluster labels are section headers — bump size and use secondary instead of muted
const clusterLabel =
  'text-[12px] uppercase tracking-wide text-(--text-secondary) font-semibold mb-4 mt-2';

// font-mono is intentional for tag pills — tags are often code identifiers / tool names
const tagPillClass =
  'bg-white/8 text-(--text-secondary) text-[12px] font-mono px-2.5 py-1 rounded-lg flex items-center gap-1.5';

// ── FieldHelp (Fix 9) ─────────────────────────────────────────────────────────

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

  const removeTag = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

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

// ── ColorPicker ───────────────────────────────────────────────────────────────

interface ColorSwatch {
  name: string;
  bg: string;
  ring: string;
}

const COLORS: ColorSwatch[] = [
  { name: 'red',    bg: '#ef4444', ring: 'rgba(239,68,68,0.35)' },
  { name: 'orange', bg: '#f97316', ring: 'rgba(249,115,22,0.35)' },
  { name: 'yellow', bg: '#eab308', ring: 'rgba(234,179,8,0.35)' },
  { name: 'green',  bg: '#22c55e', ring: 'rgba(34,197,94,0.35)' },
  { name: 'teal',   bg: '#14b8a6', ring: 'rgba(20,184,166,0.35)' },
  { name: 'blue',   bg: '#3b82f6', ring: 'rgba(59,130,246,0.35)' },
  { name: 'purple', bg: '#a855f7', ring: 'rgba(168,85,247,0.35)' },
  { name: 'pink',   bg: '#ec4899', ring: 'rgba(236,72,153,0.35)' },
];

const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

interface ColorPickerProps {
  value: string | undefined;
  onChange: (color: string | undefined) => void;
  disabled?: boolean;
}

const ColorPicker = ({ value, onChange, disabled }: ColorPickerProps) => (
  <div className="flex gap-3 flex-wrap">
    {COLORS.map((c) => {
      const selected = value === c.name;
      return (
        <button
          key={c.name}
          type="button"
          disabled={disabled}
          onClick={() => onChange(selected ? undefined : c.name)}
          aria-label={c.name}
          aria-pressed={selected}
          style={{
            background: c.bg,
            outline: selected ? `3px solid ${c.ring}` : '3px solid transparent',
            outlineOffset: 2,
            transition: 'outline 150ms',
          }}
          className="w-7 h-7 rounded-full border-none cursor-pointer flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          {selected && <span className="text-white"><CheckIcon /></span>}
        </button>
      );
    })}
  </div>
);

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
      <select
        value={selectValue}
        onChange={handleSelectChange}
        disabled={disabled}
        className={fieldInput}
      >
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

type Tab = 'identity' | 'prompt' | 'settings';

// ── IdentityTab ───────────────────────────────────────────────────────────────

interface IdentityTabProps {
  fm: AgentFrontmatter;
  onFieldChange: <K extends keyof AgentFrontmatter>(key: K, value: AgentFrontmatter[K]) => void;
  disabled?: boolean;
}

const IdentityTab = ({ fm, onFieldChange, disabled }: IdentityTabProps) => (
  <div className="px-7 py-8 flex flex-col gap-6 overflow-y-auto h-full">
    <div>
      <h2 className="m-0 mb-1 text-2xl font-['Bricolage_Grotesque',sans-serif] font-bold tracking-[-0.015em] text-(--text-primary)">
        Identity
      </h2>
      <p className="m-0 text-[13px] text-(--text-secondary)">
        Name, description, and color for this agent.
      </p>
    </div>

    <div className="flex flex-col gap-5">
      {/* Name */}
      <div>
        <label className={fieldLabel}>
          Name
          <FieldHelp text="The agent's slug identifier, used in frontmatter and when Claude Code dispatches to this agent." />
        </label>
        <input
          type="text"
          value={fm.name ?? ''}
          onChange={(e) => onFieldChange('name', e.target.value || undefined)}
          disabled={disabled}
          placeholder="my-agent"
          className={fieldInput}
        />
      </div>

      {/* Description */}
      <div>
        <label className={fieldLabel}>
          Description
          <FieldHelp text="Tells Claude Code when to delegate tasks to this agent. Be specific about the agent's specialty." />
        </label>
        <textarea
          rows={4}
          value={fm.description ?? ''}
          onChange={(e) => onFieldChange('description', e.target.value || undefined)}
          disabled={disabled}
          placeholder="When Claude should delegate to this agent…"
          className={fieldInput + ' resize-none leading-relaxed'}
        />
      </div>

      {/* Color */}
      <div>
        <label className={fieldLabel}>
          Color
          <FieldHelp text="Visual color tag shown in the sidebar. Purely cosmetic." />
        </label>
        <ColorPicker
          value={fm.color}
          onChange={(v) => onFieldChange('color', v)}
          disabled={disabled}
        />
      </div>
    </div>
  </div>
);

// ── PromptTab ─────────────────────────────────────────────────────────────────

interface PromptTabProps {
  body: string;
  onBodyChange: (val: string) => void;
  disabled?: boolean;
}

const PromptTab = ({ body, onBodyChange, disabled }: PromptTabProps) => {
  const [previewMode, setPreviewMode] = useState(false);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-7 pt-8 pb-4 shrink-0 flex items-start justify-between">
        <div>
          <h2 className="m-0 mb-1 text-2xl font-['Bricolage_Grotesque',sans-serif] font-bold tracking-[-0.015em] text-(--text-primary)">
            System Prompt
          </h2>
          <p className="m-0 text-[13px] text-(--text-secondary)">
            Markdown supported. Defines how this agent thinks and behaves.
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

interface SettingsTabProps {
  fm: AgentFrontmatter;
  onFieldChange: <K extends keyof AgentFrontmatter>(key: K, value: AgentFrontmatter[K]) => void;
  onDelete: () => void;
  deleteStatus: 'idle' | 'confirm' | 'deleting' | 'error';
  disabled?: boolean;
}

const SettingsTab = ({ fm, onFieldChange, onDelete, deleteStatus, disabled }: SettingsTabProps) => (
  <div className="px-7 py-8 flex flex-col gap-8 overflow-y-auto h-full">

    {/* Tab heading */}
    <div>
      <h2 className="m-0 mb-1 text-2xl font-['Bricolage_Grotesque',sans-serif] font-bold tracking-[-0.015em] text-(--text-primary)">
        Settings &amp; Config
      </h2>
      <p className="m-0 text-[13px] text-(--text-secondary)">
        Runtime behavior, permissions, and tool access for this agent.
      </p>
    </div>

    {/* Cluster: Behavior */}
    <div>
      <p className={clusterLabel}>Behavior</p>
      <div className="flex flex-col gap-4">

        <div>
          <label className={fieldLabel}>
            Model
            <FieldHelp text="Which Claude model this agent runs on. Inherit means the parent session's model is used." />
          </label>
          <ModelSelect
            value={fm.model}
            onChange={(v) => onFieldChange('model', v)}
            disabled={disabled}
          />
        </div>

        <div>
          <label className={fieldLabel}>
            Max Turns
            <FieldHelp text="Maximum number of back-and-forth turns before the agent stops. Leave blank for unlimited." />
          </label>
          <input
            type="number"
            min={1}
            value={fm.maxTurns ?? ''}
            onChange={(e) => {
              const v = e.target.value;
              onFieldChange('maxTurns', v === '' ? undefined : Math.max(1, parseInt(v, 10)));
            }}
            disabled={disabled}
            placeholder="Unlimited"
            className={fieldInput}
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

        <div>
          <label className={fieldLabel}>
            Background
            <FieldHelp text="When enabled, the agent runs as a detached background task rather than blocking the current session." />
          </label>
          <div className="flex items-center gap-3 mt-1">
            <Toggle
              checked={fm.background ?? false}
              onChange={(v) => onFieldChange('background', v || undefined)}
              disabled={disabled}
            />
            <span className="text-[13px] text-(--text-secondary)">Run as a background task</span>
          </div>
        </div>
      </div>
    </div>

    {/* Cluster: Permissions */}
    <div>
      <p className={clusterLabel}>Permissions</p>
      <div className="flex flex-col gap-4">

        <div>
          <label className={fieldLabel}>
            Permission Mode
            <FieldHelp text="Controls what actions the agent can take without asking for confirmation." />
          </label>
          <select
            value={fm.permissionMode ?? ''}
            onChange={(e) => onFieldChange('permissionMode', e.target.value || undefined)}
            disabled={disabled}
            className={fieldInput}
          >
            <option value=""></option>
            <option value="default">default</option>
            <option value="acceptEdits">acceptEdits</option>
            <option value="auto">auto</option>
            <option value="dontAsk">dontAsk</option>
            <option value="bypassPermissions">bypassPermissions</option>
            <option value="plan">plan</option>
          </select>
        </div>

        <div>
          <label className={fieldLabel}>
            Isolation
            <FieldHelp text="worktree creates a clean git working tree so the agent's changes don't affect your branch." />
          </label>
          <select
            value={fm.isolation ?? ''}
            onChange={(e) => onFieldChange('isolation', e.target.value || undefined)}
            disabled={disabled}
            className={fieldInput}
          >
            <option value=""></option>
            <option value="worktree">worktree</option>
          </select>
        </div>
      </div>
    </div>

    {/* Cluster: Content */}
    <div>
      <p className={clusterLabel}>Content</p>
      <div className="flex flex-col gap-4">

        <div>
          <label className={fieldLabel}>
            Tools
            <FieldHelp text="Allowlist of tools this agent can use. Leave empty to allow all tools." />
          </label>
          <TagInput
            value={fm.tools ?? []}
            onChange={(v) => onFieldChange('tools', v.length > 0 ? v : undefined)}
            placeholder="Add tool…"
            disabled={disabled}
          />
        </div>

        <div>
          <label className={fieldLabel}>
            Disallowed Tools
            <FieldHelp text="Tools explicitly blocked for this agent, even if they'd otherwise be available." />
          </label>
          <TagInput
            value={fm.disallowedTools ?? []}
            onChange={(v) => onFieldChange('disallowedTools', v.length > 0 ? v : undefined)}
            placeholder="Add tool…"
            disabled={disabled}
          />
        </div>

        <div>
          <label className={fieldLabel}>
            Initial Prompt
            <FieldHelp text="A prompt injected at the start of every run, before the user's message." />
          </label>
          <textarea
            rows={3}
            value={fm.initialPrompt ?? ''}
            onChange={(e) => onFieldChange('initialPrompt', e.target.value || undefined)}
            disabled={disabled}
            placeholder="Prompt sent at the start of each run…"
            className={fieldInput + ' resize-none leading-relaxed'}
          />
        </div>

        <div>
          <label className={fieldLabel}>
            MCP Servers
            <FieldHelp text="MCP server names this agent has access to." />
          </label>
          <TagInput
            value={fm.mcpServers ?? []}
            onChange={(v) => onFieldChange('mcpServers', v.length > 0 ? v : undefined)}
            placeholder="Add server…"
            disabled={disabled}
          />
        </div>

        <div>
          <label className={fieldLabel}>
            Memory
            <FieldHelp text="Which memory scope the agent reads from and writes to." />
          </label>
          <select
            value={fm.memory ?? ''}
            onChange={(e) => onFieldChange('memory', e.target.value || undefined)}
            disabled={disabled}
            className={fieldInput}
          >
            <option value=""></option>
            <option value="user">user</option>
            <option value="project">project</option>
            <option value="local">local</option>
          </select>
        </div>
      </div>
    </div>

    {/* Fix 4: GitHub-style Danger Zone */}
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
          : 'Delete agent'}
      </button>
    </div>
  </div>
);

// ── AgentFormEditor ───────────────────────────────────────────────────────────

export interface AgentFormEditorProps {
  content: string;
  onChange: (content: string) => void;
  onDelete?: () => void;
  deleteStatus?: 'idle' | 'confirm' | 'deleting' | 'error';
  disabled?: boolean;
  onSave?: () => void;
  saveStatus?: 'idle' | 'saving' | 'saved' | 'error';
  saveDisabled?: boolean;
  onClose?: () => void;
  onBack?: () => void;
  filePath?: string;
}

const BackArrowIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8.5 2.5L4 7L8.5 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const AgentFormEditor = ({
  content,
  onChange,
  onDelete,
  deleteStatus = 'idle',
  disabled,
  onSave,
  saveStatus,
  saveDisabled,
  onClose,
  onBack,
  filePath,
}: AgentFormEditorProps) => {
  const { frontmatter: initialFm, body: initialBody } = useMemo(
    () => parseFrontmatter(content),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [fm, setFm] = useState<AgentFrontmatter>(initialFm);
  const [body, setBody] = useState(initialBody);
  const [activeTab, setActiveTab] = useState<Tab>('identity');
  const lastExternalContent = useRef(content);

  useEffect(() => {
    if (content !== lastExternalContent.current) {
      lastExternalContent.current = content;
      const { frontmatter, body: newBody } = parseFrontmatter(content);
      setFm(frontmatter);
      setBody(newBody);
    }
  }, [content]);

  const emit = (nextFm: AgentFrontmatter, nextBody: string) => {
    const serialized = serializeFrontmatter(nextFm, nextBody);
    lastExternalContent.current = serialized;
    onChange(serialized);
  };

  const handleFieldChange = <K extends keyof AgentFrontmatter>(
    key: K,
    value: AgentFrontmatter[K]
  ) => {
    const nextFm = { ...fm, [key]: value };
    setFm(nextFm);
    emit(nextFm, body);
  };

  const handleBodyChange = (val: string) => {
    setBody(val);
    emit(fm, val);
  };

  // Fix 5 & 6: rename tab labels
  const tabs: { id: Tab; label: string }[] = [
    { id: 'identity', label: 'Identity' },
    { id: 'prompt',   label: 'System Prompt' },
    { id: 'settings', label: 'Settings & Config' },
  ];

  return (
    <div className="h-full flex flex-col bg-(--bg-base)">
      {/* Combined tab bar + actions header */}
      <div className="shrink-0 flex items-stretch justify-between border-b border-(--border-faint) px-4">
        {/* Left: Back button + tabs */}
        <div className="flex items-stretch gap-1">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1.5 pt-6 pb-5 text-[14px] text-(--text-secondary) hover:text-(--text-primary) bg-transparent border-none cursor-pointer transition-colors duration-150 pr-3 mr-2 border-r border-(--border-subtle)"
            >
              <BackArrowIcon /> Back
            </button>
          )}
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={[
                'pt-6 pb-5 px-3 bg-transparent border-none cursor-pointer transition-colors duration-150 relative',
                activeTab === id
                  ? 'text-[15px] font-semibold text-(--text-primary) after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-(--accent)'
                  : 'text-[14px] font-medium text-(--text-secondary) hover:text-(--text-primary)',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Right: file path + Save + Close actions */}
        <div className="flex items-center gap-3">
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
          {onClose && (
            <button
              onClick={onClose}
              aria-label="Close editor"
              className="text-(--text-muted) hover:text-(--text-primary) bg-transparent border-none cursor-pointer text-[18px] leading-none transition-colors flex items-center"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0">
        {activeTab === 'identity' && (
          <IdentityTab fm={fm} onFieldChange={handleFieldChange} disabled={disabled} />
        )}
        {activeTab === 'prompt' && (
          <PromptTab body={body} onBodyChange={handleBodyChange} disabled={disabled} />
        )}
        {activeTab === 'settings' && (
          <SettingsTab
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

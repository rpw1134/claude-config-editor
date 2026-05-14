import { useEffect, useMemo, useRef, useState } from 'react';
import { parseFrontmatter, serializeFrontmatter, type AgentFrontmatter } from '../../lib/frontmatter';
import { Editor } from './Editor';

// ------------------------------------------------------------
// Shared field styles
// ------------------------------------------------------------

const labelClass = 'text-[11px] font-semibold uppercase tracking-wide text-white/30 mb-1 block';
const inputClass =
  'bg-white/4 border border-white/8 rounded-md text-[13px] text-white/80 px-3 py-1.5 focus:outline-none focus:border-white/20 w-full';
const tagPillClass =
  'bg-white/8 text-white/60 text-[11px] font-mono px-2 py-0.5 rounded-md flex items-center gap-1.5';

// ------------------------------------------------------------
// TagInput
// ------------------------------------------------------------

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
      className="bg-white/4 border border-white/8 rounded-md px-2 py-1.5 flex flex-wrap gap-1.5 cursor-text min-h-[34px]"
      onClick={() => inputRef.current?.focus()}
    >
      {value.map((tag, i) => (
        <span key={i} className={tagPillClass}>
          {tag}
          {!disabled && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeTag(i); }}
              className="text-white/30 hover:text-white/70 leading-none transition-colors"
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
          className="bg-transparent text-[13px] text-white/80 outline-none placeholder:text-white/20 min-w-[80px] flex-1"
        />
      )}
    </div>
  );
};

// ------------------------------------------------------------
// ColorPicker
// ------------------------------------------------------------

const COLOR_OPTIONS = [
  { name: 'red',    dot: 'bg-red-400' },
  { name: 'blue',   dot: 'bg-blue-400' },
  { name: 'green',  dot: 'bg-green-400' },
  { name: 'yellow', dot: 'bg-yellow-400' },
  { name: 'purple', dot: 'bg-purple-400' },
  { name: 'orange', dot: 'bg-orange-400' },
  { name: 'pink',   dot: 'bg-pink-400' },
  { name: 'cyan',   dot: 'bg-cyan-400' },
] as const;

interface ColorPickerProps {
  value: string | undefined;
  onChange: (color: string | undefined) => void;
  disabled?: boolean;
}

const ColorPicker = ({ value, onChange, disabled }: ColorPickerProps) => (
  <div className="flex gap-2">
    {COLOR_OPTIONS.map(({ name, dot }) => {
      const selected = value === name;
      return (
        <button
          key={name}
          type="button"
          disabled={disabled}
          onClick={() => onChange(selected ? undefined : name)}
          className={[
            'w-5 h-5 rounded-full transition-all',
            dot,
            selected
              ? 'ring-2 ring-white/40 ring-offset-1 ring-offset-[#0d0d10]'
              : 'opacity-40 hover:opacity-70',
          ].join(' ')}
          aria-label={name}
          aria-pressed={selected}
        />
      );
    })}
  </div>
);

// ------------------------------------------------------------
// Toggle (pill switch)
// ------------------------------------------------------------

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
      'relative inline-flex h-4 w-7 shrink-0 rounded-full border border-white/10 transition-colors',
      checked ? 'bg-white/25' : 'bg-white/6',
      disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
    ].join(' ')}
  >
    <span
      className={[
        'absolute top-[1px] left-[1px] h-[10px] w-[10px] rounded-full bg-white/70 transition-transform',
        checked ? 'translate-x-3' : 'translate-x-0',
      ].join(' ')}
    />
  </button>
);

// ------------------------------------------------------------
// ModelSelect — handles inherit / known / custom
// ------------------------------------------------------------

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
    if (v === '') {
      onChange(undefined);
    } else if (v === '__custom__') {
      onChange('');
    } else {
      onChange(v);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <select
        value={selectValue}
        onChange={handleSelectChange}
        disabled={disabled}
        className={inputClass}
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
          className={inputClass}
        />
      )}
    </div>
  );
};

// ------------------------------------------------------------
// AdvancedSection
// ------------------------------------------------------------

interface AdvancedSectionProps {
  fm: AgentFrontmatter;
  onFieldChange: <K extends keyof AgentFrontmatter>(key: K, value: AgentFrontmatter[K]) => void;
  disabled?: boolean;
}

const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg
    width="10"
    height="10"
    viewBox="0 0 10 10"
    fill="currentColor"
    style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}
  >
    <path d="M3 2l4 3-4 3V2z" />
  </svg>
);

const AdvancedSection = ({ fm, onFieldChange, disabled }: AdvancedSectionProps) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-t border-white/6 pt-4 mt-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-white/30 hover:text-white/50 text-[11px] flex items-center gap-1.5 transition-colors mb-3"
      >
        <ChevronIcon open={open} />
        Advanced
      </button>

      {open && (
        <div className="flex flex-col gap-4">
          {/* model */}
          <div>
            <label className={labelClass}>Model</label>
            <ModelSelect
              value={fm.model}
              onChange={(v) => onFieldChange('model', v)}
              disabled={disabled}
            />
          </div>

          {/* tools */}
          <div>
            <label className={labelClass}>Tools</label>
            <TagInput
              value={fm.tools ?? []}
              onChange={(v) => onFieldChange('tools', v.length > 0 ? v : undefined)}
              placeholder="Add tool…"
              disabled={disabled}
            />
          </div>

          {/* disallowedTools */}
          <div>
            <label className={labelClass}>Disallowed Tools</label>
            <TagInput
              value={fm.disallowedTools ?? []}
              onChange={(v) => onFieldChange('disallowedTools', v.length > 0 ? v : undefined)}
              placeholder="Add tool…"
              disabled={disabled}
            />
          </div>

          {/* permissionMode */}
          <div>
            <label className={labelClass}>Permission Mode</label>
            <select
              value={fm.permissionMode ?? ''}
              onChange={(e) => onFieldChange('permissionMode', e.target.value || undefined)}
              disabled={disabled}
              className={inputClass}
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

          {/* maxTurns */}
          <div>
            <label className={labelClass}>Max Turns</label>
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
              className={inputClass}
            />
          </div>

          {/* memory */}
          <div>
            <label className={labelClass}>Memory</label>
            <select
              value={fm.memory ?? ''}
              onChange={(e) => onFieldChange('memory', e.target.value || undefined)}
              disabled={disabled}
              className={inputClass}
            >
              <option value=""></option>
              <option value="user">user</option>
              <option value="project">project</option>
              <option value="local">local</option>
            </select>
          </div>

          {/* background */}
          <div className="flex items-center gap-3">
            <Toggle
              checked={fm.background ?? false}
              onChange={(v) => onFieldChange('background', v || undefined)}
              disabled={disabled}
            />
            <label className={labelClass + ' mb-0'}>Background</label>
          </div>

          {/* effort */}
          <div>
            <label className={labelClass}>Effort</label>
            <select
              value={fm.effort ?? ''}
              onChange={(e) => onFieldChange('effort', e.target.value || undefined)}
              disabled={disabled}
              className={inputClass}
            >
              <option value=""></option>
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
              <option value="xhigh">xhigh</option>
              <option value="max">max</option>
            </select>
          </div>

          {/* isolation */}
          <div>
            <label className={labelClass}>Isolation</label>
            <select
              value={fm.isolation ?? ''}
              onChange={(e) => onFieldChange('isolation', e.target.value || undefined)}
              disabled={disabled}
              className={inputClass}
            >
              <option value=""></option>
              <option value="worktree">worktree</option>
            </select>
          </div>

          {/* color */}
          <div>
            <label className={labelClass}>Color</label>
            <ColorPicker
              value={fm.color}
              onChange={(v) => onFieldChange('color', v)}
              disabled={disabled}
            />
          </div>

          {/* initialPrompt */}
          <div>
            <label className={labelClass}>Initial Prompt</label>
            <textarea
              rows={3}
              value={fm.initialPrompt ?? ''}
              onChange={(e) => onFieldChange('initialPrompt', e.target.value || undefined)}
              disabled={disabled}
              placeholder="Prompt sent at the start of each run…"
              className={inputClass + ' resize-none'}
            />
          </div>

          {/* mcpServers */}
          <div>
            <label className={labelClass}>MCP Servers</label>
            <TagInput
              value={fm.mcpServers ?? []}
              onChange={(v) => onFieldChange('mcpServers', v.length > 0 ? v : undefined)}
              placeholder="Add server…"
              disabled={disabled}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// ------------------------------------------------------------
// AgentFormEditor
// ------------------------------------------------------------

export interface AgentFormEditorProps {
  content: string;
  onChange: (content: string) => void;
  disabled?: boolean;
}

export const AgentFormEditor = ({ content, onChange, disabled }: AgentFormEditorProps) => {
  const { frontmatter: initialFm, body: initialBody } = useMemo(
    () => parseFrontmatter(content),
    // Only re-parse when content changes from outside (not from our own onChange).
    // We use a ref to detect external changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [fm, setFm] = useState<AgentFrontmatter>(initialFm);
  const [body, setBody] = useState(initialBody);

  // Track whether we've already initialized from this content value
  const lastExternalContent = useRef(content);

  useEffect(() => {
    // If content changed from outside (e.g. file load), re-parse
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

  return (
    <div className="h-full flex flex-col bg-[#0d0d10]">
      {/* Scrollable form fields */}
      <div className="shrink-0 overflow-y-auto px-5 py-4" style={{ maxHeight: '320px' }}>
        {/* name */}
        <div className="mb-4">
          <label className={labelClass}>Name</label>
          <input
            type="text"
            value={fm.name ?? ''}
            onChange={(e) => handleFieldChange('name', e.target.value || undefined)}
            disabled={disabled}
            placeholder="my-agent"
            className={inputClass}
          />
        </div>

        {/* description */}
        <div className="mb-4">
          <label className={labelClass}>Description</label>
          <textarea
            rows={3}
            value={fm.description ?? ''}
            onChange={(e) => handleFieldChange('description', e.target.value || undefined)}
            disabled={disabled}
            placeholder="When Claude should delegate to this agent…"
            className={inputClass + ' resize-none'}
          />
        </div>

        {/* Advanced collapsible */}
        <AdvancedSection fm={fm} onFieldChange={handleFieldChange} disabled={disabled} />
      </div>

      {/* System prompt — fills remaining space */}
      <div className="flex-1 min-h-0 flex flex-col border-t border-white/6">
        <div className="px-5 py-2 shrink-0">
          <span className={labelClass + ' mb-0'}>System Prompt</span>
        </div>
        <div className="flex-1 min-h-0">
          <Editor
            value={body}
            onChange={handleBodyChange}
            language="markdown"
            readOnly={disabled}
          />
        </div>
      </div>
    </div>
  );
};

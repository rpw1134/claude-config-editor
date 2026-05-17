import { useEffect, useMemo, useRef, useState } from "react";
import { parseFrontmatter, serializeFrontmatter, type AgentFrontmatter } from "../../lib/frontmatter";
import { BackArrowIcon } from "./parts/BackArrowIcon";
import { IdentityTab } from "./tabs/IdentityTab";
import { PromptTab } from "./tabs/PromptTab";
import { SettingsTab } from "./tabs/SettingsTab";

// ── Tab types ─────────────────────────────────────────────────────────────────

type Tab = 'identity' | 'prompt' | 'settings';

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

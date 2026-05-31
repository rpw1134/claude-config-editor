import { useEffect, useRef, useState } from 'react';
import type { NodeType } from '../../types/grids';

interface EdgeDescriptionModalProps {
  sourceType: NodeType;
  targetType: NodeType;
  sourceLabel: string;
  targetLabel: string;
  initialDescription?: string;
  initialIsKnowledge?: boolean;
  onConfirm: (description: string, isKnowledge?: boolean) => void;
  onCancel: () => void;
}

const KNOWLEDGE_TOOLTIP =
  'A knowledge skill provides passive context — its contents are loaded into the agent\'s system prompt at startup rather than being invoked as a tool.';

export const EdgeDescriptionModal = ({
  sourceType,
  targetType,
  sourceLabel,
  targetLabel,
  initialDescription = '',
  initialIsKnowledge = false,
  onConfirm,
  onCancel,
}: EdgeDescriptionModalProps) => {
  const [value, setValue] = useState(initialDescription);
  const [isKnowledge, setIsKnowledge] = useState(initialIsKnowledge);
  const [showTooltip, setShowTooltip] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isSkillTarget = targetType === 'skill';

  useEffect(() => {
    if (!isKnowledge) {
      setTimeout(() => {
        textareaRef.current?.focus();
        const len = initialDescription.length;
        textareaRef.current?.setSelectionRange(len, len);
      }, 0);
    }
  }, [initialDescription, isKnowledge]);

  const handleConfirm = () => {
    if (!isKnowledge && !value.trim()) return;
    onConfirm(isKnowledge ? '' : value.trim(), isSkillTarget ? isKnowledge : undefined);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleConfirm(); }
    if (e.key === 'Escape') onCancel();
  };

  // sourceType is available for future contextual copy variations
  void sourceType;

  const subtitle = isKnowledge
    ? 'This skill will be loaded into context at agent startup — no invocation rule needed.'
    : targetType === 'mcp'
    ? 'When should this agent use this MCP server?'
    : targetType === 'skill'
    ? 'When should this agent invoke this skill?'
    : 'These directions will be appended to the agent\'s invocation message.';

  const placeholder = targetType === 'mcp'
    ? 'e.g. Use when accessing files or running shell commands.'
    : targetType === 'skill'
    ? 'e.g. Use this skill when the user asks to deploy or ship code.'
    : 'e.g. Use this agent when the user asks about billing or subscriptions.';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        className="w-96 bg-(--bg-elevated) border border-(--border-subtle) rounded-2xl shadow-2xl p-6 flex flex-col gap-4"
        style={{ animation: 'modalFadeIn 0.18s ease-out both' }}
        onKeyDown={handleKey}
      >
        {/* Direction */}
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-(--text-primary) truncate max-w-28">{sourceLabel}</span>
          <svg width="14" height="10" viewBox="0 0 14 10" fill="none" className="shrink-0 text-(--text-muted)">
            <path d="M1 5h11M8 1l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-[13px] font-semibold text-(--text-primary) truncate max-w-28">{targetLabel}</span>
        </div>

        {/* Knowledge checkbox — only for skill targets */}
        {isSkillTarget && (
          <label className="flex items-center gap-2.5 cursor-pointer select-none -mt-1">
            <input
              type="checkbox"
              checked={isKnowledge}
              onChange={(e) => setIsKnowledge(e.target.checked)}
              className="w-4 h-4 rounded accent-(--accent) cursor-pointer"
            />
            <span className="text-[13px] text-(--text-secondary) font-medium">Knowledge skill</span>
            <span
              className="relative ml-0.5 cursor-help"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              <svg width="14" height="14" viewBox="0 0 15 15" fill="none" className="text-(--text-muted)">
                <circle cx="7.5" cy="7.5" r="6.5" stroke="currentColor" strokeWidth="1.2" />
                <path d="M7.5 6.5v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                <circle cx="7.5" cy="4.5" r="0.6" fill="currentColor" />
              </svg>
              {showTooltip && (
                <span className="absolute left-5 top-0 z-10 w-64 px-3 py-2 rounded-lg text-[12px] text-(--text-secondary) bg-(--bg-elevated) border border-(--border-subtle) shadow-lg pointer-events-none whitespace-normal leading-relaxed">
                  {KNOWLEDGE_TOOLTIP}
                </span>
              )}
            </span>
          </label>
        )}

        <p className="text-[13px] text-(--text-muted) -mt-2">{subtitle}</p>

        {!isKnowledge && (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            rows={3}
            className="w-full bg-(--bg-surface) border border-(--border-subtle) rounded-xl px-3.5 py-2.5 text-[13px] text-(--text-primary) resize-none outline-none focus:border-(--accent) transition-colors duration-120 placeholder:text-(--text-muted)"
          />
        )}

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-[13px] font-medium text-(--text-secondary) bg-transparent border border-(--border-subtle) cursor-pointer hover:bg-white/5 transition-colors duration-120"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isKnowledge && !value.trim()}
            className="px-4 py-2 rounded-lg text-[13px] font-semibold text-(--bg-base) bg-(--accent) border-none cursor-pointer hover:bg-(--accent-hover) transition-colors duration-120 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isKnowledge ? 'Add as Knowledge' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

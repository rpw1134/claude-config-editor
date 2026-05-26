import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAIDraft } from "../../contexts/AIDraftContext";
import { useShell } from "../../contexts/ShellContext";
import { encodeProject } from "../../lib/navigation";
import { LockIcon, SendIcon, StrydeLogoMark } from "../Icons";
import { MessageBubble } from "./MessageBubble";
import { StreamingDots } from "./StreamingDots";

// ── Suggestion chips ──────────────────────────────────────────────────────────

const SUGGESTIONS = [
  "A code review agent",
  "A deploy skill",
  "A security auditor agent",
  "CLAUDE.md for a React project",
] as const;

// ── Empty state ───────────────────────────────────────────────────────────────

interface EmptyStateProps {
  onSuggest: (text: string) => void;
}

const EmptyState = ({ onSuggest }: EmptyStateProps) => (
  <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
    {/* Logo mark */}
    <div className="text-(--accent) opacity-75 mb-7 drop-shadow-[0_0_12px_rgba(0,229,255,0.35)]">
      <StrydeLogoMark size={48} />
    </div>

    {/* Heading + subtitle */}
    <h1 className="text-[46px] font-bold text-(--text-primary) leading-[1.05] tracking-[-0.03em] mb-4">
      What would you like to build?
    </h1>
    <p className="text-[17px] text-(--text-secondary) leading-relaxed max-w-sm mb-10">
      Describe an agent, skill, or project guide.
    </p>

    {/* Suggestion chips */}
    <div className="grid grid-cols-2 gap-2">
      {SUGGESTIONS.map((suggestion) => (
        <button
          key={suggestion}
          onClick={() => onSuggest(suggestion)}
          className="px-4 py-2 rounded-full text-[13px] font-medium text-(--text-muted) border border-(--border-subtle) bg-transparent hover:border-(--accent)/35 hover:text-(--accent)/80 hover:bg-(--accent)/5 transition-all duration-150 cursor-pointer whitespace-nowrap"
        >
          {suggestion}
        </button>
      ))}
    </div>
  </div>
);

// ── No API key state ──────────────────────────────────────────────────────────

interface NoApiKeyStateProps {
  projectPath: string;
}

const NoApiKeyState = ({ projectPath }: NoApiKeyStateProps) => {
  const navigate = useNavigate();
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8 text-center">
      <div className="w-10 h-10 rounded-full bg-(--bg-elevated) border border-(--border-subtle) flex items-center justify-center text-(--text-muted)">
        <LockIcon />
      </div>
      <div>
        <p className='text-[18px] font-["Bricolage_Grotesque",sans-serif] font-semibold text-(--text-primary) mb-1.5'>
          API key required
        </p>
        <p className="text-[15px] text-(--text-muted) max-w-xs leading-relaxed">
          Add your Anthropic API key in Settings to start generating drafts.
        </p>
      </div>
      <button
        onClick={() => navigate(`/${encodeProject(projectPath)}/settings`)}
        className="text-[14px] font-semibold text-(--accent) bg-(--accent)/10 border border-(--accent)/20 px-4 py-2 rounded-lg cursor-pointer hover:bg-(--accent)/15 transition-all duration-150"
      >
        Go to Settings → Profile
      </button>
    </div>
  );
};

// ── Input bar ─────────────────────────────────────────────────────────────────

interface InputBarProps {
  onSend: (text: string) => void;
  disabled: boolean;
  prefill?: string;
  onPrefillConsumed?: () => void;
}

const InputBar = ({ onSend, disabled, prefill, onPrefillConsumed }: InputBarProps) => {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Consume prefill from suggestion chips
  useEffect(() => {
    if (prefill) {
      setValue(prefill);
      onPrefillConsumed?.();
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
  }, [prefill, onPrefillConsumed]);

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) {
        onSend(value.trim());
        setValue("");
      }
    }
  };

  const handleSubmit = () => {
    if (value.trim() && !disabled) {
      onSend(value.trim());
      setValue("");
    }
  };

  const canSend = value.trim().length > 0 && !disabled;

  return (
    <div className="shrink-0 px-6 pb-7 pt-3">
      <div className="max-w-2xl mx-auto flex flex-col gap-2">
        <div className="flex items-end gap-3 bg-(--bg-elevated) border border-(--border-subtle) rounded-3xl px-5 py-4 shadow-lg shadow-black/30 transition-colors duration-150 focus-within:border-(--border-default)">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe an agent, skill, or project guide…"
            disabled={disabled}
            rows={1}
            className="flex-1 bg-transparent border-none outline-none ring-0 resize-none text-[15.5px] text-(--text-primary) placeholder:text-(--text-muted) leading-[1.65] py-0.5 min-h-6 disabled:opacity-50"
            style={{ maxHeight: 180, overflowY: "auto" }}
          />
          <button
            onClick={handleSubmit}
            disabled={!canSend}
            className={[
              "shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150 border-none mb-0.5",
              canSend
                ? "bg-(--accent) text-black cursor-pointer hover:opacity-85 active:scale-95"
                : "bg-(--bg-base) text-(--text-muted) cursor-not-allowed opacity-40",
            ].join(" ")}
          >
            {disabled
              ? <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
              : <SendIcon />}
          </button>
        </div>
        <p className="text-[11.5px] text-(--text-muted) text-center">
          <kbd className="font-mono bg-(--bg-elevated) border border-(--border-faint) rounded px-1 py-0.5 text-[10.5px]">↵ Enter</kbd>
          {" "}to send&ensp;·&ensp;
          <kbd className="font-mono bg-(--bg-elevated) border border-(--border-faint) rounded px-1 py-0.5 text-[10.5px]">⇧ Enter</kbd>
          {" "}for newline
        </p>
      </div>
    </div>
  );
};

// ── ChatInterface ─────────────────────────────────────────────────────────────

interface ChatInterfaceProps {
  projectPath: string;
}

export const ChatInterface = ({ projectPath }: ChatInterfaceProps) => {
  const { messages, isStreaming, buildingArtifact, sendMessage, noApiKey } = useAIDraft();
  const bottomRef = useRef<HTMLDivElement>(null);
  const { selectedProjectPath } = useShell();
  const [prefill, setPrefill] = useState<string | undefined>(undefined);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSuggest = useCallback((text: string) => {
    setPrefill(text);
  }, []);

  const showEmpty = messages.length === 0 && !noApiKey;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Message area */}
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
        {showEmpty && <EmptyState onSuggest={handleSuggest} />}
        {noApiKey && messages.length === 0 && (
          <NoApiKeyState projectPath={selectedProjectPath ?? projectPath} />
        )}
        {messages.length > 0 && (
          <div className="max-w-2xl mx-auto w-full px-6 py-10 flex flex-col gap-8">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {isStreaming && messages[messages.length - 1]?.role === "user" && !buildingArtifact && (
              <StreamingDots />
            )}
            {buildingArtifact && (
              <div className="flex items-center gap-3 py-1">
                <div className="flex gap-1 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-(--accent) animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-(--accent) animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-(--accent) animate-bounce [animation-delay:300ms]" />
                </div>
                <span className="text-[14px] text-(--text-muted)">
                  Drafting <span className="text-(--text-primary) font-medium">{buildingArtifact.name}</span>…
                </span>
              </div>
            )}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <InputBar
        onSend={sendMessage}
        disabled={isStreaming}
        prefill={prefill}
        onPrefillConsumed={() => setPrefill(undefined)}
      />
    </div>
  );
};

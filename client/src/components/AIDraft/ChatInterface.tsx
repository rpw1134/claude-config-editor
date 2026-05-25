import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAIDraft } from "../../contexts/AIDraftContext";
import { useShell } from "../../contexts/ShellContext";
import { encodeProject } from "../../lib/navigation";
import { LockIcon, SendIcon } from "../Icons";
import { MessageBubble } from "./MessageBubble";
import { StreamingDots } from "./StreamingDots";

// ── Empty state ───────────────────────────────────────────────────────────────

const EmptyState = () => (
  <div className="flex-1 flex flex-col items-center justify-center gap-3 px-8 text-center">
    <p className='text-[22px] font-["Bricolage_Grotesque",sans-serif] font-semibold text-(--text-primary) leading-tight'>
      AI Draft
    </p>
    <p className="text-[14px] text-(--text-muted) max-w-sm leading-relaxed">
      Describe the agent or skill you want to create, and I'll draft it for you.
    </p>
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
        <p className='text-[16px] font-["Bricolage_Grotesque",sans-serif] font-semibold text-(--text-primary) mb-1.5'>
          API key required
        </p>
        <p className="text-[13px] text-(--text-muted) max-w-xs leading-relaxed">
          Add your Anthropic API key in Settings to start generating drafts.
        </p>
      </div>
      <button
        onClick={() => navigate(`/${encodeProject(projectPath)}/settings`)}
        className="text-[13px] font-semibold text-(--accent) bg-(--accent)/10 border border-(--accent)/20 px-4 py-2 rounded-lg cursor-pointer hover:bg-(--accent)/15 transition-all duration-150"
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
}

const InputBar = ({ onSend, disabled }: InputBarProps) => {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const lineHeight = 22;
    const maxHeight = lineHeight * 5 + 16;
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
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
    <div className="shrink-0 px-4 pb-4 pt-2">
      <div className="flex items-end gap-2 bg-(--bg-surface) border border-(--border-subtle) rounded-2xl px-3.5 py-2.5 focus-within:border-(--accent)/40 transition-colors duration-150">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? "Generating…" : "Describe an agent or skill to create…"}
          disabled={disabled}
          rows={1}
          className="flex-1 bg-transparent border-none outline-none resize-none text-[14px] text-(--text-primary) placeholder:text-(--text-muted) leading-[22px] py-0 min-h-[22px] disabled:opacity-60"
          style={{ maxHeight: 110, overflowY: "auto" }}
        />
        <button
          onClick={handleSubmit}
          disabled={!canSend}
          className={[
            "shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150 border-none cursor-pointer",
            canSend
              ? "bg-(--accent) text-white hover:opacity-85"
              : "bg-(--bg-elevated) text-(--text-muted) cursor-not-allowed",
          ].join(" ")}
        >
          <SendIcon />
        </button>
      </div>
      <p className="mt-1.5 text-[11px] text-(--text-muted) text-center">
        Enter to send · Shift+Enter for newline
      </p>
    </div>
  );
};

// ── ChatInterface ─────────────────────────────────────────────────────────────

interface ChatInterfaceProps {
  projectPath: string;
}

export const ChatInterface = ({ projectPath }: ChatInterfaceProps) => {
  const { messages, isStreaming, sendMessage, noApiKey } = useAIDraft();
  const bottomRef = useRef<HTMLDivElement>(null);
  const { selectedProjectPath } = useShell();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const showEmpty = messages.length === 0 && !noApiKey;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Message area */}
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
        {showEmpty && <EmptyState />}
        {noApiKey && messages.length === 0 && (
          <NoApiKeyState projectPath={selectedProjectPath ?? projectPath} />
        )}
        {messages.length > 0 && (
          <div className="flex flex-col gap-2 py-4">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {isStreaming && messages[messages.length - 1]?.role === "user" && (
              <div className="px-4">
                <StreamingDots />
              </div>
            )}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <InputBar onSend={sendMessage} disabled={isStreaming} />
    </div>
  );
};

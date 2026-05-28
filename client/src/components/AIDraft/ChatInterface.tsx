import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAIDraft } from "../../contexts/AIDraftContext";
import { useShell } from "../../contexts/ShellContext";
import { encodeProject } from "../../lib/navigation";
import { LockIcon, SendIcon, XIcon } from "../Icons";
import { MessageBubble } from "./MessageBubble";
import { StrydeStatusIcon } from "./StrydeStatusIcon";

// ── Greetings ─────────────────────────────────────────────────────────────────

const GREETINGS = [
  "Hey hey hey!",
  "Let's build something.",
  "What are we making?",
  "Ready when you are.",
  "Hello there!",
  "Good to see you.",
  "What's the plan?",
  "Let's get to work.",
  "What'll it be?",
  "Hey, you're back!",
  "What are we cooking?",
  "Let's make something great.",
  "Hi! What do you need?",
  "Okay, let's do this.",
  "What's on your mind?",
] as const;

const greeting = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];

// ── Prompt tokens ─────────────────────────────────────────────────────────────

const PROMPT_CATEGORIES: Record<string, string[]> = {
  Agents: [
    "A code review agent",
    "A TypeScript debugging agent",
    "A security auditor agent",
    "A documentation writer agent",
    "A test writer agent",
    "An accessibility reviewer agent",
    "A performance profiler agent",
    "A refactoring assistant agent",
    "A PR reviewer agent",
    "A dependency auditor agent",
    "A log analyzer agent",
    "A database query optimizer agent",
  ],
  Skills: [
    "A git commit skill",
    "A deploy to production skill",
    "A run tests skill",
    "A lint and format skill",
    "A changelog generator skill",
    "A database migration skill",
    "A Docker build skill",
    "A branch cleanup skill",
    "An API health check skill",
    "A npm publish skill",
    "A stash and restore skill",
    "A coverage report skill",
  ],
  "CLAUDE.md": [
    "CLAUDE.md for a React project",
    "CLAUDE.md for a Node.js API",
    "CLAUDE.md for a Python CLI",
    "CLAUDE.md for a monorepo",
    "CLAUDE.md for a Go service",
    "CLAUDE.md for a data science project",
    "CLAUDE.md for a Rust project",
    "CLAUDE.md for an open-source library",
    "CLAUDE.md for a startup codebase",
    "CLAUDE.md with strict security rules",
    "CLAUDE.md for a team of 10+",
    "CLAUDE.md for a mobile app",
  ],
  Hooks: [
    "A pre-commit code formatter",
    "A pre-push test runner",
    "A commit message validator",
    "A secrets scanner hook",
    "A lint check on save",
    "A post-commit notification",
    "A branch name enforcer",
    "A file size checker",
    "A TODO comment reminder",
    "A license header checker",
  ],
  MCP: [
    "MCP server for GitHub",
    "MCP server for Jira",
    "MCP server for Slack",
    "MCP server for Postgres",
    "MCP server for Notion",
    "MCP server for Linear",
    "MCP server for AWS S3",
    "MCP server for Stripe",
    "MCP server for Figma",
    "MCP server for Datadog",
    "MCP server for PagerDuty",
  ],
};

function pickRandom<T>(arr: T[], n: number): T[] {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, n);
}

interface PromptTokensProps {
  onSelect: (text: string) => void;
}

const PromptTokens = ({ onSelect }: PromptTokensProps) => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [shownPrompts, setShownPrompts] = useState<string[]>([]);
  const isOpen = activeCategory !== null;

  const handleCategory = (cat: string) => {
    if (activeCategory === cat) {
      setActiveCategory(null);
    } else {
      setActiveCategory(cat);
      setShownPrompts(pickRandom(PROMPT_CATEGORIES[cat], 3));
    }
  };

  const handleClose = () => setActiveCategory(null);

  return (
    <div className="w-full">
      {/* Category pills — slide up + fade when panel opens */}
      <div
        className="overflow-hidden transition-all duration-250 ease-in-out"
        style={{ maxHeight: isOpen ? 0 : 56, opacity: isOpen ? 0 : 1 }}
      >
        <div className="flex justify-center gap-3 pb-1">
          {Object.keys(PROMPT_CATEGORIES).map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategory(cat)}
              className="px-5 py-2.5 rounded-full text-[14px] font-medium text-(--text-muted) border border-(--border-subtle) bg-transparent hover:border-(--border-default) hover:text-(--text-secondary) transition-colors duration-150 cursor-pointer whitespace-nowrap"
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Prompt panel — slides down + fades in */}
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: isOpen ? 400 : 0, opacity: isOpen ? 1 : 0 }}
      >
        <div className="bg-(--bg-elevated) border border-(--border-subtle) rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-2.5 border-b border-(--border-faint)">
            <span className="text-[13px] font-medium text-(--text-muted) tracking-wide uppercase">
              {activeCategory}
            </span>
            <button
              onClick={handleClose}
              className="text-(--text-muted) hover:text-(--text-primary) transition-colors cursor-pointer"
            >
              <XIcon />
            </button>
          </div>
          {shownPrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => { onSelect(prompt); handleClose(); }}
              className={[
                "w-full text-left px-5 py-3 text-[14px] text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--bg-hover) transition-colors cursor-pointer",
                i < shownPrompts.length - 1 ? "border-b border-(--border-faint)" : "",
              ].join(" ")}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

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
        <p className="text-[18px] font-semibold text-(--text-primary) mb-1.5">
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

// ── Input field ───────────────────────────────────────────────────────────────

interface InputFieldProps {
  onSend: (text: string) => void;
  disabled: boolean;
  prefill?: string;
  onPrefillConsumed?: () => void;
  onHasText?: (hasText: boolean) => void;
  compact?: boolean;
}

const InputField = ({ onSend, disabled, prefill, onPrefillConsumed, onHasText, compact }: InputFieldProps) => {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (prefill) {
      setValue(prefill);
      onPrefillConsumed?.();
      requestAnimationFrame(() => textareaRef.current?.focus());
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
        onHasText?.(false);
      }
    }
  };

  const canSend = value.trim().length > 0 && !disabled;

  const handleSubmit = () => {
    if (canSend) {
      onSend(value.trim());
      setValue("");
      onHasText?.(false);
    }
  };

  return (
    <div className={`w-full bg-(--bg-elevated) border border-(--border-subtle) rounded-3xl shadow-lg shadow-black/30 focus-within:border-(--border-default) transition-colors duration-150 ${compact ? "p-3" : "p-4"}`}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => { setValue(e.target.value); onHasText?.(e.target.value.length > 0); }}
        onKeyDown={handleKeyDown}
        placeholder="Describe an agent or skill…"
        disabled={disabled}
        rows={1}
        className={`w-full bg-transparent border-none outline-none ring-0 resize-none text-[16px] text-(--text-primary) placeholder:text-(--text-muted) leading-[1.65] disabled:opacity-50 ${compact ? "min-h-8" : "min-h-13"}`}
        style={{ maxHeight: 180, overflowY: "auto" }}
      />
      <div className="flex justify-end mt-2">
        <button
          onClick={handleSubmit}
          disabled={!canSend}
          aria-label="Send"
          className={[
            "w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 border-none cursor-pointer",
            canSend
              ? "bg-(--accent) text-black opacity-100 hover:opacity-85 active:scale-95"
              : "opacity-0 pointer-events-none",
          ].join(" ")}
        >
          {disabled
            ? <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
            : <SendIcon />}
        </button>
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activePairRef = useRef<HTMLDivElement>(null);
  const { selectedProjectPath } = useShell();
  const [prefill, setPrefill] = useState<string | undefined>(undefined);
  const [hasText, setHasText] = useState(false);
  const [tailSpace, setTailSpace] = useState(0);

  // Scroll the latest user message to the top only when a new exchange is added.
  // Never auto-scroll during streaming — the user controls the viewport.
  useEffect(() => {
    if (messages.length < 2) return;
    const lastUserMsg = messages[messages.length - 2];
    if (lastUserMsg?.role !== "user") return;

    // Two rAFs: first fires after React commits, second fires after the browser
    // has done a full reflow, so getBoundingClientRect reflects the new layout.
    let raf1: number;
    let raf2: number;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        const el = document.getElementById(`msg-${lastUserMsg.id}`);
        const container = scrollContainerRef.current;
        if (!el || !container) return;

        // Walk the offsetParent chain to get el's top relative to the scroll container.
        let offsetTop = 0;
        let node: HTMLElement | null = el;
        while (node && node !== container) {
          offsetTop += node.offsetTop;
          node = node.offsetParent as HTMLElement | null;
        }

        container.scrollTo({ top: offsetTop, behavior: "smooth" });
      });
    });
    return () => { cancelAnimationFrame(raf1); cancelAnimationFrame(raf2); };
  }, [messages.length]);

  const showEmpty = messages.length === 0 && !noApiKey;

  useEffect(() => {
    const container = scrollContainerRef.current;
    const activePair = activePairRef.current;

    if (!container || !activePair) {
      setTailSpace(0);
      return;
    }

    const updateTailSpace = () => {
      const availableHeight = container.clientHeight;
      const activeHeight = activePair.offsetHeight;
      setTailSpace(Math.max(0, availableHeight - activeHeight));
    };

    updateTailSpace();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateTailSpace);
      return () => window.removeEventListener("resize", updateTailSpace);
    }

    const observer = new ResizeObserver(updateTailSpace);
    observer.observe(container);
    observer.observe(activePair);

    return () => observer.disconnect();
  }, [messages.length, isStreaming, buildingArtifact]);

  // ── Empty landing ──────────────────────────────────────────────────────────
  if (showEmpty) {
    return (
      <div className="flex flex-col flex-1 min-h-0 items-center px-8">
        {/* Top spacer — mirrors bottom spacer so content stays centered */}
        <div className="flex-1" />

        {/* Fixed content: logo + heading + input — never moves */}
        <div className="w-full max-w-2xl flex flex-col items-center gap-8">
          <div className="flex flex-col items-center gap-5 text-center">
            <StrydeStatusIcon status="idle" size={44} />
            <h1 className="text-[52px] font-bold text-(--text-primary) leading-[1.05] tracking-[-0.03em]">
              {greeting}
            </h1>
          </div>
          <InputField
            onSend={sendMessage}
            disabled={isStreaming}
            prefill={prefill}
            onPrefillConsumed={() => setPrefill(undefined)}
            onHasText={setHasText}
          />
        </div>

        {/* Bottom spacer — tokens expand here, never pushes input */}
        <div className="flex-1 w-full max-w-2xl pt-6 min-h-0">
          <div
            className="overflow-hidden transition-all duration-300 ease-in-out"
            style={{ maxHeight: hasText ? 0 : 500, opacity: hasText ? 0 : 1 }}
          >
            <PromptTokens onSelect={setPrefill} />
          </div>
        </div>
      </div>
    );
  }

  // ── No API key ─────────────────────────────────────────────────────────────
  if (noApiKey) {
    return (
      <div className="flex flex-col flex-1 min-h-0">
        <NoApiKeyState projectPath={selectedProjectPath ?? projectPath} />
      </div>
    );
  }

  // Group messages into [user, assistant?] pairs so each exchange renders as a single block.
  const pairs: { user: typeof messages[0]; assistant?: typeof messages[0] }[] = [];
  for (let i = 0; i < messages.length; i++) {
    if (messages[i].role === "user") {
      const assistant = messages[i + 1]?.role === "assistant" ? messages[i + 1] : undefined;
      pairs.push({ user: messages[i], assistant });
      if (assistant) i++;
    }
  }
  const lastPairIdx = pairs.length - 1;

  // ── Active conversation ────────────────────────────────────────────────────
  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto relative">
        <div className="w-[80%] mx-auto">
          {pairs.map(({ user, assistant }, idx) => (
            <div
              key={user.id}
              ref={idx === lastPairIdx ? activePairRef : undefined}
              className={`flex flex-col gap-6 pt-6 pb-4`}
            >
              <div id={`msg-${user.id}`}>
                <MessageBubble message={user} />
              </div>
              <div className="flex flex-col gap-3">
                {assistant && (
                  <div id={`msg-${assistant.id}`}>
                    <MessageBubble message={assistant} isLastAssistant={idx === lastPairIdx} />
                  </div>
                )}
                {idx === lastPairIdx && isStreaming && !assistant && !buildingArtifact && (
                  <StrydeStatusIcon status="listening" size={28} />
                )}
                {idx === lastPairIdx && buildingArtifact && (
                  <div className="flex items-center gap-3 py-1">
                    <StrydeStatusIcon status="thinking" size={28} />
                    <span className="thinking-text text-[14px]">
                      Drafting {buildingArtifact.name}…
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
          {lastPairIdx >= 0 && <div aria-hidden="true" style={{ height: Math.max(40, tailSpace) }} />}
        </div>
      </div>
      <div className="shrink-0 relative">
        <div className="absolute -top-10 left-0 right-0 h-10 bg-linear-to-b from-transparent to-(--bg-base) pointer-events-none" />
        <div className="bg-(--bg-base) px-4 pb-6 pt-2">
          <div className="w-[88%] mx-auto chat-input-enter">
            <InputField onSend={sendMessage} disabled={isStreaming} compact />
          </div>
        </div>
      </div>
    </div>
  );
};

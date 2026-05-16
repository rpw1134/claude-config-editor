import { useEffect, useRef, useState } from "react";
import { useBlocker } from "react-router-dom";
import { createAgent } from "../lib/api";

export interface AgentCreateFlowProps {
  projectPath: string;
  onCreated: (name: string) => void;
  onCancel: () => void;
}

type ModelOption =
  | "claude-opus-4-7"
  | "claude-sonnet-4-6"
  | "claude-haiku-4-5-20251001";

const MODELS: { value: ModelOption; label: string; note: string }[] = [
  { value: "claude-opus-4-7", label: "Claude Opus 4.7", note: "Most capable" },
  {
    value: "claude-sonnet-4-6",
    label: "Claude Sonnet 4.6",
    note: "Balanced — default",
  },
  {
    value: "claude-haiku-4-5-20251001",
    label: "Claude Haiku 4.5",
    note: "Fastest",
  },
];

const DEFAULT_MODEL: ModelOption = "claude-sonnet-4-6";

type PermissionMode =
  | "default"
  | "acceptEdits"
  | "auto"
  | "dontAsk"
  | "bypassPermissions"
  | "plan";
type EffortLevel = "low" | "medium" | "high" | "xhigh" | "max";
type MemoryScope = "user" | "project" | "local";

const PERMISSION_MODES: { value: PermissionMode; note: string }[] = [
  { value: "default", note: "Standard prompting" },
  { value: "acceptEdits", note: "Auto-accept file edits" },
  { value: "auto", note: "Auto-approve safe actions" },
  { value: "dontAsk", note: "Skip most confirmations" },
  { value: "bypassPermissions", note: "No permission checks" },
  { value: "plan", note: "Plan mode only" },
];

const EFFORT_LEVELS: { value: EffortLevel; note: string }[] = [
  { value: "low", note: "" },
  { value: "medium", note: "" },
  { value: "high", note: "" },
  { value: "xhigh", note: "Extra high" },
  { value: "max", note: "Maximum" },
];

const MEMORY_SCOPES: { value: MemoryScope; note: string }[] = [
  { value: "user", note: "Cross-project user memories" },
  { value: "project", note: "Per-project memories" },
  { value: "local", note: "Local session only" },
];

interface ColorSwatch {
  name: string;
  bg: string;
  ring: string;
}

const COLORS: ColorSwatch[] = [
  { name: "red", bg: "#ef4444", ring: "rgba(239,68,68,0.35)" },
  { name: "orange", bg: "#f97316", ring: "rgba(249,115,22,0.35)" },
  { name: "yellow", bg: "#eab308", ring: "rgba(234,179,8,0.35)" },
  { name: "green", bg: "#22c55e", ring: "rgba(34,197,94,0.35)" },
  { name: "teal", bg: "#14b8a6", ring: "rgba(20,184,166,0.35)" },
  { name: "blue", bg: "#3b82f6", ring: "rgba(59,130,246,0.35)" },
  { name: "purple", bg: "#a855f7", ring: "rgba(168,85,247,0.35)" },
  { name: "pink", bg: "#ec4899", ring: "rgba(236,72,153,0.35)" },
];

const NAME_PATTERN = /^[a-zA-Z0-9_-]+$/;

function agentsDirDisplay(projectPath: string): string {
  const isGlobal = projectPath.endsWith('/.claude');
  if (isGlobal) return '~/.claude/agents/';
  const home = projectPath.match(/^(\/Users\/[^/]+|\/home\/[^/]+)\//)?.[1];
  const shortened = home ? projectPath.replace(home, '~') : projectPath;
  return `${shortened}/.claude/agents/`;
}

const ChevronDownIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path
      d="M3 5L7 9L11 5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path
      d="M2 6L5 9L10 3"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path
      d="M3 7H11M8 4L11 7L8 10"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path
      d="M3 3L13 13M13 3L3 13"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

interface StepDotsProps {
  total: number;
  current: number;
  onGoTo: (index: number) => void;
}

const StepDots = ({ total, current, onGoTo }: StepDotsProps) => (
  <div className="flex items-center gap-2.5">
    {Array.from({ length: total }).map((_, i) => {
      const completed = i < current;
      const active = i === current;
      const future = i > current;
      return (
        <button
          key={i}
          disabled={future}
          onClick={() => (completed ? onGoTo(i) : undefined)}
          aria-label={`Step ${i + 1}`}
          className="rounded-full border-none p-0 shrink-0 focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2"
          style={{
            width: active ? 10 : 8,
            height: active ? 10 : 8,
            background: future ? "var(--text-muted)" : "var(--accent)",
            cursor: completed ? "pointer" : "default",
            transition: "width 200ms, height 200ms, background 200ms",
          }}
        />
      );
    })}
  </div>
);

interface StepHeadingProps {
  heading: string;
  subtext: React.ReactNode;
}

const StepHeading = ({ heading, subtext }: StepHeadingProps) => (
  <div className="mb-6">
    <h1 className="m-0 mb-3 text-4xl font-['Bricolage_Grotesque',sans-serif] font-bold tracking-[-0.02em] leading-[1.1] text-(--text-primary)">
      {heading}
    </h1>
    <p className="m-0 text-[14px] text-(--text-secondary) leading-[1.55]">
      {subtext}
    </p>
  </div>
);

const InlineError = ({ message }: { message: string }) => (
  <p className="mt-2 text-[13px] text-(--error) font-['Fira_Code',monospace]">
    {message}
  </p>
);

interface AccordionSectionProps {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  buttonRef?: React.RefObject<HTMLButtonElement | null>;
}

const AccordionSection = ({
  title,
  open,
  onToggle,
  children,
  buttonRef,
}: AccordionSectionProps) => {
  return (
    <div className="border border-(--border-subtle) rounded-3.5 overflow-hidden shrink-0">
      <button
        ref={buttonRef}
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left bg-transparent border-none cursor-pointer text-(--text-primary) transition-colors duration-150 hover:bg-(--bg-hover) focus-visible:outline-2 focus-visible:outline-(--accent)"
      >
        <span className="text-[15px] font-semibold">{title}</span>
        <span
          className="text-(--text-muted) transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          <ChevronDownIcon />
        </span>
      </button>
      <div
        className="overflow-hidden"
        style={{
          maxHeight: open ? 400 : 0,
          transition: "max-height 260ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div className="px-5 pb-5 pt-1">{children}</div>
      </div>
    </div>
  );
};

interface DiscardModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

const DiscardModal = ({ onConfirm, onCancel }: DiscardModalProps) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="bg-(--bg-surface) rounded-4.5 border border-(--border-subtle) p-8 max-w-90 w-full mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="m-0 mb-2 text-[20px] font-bold text-(--text-primary)">
          Discard this agent?
        </h2>
        <p className="m-0 mb-6 text-[14px] text-(--text-secondary)">
          You'll lose everything you've entered so far.
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={onConfirm}
            className="px-5 py-2.5 rounded-2.5 text-[14px] font-medium text-white bg-(--error) border-none cursor-pointer transition-colors duration-150"
          >
            Discard
          </button>
          <button
            onClick={onCancel}
            className="text-[14px] text-(--text-muted) bg-transparent border-none cursor-pointer transition-colors duration-150 hover:text-(--text-secondary)"
          >
            Keep editing
          </button>
        </div>
      </div>
    </div>
  );
};

interface StepNameProps {
  value: string;
  onChange: (v: string) => void;
  error: string | null;
  onContinue: () => void;
  projectPath: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

const StepName = ({
  value,
  onChange,
  error,
  onContinue,
  projectPath,
  inputRef,
}: StepNameProps) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") onContinue();
  };

  const displayPath = agentsDirDisplay(projectPath);

  return (
    <div>
      <StepHeading
        heading="What should we call this agent?"
        subtext={
          <>
            Give your agent a unique name. This becomes its filename in{" "}
            <code className="font-['Fira_Code',monospace] text-[13px] bg-(--bg-hover) border border-(--border-subtle) rounded px-1 py-px">
              {displayPath}
            </code>
            .
          </>
        }
      />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="e.g. engineer, reviewer, tutor"
        className={[
          "w-full px-4 py-4 rounded-3.5 text-lg text-(--text-primary) bg-(--bg-surface) outline-none ring-0 focus:ring-0 focus:outline-none box-border transition-colors duration-150",
          "placeholder:text-(--text-muted)",
          error
            ? "border border-[rgba(248,113,113,0.5)]"
            : "border border-(--border-subtle) focus:border-(--accent)",
        ].join(" ")}
      />
      {error && <InlineError message={error} />}
      <div className="mt-6">
        <button
          onClick={onContinue}
          className="flex items-center gap-2 px-5 py-2.75 rounded-2.5 bg-(--accent) text-white text-[15px] font-medium border-none cursor-pointer transition-colors duration-150 hover:bg-(--accent-hover) focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2"
        >
          Continue
          <ArrowRightIcon />
        </button>
      </div>
    </div>
  );
};

interface StepDescriptionProps {
  value: string;
  onChange: (v: string) => void;
  onContinue: () => void;
  onBack: () => void;
  inputRef?: React.RefObject<HTMLTextAreaElement | null>;
}

const StepDescription = ({
  value,
  onChange,
  onContinue,
  onBack,
  inputRef,
}: StepDescriptionProps) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onContinue();
    }
  };

  return (
    <div>
      <StepHeading
        heading="What does this agent do?"
        subtext="A short summary of this agent's role. Shown in listings and helps Claude route tasks to it."
      />
      <textarea
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="e.g. A senior engineer focused on code review, refactoring, and architecture decisions."
        rows={4}
        className="w-full px-4 py-4 rounded-3.5 text-[15px] text-(--text-primary) bg-(--bg-surface) border border-(--border-subtle) outline-none ring-0 focus:ring-0 focus:outline-none box-border transition-colors duration-150 leading-relaxed placeholder:text-(--text-muted) focus:border-(--accent) resize-none overflow-y-auto"
      />
      <div className="mt-6 flex items-center gap-4">
        <button
          onClick={onContinue}
          className="flex items-center gap-2 px-5 py-2.75 rounded-2.5 bg-(--accent) text-white text-[15px] font-medium border-none cursor-pointer transition-colors duration-150 hover:bg-(--accent-hover) focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2"
        >
          Continue
          <ArrowRightIcon />
        </button>
        <button
          onClick={onBack}
          className="text-[14px] text-(--text-muted) bg-transparent border-none cursor-pointer transition-colors duration-150 hover:text-(--text-secondary) focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2 rounded-md"
        >
          ← Back
        </button>
      </div>
    </div>
  );
};

interface StepOptionsProps {
  model: ModelOption;
  onModelChange: (m: ModelOption) => void;
  color: string | null;
  onColorChange: (c: string | null) => void;
  permissionMode: PermissionMode | null;
  onPermissionModeChange: (m: PermissionMode | null) => void;
  effort: EffortLevel | null;
  onEffortChange: (e: EffortLevel | null) => void;
  memory: MemoryScope | null;
  onMemoryChange: (m: MemoryScope | null) => void;
  background: boolean;
  onBackgroundChange: (b: boolean) => void;
  isolation: boolean;
  onIsolationChange: (b: boolean) => void;
  maxTurns: string;
  onMaxTurnsChange: (v: string) => void;
  tools: string;
  onToolsChange: (v: string) => void;
  disallowedTools: string;
  onDisallowedToolsChange: (v: string) => void;
  skills: string;
  onSkillsChange: (v: string) => void;
  initialPrompt: string;
  onInitialPromptChange: (v: string) => void;
  onContinue: () => void;
  onBack: () => void;
  firstButtonRef?: React.RefObject<HTMLButtonElement | null>;
}

const radioRow = (active: boolean) =>
  [
    "w-full flex items-center justify-between px-4 py-3 rounded-2.5 text-left border cursor-pointer transition-colors duration-150",
    active
      ? "bg-(--accent-dim) border-(--accent) text-(--text-primary)"
      : "bg-transparent border-(--border-subtle) text-(--text-secondary) hover:border-(--border-default) hover:text-(--text-primary)",
  ].join(" ");

const fieldInput =
  "w-full px-4 py-3 rounded-3 text-[14px] text-(--text-primary) bg-(--bg-surface) border border-(--border-subtle) outline-none ring-0 focus:ring-0 focus:outline-none box-border transition-colors duration-150 placeholder:text-(--text-muted) focus:border-(--accent)";

const Toggle = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
  <button
    onClick={onToggle}
    className="relative shrink-0 border-none cursor-pointer p-0 bg-transparent focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2 rounded-2.75 w-10 h-5.5"
    aria-pressed={on}
  >
    <span
      className="block w-full h-full rounded-2.75"
      style={{
        background: on ? "var(--accent)" : "var(--border-default)",
        transition: "background 150ms",
      }}
    />
    <span
      className="absolute top-0.75 w-4 h-4 rounded-full bg-white"
      style={{
        left: on ? 21 : 3,
        transition: "left 150ms",
      }}
    />
  </button>
);

function StepOptions({
  model,
  onModelChange,
  color,
  onColorChange,
  permissionMode,
  onPermissionModeChange,
  effort,
  onEffortChange,
  memory,
  onMemoryChange,
  background,
  onBackgroundChange,
  isolation,
  onIsolationChange,
  maxTurns,
  onMaxTurnsChange,
  tools,
  onToolsChange,
  disallowedTools,
  onDisallowedToolsChange,
  skills,
  onSkillsChange,
  initialPrompt,
  onInitialPromptChange,
  onContinue,
  onBack,
  firstButtonRef,
}: StepOptionsProps) {
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggle = (title: string) =>
    setOpenSection((prev) => (prev === title ? null : title));

  return (
    <div className="flex flex-col h-full">
      {/* Fixed top */}
      <StepHeading
        heading="Fine-tune the behavior"
        subtext="All optional. You can change these at any time in the editor."
      />

      {/* Scrollable middle */}
      <div className="flex flex-col gap-2 mb-6 flex-1 overflow-y-auto min-h-0">
        <AccordionSection
          title="Model"
          open={openSection === "Model"}
          onToggle={() => toggle("Model")}
          buttonRef={firstButtonRef}
        >
          <div className="flex flex-col gap-1.5 pt-1">
            {MODELS.map((m) => (
              <button
                key={m.value}
                onClick={() => onModelChange(m.value)}
                className={
                  radioRow(model === m.value) +
                  " focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2"
                }
              >
                <span className="text-[14px] font-medium">{m.label}</span>
                <span className="text-[12px] text-(--text-muted)">
                  {m.note}
                </span>
              </button>
            ))}
          </div>
        </AccordionSection>

        <AccordionSection
          title="Color"
          open={openSection === "Color"}
          onToggle={() => toggle("Color")}
        >
          <div className="flex gap-3 flex-wrap pt-1">
            {COLORS.map((c) => (
              <button
                key={c.name}
                onClick={() => onColorChange(color === c.name ? null : c.name)}
                aria-label={c.name}
                title={c.name}
                style={{
                  background: c.bg,
                  outline:
                    color === c.name
                      ? `3px solid ${c.ring}`
                      : "3px solid transparent",
                  outlineOffset: 2,
                  transition: "outline 150ms",
                }}
                className="w-8 h-8 rounded-full border-none cursor-pointer flex items-center justify-center focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-[5px]"
              >
                {color === c.name && (
                  <span className="text-white">
                    <CheckIcon />
                  </span>
                )}
              </button>
            ))}
          </div>
        </AccordionSection>

        <AccordionSection
          title="Permission Mode"
          open={openSection === "Permission Mode"}
          onToggle={() => toggle("Permission Mode")}
        >
          <div className="flex flex-col gap-1.5 pt-1">
            {PERMISSION_MODES.map((p) => (
              <button
                key={p.value}
                onClick={() =>
                  onPermissionModeChange(
                    permissionMode === p.value ? null : p.value,
                  )
                }
                className={
                  radioRow(permissionMode === p.value) +
                  " focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2"
                }
              >
                <span className="text-[14px] font-medium">{p.value}</span>
                <span className="text-[12px] text-(--text-muted)">
                  {p.note}
                </span>
              </button>
            ))}
          </div>
        </AccordionSection>

        <AccordionSection
          title="Effort"
          open={openSection === "Effort"}
          onToggle={() => toggle("Effort")}
        >
          <div className="flex flex-col gap-1.5 pt-1">
            {EFFORT_LEVELS.map((e) => (
              <button
                key={e.value}
                onClick={() =>
                  onEffortChange(effort === e.value ? null : e.value)
                }
                className={
                  radioRow(effort === e.value) +
                  " focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2"
                }
              >
                <span className="text-[14px] font-medium">{e.value}</span>
                {e.note && (
                  <span className="text-[12px] text-(--text-muted)">
                    {e.note}
                  </span>
                )}
              </button>
            ))}
          </div>
        </AccordionSection>

        <AccordionSection
          title="Memory"
          open={openSection === "Memory"}
          onToggle={() => toggle("Memory")}
        >
          <div className="flex flex-col gap-1.5 pt-1">
            {MEMORY_SCOPES.map((m) => (
              <button
                key={m.value}
                onClick={() =>
                  onMemoryChange(memory === m.value ? null : m.value)
                }
                className={
                  radioRow(memory === m.value) +
                  " focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2"
                }
              >
                <span className="text-[14px] font-medium">{m.value}</span>
                <span className="text-[12px] text-(--text-muted)">
                  {m.note}
                </span>
              </button>
            ))}
          </div>
        </AccordionSection>

        <AccordionSection
          title="Tools"
          open={openSection === "Tools"}
          onToggle={() => toggle("Tools")}
        >
          <div className="flex flex-col gap-3 pt-1">
            <div>
              <p className="text-[12px] text-(--text-muted) mb-1.5">
                Allowed tools — comma-separated. Leave empty to inherit all.
              </p>
              <input
                type="text"
                value={tools}
                onChange={(e) => onToolsChange(e.target.value)}
                placeholder="e.g. Read, Write, Bash"
                className={fieldInput}
              />
            </div>
            <div>
              <p className="text-[12px] text-(--text-muted) mb-1.5">
                Disallowed tools — removed from inherited or specified list.
              </p>
              <input
                type="text"
                value={disallowedTools}
                onChange={(e) => onDisallowedToolsChange(e.target.value)}
                placeholder="e.g. WebSearch, WebFetch"
                className={fieldInput}
              />
            </div>
          </div>
        </AccordionSection>

        <AccordionSection
          title="Skills"
          open={openSection === "Skills"}
          onToggle={() => toggle("Skills")}
        >
          <div className="pt-1">
            <p className="text-[12px] text-(--text-muted) mb-1.5">
              Comma-separated skill names to preload into context at startup.
            </p>
            <input
              type="text"
              value={skills}
              onChange={(e) => onSkillsChange(e.target.value)}
              placeholder="e.g. ship-pr, review"
              className={fieldInput}
            />
          </div>
        </AccordionSection>

        <AccordionSection
          title="Max Turns"
          open={openSection === "Max Turns"}
          onToggle={() => toggle("Max Turns")}
        >
          <div className="pt-1">
            <p className="text-[12px] text-(--text-muted) mb-1.5">
              Maximum agentic turns before the subagent stops.
            </p>
            <input
              type="number"
              min={1}
              value={maxTurns}
              onChange={(e) => onMaxTurnsChange(e.target.value)}
              placeholder="e.g. 10"
              className={fieldInput}
            />
          </div>
        </AccordionSection>

        <AccordionSection
          title="Initial Prompt"
          open={openSection === "Initial Prompt"}
          onToggle={() => toggle("Initial Prompt")}
        >
          <div className="pt-1">
            <p className="text-[12px] text-(--text-muted) mb-1.5">
              Auto-submitted as the first user turn when run as the main session
              agent.
            </p>
            <textarea
              value={initialPrompt}
              onChange={(e) => onInitialPromptChange(e.target.value)}
              placeholder="e.g. Start by reading CLAUDE.md then summarize the repo."
              rows={3}
              className={
                fieldInput + " leading-relaxed resize-none overflow-y-auto"
              }
            />
          </div>
        </AccordionSection>

        <AccordionSection
          title="Behavior"
          open={openSection === "Behavior"}
          onToggle={() => toggle("Behavior")}
        >
          <div className="flex flex-col gap-4 pt-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[14px] font-medium text-(--text-primary) m-0">
                  Background
                </p>
                <p className="text-[12px] text-(--text-muted) m-0 mt-0.5">
                  Always run as a background task.
                </p>
              </div>
              <Toggle
                on={background}
                onToggle={() => onBackgroundChange(!background)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[14px] font-medium text-(--text-primary) m-0">
                  Isolation
                </p>
                <p className="text-[12px] text-(--text-muted) m-0 mt-0.5">
                  Run in a temporary git worktree.
                </p>
              </div>
              <Toggle
                on={isolation}
                onToggle={() => onIsolationChange(!isolation)}
              />
            </div>
          </div>
        </AccordionSection>
      </div>

      {/* Fixed bottom */}
      <div className="flex items-center gap-4 pt-2 pb-1">
        <button
          onClick={onContinue}
          className="flex items-center gap-2 px-5 py-2.75 rounded-2.5 bg-(--accent) text-white text-[15px] font-medium border-none cursor-pointer transition-colors duration-150 hover:bg-(--accent-hover) focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2"
        >
          Continue <ArrowRightIcon />
        </button>
        <button
          onClick={onBack}
          className="text-[14px] text-(--text-muted) bg-transparent border-none cursor-pointer transition-colors duration-150 hover:text-(--text-secondary) focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2 rounded-md"
        >
          ← Back
        </button>
      </div>
    </div>
  );
}

// Lightweight markdown-to-HTML converter. Handles the common subset needed for
// system prompts: fenced code blocks, headings, bold, italic, inline code,
// unordered lists, and paragraphs. Does NOT sanitize — used only for local
// content typed by the user in this session.
function renderMarkdown(md: string): string {
  let html = md;

  // Fenced code blocks (``` ... ```)
  html = html.replace(/```[\w]*\n?([\s\S]*?)```/g, (_, code) => {
    const escaped = code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    return `<pre style="background:var(--bg-hover);border:1px solid var(--border-subtle);border-radius:8px;padding:12px 14px;overflow-x:auto;font-family:'Fira Code',monospace;font-size:13px;line-height:1.5;margin:12px 0"><code>${escaped}</code></pre>`;
  });

  // Split into lines for block-level processing
  const lines = html.split("\n");
  const out: string[] = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Already-processed HTML blocks (pre) — pass through
    if (line.startsWith("<pre")) {
      out.push(line);
      inList = false;
      continue;
    }

    // Headings
    const h3 = line.match(/^### (.+)/);
    const h2 = line.match(/^## (.+)/);
    const h1 = line.match(/^# (.+)/);
    if (h3) {
      if (inList) {
        out.push("</ul>");
        inList = false;
      }
      out.push(
        `<h3 style="font-size:15px;font-weight:600;margin:16px 0 6px">${h3[1]}</h3>`,
      );
      continue;
    }
    if (h2) {
      if (inList) {
        out.push("</ul>");
        inList = false;
      }
      out.push(
        `<h2 style="font-size:18px;font-weight:700;margin:20px 0 8px">${h2[1]}</h2>`,
      );
      continue;
    }
    if (h1) {
      if (inList) {
        out.push("</ul>");
        inList = false;
      }
      out.push(
        `<h1 style="font-size:22px;font-weight:700;margin:20px 0 8px">${h1[1]}</h1>`,
      );
      continue;
    }

    // Unordered list items
    const li = line.match(/^[-*] (.+)/);
    if (li) {
      if (!inList) {
        out.push('<ul style="margin:8px 0 8px 20px;padding:0">');
        inList = true;
      }
      out.push(`<li style="margin:3px 0">${inlineMarkdown(li[1])}</li>`);
      continue;
    }

    // Close list on non-list line
    if (inList) {
      out.push("</ul>");
      inList = false;
    }

    // Blank line → paragraph break
    if (line.trim() === "") {
      out.push("<br>");
      continue;
    }

    // Regular paragraph line
    out.push(`<p style="margin:0 0 6px">${inlineMarkdown(line)}</p>`);
  }

  if (inList) out.push("</ul>");

  return out.join("\n");
}

function inlineMarkdown(text: string): string {
  // Inline code
  text = text.replace(
    /`([^`]+)`/g,
    `<code style="font-family:'Fira Code',monospace;font-size:0.9em;background:var(--bg-hover);border:1px solid var(--border-subtle);border-radius:4px;padding:1px 5px">$1</code>`,
  );
  // Bold
  text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  // Italic
  text = text.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  return text;
}

const EyeIcon = ({ crossed }: { crossed: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path
      d="M1 8C1 8 3.5 3 8 3C12.5 3 15 8 15 8C15 8 12.5 13 8 13C3.5 13 1 8 1 8Z"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.4" />
    {crossed && (
      <line
        x1="2"
        y1="2"
        x2="14"
        y2="14"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    )}
  </svg>
);

interface StepSystemPromptProps {
  value: string;
  onChange: (v: string) => void;
  submitting: boolean;
  error: string | null;
  onSubmit: () => void;
  onBack: () => void;
  showPreview: boolean;
  onPreviewToggle: () => void;
  inputRef?: React.RefObject<HTMLTextAreaElement | null>;
}

const StepSystemPrompt = ({
  value,
  onChange,
  submitting,
  error,
  onSubmit,
  onBack,
  showPreview,
  onPreviewToggle,
  inputRef,
}: StepSystemPromptProps) => {
  return (
    <div>
      <StepHeading
        heading="Write the system prompt"
        subtext="Detailed instructions for how this agent should behave, what it knows, and how it responds."
      />

      {/* Toolbar row */}
      <div className="flex justify-end mb-2">
        <button
          onClick={onPreviewToggle}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2 text-[13px] border border-(--border-subtle) bg-transparent cursor-pointer transition-colors duration-150 hover:bg-(--bg-hover) focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2 ${showPreview ? "text-(--accent)" : "text-(--text-muted)"}`}
        >
          <EyeIcon crossed={!showPreview} />
          {showPreview ? "Hide preview" : "Preview"}
        </button>
      </div>

      <textarea
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="You are a senior software engineer with expertise in..."
        className="w-full px-4 py-4 rounded-3.5 text-[14px] text-(--text-primary) bg-(--bg-surface) border border-(--border-subtle) outline-none ring-0 focus:ring-0 focus:outline-none box-border transition-colors duration-150 leading-relaxed placeholder:text-(--text-muted) focus:border-(--accent) font-['Fira_Code',monospace] min-h-50 resize-none overflow-y-auto"
        disabled={submitting}
      />

      {error && <InlineError message={error} />}
      <div className="mt-6 flex items-center gap-4">
        <button
          onClick={onSubmit}
          disabled={submitting}
          className={[
            "flex items-center gap-2 px-5 py-2.75 rounded-2.5 text-white text-[15px] font-medium border-none transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2",
            submitting
              ? "bg-(--accent) opacity-60 cursor-not-allowed"
              : "bg-(--accent) cursor-pointer hover:bg-(--accent-hover)",
          ].join(" ")}
        >
          {submitting ? "Creating…" : "Create Agent"}
        </button>
        <button
          onClick={onBack}
          disabled={submitting}
          className="text-[14px] text-(--text-muted) bg-transparent border-none cursor-pointer transition-colors duration-150 hover:text-(--text-secondary) disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2 rounded-md"
        >
          ← Back
        </button>
      </div>
    </div>
  );
};

export const AgentCreateFlow = ({
  projectPath,
  onCreated,
  onCancel,
}: AgentCreateFlowProps) => {
  const [step, setStep] = useState(0);
  const [showDiscardModal, setShowDiscardModal] = useState(false);

  // Fields are declared below but we need to forward-reference them for the
  // blocker condition. The state is initialized to empty strings so we track
  // whether the user has typed anything.
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [model, setModel] = useState<ModelOption>(DEFAULT_MODEL);
  const [color, setColor] = useState<string | null>(null);
  const [permissionMode, setPermissionMode] = useState<PermissionMode | null>(
    null,
  );
  const [effort, setEffort] = useState<EffortLevel | null>(null);
  const [memory, setMemory] = useState<MemoryScope | null>(null);
  const [background, setBackground] = useState(false);
  const [isolation, setIsolation] = useState(false);
  const [maxTurns, setMaxTurns] = useState("");
  const [tools, setTools] = useState("");
  const [disallowedTools, setDisallowedTools] = useState("");
  const [skills, setSkills] = useState("");
  const [initialPrompt, setInitialPrompt] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const hasData = name !== "" || description !== "" || systemPrompt !== "";

  // Block router navigation when the user has entered data, so they don't
  // accidentally lose work by clicking a sidebar item or pressing back.
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      currentLocation.pathname !== nextLocation.pathname && hasData,
  );

  // The modal is shown either when the X/Escape path sets showDiscardModal,
  // or when the router blocker has intercepted a navigation attempt.
  const discardModalVisible = showDiscardModal || blocker.state === "blocked";

  const handleDiscardConfirm = () => {
    if (blocker.state === "blocked") {
      blocker.proceed();
    }
    onCancel();
  };

  const handleDiscardCancel = () => {
    if (blocker.state === "blocked") {
      blocker.reset();
    }
    setShowDiscardModal(false);
  };

  const nameInputRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const optionsFirstButtonRef = useRef<HTMLButtonElement>(null);
  const systemPromptRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !showDiscardModal) setShowDiscardModal(true);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [showDiscardModal]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (step === 0) nameInputRef.current?.focus();
      if (step === 1) descriptionRef.current?.focus();
      if (step === 2) optionsFirstButtonRef.current?.focus();
      if (step === 3) systemPromptRef.current?.focus();
    }, 380);
    return () => clearTimeout(t);
  }, [step]);

  const TOTAL_STEPS = 4;

  const validateName = (val: string): string | null => {
    const trimmed = val.trim();
    if (!trimmed) return "Name is required.";
    if (!NAME_PATTERN.test(trimmed))
      return "Only letters, numbers, hyphens, and underscores allowed.";
    return null;
  };

  const goTo = (index: number) => {
    if (index >= 0 && index < TOTAL_STEPS) setStep(index);
  };

  const handleBack = () => setStep((s) => s - 1);

  const handleStep1Continue = () => {
    const err = validateName(name);
    if (err) {
      setNameError(err);
      return;
    }
    setNameError(null);
    setStep(1);
  };

  const handleStep2Continue = () => setStep(2);
  const handleStep3Continue = () => setStep(3);

  const toYamlList = (raw: string) =>
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  const buildContent = (): string => {
    const lines: string[] = ["---"];
    lines.push(`name: ${name.trim()}`);
    lines.push(`description: ${description.trim()}`);
    if (model !== DEFAULT_MODEL) lines.push(`model: ${model}`);
    if (color) lines.push(`color: ${color}`);
    if (permissionMode) lines.push(`permissionMode: ${permissionMode}`);
    if (effort) lines.push(`effort: ${effort}`);
    if (memory) lines.push(`memory: ${memory}`);
    if (background) lines.push(`background: true`);
    if (isolation) lines.push(`isolation: worktree`);
    const mt = parseInt(maxTurns);
    if (maxTurns.trim() && !isNaN(mt)) lines.push(`maxTurns: ${mt}`);
    const toolList = toYamlList(tools);
    if (toolList.length) lines.push(`tools: [${toolList.join(", ")}]`);
    const denyList = toYamlList(disallowedTools);
    if (denyList.length)
      lines.push(`disallowedTools: [${denyList.join(", ")}]`);
    const skillList = toYamlList(skills);
    if (skillList.length) lines.push(`skills: [${skillList.join(", ")}]`);
    if (initialPrompt.trim()) {
      lines.push("initialPrompt: |");
      for (const line of initialPrompt.trim().split("\n"))
        lines.push(`  ${line}`);
    }
    lines.push("---");
    if (systemPrompt.trim()) {
      lines.push("");
      lines.push(systemPrompt.trim());
    }
    return lines.join("\n");
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const content = buildContent();
      await createAgent(projectPath, name.trim(), content);
      onCreated(name.trim());
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Something went wrong.",
      );
      setSubmitting(false);
    }
  };

  const steps = [
    <StepName
      key="name"
      value={name}
      onChange={(v) => {
        setName(v);
        if (nameError) setNameError(null);
      }}
      error={nameError}
      onContinue={handleStep1Continue}
      projectPath={projectPath}
      inputRef={nameInputRef}
    />,
    <StepDescription
      key="desc"
      value={description}
      onChange={setDescription}
      onContinue={handleStep2Continue}
      onBack={handleBack}
      inputRef={descriptionRef}
    />,
    <StepOptions
      key="opts"
      model={model}
      onModelChange={setModel}
      color={color}
      onColorChange={setColor}
      permissionMode={permissionMode}
      onPermissionModeChange={setPermissionMode}
      effort={effort}
      onEffortChange={setEffort}
      memory={memory}
      onMemoryChange={setMemory}
      background={background}
      onBackgroundChange={setBackground}
      isolation={isolation}
      onIsolationChange={setIsolation}
      maxTurns={maxTurns}
      onMaxTurnsChange={setMaxTurns}
      tools={tools}
      onToolsChange={setTools}
      disallowedTools={disallowedTools}
      onDisallowedToolsChange={setDisallowedTools}
      skills={skills}
      onSkillsChange={setSkills}
      initialPrompt={initialPrompt}
      onInitialPromptChange={setInitialPrompt}
      onContinue={handleStep3Continue}
      onBack={handleBack}
      firstButtonRef={optionsFirstButtonRef}
    />,
    <StepSystemPrompt
      key="prompt"
      value={systemPrompt}
      onChange={setSystemPrompt}
      submitting={submitting}
      error={submitError}
      onSubmit={handleSubmit}
      onBack={handleBack}
      showPreview={showPreview}
      onPreviewToggle={() => setShowPreview((v) => !v)}
      inputRef={systemPromptRef}
    />,
  ];

  return (
    <div
      className="flex-1 overflow-hidden relative bg-(--bg-base)"
    >
      {discardModalVisible && (
        <DiscardModal
          onConfirm={handleDiscardConfirm}
          onCancel={handleDiscardCancel}
        />
      )}

      <button
        onClick={() => setShowDiscardModal(true)}
        aria-label="Discard and exit"
        className="absolute top-7 left-8 z-10 flex items-center justify-center w-8 h-8 rounded-full text-(--text-muted) bg-transparent border-none cursor-pointer transition-colors duration-150 hover:text-(--text-secondary) hover:bg-(--bg-hover) focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2"
      >
        <XIcon />
      </button>

      {/* Dots pinned to top */}
      <div
        className="absolute top-8 left-0 right-0 flex justify-center z-10 pointer-events-none"
      >
        <div className="pointer-events-auto">
          <StepDots total={TOTAL_STEPS} current={step} onGoTo={goTo} />
        </div>
      </div>

      {/* Track */}
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          display: "flex",
          width: `${TOTAL_STEPS * 100}%`,
          transform: `translateX(-${step * (100 / TOTAL_STEPS)}%)`,
          transition: "transform 350ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {steps.map((stepEl, i) => {
          // Step 2 (StepOptions) needs flex-start + full height so its internal
          // sticky header/footer + scrollable middle work correctly.
          const isScrollStep = i === 2;

          // Step 3 (system prompt) — form centered when preview is closed,
          // slides left as the preview panel animates in from the right.
          if (i === 3) {
            const previewWidth = showPreview ? "min(50vw, 600px)" : "0px";
            return (
              <div
                key={i}
                style={{
                  width: `${100 / TOTAL_STEPS}%`,
                  flexShrink: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingTop: 80,
                  paddingBottom: 56,
                  boxSizing: "border-box",
                  overflow: "hidden",
                }}
              >
                {/* Inner row — its width grows as preview opens, centering shifts the form left */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "stretch",
                    height: "100%",
                    maxWidth: "100%",
                    transition: "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                >
                  {/* Form column — fixed width, vertically centered */}
                  <div
                    style={{
                      flex: "0 0 auto",
                      width: 520,
                      maxWidth: "100%",
                      paddingLeft: 40,
                      paddingRight: 40,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      overflowY: "auto",
                      boxSizing: "border-box",
                    }}
                  >
                    {stepEl}
                  </div>

                  {/* Preview column — slides in/out via width transition */}
                  <div
                    style={{
                      width: previewWidth,
                      transition: "width 300ms cubic-bezier(0.4, 0, 0.2, 1)",
                      overflow: "hidden",
                      flexShrink: 0,
                      borderLeft: showPreview
                        ? "1px solid var(--border-subtle)"
                        : "none",
                      boxSizing: "border-box",
                    }}
                  >
                    {/* Inner div is always full size; outer column clips it */}
                    <div
                      style={{
                        width: "min(50vw, 600px)",
                        paddingLeft: 40,
                        paddingRight: 40,
                        paddingTop: 8,
                        paddingBottom: 40,
                        overflowY: "auto",
                        height: "100%",
                        boxSizing: "border-box",
                      }}
                    >
                      <p className="text-[12px] text-(--text-muted) font-medium uppercase tracking-[0.08em] m-0 mb-4">
                        Preview
                      </p>
                      <div
                        className="text-[14px] text-(--text-primary) leading-[1.6] font-[inherit]"
                        dangerouslySetInnerHTML={{
                          __html: systemPrompt.trim()
                            ? renderMarkdown(systemPrompt)
                            : '<span style="color:var(--text-muted);font-style:italic">Nothing to preview yet.</span>',
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div
              key={i}
              style={{
                width: `${100 / TOTAL_STEPS}%`,
                flexShrink: 0,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                justifyContent: isScrollStep ? "flex-start" : "center",
                paddingTop: 80,
                paddingLeft: 56,
                paddingRight: 56,
                paddingBottom: isScrollStep ? 32 : 0,
                marginBottom: isScrollStep ? 0 : 100,
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  maxWidth: 560,
                  margin: "0 auto",
                  width: "100%",
                  flex: isScrollStep ? "1 1 0" : undefined,
                  minHeight: isScrollStep ? 0 : undefined,
                  display: isScrollStep ? "flex" : undefined,
                  flexDirection: isScrollStep ? "column" : undefined,
                }}
              >
                {stepEl}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

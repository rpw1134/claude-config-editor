import { useEffect, useRef, useState } from "react";
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
  <div className="flex items-center gap-[10px]">
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
          style={{
            width: active ? 10 : 8,
            height: active ? 10 : 8,
            borderRadius: "50%",
            background: future ? "var(--text-muted)" : "var(--accent)",
            border: "none",
            padding: 0,
            cursor: completed ? "pointer" : "default",
            transition: "width 200ms, height 200ms, background 200ms",
            flexShrink: 0,
          }}
        />
      );
    })}
  </div>
);

interface StepHeadingProps {
  heading: string;
  subtext: string;
}

const StepHeading = ({ heading, subtext }: StepHeadingProps) => (
  <div className="mb-6">
    <h1
      className="m-0 mb-3 font-['Bricolage_Grotesque',sans-serif] font-bold tracking-[-0.02em] leading-[1.1] text-[var(--text-primary)]"
      style={{ fontSize: 36 }}
    >
      {heading}
    </h1>
    <p className="m-0 text-[14px] text-[var(--text-secondary)] leading-[1.55]">
      {subtext}
    </p>
  </div>
);

const InlineError = ({ message }: { message: string }) => (
  <p className="mt-2 text-[13px] text-[var(--error)] font-['Fira_Code',monospace]">
    {message}
  </p>
);

interface AccordionSectionProps {
  title: string;
  children: React.ReactNode;
}

const AccordionSection = ({ title, children }: AccordionSectionProps) => {
  const [open, setOpen] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  return (
    <div className="border border-[var(--border-subtle)] rounded-[14px] overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left bg-transparent border-none cursor-pointer text-[var(--text-primary)] transition-colors duration-150 hover:bg-[var(--bg-hover)]"
      >
        <span className="text-[15px] font-semibold">{title}</span>
        <span
          className="text-[var(--text-muted)] transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          <ChevronDownIcon />
        </span>
      </button>
      <div
        ref={bodyRef}
        style={{
          maxHeight: open ? 400 : 0,
          overflow: "hidden",
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
        className="bg-[var(--bg-surface)] rounded-[18px] border border-[var(--border-subtle)] p-8 max-w-[360px] w-full mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="m-0 mb-2 text-[20px] font-bold text-[var(--text-primary)]">
          Discard this agent?
        </h2>
        <p className="m-0 mb-6 text-[14px] text-[var(--text-secondary)]">
          You'll lose everything you've entered so far.
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={onConfirm}
            className="px-5 py-[10px] rounded-[10px] text-[14px] font-medium text-white border-none cursor-pointer transition-colors duration-150"
            style={{ background: "var(--error, #ef4444)" }}
          >
            Discard
          </button>
          <button
            onClick={onCancel}
            className="text-[14px] text-[var(--text-muted)] bg-transparent border-none cursor-pointer transition-colors duration-150 hover:text-[var(--text-secondary)]"
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
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

const StepName = ({
  value,
  onChange,
  error,
  onContinue,
  inputRef,
}: StepNameProps) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") onContinue();
  };

  return (
    <div>
      <StepHeading
        heading="What should we call this agent?"
        subtext="Give your agent a unique name. This becomes its filename in ~/.claude/agents/."
      />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="e.g. engineer, reviewer, tutor"
        className={[
          "w-full px-4 py-4 rounded-[14px] text-[var(--text-primary)] bg-[var(--bg-surface)] outline-none box-border transition-colors duration-150",
          "placeholder:text-[var(--text-muted)]",
          error
            ? "border border-[rgba(248,113,113,0.5)]"
            : "border border-[var(--border-subtle)] focus:border-[var(--border-default)]",
        ].join(" ")}
        style={{ fontSize: 18 }}
      />
      {error && <InlineError message={error} />}
      <div className="mt-6">
        <button
          onClick={onContinue}
          className="flex items-center gap-2 px-5 py-[11px] rounded-[10px] bg-[var(--accent)] text-white text-[15px] font-medium border-none cursor-pointer transition-colors duration-150 hover:bg-[var(--accent-hover)]"
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
  onSkip: () => void;
  onBack: () => void;
}

const StepDescription = ({
  value,
  onChange,
  onContinue,
  onSkip,
  onBack,
}: StepDescriptionProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  return (
    <div>
      <StepHeading
        heading="What does this agent do?"
        subtext="A short summary of this agent's role. Shown in listings and helps Claude understand context. Optional."
      />
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. A senior engineer focused on code review, refactoring, and architecture decisions."
        rows={4}
        className="w-full px-4 py-4 rounded-[14px] text-[15px] text-[var(--text-primary)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] outline-none box-border transition-colors duration-150 resize-y leading-relaxed placeholder:text-[var(--text-muted)] focus:border-[var(--border-default)]"
      />
      <div className="mt-6 flex items-center gap-4">
        <button
          onClick={onContinue}
          className="flex items-center gap-2 px-5 py-[11px] rounded-[10px] bg-[var(--accent)] text-white text-[15px] font-medium border-none cursor-pointer transition-colors duration-150 hover:bg-[var(--accent-hover)]"
        >
          Continue
          <ArrowRightIcon />
        </button>
        <button
          onClick={onSkip}
          className="text-[14px] text-[var(--text-muted)] bg-transparent border-none cursor-pointer transition-colors duration-150 hover:text-[var(--text-secondary)]"
        >
          Skip
        </button>
        <button
          onClick={onBack}
          className="text-[14px] text-[var(--text-muted)] bg-transparent border-none cursor-pointer transition-colors duration-150 hover:text-[var(--text-secondary)]"
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
  onContinue: () => void;
  onBack: () => void;
}

const StepOptions = ({
  model,
  onModelChange,
  color,
  onColorChange,
  onContinue,
  onBack,
}: StepOptionsProps) => (
  <div>
    <StepHeading
      heading="Fine-tune the behavior"
      subtext="All optional. You can change these at any time in the editor."
    />
    <div className="flex flex-col gap-2 mb-6">
      <AccordionSection title="Model">
        <div className="flex flex-col gap-1.5 pt-1">
          {MODELS.map((m) => (
            <button
              key={m.value}
              onClick={() => onModelChange(m.value)}
              className={[
                "w-full flex items-center justify-between px-4 py-3 rounded-[10px] text-left border cursor-pointer transition-colors duration-150",
                model === m.value
                  ? "bg-[var(--accent-dim)] border-[var(--accent)] text-[var(--text-primary)]"
                  : "bg-transparent border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-default)] hover:text-[var(--text-primary)]",
              ].join(" ")}
            >
              <span className="text-[14px] font-medium">{m.label}</span>
              <span className="text-[12px] text-[var(--text-muted)]">
                {m.note}
              </span>
            </button>
          ))}
        </div>
      </AccordionSection>
      <AccordionSection title="Color">
        <div className="flex gap-3 flex-wrap pt-1">
          {COLORS.map((c) => (
            <button
              key={c.name}
              onClick={() => onColorChange(color === c.name ? null : c.name)}
              aria-label={c.name}
              title={c.name}
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: c.bg,
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                outline:
                  color === c.name
                    ? `3px solid ${c.ring}`
                    : "3px solid transparent",
                outlineOffset: 2,
                transition: "outline 150ms",
              }}
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
    </div>
    <div className="flex items-center gap-4">
      <button
        onClick={onContinue}
        className="flex items-center gap-2 px-5 py-[11px] rounded-[10px] bg-[var(--accent)] text-white text-[15px] font-medium border-none cursor-pointer transition-colors duration-150 hover:bg-[var(--accent-hover)]"
      >
        Continue
        <ArrowRightIcon />
      </button>
      <button
        onClick={onBack}
        className="text-[14px] text-[var(--text-muted)] bg-transparent border-none cursor-pointer transition-colors duration-150 hover:text-[var(--text-secondary)]"
      >
        ← Back
      </button>
    </div>
  </div>
);

interface StepSystemPromptProps {
  value: string;
  onChange: (v: string) => void;
  submitting: boolean;
  error: string | null;
  onSubmit: () => void;
  onBack: () => void;
}

const StepSystemPrompt = ({
  value,
  onChange,
  submitting,
  error,
  onSubmit,
  onBack,
}: StepSystemPromptProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  return (
    <div>
      <StepHeading
        heading="Write the system prompt"
        subtext="Detailed instructions for how this agent should behave, what it knows, and how it responds."
      />
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="You are a senior software engineer with expertise in..."
        className="w-full px-4 py-4 rounded-[14px] text-[14px] text-[var(--text-primary)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] outline-none box-border transition-colors duration-150 resize-y leading-relaxed placeholder:text-[var(--text-muted)] focus:border-[var(--border-default)] font-['Fira_Code',monospace]"
        style={{ minHeight: 200 }}
        disabled={submitting}
      />
      {error && <InlineError message={error} />}
      <div className="mt-6 flex items-center gap-4">
        <button
          onClick={onSubmit}
          disabled={submitting}
          className={[
            "flex items-center gap-2 px-5 py-[11px] rounded-[10px] text-white text-[15px] font-medium border-none transition-colors duration-150",
            submitting
              ? "bg-[var(--accent)] opacity-60 cursor-not-allowed"
              : "bg-[var(--accent)] cursor-pointer hover:bg-[var(--accent-hover)]",
          ].join(" ")}
        >
          {submitting ? "Creating…" : "Create Agent"}
        </button>
        <button
          onClick={onBack}
          disabled={submitting}
          className="text-[14px] text-[var(--text-muted)] bg-transparent border-none cursor-pointer transition-colors duration-150 hover:text-[var(--text-secondary)] disabled:opacity-40 disabled:cursor-not-allowed"
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
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      if (step === 0) nameInputRef.current?.focus();
    }, 380);
    return () => clearTimeout(t);
  }, [step]);

  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [model, setModel] = useState<ModelOption>(DEFAULT_MODEL);
  const [color, setColor] = useState<string | null>(null);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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
  const handleStep2Skip = () => {
    setDescription("");
    setStep(2);
  };
  const handleStep3Continue = () => setStep(3);

  const buildContent = (): string => {
    const lines: string[] = ["---"];
    lines.push(`name: ${name.trim()}`);
    if (description.trim()) lines.push(`description: ${description.trim()}`);
    if (model !== DEFAULT_MODEL) lines.push(`model: ${model}`);
    if (color) lines.push(`color: ${color}`);
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
      inputRef={nameInputRef}
    />,
    <StepDescription
      key="desc"
      value={description}
      onChange={setDescription}
      onContinue={handleStep2Continue}
      onSkip={handleStep2Skip}
      onBack={handleBack}
    />,
    <StepOptions
      key="opts"
      model={model}
      onModelChange={setModel}
      color={color}
      onColorChange={setColor}
      onContinue={handleStep3Continue}
      onBack={handleBack}
    />,
    <StepSystemPrompt
      key="prompt"
      value={systemPrompt}
      onChange={setSystemPrompt}
      submitting={submitting}
      error={submitError}
      onSubmit={handleSubmit}
      onBack={handleBack}
    />,
  ];

  return (
    <div className="flex-1 overflow-hidden relative" style={{ background: 'var(--bg-base)' }}>
      {showDiscardModal && (
        <DiscardModal
          onConfirm={onCancel}
          onCancel={() => setShowDiscardModal(false)}
        />
      )}

      <button
        onClick={() => setShowDiscardModal(true)}
        aria-label="Discard and exit"
        className="absolute top-7 right-8 z-10 flex items-center justify-center w-8 h-8 rounded-full text-[var(--text-muted)] bg-transparent border-none cursor-pointer transition-colors duration-150 hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
      >
        <XIcon />
      </button>

      {/* Dots pinned to top */}
      <div className="absolute top-8 left-0 right-0 flex justify-center z-10" style={{ pointerEvents: 'none' }}>
        <div style={{ pointerEvents: 'auto' }}>
          <StepDots total={TOTAL_STEPS} current={step} onGoTo={goTo} />
        </div>
      </div>

      {/* Track */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          display: 'flex',
          width: `${TOTAL_STEPS * 100}%`,
          transform: `translateX(-${step * (100 / TOTAL_STEPS)}%)`,
          transition: 'transform 350ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {steps.map((stepEl, i) => (
          <div
            key={i}
            style={{
              width: `${100 / TOTAL_STEPS}%`,
              flexShrink: 0,
              overflowY: 'auto',
              paddingTop: 80,
              paddingLeft: 56,
              paddingRight: 56,
              paddingBottom: 56,
            }}
          >
            {stepEl}
          </div>
        ))}
      </div>
    </div>
  );
};

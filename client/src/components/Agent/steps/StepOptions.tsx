import { useState } from "react";
import { AccordionSection } from "../../Shared/Accordion";
import { Toggle } from "../../Shared/forms/Toggle";
import { CheckIcon, ArrowRightIcon } from "../../Icons";
import {
  type ModelOption,
  type PermissionMode,
  type EffortLevel,
  type MemoryScope,
  MODELS,
  COLORS,
  PERMISSION_MODES,
  EFFORT_LEVELS,
  MEMORY_SCOPES,
} from "../constants";

const radioRow = (active: boolean) =>
  [
    "w-full flex items-center justify-between px-4 py-3 rounded-2.5 text-left border cursor-pointer transition-colors duration-150",
    active
      ? "bg-(--accent-dim) border-(--accent) text-(--text-primary)"
      : "bg-transparent border-(--border-subtle) text-(--text-secondary) hover:border-(--border-default) hover:text-(--text-primary)",
  ].join(" ");

const fieldInput =
  "w-full px-4 py-3 rounded-3 text-[14px] text-(--text-primary) bg-(--bg-surface) border border-(--border-subtle) outline-none ring-0 focus:ring-0 focus:outline-none box-border transition-colors duration-150 placeholder:text-(--text-muted) focus:border-(--accent)";

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
  onEnterAdvance?: () => void;
}

export function StepOptions({
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
  onEnterAdvance,
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
          onEnterAdvance={onEnterAdvance}
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
          onEnterAdvance={onEnterAdvance}
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
          onEnterAdvance={onEnterAdvance}
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
          onEnterAdvance={onEnterAdvance}
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
          onEnterAdvance={onEnterAdvance}
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
          onEnterAdvance={onEnterAdvance}
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
          onEnterAdvance={onEnterAdvance}
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
          onEnterAdvance={onEnterAdvance}
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
          onEnterAdvance={onEnterAdvance}
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
          onEnterAdvance={onEnterAdvance}
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
              <Toggle checked={background} onChange={onBackgroundChange} />
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
              <Toggle checked={isolation} onChange={onIsolationChange} />
            </div>
          </div>
        </AccordionSection>
      </div>

      {/* Fixed bottom */}
      <div className="flex items-center gap-4 pt-2 pb-1">
        <button
          onClick={onContinue}
          className="flex items-center gap-2 px-5 py-2.75 rounded-2.5 border border-(--border-subtle) bg-(--bg-elevated) text-(--text-primary) text-[15px] font-semibold cursor-pointer transition-colors duration-150 hover:bg-(--bg-hover)"
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

import { useEffect, useRef, useState } from "react";
import { useBlocker } from "react-router-dom";
import { useAgentCreateForm } from "../../hooks/useAgentCreateForm";
import { renderMarkdown } from "../../lib/markdown";
import { DiscardModal } from "../Shared/DiscardModal";
import { StepDots } from "../Shared/StepDots";
import { StepName } from "./steps/StepName";
import { StepDescription } from "./steps/StepDescription";
import { StepOptions } from "./steps/StepOptions";
import { StepSystemPrompt } from "./steps/StepSystemPrompt";
import { XIcon } from "../Icons";
import { AgentPastePanel } from "./AgentPastePanel";

type AgentCreateMode = "wizard" | "paste";

export interface AgentCreateFlowProps {
  projectPath: string;
  onCreated: (name: string) => void;
  onCancel: () => void;
}

export const AgentCreateFlow = ({
  projectPath,
  onCreated,
  onCancel,
}: AgentCreateFlowProps) => {
  const {
    step,
    goTo,
    handleBack,
    handleStep1Continue,
    handleStep2Continue,
    handleStep3Continue,
    TOTAL_STEPS,
    name,
    setName,
    nameError,
    setNameError,
    description,
    setDescription,
    model,
    setModel,
    color,
    setColor,
    permissionMode,
    setPermissionMode,
    effort,
    setEffort,
    memory,
    setMemory,
    background,
    setBackground,
    isolation,
    setIsolation,
    maxTurns,
    setMaxTurns,
    tools,
    setTools,
    disallowedTools,
    setDisallowedTools,
    skills,
    setSkills,
    initialPrompt,
    setInitialPrompt,
    systemPrompt,
    setSystemPrompt,
    showPreview,
    setShowPreview,
    submitting,
    submitError,
    handleSubmit,
    createSuccess,
    hasData,
  } = useAgentCreateForm(projectPath, onCreated);

  const [mode, setMode] = useState<AgentCreateMode>("wizard");
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const submitted = useRef(false);

  // Mark submitted so the blocker doesn't fire after success
  useEffect(() => {
    if (createSuccess) submitted.current = true;
  }, [createSuccess]);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      currentLocation.pathname !== nextLocation.pathname &&
      mode === "wizard" &&
      hasData &&
      !submitted.current,
  );

  const discardModalVisible = showDiscardModal || blocker.state === "blocked";

  const handleDiscardConfirm = () => {
    if (blocker.state === "blocked") {
      blocker.proceed();
    } else {
      onCancel();
    }
  };

  const handleDiscardCancel = () => {
    if (blocker.state === "blocked") blocker.reset();
    setShowDiscardModal(false);
  };

  const nameInputRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const optionsFirstButtonRef = useRef<HTMLButtonElement>(null);
  const systemPromptRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !showDiscardModal) {
        if (mode === "paste") {
          setMode("wizard");
        } else {
          setShowDiscardModal(true);
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [showDiscardModal, mode, onCancel]);

  useEffect(() => {
    if (mode !== "wizard") return;
    const t = setTimeout(() => {
      if (step === 0) nameInputRef.current?.focus();
      if (step === 1) descriptionRef.current?.focus();
      if (step === 2) optionsFirstButtonRef.current?.focus();
      if (step === 3) systemPromptRef.current?.focus();
    }, 380);
    return () => clearTimeout(t);
  }, [step, mode]);

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
      onSwitchToPaste={() => setMode("paste")}
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
      onEnterAdvance={handleStep3Continue}
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
    <div className="flex-1 overflow-hidden relative bg-(--bg-base)">
      {discardModalVisible && (
        <DiscardModal
          title="Discard this agent?"
          message="You'll lose everything you've entered so far."
          confirmLabel="Discard"
          onConfirm={handleDiscardConfirm}
          onCancel={handleDiscardCancel}
        />
      )}

      {createSuccess && (
        <div
          className="absolute inset-0 z-30 flex items-center justify-center bg-(--bg-base)"
          style={{ animation: "ccs-fade-in 0.2s ease-out both" }}
        >
          <div
            className="flex flex-col items-center gap-5 text-center"
            style={{
              animation:
                "ccs-success-enter 0.35s cubic-bezier(0.34, 1.4, 0.64, 1) both",
            }}
          >
            {/* Spinning ring */}
            <div className="relative w-16 h-16">
              <svg className="w-full h-full" viewBox="0 0 64 64" fill="none">
                <circle
                  cx="32"
                  cy="32"
                  r="26"
                  stroke="var(--border-subtle)"
                  strokeWidth="4"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="26"
                  stroke="var(--accent)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray="40 124"
                  style={{
                    animation: "spin 0.9s linear infinite",
                    transformOrigin: "32px 32px",
                  }}
                />
              </svg>
            </div>
            <div>
              <p className="m-0 text-[20px] font-semibold text-(--text-primary)">
                Creating agent…
              </p>
              <p className="m-0 mt-1 text-[13px] text-(--text-muted)">
                Writing files and configuring {name.trim()}
              </p>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => {
          if (mode === "paste") {
            setMode("wizard");
          } else {
            setShowDiscardModal(true);
          }
        }}
        aria-label="Discard and exit"
        className="absolute top-7 left-8 z-10 flex items-center justify-center w-8 h-8 rounded-full text-(--text-muted) bg-transparent border-none cursor-pointer transition-colors duration-150 hover:text-(--text-secondary) hover:bg-(--bg-hover) focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2"
      >
        <XIcon />
      </button>

      {/* Dots pinned to top — wizard only */}
      {mode === "wizard" && (
        <div className="absolute top-8 left-0 right-0 flex justify-center z-10 pointer-events-none">
          <div className="pointer-events-auto">
            <StepDots total={TOTAL_STEPS} current={step} onGoTo={goTo} />
          </div>
        </div>
      )}

      {/* Paste mode */}
      {mode === "paste" && (
        <div className="flex-1 flex flex-col items-center justify-center px-14 py-20 overflow-y-auto">
          <AgentPastePanel projectPath={projectPath} onCreated={onCreated} />
        </div>
      )}

      {/* Wizard track */}
      {mode === "wizard" && <div
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
          const isScrollStep = i === 2;

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
      </div>}
    </div>
  );
};

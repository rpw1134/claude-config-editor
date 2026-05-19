import { useEffect, useRef, useState } from "react";
import { createMcpServer } from "../../lib/api";
import { validateName } from "../../lib/validation";
import { buildMcpJson, type AuthType } from "../../lib/mcp";
import { DiscardModal } from "../Shared/DiscardModal";
import { CloseIcon } from "../Icons";
import { StepName } from "./mcp/StepName";
import { StepType } from "./mcp/StepType";
import { StepJsonMode } from "./mcp/StepJsonMode";
import { StepConfigure } from "./mcp/StepConfigure";
import { StepReview } from "./mcp/StepReview";

type ServerType = "stdio" | "http";
type Step = 1 | 2 | 3 | 4;
type Mode = "guided" | "json";

export interface McpCreateModalProps {
  projectPath: string;
  onSuccess: (name: string) => void;
  onClose: () => void;
}

export const McpCreateModal = ({
  projectPath,
  onSuccess,
  onClose,
}: McpCreateModalProps) => {
  const [step, setStep] = useState<Step>(1);
  const [mode, setMode] = useState<Mode>("guided");
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [serverType, setServerType] = useState<ServerType>("stdio");
  const [rawJson, setRawJson] = useState("{\n  \n}");

  // stdio fields
  const [command, setCommand] = useState("");
  const [argsRaw, setArgsRaw] = useState("");
  const [envRaw, setEnvRaw] = useState("");

  // http fields
  const [url, setUrl] = useState("");
  const [authType, setAuthType] = useState<AuthType>("none");
  const [token, setToken] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const hasData = name !== "" || step > 1;

  const handleClose = () => {
    if (hasData) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (showDiscardConfirm) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDiscardConfirm, hasData]);

  // ── Step navigation ──────────────────────────────────────────────────────────

  const handleStep1Continue = (nextMode?: Mode) => {
    const err = validateName(name);
    if (err) {
      setNameError(err);
      return;
    }
    setNameError(null);
    if (nextMode) setMode(nextMode);
    setStep(2);
  };

  const handleStep2Continue = () => setStep(3);
  const handleStep3Continue = () => setStep(4);

  const handleBack = () => {
    if (step === 2 && mode === "json") {
      setMode("guided");
      setStep(1);
    } else {
      setStep((s) => (s - 1) as Step);
    }
  };

  // ── Submit ───────────────────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (submitting) return;
    setSubmitting(true);
    setSubmitError(null);

    const content =
      mode === "json"
        ? rawJson
        : JSON.stringify(
            buildMcpJson(serverType, command, argsRaw, envRaw, url, authType, token),
            null,
            2,
          );

    try {
      await createMcpServer(projectPath, name.trim(), content);
      onSuccess(name.trim());
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Something went wrong.",
      );
      setSubmitting(false);
    }
  };

  // ── Derived ──────────────────────────────────────────────────────────────────

  const previewJson = JSON.stringify(
    buildMcpJson(serverType, command, argsRaw, envRaw, url, authType, token),
    null,
    2,
  );

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      {showDiscardConfirm && (
        <DiscardModal
          title="Discard this server?"
          confirmLabel="Discard"
          onConfirm={onClose}
          onCancel={() => setShowDiscardConfirm(false)}
        />
      )}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === e.currentTarget) handleClose();
        }}
      >
        <div className="w-full max-w-md mx-4 bg-(--bg-surface) border border-(--border-subtle) rounded-2xl p-8 shadow-2xl animate-[modalFadeIn_200ms_ease-out_both]">
          {/* Header */}
          <div className="flex items-start justify-between mb-1">
            <div className="flex-1 min-w-0 pr-4">
              <span className="block text-[11px] font-medium text-(--text-muted) tracking-widest uppercase mb-2">
                {mode === "json" ? `${step === 1 ? 1 : 2} / 2` : `${step} / 4`}
              </span>
              <h2 className='text-[22px] font-semibold text-(--text-primary) leading-tight font-["Bricolage_Grotesque",sans-serif] m-0'>
                {step === 1 && "New MCP Server"}
                {step === 2 && mode === "json" && "JSON Configuration"}
                {step === 2 && mode === "guided" && "Server Type"}
                {step === 3 && (serverType === "stdio" ? "Command" : "Connection")}
                {step === 4 && "Review"}
              </h2>
              <p className="mt-2 text-[13px] text-(--text-muted) leading-relaxed">
                {step === 1 && "Give your server a name — you can rename it later."}
                {step === 2 && mode === "json" && "Paste or type the server configuration JSON directly."}
                {step === 2 && mode === "guided" && "How does Claude connect to this server?"}
                {step === 3 && serverType === "stdio" && "Configure the command that starts your server."}
                {step === 3 && serverType === "http" && "Configure the remote server connection."}
                {step === 4 && "Review the generated configuration before saving."}
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-(--text-muted) hover:text-(--text-primary) hover:bg-(--bg-elevated) transition-colors duration-150 cursor-pointer border-none bg-transparent"
              aria-label="Close"
            >
              <CloseIcon />
            </button>
          </div>

          <div className="border-t border-(--border-subtle) my-6" />

          {step === 1 && (
            <StepName
              name={name}
              nameError={nameError}
              onNameChange={(val) => {
                setName(val);
                if (nameError) setNameError(null);
              }}
              onContinue={() => handleStep1Continue()}
              onContinueJson={() => handleStep1Continue("json")}
              inputRef={nameInputRef}
            />
          )}
          {step === 2 && mode === "json" && (
            <StepJsonMode
              rawJson={rawJson}
              onRawJsonChange={setRawJson}
              submitError={submitError}
              submitting={submitting}
              onCreate={handleCreate}
              onBack={handleBack}
            />
          )}
          {step === 2 && mode === "guided" && (
            <StepType
              serverType={serverType}
              onServerTypeChange={setServerType}
              onContinue={handleStep2Continue}
              onBack={handleBack}
            />
          )}
          {step === 3 && (
            <StepConfigure
              serverType={serverType}
              command={command}
              onCommandChange={setCommand}
              argsRaw={argsRaw}
              onArgsRawChange={setArgsRaw}
              envRaw={envRaw}
              onEnvRawChange={setEnvRaw}
              url={url}
              onUrlChange={setUrl}
              authType={authType}
              onAuthTypeChange={(val) => {
                setAuthType(val);
                setToken("");
              }}
              token={token}
              onTokenChange={setToken}
              onContinue={handleStep3Continue}
              onBack={handleBack}
            />
          )}
          {step === 4 && (
            <StepReview
              name={name}
              previewJson={previewJson}
              submitError={submitError}
              submitting={submitting}
              onCreate={handleCreate}
              onBack={handleBack}
            />
          )}
        </div>
      </div>
    </>
  );
};

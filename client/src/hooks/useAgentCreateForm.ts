import { useState } from "react";
import { createAgent } from "../lib/api";
import { validateName } from "../lib/validation";
import {
  DEFAULT_MODEL,
  type ModelOption,
  type PermissionMode,
  type EffortLevel,
  type MemoryScope,
} from "../components/Agent/constants";

const TOTAL_STEPS = 4;

function toYamlList(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function buildContent(opts: {
  name: string;
  description: string;
  model: ModelOption;
  color: string | null;
  permissionMode: PermissionMode | null;
  effort: EffortLevel | null;
  memory: MemoryScope | null;
  background: boolean;
  isolation: boolean;
  maxTurns: string;
  tools: string;
  disallowedTools: string;
  skills: string[];
  initialPrompt: string;
  systemPrompt: string;
}): string {
  const lines: string[] = ["---"];
  lines.push(`name: ${opts.name.trim()}`);
  lines.push(`description: ${opts.description.trim()}`);
  // Skip when model equals DEFAULT_MODEL; "inherit" is always written since it differs from DEFAULT_MODEL
  if (opts.model !== DEFAULT_MODEL) {
    lines.push(`model: ${opts.model}`);
  }
  if (opts.color) lines.push(`color: ${opts.color}`);
  if (opts.permissionMode) lines.push(`permissionMode: ${opts.permissionMode}`);
  if (opts.effort) lines.push(`effort: ${opts.effort}`);
  if (opts.memory) lines.push(`memory: ${opts.memory}`);
  if (opts.background) lines.push(`background: true`);
  if (opts.isolation) lines.push(`isolation: worktree`);
  const mt = parseInt(opts.maxTurns);
  if (opts.maxTurns.trim() && !isNaN(mt)) lines.push(`maxTurns: ${mt}`);
  const toolList = toYamlList(opts.tools);
  if (toolList.length) lines.push(`tools: [${toolList.join(", ")}]`);
  const denyList = toYamlList(opts.disallowedTools);
  if (denyList.length) lines.push(`disallowedTools: [${denyList.join(", ")}]`);
  if (opts.skills.length) lines.push(`skills: [${opts.skills.join(", ")}]`);
  if (opts.initialPrompt.trim()) {
    lines.push("initialPrompt: |");
    for (const line of opts.initialPrompt.trim().split("\n"))
      lines.push(`  ${line}`);
  }
  lines.push("---");
  if (opts.systemPrompt.trim()) {
    lines.push("");
    lines.push(opts.systemPrompt.trim());
  }
  return lines.join("\n");
}

export function useAgentCreateForm(
  projectPath: string,
  onCreated: (name: string) => void,
) {
  const [step, setStep] = useState(0);

  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [model, setModel] = useState<ModelOption>(DEFAULT_MODEL);
  const [color, setColor] = useState<string | null>(null);
  const [permissionMode, setPermissionMode] = useState<PermissionMode | null>("default");
  const [effort, setEffort] = useState<EffortLevel | null>("medium");
  const [memory, setMemory] = useState<MemoryScope | null>(null);
  const [background, setBackground] = useState(false);
  const [isolation, setIsolation] = useState(false);
  const [maxTurns, setMaxTurns] = useState("");
  const [tools, setTools] = useState("");
  const [disallowedTools, setDisallowedTools] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [initialPrompt, setInitialPrompt] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);

  const hasData = name !== "" || description !== "" || systemPrompt !== "";

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

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const content = buildContent({
        name,
        description,
        model,
        color,
        permissionMode,
        effort,
        memory,
        background,
        isolation,
        maxTurns,
        tools,
        disallowedTools,
        skills,
        initialPrompt,
        systemPrompt,
      });
      await createAgent(projectPath, name.trim(), content);
      setCreateSuccess(true);
      setTimeout(() => onCreated(name.trim()), 400);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Something went wrong.",
      );
      setSubmitting(false);
    }
  };

  return {
    // Step
    step,
    goTo,
    handleBack,
    handleStep1Continue,
    handleStep2Continue,
    handleStep3Continue,
    TOTAL_STEPS,
    // Name step
    name,
    setName,
    nameError,
    setNameError,
    // Description step
    description,
    setDescription,
    // Options step
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
    // Prompt step
    systemPrompt,
    setSystemPrompt,
    showPreview,
    setShowPreview,
    // Submit
    submitting,
    submitError,
    handleSubmit,
    createSuccess,
    // Derived
    hasData,
  };
}

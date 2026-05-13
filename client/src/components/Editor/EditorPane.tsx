import { useEffect, useRef, useState } from "react";
import {
  fetchAgentContent,
  fetchSkillContent,
  updateAgentContent,
  updateSkillContent,
  createAgent,
  createSkill,
} from "../../lib/api";
import { Editor } from "./Editor";

interface EditorPaneProps {
  name: string | null;
  type: "agent" | "skill";
  onClose: () => void;
  onCreated?: (name: string) => void;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";
type CreateStatus = "idle" | "creating" | "error";

function filePath(name: string, type: "agent" | "skill"): string {
  return type === "agent"
    ? `~/.claude/agents/${name}`
    : `~/.claude/skills/${name}/SKILL.md`;
}

// ------------------------------------------------------------
// Create mode
// ------------------------------------------------------------

interface CreateHeaderProps {
  type: "agent" | "skill";
  draftName: string;
  onDraftNameChange: (val: string) => void;
  createStatus: CreateStatus;
  onClose: () => void;
  onCreate: () => void;
}

const CreateHeader = ({
  type,
  draftName,
  onDraftNameChange,
  createStatus,
  onClose,
  onCreate,
}: CreateHeaderProps) => {
  const creating = createStatus === "creating";
  const isError = createStatus === "error";
  const disabled = draftName.trim() === "" || creating;

  const btnClassName = [
    "font-mono text-[12px] px-2.5 py-1 rounded transition-colors",
    disabled
      ? "opacity-40 cursor-not-allowed text-white/40"
      : isError
      ? "text-red-400/70"
      : "text-white/50 hover:text-white/80",
  ].join(" ");

  const label = creating ? "Creating…" : isError ? "Error" : "Create";

  return (
    <div className="px-5 border-b border-white/6 flex items-center justify-between shrink-0" style={{ minHeight: '44px' }}>
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-[12px] text-white/25">
          {type === "agent" ? "~/.claude/agents/" : "~/.claude/skills/"}
        </span>
        <input
          type="text"
          value={draftName}
          onChange={(e) => onDraftNameChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !disabled) onCreate(); }}
          placeholder="name"
          className="bg-transparent font-mono text-[12px] text-white/60 outline-none border-b border-white/20 focus:border-white/40 w-48 transition-colors"
          autoFocus
          spellCheck={false}
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onCreate}
          disabled={disabled}
          className={btnClassName}
          aria-label="Create file"
        >
          {label}
        </button>
        <button
          onClick={onClose}
          className="text-white/30 hover:text-white/60 transition-colors text-[18px] leading-none"
          aria-label="Close editor"
        >
          ×
        </button>
      </div>
    </div>
  );
};

// ------------------------------------------------------------
// Edit mode header
// ------------------------------------------------------------

interface EditHeaderProps {
  name: string;
  type: "agent" | "skill";
  saveStatus: SaveStatus;
  saveDisabled: boolean;
  onSave: () => void;
  onClose: () => void;
}

const EditHeader = ({
  name,
  type,
  saveStatus,
  saveDisabled,
  onSave,
  onClose,
}: EditHeaderProps) => {
  const saveLabel =
    saveStatus === "saving"
      ? "Saving…"
      : saveStatus === "saved"
      ? "Saved"
      : saveStatus === "error"
      ? "Error"
      : "Save";

  const saveClassName = [
    "font-mono text-[12px] px-2.5 py-1 rounded transition-colors",
    saveDisabled
      ? "opacity-40 cursor-not-allowed text-white/40"
      : saveStatus === "saved"
      ? "text-green-400/70 hover:text-green-400"
      : saveStatus === "error"
      ? "text-red-400/70"
      : "text-white/50 hover:text-white/80",
  ].join(" ");

  return (
    <div className="px-5 border-b border-white/6 flex items-center justify-between shrink-0" style={{ minHeight: '44px' }}>
      <span className="font-mono text-[12px] text-white/30">
        {filePath(name, type)}
      </span>
      <div className="flex items-center gap-3">
        <button
          onClick={onSave}
          disabled={saveDisabled}
          className={saveClassName}
          aria-label="Save file"
        >
          {saveLabel}
        </button>
        <button
          onClick={onClose}
          className="text-white/30 hover:text-white/60 transition-colors text-[18px] leading-none"
          aria-label="Close editor"
        >
          ×
        </button>
      </div>
    </div>
  );
};

// ------------------------------------------------------------
// EditorPane — composes the two header modes
// ------------------------------------------------------------

export const EditorPane = ({ name, type, onClose, onCreated }: EditorPaneProps) => {
  // Edit mode state
  const [content, setContent] = useState("");
  const [savedContent, setSavedContent] = useState("");
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const statusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Create mode state
  const [draftName, setDraftName] = useState("");
  const [createStatus, setCreateStatus] = useState<CreateStatus>("idle");

  const isCreateMode = name === null;

  // Edit mode derived values
  const currentKey = `${type}:${name}`;
  const loading = !isCreateMode && loadedKey !== currentKey;
  const dirty = !loading && !isCreateMode && content !== savedContent;
  const saving = saveStatus === "saving";

  // Fetch content in edit mode
  useEffect(() => {
    if (isCreateMode) return;
    const fetchFn = type === "agent" ? fetchAgentContent : fetchSkillContent;
    fetchFn(name)
      .then((text) => {
        setContent(text);
        setSavedContent(text);
        setLoadedKey(currentKey);
        setSaveStatus("idle");
      })
      .catch(() => {
        setContent("");
        setSavedContent("");
        setLoadedKey(currentKey);
        setSaveStatus("idle");
      });
  }, [name, type, currentKey, isCreateMode]);

  // Clear any pending status timer on unmount
  useEffect(() => {
    return () => {
      if (statusTimer.current !== null) clearTimeout(statusTimer.current);
    };
  }, []);

  const handleSave = async () => {
    if (loading || !dirty || saving || isCreateMode) return;
    setSaveStatus("saving");
    try {
      const updateFn = type === "agent" ? updateAgentContent : updateSkillContent;
      await updateFn(name, content);
      setSavedContent(content);
      setSaveStatus("saved");
      statusTimer.current = setTimeout(() => setSaveStatus("idle"), 1500);
    } catch {
      setSaveStatus("error");
      statusTimer.current = setTimeout(() => setSaveStatus("idle"), 2000);
    }
  };

  const handleCreate = async () => {
    const trimmed = draftName.trim();
    if (trimmed === "" || createStatus === "creating") return;
    setCreateStatus("creating");
    try {
      const createFn = type === "agent" ? createAgent : createSkill;
      await createFn(trimmed, content);
      onCreated?.(trimmed);
    } catch {
      setCreateStatus("error");
      statusTimer.current = setTimeout(() => setCreateStatus("idle"), 2000);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0d0d10] border-l border-white/6">
      {isCreateMode ? (
        <CreateHeader
          type={type}
          draftName={draftName}
          onDraftNameChange={setDraftName}
          createStatus={createStatus}
          onClose={onClose}
          onCreate={handleCreate}
        />
      ) : (
        <EditHeader
          name={name}
          type={type}
          saveStatus={saveStatus}
          saveDisabled={loading || !dirty || saving}
          onSave={handleSave}
          onClose={onClose}
        />
      )}
      <div className="flex-1 min-h-0">
        <Editor
          value={loading ? "" : content}
          onChange={(val) => setContent(val ?? "")}
          language="markdown"
          readOnly={loading}
        />
      </div>
    </div>
  );
};

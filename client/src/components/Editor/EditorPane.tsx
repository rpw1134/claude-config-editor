import { useEffect, useRef, useState } from "react";
import {
  fetchAgentContent,
  fetchSkillContent,
  updateAgentContent,
  updateSkillContent,
  createAgent,
  createSkill,
  deleteAgent,
  deleteSkill,
  fetchMcpServerContent,
  updateMcpServerContent,
  createMcpServer,
  fetchProjectContent,
  updateProjectContent,
} from "../../lib/api";
import { Editor } from "./Editor";

interface EditorPaneProps {
  name: string | null;
  type: "agent" | "skill" | "mcp-server" | "project";
  onClose: () => void;
  onCreated?: (name: string) => void;
  onDeleted?: () => void;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";
type CreateStatus = "idle" | "creating" | "error";
type DeleteStatus = "idle" | "confirm" | "deleting" | "error";

function filePath(name: string, type: "agent" | "skill" | "mcp-server" | "project"): string {
  if (type === "agent") return `~/.claude/agents/${name}`;
  if (type === "skill") return `~/.claude/skills/${name}/SKILL.md`;
  if (type === "project") return `${name}/CLAUDE.md`;
  return `~/.claude.json → mcpServers → ${name}`;
}

// ------------------------------------------------------------
// Create mode
// ------------------------------------------------------------

interface CreateHeaderProps {
  type: "agent" | "skill" | "mcp-server" | "project";
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
          {type === "agent"
            ? "~/.claude/agents/"
            : type === "skill"
            ? "~/.claude/skills/"
            : "~/.claude.json → mcpServers → "}
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
  type: "agent" | "skill" | "mcp-server" | "project";
  saveStatus: SaveStatus;
  saveDisabled: boolean;
  onSave: () => void;
  onClose: () => void;
  deleteStatus: DeleteStatus;
  onDelete: () => void;
}

const EditHeader = ({
  name,
  type,
  saveStatus,
  saveDisabled,
  onSave,
  onClose,
  deleteStatus,
  onDelete,
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

  const deleteLabel =
    deleteStatus === "confirm"
      ? "Confirm?"
      : deleteStatus === "deleting"
      ? "Deleting…"
      : deleteStatus === "error"
      ? "Error"
      : "Delete";

  const deleteClassName = [
    "font-mono text-[12px] px-2.5 py-1 rounded transition-colors",
    deleteStatus === "deleting"
      ? "opacity-40 cursor-not-allowed text-white/40"
      : deleteStatus === "confirm"
      ? "text-rose-400/80 hover:text-rose-400"
      : deleteStatus === "error"
      ? "text-red-400/70"
      : "text-white/20 hover:text-white/50",
  ].join(" ");

  const canDelete = type === "agent" || type === "skill";

  return (
    <div className="px-5 border-b border-white/6 flex items-center justify-between shrink-0" style={{ minHeight: '44px' }}>
      <span className="font-mono text-[12px] text-white/30">
        {filePath(name, type)}
      </span>
      <div className="flex items-center gap-3">
        {canDelete && (
          <button
            onClick={onDelete}
            disabled={deleteStatus === "deleting"}
            className={deleteClassName}
            aria-label="Delete file"
          >
            {deleteLabel}
          </button>
        )}
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

export const EditorPane = ({ name, type, onClose, onCreated, onDeleted }: EditorPaneProps) => {
  // Edit mode state
  const [content, setContent] = useState("");
  const [savedContent, setSavedContent] = useState("");
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [deleteStatus, setDeleteStatus] = useState<DeleteStatus>("idle");
  const statusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deleteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    const fetchFn =
      type === "agent"
        ? fetchAgentContent
        : type === "skill"
        ? fetchSkillContent
        : type === "project"
        ? fetchProjectContent
        : fetchMcpServerContent;
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

  // Clear any pending timers on unmount
  useEffect(() => {
    const st = statusTimer.current;
    const dt = deleteTimer.current;
    return () => {
      if (st !== null) clearTimeout(st);
      if (dt !== null) clearTimeout(dt);
    };
  }, []);

  const handleSave = async () => {
    if (loading || !dirty || saving || isCreateMode) return;
    setSaveStatus("saving");
    try {
      if (type === "agent") {
        await updateAgentContent(name, content);
      } else if (type === "skill") {
        await updateSkillContent(name, content);
      } else if (type === "project") {
        await updateProjectContent(name, content);
      } else {
        await updateMcpServerContent(name, content);
      }
      setSavedContent(content);
      setSaveStatus("saved");
      statusTimer.current = setTimeout(() => setSaveStatus("idle"), 1500);
    } catch {
      setSaveStatus("error");
      statusTimer.current = setTimeout(() => setSaveStatus("idle"), 2000);
    }
  };

  const handleDelete = async () => {
    if (isCreateMode || !name || deleteStatus === "deleting") return;
    if (deleteStatus !== "confirm") {
      setDeleteStatus("confirm");
      deleteTimer.current = setTimeout(() => setDeleteStatus("idle"), 3000);
      return;
    }
    if (deleteTimer.current !== null) clearTimeout(deleteTimer.current);
    setDeleteStatus("deleting");
    try {
      if (type === "agent") await deleteAgent(name);
      else if (type === "skill") await deleteSkill(name);
      onDeleted?.();
    } catch {
      setDeleteStatus("error");
      deleteTimer.current = setTimeout(() => setDeleteStatus("idle"), 2000);
    }
  };

  // Cmd+S / Ctrl+S to save
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  });

  const handleCreate = async () => {
    const trimmed = draftName.trim();
    if (trimmed === "" || createStatus === "creating") return;
    setCreateStatus("creating");
    try {
      const createFn =
        type === "agent"
          ? createAgent
          : type === "skill"
          ? createSkill
          : createMcpServer;
      await createFn(trimmed, content);
      onCreated?.(trimmed);
    } catch {
      setCreateStatus("error");
      statusTimer.current = setTimeout(() => setCreateStatus("idle"), 2000);
    }
  };

  const editorLanguage =
    type === "mcp-server" ? "json" : "markdown";

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
          deleteStatus={deleteStatus}
          onDelete={handleDelete}
        />
      )}
      <div className="flex-1 min-h-0">
        {loading ? (
          <div className="w-full h-full bg-[#0d0d10]" />
        ) : (
          <Editor
            value={content}
            onChange={(val) => setContent(val ?? "")}
            language={editorLanguage}
          />
        )}
      </div>
    </div>
  );
};

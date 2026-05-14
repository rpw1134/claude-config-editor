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
import { AgentFormEditor } from "./AgentFormEditor";

type ViewMode = "form" | "raw";

interface EditorPaneProps {
  name: string | null;
  type: "agent" | "skill" | "mcp-server" | "project";
  projectPath: string | null;
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

interface ViewModeToggleProps {
  viewMode: ViewMode;
  onToggle: (mode: ViewMode) => void;
}

const ViewModeToggle = ({ viewMode, onToggle }: ViewModeToggleProps) => (
  <div className="flex items-center gap-2">
    <button
      type="button"
      onClick={() => onToggle("form")}
      className={[
        "font-mono text-[11px] transition-colors",
        viewMode === "form" ? "text-white/70" : "text-white/25 hover:text-white/50",
      ].join(" ")}
    >
      Form
    </button>
    <span className="text-white/15 text-[11px]">/</span>
    <button
      type="button"
      onClick={() => onToggle("raw")}
      className={[
        "font-mono text-[11px] transition-colors",
        viewMode === "raw" ? "text-white/70" : "text-white/25 hover:text-white/50",
      ].join(" ")}
    >
      Raw
    </button>
  </div>
);

interface CreateHeaderProps {
  type: "agent" | "skill" | "mcp-server" | "project";
  draftName: string;
  onDraftNameChange: (val: string) => void;
  createStatus: CreateStatus;
  onClose: () => void;
  onCreate: () => void;
  viewMode: ViewMode;
  onViewModeToggle: (mode: ViewMode) => void;
}

const CreateHeader = ({
  type,
  draftName,
  onDraftNameChange,
  createStatus,
  onClose,
  onCreate,
  viewMode,
  onViewModeToggle,
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
        {type === "agent" && (
          <ViewModeToggle viewMode={viewMode} onToggle={onViewModeToggle} />
        )}
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

interface EditHeaderProps {
  name: string;
  type: "agent" | "skill" | "mcp-server" | "project";
  saveStatus: SaveStatus;
  saveDisabled: boolean;
  onSave: () => void;
  onClose: () => void;
  deleteStatus: DeleteStatus;
  onDelete: () => void;
  viewMode: ViewMode;
  onViewModeToggle: (mode: ViewMode) => void;
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
  viewMode,
  onViewModeToggle,
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
        {type === "agent" && (
          <ViewModeToggle viewMode={viewMode} onToggle={onViewModeToggle} />
        )}
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

export const EditorPane = ({ name, type, projectPath, onClose, onCreated, onDeleted }: EditorPaneProps) => {
  const [content, setContent] = useState("");
  const [savedContent, setSavedContent] = useState("");
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [deleteStatus, setDeleteStatus] = useState<DeleteStatus>("idle");
  const statusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deleteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [draftName, setDraftName] = useState("");
  const [createStatus, setCreateStatus] = useState<CreateStatus>("idle");

  const isCreateMode = name === null;
  const currentKey = `${type}:${projectPath}:${name}`;

  // Store the view mode key alongside the mode so we can reset to default when
  // the active file changes, without needing an effect.
  const defaultMode: ViewMode = type === "agent" ? "form" : "raw";
  const [storedViewMode, setStoredViewMode] = useState<{ key: string; mode: ViewMode }>({
    key: currentKey,
    mode: defaultMode,
  });
  const viewMode =
    storedViewMode.key === currentKey ? storedViewMode.mode : defaultMode;
  const setViewMode = (mode: ViewMode) =>
    setStoredViewMode({ key: currentKey, mode });

  const loading = !isCreateMode && loadedKey !== currentKey;
  const dirty = !loading && !isCreateMode && content !== savedContent;
  const saving = saveStatus === "saving";

  useEffect(() => {
    if (isCreateMode) return;
    const fetchContent = async () => {
      try {
        let text: string;
        if (type === "project") {
          text = await fetchProjectContent(name);
        } else if (type === "agent" && projectPath) {
          text = await fetchAgentContent(projectPath, name);
        } else if (type === "skill" && projectPath) {
          text = await fetchSkillContent(projectPath, name);
        } else if (type === "mcp-server" && projectPath) {
          text = await fetchMcpServerContent(projectPath, name);
        } else {
          text = "";
        }
        setContent(text);
        setSavedContent(text);
        setLoadedKey(currentKey);
        setSaveStatus("idle");
      } catch {
        setContent("");
        setSavedContent("");
        setLoadedKey(currentKey);
        setSaveStatus("idle");
      }
    };
    fetchContent();
  }, [name, type, projectPath, currentKey, isCreateMode]);

  useEffect(() => {
    const st = statusTimer.current;
    const dt = deleteTimer.current;
    return () => {
      if (st !== null) clearTimeout(st);
      if (dt !== null) clearTimeout(dt);
    };
  }, []);

  const handleSave = async () => {
    if (loading || !dirty || saving || isCreateMode || !name) return;
    setSaveStatus("saving");
    try {
      if (type === "agent" && projectPath) {
        await updateAgentContent(projectPath, name, content);
      } else if (type === "skill" && projectPath) {
        await updateSkillContent(projectPath, name, content);
      } else if (type === "project") {
        await updateProjectContent(name, content);
      } else if (type === "mcp-server" && projectPath) {
        await updateMcpServerContent(projectPath, name, content);
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
      if (type === "agent" && projectPath) await deleteAgent(projectPath, name);
      else if (type === "skill" && projectPath) await deleteSkill(projectPath, name);
      onDeleted?.();
    } catch {
      setDeleteStatus("error");
      deleteTimer.current = setTimeout(() => setDeleteStatus("idle"), 2000);
    }
  };

  // No dependency array: handleSave and dirty must be current on every keydown.
  // Adding them as deps would require memoizing handleSave, which isn't worth it.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      } else if (e.key === "Escape" && !dirty) {
        (document.activeElement as HTMLElement)?.blur();
        onClose();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  });

  const handleCreate = async () => {
    const trimmed = draftName.trim();
    if (trimmed === "" || createStatus === "creating" || !projectPath) return;
    setCreateStatus("creating");
    try {
      if (type === "agent") {
        await createAgent(projectPath, trimmed, content);
      } else if (type === "skill") {
        await createSkill(projectPath, trimmed, content);
      } else if (type === "mcp-server") {
        await createMcpServer(projectPath, trimmed, content);
      }
      onCreated?.(trimmed);
    } catch {
      setCreateStatus("error");
      statusTimer.current = setTimeout(() => setCreateStatus("idle"), 2000);
    }
  };

  const editorLanguage = type === "mcp-server" ? "json" : "markdown";
  const showFormView = type === "agent" && viewMode === "form";

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
          viewMode={viewMode}
          onViewModeToggle={setViewMode}
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
          viewMode={viewMode}
          onViewModeToggle={setViewMode}
        />
      )}
      <div className="flex-1 min-h-0">
        {loading ? (
          <div className="w-full h-full bg-[#0d0d10]" />
        ) : showFormView ? (
          <AgentFormEditor
            content={content}
            onChange={setContent}
            disabled={saving}
          />
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

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
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

// ── View mode toggle ──────────────────────────────────────────────────────────

interface ViewModeToggleProps {
  viewMode: ViewMode;
  onToggle: (mode: ViewMode) => void;
}

const ViewModeToggle = ({ viewMode, onToggle }: ViewModeToggleProps) => (
  <div className="flex items-center gap-3">
    <button
      type="button"
      onClick={() => onToggle("form")}
      className={[
        'text-[13px] bg-transparent border-none cursor-pointer p-0 transition-colors duration-150',
        viewMode === "form" ? "text-(--text-primary)" : "text-(--text-muted) hover:text-(--text-secondary)",
      ].join(' ')}
    >
      Form
    </button>
    <button
      type="button"
      onClick={() => onToggle("raw")}
      className={[
        'text-[13px] bg-transparent border-none cursor-pointer p-0 transition-colors duration-150',
        viewMode === "raw" ? "text-(--text-primary)" : "text-(--text-muted) hover:text-(--text-secondary)",
      ].join(' ')}
    >
      Raw
    </button>
  </div>
);

// ── Create header ─────────────────────────────────────────────────────────────

interface CreateHeaderProps {
  type: "agent" | "skill" | "mcp-server" | "project";
  draftName: string;
  onDraftNameChange: (val: string) => void;
  createStatus: CreateStatus;
  onCreate: () => void;
  viewMode: ViewMode;
  onViewModeToggle: (mode: ViewMode) => void;
  contentEmpty?: boolean;
}

const CreateHeader = ({
  type,
  draftName,
  onDraftNameChange,
  createStatus,
  onCreate,
  viewMode,
  onViewModeToggle,
  contentEmpty = false,
}: CreateHeaderProps) => {
  const creating = createStatus === "creating";
  const isError = createStatus === "error";
  const needsBody = type === "mcp-server" && contentEmpty;
  const disabled = draftName.trim() === "" || creating || needsBody;

  const label = creating ? "Creating…" : isError ? "Error" : "Create";

  return (
    <div className="px-5 border-b border-(--border-faint) flex items-center justify-between shrink-0 min-h-12 bg-(--bg-sidebar)">
      <div className="flex items-center gap-1.5">
        <span className='font-["Fira_Code",monospace] text-[12px] text-(--text-muted)'>
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
          className='bg-transparent font-["Fira_Code",monospace] text-[12px] text-(--text-secondary) outline-none border-none border-b border-(--border-subtle) w-48 transition-colors duration-150 focus:border-b-(--border-strong)'
          autoFocus
          spellCheck={false}
        />
      </div>
      <div className="flex items-center gap-3">
        {type === "agent" && (
          <ViewModeToggle viewMode={viewMode} onToggle={onViewModeToggle} />
        )}
        {needsBody && (
          <span className='font-["Fira_Code",monospace] text-[11px] text-(--text-muted) opacity-60'>
            add JSON body below first
          </span>
        )}
        <button
          onClick={onCreate}
          disabled={disabled}
          aria-label="Create file"
          className={[
            'text-[13px] px-3 py-1 rounded-md border-none transition-colors duration-150',
            isError
              ? "text-(--error) bg-transparent cursor-pointer"
              : !disabled
              ? "bg-(--accent) text-white cursor-pointer hover:bg-(--accent-hover)"
              : "bg-transparent text-(--text-muted) cursor-not-allowed opacity-40",
          ].join(' ')}
        >
          {label}
        </button>
      </div>
    </div>
  );
};

// ── Edit header ───────────────────────────────────────────────────────────────

interface EditHeaderProps {
  name: string;
  type: "agent" | "skill" | "mcp-server" | "project";
  saveStatus: SaveStatus;
  saveDisabled: boolean;
  onSave: () => void;
  viewMode: ViewMode;
  onViewModeToggle: (mode: ViewMode) => void;
  showViewToggle?: boolean;
}

const EditHeader = ({
  name,
  type,
  saveStatus,
  saveDisabled,
  onSave,
  viewMode,
  onViewModeToggle,
  showViewToggle = true,
}: EditHeaderProps) => {
  const saveLabel =
    saveStatus === "saving"
      ? "Saving…"
      : saveStatus === "saved"
      ? "Saved"
      : saveStatus === "error"
      ? "Error"
      : "Save";

  // Show the filled Save button only when there are unsaved changes
  const showSaveButton = !saveDisabled;

  const saveColor =
    saveStatus === "saved"
      ? "text-(--success)"
      : saveStatus === "error"
      ? "text-(--error)"
      : "text-(--text-muted)";

  return (
    <div className="px-5 border-b border-(--border-faint) flex items-center justify-between shrink-0 min-h-12 bg-(--bg-sidebar)">
      <span className='font-["Fira_Code",monospace] text-[12px] text-(--text-muted)'>
        {filePath(name, type)}
      </span>
      <div className="flex items-center gap-3">
        {type === "agent" && showViewToggle && (
          <ViewModeToggle viewMode={viewMode} onToggle={onViewModeToggle} />
        )}
        {/* Save — accent filled button only when dirty; transient status text otherwise */}
        {showSaveButton ? (
          <button
            onClick={onSave}
            aria-label="Save file"
            className='text-[13px] px-3 py-1 rounded-md bg-(--accent) border-none cursor-pointer text-white transition-colors duration-150 hover:bg-(--accent-hover)'
          >
            {saveLabel}
          </button>
        ) : (saveStatus === "saving" || saveStatus === "saved" || saveStatus === "error") ? (
          <span className={['text-[13px]', saveColor].join(' ')}>
            {saveLabel}
          </span>
        ) : null}
      </div>
    </div>
  );
};

// ── Back button ───────────────────────────────────────────────────────────────

const BackArrowIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8.5 2.5L4 7L8.5 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ── EditorPane ────────────────────────────────────────────────────────────────

export const EditorPane = ({ name, type, projectPath, onCreated, onDeleted }: EditorPaneProps) => {
  const navigate = useNavigate();
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

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      } else if (e.key === "Escape" && !dirty) {
        (document.activeElement as HTMLElement)?.blur();
        navigate(-1);
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
    <div className="relative flex flex-1 flex-col h-full w-full bg-(--bg-base) border-l border-(--border-faint)">
      {/* Back button */}
      <div className="absolute top-3.5 left-4 z-10">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-[13px] text-(--text-muted) hover:text-(--text-primary) bg-transparent border-none cursor-pointer transition-colors duration-150 p-0"
        >
          <BackArrowIcon /> Back
        </button>
      </div>

      {isCreateMode ? (
        <CreateHeader
          type={type}
          draftName={draftName}
          onDraftNameChange={setDraftName}
          createStatus={createStatus}
          onCreate={handleCreate}
          viewMode={viewMode}
          onViewModeToggle={setViewMode}
          contentEmpty={content.trim() === ""}
        />
      ) : !showFormView ? (
        <EditHeader
          name={name}
          type={type}
          saveStatus={saveStatus}
          saveDisabled={loading || !dirty || saving}
          onSave={handleSave}
          viewMode={viewMode}
          onViewModeToggle={setViewMode}
          showViewToggle={true}
        />
      ) : null}
      <div className="flex-1 min-h-0">
        {loading ? (
          <div className="w-full h-full bg-(--bg-base)" />
        ) : showFormView ? (
          <AgentFormEditor
            content={content}
            onChange={setContent}
            onDelete={handleDelete}
            onSave={handleSave}
            saveStatus={saveStatus}
            saveDisabled={loading || !dirty || saving}
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

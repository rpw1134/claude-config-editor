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

// ── View mode toggle ──────────────────────────────────────────────────────────

interface ViewModeToggleProps {
  viewMode: ViewMode;
  onToggle: (mode: ViewMode) => void;
}

const ViewModeToggle = ({ viewMode, onToggle }: ViewModeToggleProps) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    <button
      type="button"
      onClick={() => onToggle("form")}
      style={{
        fontFamily: 'Fira Code, monospace',
        fontSize: '13px',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        color: viewMode === "form" ? 'var(--text-primary)' : 'var(--text-muted)',
        transition: 'color 150ms ease',
        padding: 0,
      }}
      onMouseEnter={(e) => {
        if (viewMode !== "form") (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
      }}
      onMouseLeave={(e) => {
        if (viewMode !== "form") (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
      }}
    >
      Form
    </button>
    <span style={{ color: 'var(--text-muted)', fontSize: '13px', opacity: 0.5 }}>/</span>
    <button
      type="button"
      onClick={() => onToggle("raw")}
      style={{
        fontFamily: 'Fira Code, monospace',
        fontSize: '13px',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        color: viewMode === "raw" ? 'var(--text-primary)' : 'var(--text-muted)',
        transition: 'color 150ms ease',
        padding: 0,
      }}
      onMouseEnter={(e) => {
        if (viewMode !== "raw") (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
      }}
      onMouseLeave={(e) => {
        if (viewMode !== "raw") (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
      }}
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

  const label = creating ? "Creating…" : isError ? "Error" : "Create";

  return (
    <div style={{
      padding: '0 20px',
      borderBottom: '1px solid var(--border-faint)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexShrink: 0,
      minHeight: '48px',
      background: 'var(--bg-sidebar)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{
          fontFamily: 'Fira Code, monospace',
          fontSize: '12px',
          color: 'var(--text-muted)',
        }}>
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
          style={{
            background: 'transparent',
            fontFamily: 'Fira Code, monospace',
            fontSize: '12px',
            color: 'var(--text-secondary)',
            outline: 'none',
            border: 'none',
            borderBottom: '1px solid var(--border-subtle)',
            width: '192px',
            transition: 'border-color 150ms ease',
          }}
          onFocus={(e) => { (e.target as HTMLInputElement).style.borderBottomColor = 'var(--border-strong)'; }}
          onBlur={(e) => { (e.target as HTMLInputElement).style.borderBottomColor = 'var(--border-subtle)'; }}
          autoFocus
          spellCheck={false}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {type === "agent" && (
          <ViewModeToggle viewMode={viewMode} onToggle={onViewModeToggle} />
        )}
        <button
          onClick={onCreate}
          disabled={disabled}
          aria-label="Create file"
          style={{
            fontFamily: 'Fira Code, monospace',
            fontSize: '13px',
            padding: '4px 12px',
            borderRadius: '6px',
            background: !disabled ? 'var(--accent)' : 'transparent',
            border: 'none',
            cursor: disabled ? 'not-allowed' : 'pointer',
            color: isError ? 'var(--error)' : !disabled ? 'white' : 'var(--text-muted)',
            opacity: disabled && !isError ? 0.4 : 1,
            transition: 'background 150ms ease, color 150ms ease',
          }}
          onMouseEnter={(e) => {
            if (!disabled) (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent-hover)';
          }}
          onMouseLeave={(e) => {
            if (!disabled) (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent)';
          }}
        >
          {label}
        </button>
        <button
          onClick={onClose}
          aria-label="Close editor"
          style={{
            color: 'var(--text-muted)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: '18px',
            lineHeight: 1,
            transition: 'color 150ms ease',
            display: 'flex',
            alignItems: 'center',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'; }}
        >
          ×
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

  // Save button: when dirty (idle + not disabled) → accent filled button
  // When saved → plain success text, no button bg
  // When error → error text
  // When disabled (clean) → muted, no bg
  const showSaveButton = saveStatus === "idle" && !saveDisabled;
  const saveColor =
    saveStatus === "saved"
      ? 'var(--success)'
      : saveStatus === "error"
      ? 'var(--error)'
      : saveDisabled
      ? 'var(--text-muted)'
      : 'var(--text-secondary)';

  const deleteLabel =
    deleteStatus === "confirm"
      ? "Confirm?"
      : deleteStatus === "deleting"
      ? "Deleting…"
      : deleteStatus === "error"
      ? "Error"
      : "Delete";

  const deleteColor =
    deleteStatus === "deleting"
      ? 'var(--text-muted)'
      : deleteStatus === "confirm"
      ? 'var(--error)'
      : deleteStatus === "error"
      ? 'var(--error)'
      : 'var(--text-muted)';

  const canDelete = type === "agent" || type === "skill";

  return (
    <div style={{
      padding: '0 20px',
      borderBottom: '1px solid var(--border-faint)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexShrink: 0,
      minHeight: '48px',
      background: 'var(--bg-sidebar)',
    }}>
      <span style={{
        fontFamily: 'Fira Code, monospace',
        fontSize: '12px',
        color: 'var(--text-muted)',
      }}>
        {filePath(name, type)}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {type === "agent" && (
          <ViewModeToggle viewMode={viewMode} onToggle={onViewModeToggle} />
        )}
        {canDelete && (
          <button
            onClick={onDelete}
            disabled={deleteStatus === "deleting"}
            aria-label="Delete file"
            style={{
              fontFamily: 'Fira Code, monospace',
              fontSize: '13px',
              padding: '4px 10px',
              borderRadius: '6px',
              background: 'transparent',
              border: deleteStatus === "confirm" ? `1px solid rgba(248,113,113,0.3)` : 'none',
              cursor: deleteStatus === "deleting" ? 'not-allowed' : 'pointer',
              color: deleteColor,
              opacity: deleteStatus === "deleting" ? 0.4 : 1,
              transition: 'color 150ms ease, border-color 150ms ease',
            }}
            onMouseEnter={(e) => {
              if (deleteStatus === "idle") (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
            }}
            onMouseLeave={(e) => {
              if (deleteStatus === "idle") (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
            }}
          >
            {deleteLabel}
          </button>
        )}
        {/* Save — accent filled button only when there are unsaved changes */}
        {showSaveButton ? (
          <button
            onClick={onSave}
            aria-label="Save file"
            style={{
              fontFamily: 'Fira Code, monospace',
              fontSize: '13px',
              padding: '4px 12px',
              borderRadius: '6px',
              background: 'var(--accent)',
              border: 'none',
              cursor: 'pointer',
              color: 'white',
              transition: 'background 150ms ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent-hover)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent)';
            }}
          >
            {saveLabel}
          </button>
        ) : (
          <span style={{
            fontFamily: 'Fira Code, monospace',
            fontSize: '13px',
            color: saveColor,
            opacity: saveDisabled && saveStatus === "idle" ? 0.35 : 1,
          }}>
            {saveLabel}
          </span>
        )}
        <button
          onClick={onClose}
          aria-label="Close editor"
          style={{
            color: 'var(--text-muted)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: '18px',
            lineHeight: 1,
            transition: 'color 150ms ease',
            display: 'flex',
            alignItems: 'center',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'; }}
        >
          ×
        </button>
      </div>
    </div>
  );
};

// ── EditorPane ────────────────────────────────────────────────────────────────

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
    <div style={{
      display: 'flex',
      flex: 1,
      flexDirection: 'column',
      height: '100%',
      width: '100%',
      background: 'var(--bg-base)',
      borderLeft: '1px solid var(--border-faint)',
    }}>
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
      <div style={{ flex: 1, minHeight: 0 }}>
        {loading ? (
          <div style={{ width: '100%', height: '100%', background: 'var(--bg-base)' }} />
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

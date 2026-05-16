import { useEffect, useRef, useState } from "react";
import { useNavigate, useBlocker } from "react-router-dom";
import ReactMarkdown from "react-markdown";
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

function shortenHome(p: string): string {
  return p.replace(/^(\/Users\/[^/]+|\/home\/[^/]+)/, '~');
}

function filePath(
  name: string,
  type: "agent" | "skill" | "mcp-server" | "project",
  projectPath: string | null,
): string {
  const isGlobal = projectPath?.endsWith('/.claude') ?? true;
  const configDir = isGlobal
    ? '~/.claude'
    : projectPath
    ? shortenHome(projectPath) + '/.claude'
    : '~/.claude';

  if (type === "agent") return `${configDir}/agents/${name}.md`;
  if (type === "skill") return `${configDir}/skills/${name}/SKILL.md`;
  if (type === "project") {
    // name is the full project path when type === "project"
    return `${shortenHome(name)}/CLAUDE.md`;
  }
  return `~/.claude.json → mcpServers → ${name}`;
}

// ── View mode toggle ──────────────────────────────────────────────────────────

interface ViewModeToggleProps {
  viewMode: ViewMode;
  onToggle: (mode: ViewMode) => void;
}

const ViewModeToggle = ({ viewMode, onToggle }: ViewModeToggleProps) => (
  <div className="flex items-center bg-(--bg-surface) border border-(--border-subtle) rounded-md p-0.5">
    <button
      type="button"
      onClick={() => onToggle("form")}
      className={[
        'text-[13px] px-2.5 py-0.5 rounded cursor-pointer border-none transition-colors duration-150',
        viewMode === "form"
          ? "bg-(--bg-elevated) text-(--text-primary)"
          : "bg-transparent text-(--text-muted) hover:text-(--text-secondary)",
      ].join(' ')}
    >
      Form
    </button>
    <button
      type="button"
      onClick={() => onToggle("raw")}
      className={[
        'text-[13px] px-2.5 py-0.5 rounded cursor-pointer border-none transition-colors duration-150',
        viewMode === "raw"
          ? "bg-(--bg-elevated) text-(--text-primary)"
          : "bg-transparent text-(--text-muted) hover:text-(--text-secondary)",
      ].join(' ')}
    >
      Raw
    </button>
  </div>
);

// ── Back arrow icon ───────────────────────────────────────────────────────────

const BackArrowIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8.5 2.5L4 7L8.5 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ── Create header ─────────────────────────────────────────────────────────────

interface CreateHeaderProps {
  type: "agent" | "skill" | "mcp-server" | "project";
  projectPath: string | null;
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
  projectPath,
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

  const isGlobal = projectPath?.endsWith('/.claude') ?? true;
  const configDir = isGlobal
    ? '~/.claude'
    : projectPath
    ? shortenHome(projectPath) + '/.claude'
    : '~/.claude';
  const pathPrefix =
    type === "agent"
      ? `${configDir}/agents/`
      : type === "skill"
      ? `${configDir}/skills/`
      : "~/.claude.json → mcpServers → ";

  return (
    <div className="px-5 border-b border-(--border-faint) flex items-center justify-between shrink-0 min-h-12 bg-(--bg-sidebar)">
      <div className="flex items-center gap-1.5">
        <span className='font-["Fira_Code",monospace] text-[12px] text-(--text-muted)'>
          {pathPrefix}
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
  projectPath: string | null;
  saveStatus: SaveStatus;
  saveDisabled: boolean;
  onSave: () => void;
  viewMode: ViewMode;
  onViewModeToggle: (mode: ViewMode) => void;
  showViewToggle?: boolean;
  onBack?: () => void;
  previewMode?: boolean;
  onTogglePreview?: () => void;
}

const EditHeader = ({
  name,
  type,
  projectPath,
  saveStatus,
  saveDisabled,
  onSave,
  viewMode,
  onViewModeToggle,
  showViewToggle = true,
  onBack,
  previewMode,
  onTogglePreview,
}: EditHeaderProps) => {
  const isSaved = saveStatus === "saved";
  const saveLabel =
    saveStatus === "saving"
      ? "Saving…"
      : isSaved
      ? "Saved ✓"
      : saveDisabled
      ? "Up to date"
      : "Save";

  const isDisabled = saveDisabled && !isSaved;

  return (
    <div className="px-5 border-b border-(--border-faint) flex items-center justify-between shrink-0 min-h-12 bg-(--bg-sidebar)">
      {/* Left: optional Back button + file path */}
      <div className="flex items-center gap-0 min-w-0">
        {onBack && (
          <>
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1.5 text-[13px] text-(--text-muted) hover:text-(--text-primary) bg-transparent border-none cursor-pointer transition-colors duration-150 p-0 pr-3 shrink-0"
            >
              <BackArrowIcon /> Back
            </button>
            <span className="w-px h-4 bg-(--border-faint) mx-3 shrink-0" />
          </>
        )}
        <span className='font-["Fira_Code",monospace] text-[12px] text-(--text-muted) truncate'>
          {filePath(name, type, projectPath)}
        </span>
      </div>

      {/* Right: view toggle + preview toggle + save */}
      <div className="flex items-center gap-3 shrink-0 ml-3">
        {type === "agent" && showViewToggle && (
          <ViewModeToggle viewMode={viewMode} onToggle={onViewModeToggle} />
        )}
        {onTogglePreview && (
          <div className="flex items-center bg-(--bg-surface) border border-(--border-subtle) rounded-md p-0.5">
            <button
              type="button"
              onClick={() => previewMode && onTogglePreview()}
              className={[
                'text-[13px] px-2.5 py-0.5 rounded cursor-pointer border-none transition-colors duration-150',
                !previewMode
                  ? 'bg-(--bg-elevated) text-(--text-primary)'
                  : 'bg-transparent text-(--text-muted) hover:text-(--text-secondary)',
              ].join(' ')}
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => !previewMode && onTogglePreview()}
              className={[
                'text-[13px] px-2.5 py-0.5 rounded cursor-pointer border-none transition-colors duration-150',
                previewMode
                  ? 'bg-(--bg-elevated) text-(--text-primary)'
                  : 'bg-transparent text-(--text-muted) hover:text-(--text-secondary)',
              ].join(' ')}
            >
              Preview
            </button>
          </div>
        )}
        <button
          onClick={isDisabled ? undefined : onSave}
          disabled={isDisabled}
          aria-label="Save file"
          className={[
            'text-[13px] px-3 py-1 rounded-md border-none transition-colors duration-150',
            isDisabled
              ? 'bg-(--bg-surface) text-(--text-muted) opacity-50 cursor-not-allowed'
              : 'bg-(--accent) cursor-pointer text-white hover:bg-(--accent-hover)',
          ].join(' ')}
        >
          {saveLabel}
        </button>
      </div>
    </div>
  );
};

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
  const [storedPreviewKey, setStoredPreviewKey] = useState<string | null>(null);

  const isCreateMode = name === null;
  const currentKey = `${type}:${projectPath}:${name}`;

  // previewMode is true only when the stored key matches the current file
  const previewMode = storedPreviewKey === currentKey;
  const setPreviewMode = (on: boolean) =>
    setStoredPreviewKey(on ? currentKey : null);

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
  const isMarkdown = type === "project" || type === "skill";

  // Block router navigation when there are unsaved changes.
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty && currentLocation.pathname !== nextLocation.pathname,
  );

  return (
    <div className="flex flex-1 flex-col h-full w-full bg-(--bg-base) border-l border-(--border-faint)">
      {/* Unsaved-changes confirmation modal */}
      {blocker.state === "blocked" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => blocker.reset()}
        >
          <div
            className="bg-(--bg-surface) rounded-4.5 border border-(--border-subtle) p-8 max-w-90 w-full mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="m-0 mb-2 text-[20px] font-bold text-(--text-primary)">
              Unsaved changes
            </h2>
            <p className="m-0 mb-6 text-[14px] text-(--text-secondary)">
              Leave without saving? Your changes will be lost.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => blocker.proceed()}
                className="px-5 py-2.5 rounded-2.5 text-[14px] font-medium text-white bg-(--error) border-none cursor-pointer transition-colors duration-150"
              >
                Leave
              </button>
              <button
                onClick={() => blocker.reset()}
                className="text-[14px] text-(--text-muted) bg-transparent border-none cursor-pointer transition-colors duration-150 hover:text-(--text-secondary)"
              >
                Keep editing
              </button>
            </div>
          </div>
        </div>
      )}
      {isCreateMode ? (
        <CreateHeader
          type={type}
          projectPath={projectPath}
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
          projectPath={projectPath}
          saveStatus={saveStatus}
          saveDisabled={loading || !dirty || saving}
          onSave={handleSave}
          viewMode={viewMode}
          onViewModeToggle={setViewMode}
          showViewToggle={true}
          onBack={() => navigate(-1)}
          previewMode={isMarkdown ? previewMode : undefined}
          onTogglePreview={isMarkdown ? () => setPreviewMode(!previewMode) : undefined}
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
            deleteStatus={deleteStatus}
            onSave={handleSave}
            saveStatus={saveStatus}
            saveDisabled={loading || !dirty || saving}
            disabled={saving}
            onBack={() => navigate(-1)}
            filePath={name ? filePath(name, 'agent', projectPath) : undefined}
          />
        ) : isMarkdown && previewMode ? (
          <div className="flex-1 min-h-0 overflow-y-auto h-full px-14 py-10 prose prose-invert prose-sm max-w-none bg-(--bg-base)">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
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

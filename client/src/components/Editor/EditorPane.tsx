import { useEffect, useRef, useState } from "react";
import { useNavigate, useBlocker } from "react-router-dom";
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
import { AgentFormEditor } from "../Agent/AgentFormEditor";
import type { ViewMode } from "./parts/types";
import { CreateHeader } from "./parts/CreateHeader";
import { EditHeader } from "./parts/EditHeader";
import { MarkdownEditorView } from "./parts/MarkdownEditorView";

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

type EditorType = "agent" | "skill" | "mcp-server" | "project";

function shortenHome(p: string): string {
  return p.replace(/^(\/Users\/[^/]+|\/home\/[^/]+)/, "~");
}

function filePath(
  name: string,
  type: EditorType,
  projectPath: string | null,
): string {
  const isGlobal = projectPath?.endsWith("/.claude") ?? true;
  const configDir = isGlobal
    ? "~/.claude"
    : projectPath
      ? shortenHome(projectPath) + "/.claude"
      : "~/.claude";

  if (type === "agent") return `${configDir}/agents/${name}.md`;
  if (type === "skill") return `${configDir}/skills/${name}/SKILL.md`;
  if (type === "project") {
    // name is the full project path when type === "project"
    return `${shortenHome(name)}/CLAUDE.md`;
  }
  return `~/.claude.json → mcpServers → ${name}`;
}

export const EditorPane = ({
  name,
  type,
  projectPath,
  onCreated,
  onDeleted,
}: EditorPaneProps) => {
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
  const [storedViewMode, setStoredViewMode] = useState<{
    key: string;
    mode: ViewMode;
  }>({
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
      else if (type === "skill" && projectPath)
        await deleteSkill(projectPath, name);
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
  const isGlobal = projectPath?.endsWith("/.claude") ?? true;
  const configDir = isGlobal
    ? "~/.claude"
    : projectPath
      ? shortenHome(projectPath) + "/.claude"
      : "~/.claude";
  const createPathPrefix =
    type === "agent"
      ? `${configDir}/agents/`
      : type === "skill"
        ? `${configDir}/skills/`
        : "~/.claude.json → mcpServers → ";

  // Block router navigation when there are unsaved changes.
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty && currentLocation.pathname !== nextLocation.pathname,
  );

  useEffect(() => {
    if (!dirty && blocker.state === "blocked") {
      blocker.proceed();
    }
  }, [dirty, blocker]);

  return (
    <div className="flex flex-1 flex-col h-full w-full bg-(--bg-base)">
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
          pathPrefix={createPathPrefix}
          draftName={draftName}
          onDraftNameChange={setDraftName}
          createStatus={createStatus}
          onCreate={handleCreate}
          viewMode={viewMode}
          onViewModeToggle={setViewMode}
          contentEmpty={content.trim() === ""}
        />
      ) : !showFormView && !isMarkdown ? (
        <EditHeader
          filePath={filePath(name, type, projectPath)}
          type={type}
          saveStatus={saveStatus}
          saveDisabled={loading || !dirty || saving}
          onSave={handleSave}
          viewMode={viewMode}
          onViewModeToggle={setViewMode}
          showViewToggle={true}
          onBack={() => navigate(-1)}
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
            filePath={name ? filePath(name, "agent", projectPath) : undefined}
          />
        ) : isMarkdown && !isCreateMode ? (
          <MarkdownEditorView
            title={type === "project" ? "CLAUDE.md" : name}
            description={
              type === "project"
                ? "Project-level instructions and context for Claude Code."
                : "Skill documentation and instructions. Claude reads this when the skill is invoked."
            }
            resolvedFilePath={filePath(name, type, projectPath)}
            content={content}
            onChange={setContent}
            saveStatus={saveStatus}
            saveDisabled={loading || !dirty || saving}
            onSave={handleSave}
            onBack={() => navigate(-1)}
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

import { useEffect } from "react";
import { useBlocker } from "react-router-dom";
import { useMcpEditor } from "../../hooks/useMcpEditor";
import { Editor } from "../Editor/Editor";
import { ConfigureTab } from "./tabs/ConfigureTab";
import { McpSettingsTab } from "./tabs/McpSettingsTab";
import { UnsavedModal } from "../Shared/UnsavedModal";
import { ChevronLeftIcon } from "../Icons";
import { VCHistoryTab } from "../VersionControl/VCHistoryTab";

// ── Types ─────────────────────────────────────────────────────────────────────

type TabId = "configure" | "json" | "settings" | "history";

// ── TabButton ─────────────────────────────────────────────────────────────────

interface TabButtonProps {
  id: TabId;
  label: string;
  active: TabId;
  onClick: (id: TabId) => void;
}

const TabButton = ({ id, label, active, onClick }: TabButtonProps) => {
  const isActive = active === id;
  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      className={[
        "pt-4 pb-3.5 px-3 bg-transparent border-none relative transition-colors duration-150 text-[14px]",
        isActive
          ? "cursor-default font-semibold text-(--text-primary) after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-(--accent)"
          : "cursor-pointer text-(--text-secondary) hover:text-(--text-primary)",
      ].join(" ")}
    >
      {label}
    </button>
  );
};

// ── McpEditorPane ─────────────────────────────────────────────────────────────

export interface McpEditorPaneProps {
  name: string;
  projectPath: string;
  onBack: () => void;
  onDeleted: () => void;
}

export const McpEditorPane = ({
  name,
  projectPath,
  onBack,
  onDeleted,
}: McpEditorPaneProps) => {
  const {
    loading,
    loadError,
    activeTab,
    setActiveTab,
    serverType,
    command,
    argsRaw,
    envRaw,
    url,
    authType,
    token,
    setCommandDirty,
    setArgsRawDirty,
    setEnvRawDirty,
    setUrlDirty,
    setAuthTypeDirty,
    setTokenDirty,
    rawJson,
    setRawJson,
    dirty,
    saving,
    handleConfigureSave,
    handleJsonSave,
    deleteConfirm,
    setDeleteConfirm,
    deleting,
    handleDeleteClick,
  } = useMcpEditor(name, projectPath, onDeleted);

  // Block router navigation when there are unsaved changes
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty && currentLocation.pathname !== nextLocation.pathname,
  );
  useEffect(() => {
    if (!dirty && blocker.state === "blocked") blocker.proceed();
  }, [dirty, blocker]);

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-(--bg-base)">
        <span className="text-[13px] text-(--text-muted)">Loading…</span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex-1 flex items-center justify-center bg-(--bg-base)">
        <span className="text-[13px] text-(--error) font-['Fira_Code',monospace]">
          {loadError}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-(--bg-base)">
      {blocker.state === "blocked" && (
        <UnsavedModal
          onLeave={() => blocker.proceed()}
          onKeep={() => blocker.reset()}
        />
      )}
      <div className="shrink-0 flex items-stretch justify-between px-4">
        <div className="flex items-stretch gap-1">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 pt-6 pb-5 text-[14px] text-(--text-secondary) hover:text-(--text-primary) bg-transparent border-none cursor-pointer transition-colors duration-150 pr-3 mr-2"
          >
            <ChevronLeftIcon /> Back
          </button>
          <TabButton id="configure" label="Configure" active={activeTab} onClick={setActiveTab} />
          <TabButton id="json" label="JSON" active={activeTab} onClick={setActiveTab} />
          <TabButton id="settings" label="Settings" active={activeTab} onClick={setActiveTab} />
          <TabButton id="history" label="History" active={activeTab} onClick={setActiveTab} />
        </div>

        <div className="flex items-center gap-3">
          <span className='font-["Fira_Code",monospace] text-[11px] text-(--text-muted) truncate max-w-48 hidden sm:block'>
            ~/.claude/mcpServers/{name}
          </span>
          {activeTab !== "settings" && activeTab !== "history" && (
            <button
              type="button"
              onClick={(!dirty || saving) ? undefined : (activeTab === "configure" ? handleConfigureSave : handleJsonSave)}
              disabled={!dirty || saving}
              className={[
                "text-[13px] font-medium px-3 py-1 rounded-lg border-none transition-colors duration-150",
                (!dirty || saving)
                  ? "bg-(--bg-surface) text-(--text-muted) opacity-50 cursor-not-allowed"
                  : "text-(--accent) font-semibold cursor-pointer hover:bg-(--accent)/8 bg-transparent border-none",
              ].join(" ")}
            >
              {saving ? "Saving…" : dirty ? "Save" : "Up to date"}
            </button>
          )}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === "configure" && (
        <ConfigureTab
          serverType={serverType}
          command={command}
          onCommandChange={setCommandDirty}
          argsRaw={argsRaw}
          onArgsChange={setArgsRawDirty}
          envRaw={envRaw}
          onEnvChange={setEnvRawDirty}
          url={url}
          onUrlChange={setUrlDirty}
          authType={authType}
          onAuthTypeChange={setAuthTypeDirty}
          token={token}
          onTokenChange={setTokenDirty}
        />
      )}

      {activeTab === "settings" && (
        <McpSettingsTab
          name={name}
          deleteConfirm={deleteConfirm}
          deleting={deleting}
          onDeleteClick={handleDeleteClick}
          onDeleteBlur={() => setDeleteConfirm(false)}
        />
      )}

      {activeTab === "json" && (
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 min-h-0">
            <Editor
              value={rawJson}
              onChange={setRawJson}
              language="json"
            />
          </div>
        </div>
      )}

      {activeTab === "history" && (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <VCHistoryTab
            projectPath={projectPath}
            filePath=".claude/settings.json"
            jsonPath={`mcpServers.${name}`}
          />
        </div>
      )}
    </div>
  );
};

import { useEffect, useState } from "react";
import { useBlocker } from "react-router-dom";
import { useHooksEditor } from "../../hooks/useHooksEditor";
import { Editor } from "../Editor/Editor";
import { UnsavedModal } from "../Shared/UnsavedModal";
import { EventSection } from "./EventSection";
import { AddHookModal } from "./AddHookModal";
import { PlusIcon } from "../Icons";

type TabId = "visual" | "json";

const TabButton = ({
  id,
  label,
  active,
  onClick,
}: {
  id: TabId;
  label: string;
  active: TabId;
  onClick: (id: TabId) => void;
}) => {
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

interface HooksPageProps {
  projectPath: string;
}

export const HooksPage = ({ projectPath }: HooksPageProps) => {
  const {
    hooks,
    rawJson,
    setRawJson,
    loading,
    loadError,
    activeTab,
    setActiveTab,
    dirty,
    saving,
    addHookGroup,
    deleteHookGroup,
    handleSave,
  } = useHooksEditor(projectPath);

  const [showAddModal, setShowAddModal] = useState(false);

  // Cmd+S / Ctrl+S save
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (dirty && !saving) handleSave();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [dirty, saving, handleSave]);

  // Navigation blocker when dirty
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty && currentLocation.pathname !== nextLocation.pathname
  );
  useEffect(() => {
    if (!dirty && blocker.state === "blocked") blocker.proceed();
  }, [dirty, blocker]);

  const isGlobal = projectPath.endsWith("/.claude");
  const filePath = isGlobal ? "~/.claude/settings.json" : ".claude/settings.json";

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

  const eventEntries = Object.entries(hooks);

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-(--bg-base)">
      {blocker.state === "blocked" && (
        <UnsavedModal
          onLeave={() => blocker.proceed()}
          onKeep={() => blocker.reset()}
        />
      )}

      {/* Tab bar — matches McpEditorPane */}
      <div className="shrink-0 flex items-stretch justify-between border-b border-(--border-faint) px-4">
        <div className="flex items-stretch gap-1">
          <TabButton id="visual" label="Visual" active={activeTab} onClick={setActiveTab} />
          <TabButton id="json" label="JSON" active={activeTab} onClick={setActiveTab} />
        </div>
        <div className="flex items-center gap-3">
          <span className='font-["Fira_Code",monospace] text-[11px] text-(--text-muted) truncate max-w-48 hidden sm:block'>
            {filePath}
          </span>
          <button
            type="button"
            onClick={dirty && !saving ? handleSave : undefined}
            disabled={!dirty || saving}
            className={[
              "text-[13px] font-medium px-3 py-1 rounded-lg border-none transition-colors duration-150",
              !dirty || saving
                ? "bg-(--bg-surface) text-(--text-muted) opacity-50 cursor-not-allowed"
                : "bg-(--accent) text-white cursor-pointer hover:bg-(--accent-hover)",
            ].join(" ")}
          >
            {saving ? "Saving…" : dirty ? "Save" : "Up to date"}
          </button>
        </div>
      </div>

      {/* Visual tab */}
      {activeTab === "visual" && (
        <div className="flex-1 min-h-0 overflow-y-auto px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className='m-0 mb-1 text-2xl font-["Bricolage_Grotesque",sans-serif] font-bold tracking-[-0.015em] text-(--text-primary)'>
                Hooks
              </h2>
              <p className="m-0 text-[13px] text-(--text-muted)">
                Shell commands that run at specific lifecycle events.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 text-[13px] font-medium px-3 py-1.5 rounded-lg border border-(--border-subtle) bg-(--bg-surface) text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--bg-hover) cursor-pointer transition-colors"
            >
              <PlusIcon />
              Add Hook
            </button>
          </div>

          {eventEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <p className="m-0 text-[14px] text-(--text-muted)">No hooks configured.</p>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 text-[13px] font-medium px-4 py-2 rounded-lg bg-(--accent) text-white border-none cursor-pointer hover:bg-(--accent-hover) transition-colors"
              >
                <PlusIcon />
                Add your first hook
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {eventEntries.map(([event, groups]) => (
                <EventSection
                  key={event}
                  event={event}
                  groups={groups}
                  onDeleteGroup={(i) => deleteHookGroup(event, i)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* JSON tab */}
      {activeTab === "json" && (
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 min-h-0">
            <Editor
              value={rawJson}
              onChange={(val) => setRawJson(val)}
              language="json"
            />
          </div>
        </div>
      )}

      {showAddModal && (
        <AddHookModal
          onAdd={addHookGroup}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
};

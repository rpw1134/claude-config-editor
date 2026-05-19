import { useEffect, useRef, useState } from "react";
import { type HooksConfig } from "../../lib/api";
import { type HookTabId } from "../../hooks/useHooksEditor";
import { Editor } from "../Editor/Editor";
import { ChevronLeftIcon, PlusIcon } from "../Icons";
import { HookGroupCard } from "./HookGroupCard";
import { AddHookModal } from "./AddHookModal";

// ── TabButton ─────────────────────────────────────────────────────────────────

const TabButton = ({
  id,
  label,
  active,
  onClick,
}: {
  id: HookTabId;
  label: string;
  active: HookTabId;
  onClick: (id: HookTabId) => void;
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

// ── Types ─────────────────────────────────────────────────────────────────────

interface HookGroup {
  matcher: string;
  hooks: Array<{ type?: string; command?: string; url?: string; timeout?: number }>;
}

interface HooksEventDetailProps {
  event: string;
  projectPath: string;
  hooks: HooksConfig;
  rawJson: string;
  setRawJson: (val: string) => void;
  activeTab: HookTabId;
  setActiveTab: (tab: HookTabId) => void;
  dirty: boolean;
  saving: boolean;
  addHookGroup: (event: string, group: { matcher: string; hooks: Array<Record<string, unknown>> }) => void;
  editHookGroup: (event: string, index: number, group: { matcher: string; hooks: Array<Record<string, unknown>> }) => void;
  deleteHookGroup: (event: string, index: number) => void;
  handleSave: () => Promise<void>;
  onBack: () => void;
}

// ── HooksEventDetail ──────────────────────────────────────────────────────────

export const HooksEventDetail = ({
  event,
  projectPath,
  hooks,
  rawJson,
  setRawJson,
  activeTab,
  setActiveTab,
  dirty,
  saving,
  addHookGroup,
  editHookGroup,
  deleteHookGroup,
  handleSave,
  onBack,
}: HooksEventDetailProps) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<{ index: number; group: HookGroup } | null>(null);
  const [showFullJson, setShowFullJson] = useState(false);
  const [localEventJson, setLocalEventJson] = useState(() =>
    JSON.stringify(hooks[event] ?? [], null, 2)
  );

  // Re-sync localEventJson when switching to the JSON tab
  const prevTabRef = useRef(activeTab);
  useEffect(() => {
    if (activeTab === "json" && prevTabRef.current !== "json" && !showFullJson) {
      setLocalEventJson(JSON.stringify(hooks[event] ?? [], null, 2));
    }
    prevTabRef.current = activeTab;
  }, [activeTab, event, hooks, showFullJson]);

  const handleEventJsonChange = (val: string) => {
    setLocalEventJson(val);
    try {
      const parsed = JSON.parse(val) as unknown;
      if (Array.isArray(parsed)) {
        const allHooks = (() => {
          try { return JSON.parse(rawJson) as Record<string, unknown>; }
          catch { return {} as Record<string, unknown>; }
        })();
        if (parsed.length === 0) {
          delete allHooks[event];
        } else {
          allHooks[event] = parsed;
        }
        setRawJson(JSON.stringify(allHooks, null, 2));
      }
    } catch {
      // invalid JSON — leave rawJson unchanged
    }
  };

  const handleToggleFullJson = (full: boolean) => {
    setShowFullJson(full);
    if (!full) {
      try {
        const allHooks = JSON.parse(rawJson) as Record<string, unknown>;
        setLocalEventJson(JSON.stringify(allHooks[event] ?? [], null, 2));
      } catch {
        setLocalEventJson("[]");
      }
    }
  };

  const groups = hooks[event] ?? [];
  const isGlobal = projectPath.endsWith("/.claude");

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-(--bg-base)">
      {/* Header — matches McpEditorPane exactly */}
      <div className="shrink-0 flex items-stretch justify-between border-b border-(--border-faint) px-4">
        <div className="flex items-stretch gap-1">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 pt-6 pb-5 text-[14px] text-(--text-secondary) hover:text-(--text-primary) bg-transparent border-none cursor-pointer transition-colors duration-150 pr-3 mr-2 border-r border-(--border-subtle)"
          >
            <ChevronLeftIcon /> Back
          </button>
          <TabButton id="visual" label="Visual" active={activeTab} onClick={setActiveTab} />
          <TabButton id="json" label="JSON" active={activeTab} onClick={setActiveTab} />
        </div>
        <div className="flex items-center gap-3">
          <span className='font-["Fira_Code",monospace] text-[11px] text-(--text-muted) truncate max-w-48 hidden sm:block'>
            {isGlobal ? "~/.claude/settings.json" : ".claude/settings.json"}
          </span>
          <button
            type="button"
            onClick={dirty && !saving ? handleSave : undefined}
            disabled={!dirty || saving}
            className={[
              "text-[13px] font-medium px-3 py-1 rounded-lg border-none transition-colors duration-150",
              !dirty || saving
                ? "bg-(--bg-surface) text-(--text-muted) opacity-50 cursor-not-allowed"
                : "bg-(--accent) text-(--bg-base) font-semibold cursor-pointer hover:bg-(--accent-hover)",
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
                {event}
              </h2>
              <p className="m-0 text-[13px] text-(--text-muted)">
                {groups.length} {groups.length === 1 ? "hook" : "hooks"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 text-[13px] font-medium px-3 py-1.5 rounded-lg border border-(--border-subtle) bg-(--bg-surface) text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--bg-hover) cursor-pointer transition-colors"
            >
              <PlusIcon /> Add hook
            </button>
          </div>

          {groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <p className="m-0 text-[14px] text-(--text-muted)">No hooks for this event.</p>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 text-[13px] font-semibold px-4 py-2 rounded-lg bg-(--accent) text-(--bg-base) border-none cursor-pointer hover:bg-(--accent-hover) transition-colors"
              >
                <PlusIcon /> Add hook
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {groups.map((group, i) => (
                <HookGroupCard
                  key={i}
                  group={group}
                  onEdit={() => setEditingGroup({ index: i, group })}
                  onDelete={() => deleteHookGroup(event, i)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* JSON tab */}
      {activeTab === "json" && (
        <div className="flex flex-col flex-1 min-h-0">
          <div className="shrink-0 flex items-center justify-end px-4 py-2 border-b border-(--border-faint)">
            <label className="flex items-center gap-2 cursor-pointer select-none text-[12px] text-(--text-muted) hover:text-(--text-secondary) transition-colors">
              <input
                type="checkbox"
                checked={showFullJson}
                onChange={(e) => handleToggleFullJson(e.target.checked)}
                className="sr-only"
              />
              <div className={[
                "w-3.5 h-3.5 rounded border transition-colors duration-150 flex items-center justify-center shrink-0",
                showFullJson
                  ? "bg-(--accent) border-(--accent)"
                  : "bg-transparent border-(--border-default)",
              ].join(" ")}>
                {showFullJson && (
                  <svg viewBox="0 0 10 10" fill="none" className="w-full h-full p-0.5">
                    <path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              Show full hooks config
            </label>
          </div>
          <div className="flex-1 min-h-0">
            {showFullJson ? (
              <Editor value={rawJson} onChange={(val) => setRawJson(val)} language="json" />
            ) : (
              <Editor value={localEventJson} onChange={handleEventJsonChange} language="json" />
            )}
          </div>
        </div>
      )}

      {/* Add modal */}
      {showAddModal && (
        <AddHookModal
          fixedEvent={event}
          onConfirm={(_, group) => {
            addHookGroup(event, group);
            setShowAddModal(false);
          }}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {/* Edit modal */}
      {editingGroup && (
        <AddHookModal
          fixedEvent={event}
          initialGroup={editingGroup.group}
          onConfirm={(_, group) => {
            editHookGroup(event, editingGroup.index, group);
            setEditingGroup(null);
          }}
          onClose={() => setEditingGroup(null)}
        />
      )}
    </div>
  );
};

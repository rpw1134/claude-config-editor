import { useEffect, useState } from "react";
import { useBlocker } from "react-router-dom";
import { useHooksEditor } from "../../hooks/useHooksEditor";
import { useVersionControl } from "../../contexts/VersionControlContext";
import { UnsavedModal } from "../Shared/UnsavedModal";
import { HooksLanding } from "./HooksLanding";
import { HooksEventDetail } from "./HooksEventDetail";
import { VCHistoryTab } from "../VersionControl/VCHistoryTab";

interface HooksPageProps {
  projectPath: string;
}

export const HooksPage = ({ projectPath }: HooksPageProps) => {
  const hooksEditor = useHooksEditor(projectPath);
  const { dirty, saving, handleSave, hooks } = hooksEditor;
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"hooks" | "history">("hooks");

  const { getItemStatus, markHooksDirty } = useVersionControl();
  const hooksVcStatus = getItemStatus("hooks", "settings");

  const wrappedSave = async () => {
    await handleSave();
    const eventNames = Object.keys(hooks ?? {});
    if (eventNames.length > 0) {
      eventNames.forEach((eventName) => markHooksDirty(eventName));
    } else {
      markHooksDirty("settings");
    }
  };

  // Cmd+S / Ctrl+S — works on both landing and event detail
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (dirty && !saving) wrappedSave();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [dirty, saving, wrappedSave]);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty && currentLocation.pathname !== nextLocation.pathname
  );

  if (hooksEditor.loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-(--bg-base)">
        <span className="text-[13px] text-(--text-muted)">Loading…</span>
      </div>
    );
  }

  if (hooksEditor.loadError) {
    return (
      <div className="flex-1 flex items-center justify-center bg-(--bg-base)">
        <span className="text-[13px] text-(--error) font-['Fira_Code',monospace]">
          {hooksEditor.loadError}
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

      {/* View tabs */}
      <div className="shrink-0 flex items-stretch px-4 border-b border-(--border-faint)">
        <button
          type="button"
          onClick={() => setActiveView("hooks")}
          className={[
            "pt-4 pb-3.5 px-3 bg-transparent border-none relative transition-colors duration-150 flex items-center gap-1.5",
            activeView === "hooks"
              ? "cursor-default text-[14px] font-semibold text-(--text-primary) after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-(--accent)"
              : "cursor-pointer text-[14px] text-(--text-secondary) hover:text-(--text-primary)",
          ].join(" ")}
        >
          Hooks
          {hooksVcStatus && (
            <span
              className={[
                "w-1.5 h-1.5 rounded-full",
                hooksVcStatus === "M" ? "bg-amber-400" : "bg-emerald-400",
              ].join(" ")}
            />
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveView("history")}
          className={[
            "pt-4 pb-3.5 px-3 bg-transparent border-none relative transition-colors duration-150",
            activeView === "history"
              ? "cursor-default text-[14px] font-semibold text-(--text-primary) after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-(--accent)"
              : "cursor-pointer text-[14px] text-(--text-secondary) hover:text-(--text-primary)",
          ].join(" ")}
        >
          History
        </button>
      </div>

      {activeView === "hooks" && (
        selectedEvent ? (
          <HooksEventDetail
            event={selectedEvent}
            projectPath={projectPath}
            onBack={() => setSelectedEvent(null)}
            {...hooksEditor}
            handleSave={wrappedSave}
          />
        ) : (
          <HooksLanding
            hooks={hooks}
            dirty={dirty}
            saving={saving}
            onSelectEvent={setSelectedEvent}
            onSave={wrappedSave}
          />
        )
      )}

      {activeView === "history" && (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <VCHistoryTab
            projectPath={projectPath}
            filePath=".claude/settings.json"
          />
        </div>
      )}
    </div>
  );
};

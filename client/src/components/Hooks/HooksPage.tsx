import { useEffect, useState } from "react";
import { useBlocker } from "react-router-dom";
import { useHooksEditor } from "../../hooks/useHooksEditor";
import { useVersionControl } from "../../contexts/VersionControlContext";
import { UnsavedModal } from "../Shared/UnsavedModal";
import { HooksLanding } from "./HooksLanding";
import { HooksEventDetail } from "./HooksEventDetail";

interface HooksPageProps {
  projectPath: string;
}

export const HooksPage = ({ projectPath }: HooksPageProps) => {
  const hooksEditor = useHooksEditor(projectPath);
  const { dirty, saving, handleSave, hooks } = hooksEditor;
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);

  const { refresh: refreshVc } = useVersionControl();

  const wrappedSave = async () => {
    await handleSave();
    refreshVc();
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

      {selectedEvent ? (
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
      )}
    </div>
  );
};

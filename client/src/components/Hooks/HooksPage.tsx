import { useState } from "react";
import { useBlocker } from "react-router-dom";
import { useHooksEditor } from "../../hooks/useHooksEditor";
import { UnsavedModal } from "../Shared/UnsavedModal";
import { HooksLanding } from "./HooksLanding";
import { HooksEventDetail } from "./HooksEventDetail";
import { AddHookModal } from "./AddHookModal";

interface HooksPageProps {
  projectPath: string;
}

export const HooksPage = ({ projectPath }: HooksPageProps) => {
  const hooksEditor = useHooksEditor(projectPath);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hooksEditor.dirty && currentLocation.pathname !== nextLocation.pathname
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
        />
      ) : (
        <>
          <HooksLanding
            hooks={hooksEditor.hooks}
            dirty={hooksEditor.dirty}
            saving={hooksEditor.saving}
            onSelectEvent={setSelectedEvent}
            onAddHook={() => setShowAddModal(true)}
            onSave={hooksEditor.handleSave}
          />
          {showAddModal && (
            <AddHookModal
              onConfirm={(event, group) => {
                hooksEditor.addHookGroup(event, group);
                setShowAddModal(false);
              }}
              onClose={() => setShowAddModal(false)}
            />
          )}
        </>
      )}
    </div>
  );
};

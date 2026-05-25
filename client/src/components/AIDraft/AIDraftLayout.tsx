import { useCallback, useState } from "react";
import { useBlocker } from "react-router-dom";
import { useAIDraft } from "../../contexts/AIDraftContext";
import { UnsavedModal } from "../Shared/UnsavedModal";
import { ArtifactBadge } from "./ArtifactBadge";
import { ArtifactSidebar } from "./ArtifactSidebar";
import { ChatInterface } from "./ChatInterface";

// ── AIDraftLayout ─────────────────────────────────────────────────────────────

interface AIDraftLayoutProps {
  projectPath: string;
}

export const AIDraftLayout = ({ projectPath }: AIDraftLayoutProps) => {
  const { unsavedCount, clearSession } = useAIDraft();
  const [showModal, setShowModal] = useState(false);

  const blocker = useBlocker(
    useCallback(
      ({ currentLocation, nextLocation }) =>
        unsavedCount > 0 && currentLocation.pathname !== nextLocation.pathname,
      [unsavedCount]
    )
  );

  // Sync local modal state with blocker state
  const isBlocking = blocker.state === "blocked";

  const handleLeave = () => {
    clearSession();
    blocker.proceed?.();
    setShowModal(false);
  };

  const handleKeep = () => {
    blocker.reset?.();
    setShowModal(false);
  };

  return (
    <div className="flex flex-row flex-1 min-h-0 overflow-hidden bg-(--bg-base)">
      {/* Chat area */}
      <div className="relative flex flex-col flex-1 min-h-0 min-w-0">
        <ArtifactBadge />
        <ChatInterface projectPath={projectPath} />
      </div>

      {/* Artifact sidebar */}
      <ArtifactSidebar />

      {/* Navigation blocker modal */}
      {isBlocking && (
        <UnsavedModal
          onLeave={handleLeave}
          onKeep={handleKeep}
        />
      )}
      {showModal && (
        <UnsavedModal
          onLeave={handleLeave}
          onKeep={handleKeep}
        />
      )}
    </div>
  );
};

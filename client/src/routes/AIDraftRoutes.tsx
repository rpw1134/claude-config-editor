import { Navigate, useParams } from "react-router-dom";
import { AIDraftProvider } from "../contexts/AIDraftContext";
import { AIDraftLayout } from "../components/AIDraft/AIDraftLayout";
import { decodeProject } from "../lib/navigation";
import { useShell } from "../contexts/ShellContext";

// ── AIDraftContent ────────────────────────────────────────────────────────────

export const AIDraftContent = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { selectedProjectPath } = useShell();
  const projectPath = projectId ? decodeProject(projectId) : null;

  if (!projectPath) return <Navigate to="/" replace />;

  if (!selectedProjectPath) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center px-8 bg-(--bg-base)">
        <p className="text-[14px] text-(--text-muted)">
          Select a project to use AI Draft.
        </p>
      </div>
    );
  }

  return (
    <AIDraftProvider projectPath={projectPath}>
      <AIDraftLayout projectPath={projectPath} />
    </AIDraftProvider>
  );
};

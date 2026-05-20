import { useVersionControl } from "../../contexts/VersionControlContext";
import { VCInitPrompt } from "./VCInitPrompt";
import { VCChangesPane } from "./VCChangesPane";

interface VersionControlPageProps {
  projectPath: string;
}

export const VersionControlPage = ({ projectPath }: VersionControlPageProps) => {
  const { status, isLoading } = useVersionControl();

  if (isLoading && !status) {
    return (
      <div className="flex-1 flex items-center justify-center bg-(--bg-base)">
        <span className="text-[13px] text-(--text-muted)">Loading…</span>
      </div>
    );
  }

  if (!status || !status.initialized) {
    return <VCInitPrompt projectPath={projectPath} />;
  }

  return <VCChangesPane projectPath={projectPath} />;
};

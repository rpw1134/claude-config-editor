import { useParams } from "react-router-dom";
import { VersionControlPage } from "../components/VersionControl/VersionControlPage";
import { decodeProject } from "../lib/navigation";

export const VCContent = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const projectPath = projectId ? decodeProject(projectId) : null;
  if (!projectPath) return null;
  return <VersionControlPage projectPath={projectPath} />;
};

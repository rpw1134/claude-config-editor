import { useState } from "react";
import { DeleteProjectModal } from "../Modals/DeleteProjectModal";

// ── Types ─────────────────────────────────────────────────────────────────────

type TabId = "project";

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

// ── ProjectSettingsPage ───────────────────────────────────────────────────────

export interface ProjectSettingsPageProps {
  projectPath: string;
  onDeleted: () => void;
}

export const ProjectSettingsPage = ({
  projectPath,
  onDeleted,
}: ProjectSettingsPageProps) => {
  const [activeTab, setActiveTab] = useState<TabId>("project");
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const projectName = projectPath.split("/").pop() ?? projectPath;

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-(--bg-base)">
      {/* Tab bar */}
      <div className="shrink-0 flex items-stretch border-b border-(--border-faint) px-4">
        <TabButton
          id="project"
          label="Project"
          active={activeTab}
          onClick={setActiveTab}
        />
      </div>

      {/* Tab content */}
      {activeTab === "project" && (
        <div className="flex-1 min-h-0 overflow-y-auto px-8 py-8 flex flex-col gap-8">
          {/* Project identity */}
          <div>
            <h2 className='m-0 mb-1 text-2xl font-["Bricolage_Grotesque",sans-serif] font-bold tracking-[-0.015em] text-(--text-primary)'>
              {projectName}
            </h2>
            <p className='m-0 text-[13px] font-["Fira_Code",monospace] text-(--text-muted)'>
              {projectPath}
            </p>
          </div>

          {/* Danger zone */}
          <div className="border border-red-500/30 rounded-xl p-5">
            <div className="mb-4">
              <p className="m-0 mb-1 text-[13px] font-semibold text-red-400">
                &#9888; Danger Zone
              </p>
              <p className="m-0 text-[12px] text-(--text-muted)">
                Permanent actions that cannot be undone.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="text-[13px] font-medium px-3 py-1.5 rounded-lg border transition-colors duration-150 cursor-pointer bg-transparent border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              Delete project
            </button>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {showDeleteModal && (
        <DeleteProjectModal
          projectName={projectName}
          projectPath={projectPath}
          onDeleted={onDeleted}
          onClose={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
};

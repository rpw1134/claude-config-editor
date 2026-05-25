import { useEffect, useState } from "react";
import { DeleteProjectModal } from "../Modals/DeleteProjectModal";
import { fetchProfile, updateProfile } from "../../lib/api";
import { EyeIcon } from "../Icons";

// ── Types ─────────────────────────────────────────────────────────────────────

type TabId = "project" | "profile";

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

// ── ProfileTab ────────────────────────────────────────────────────────────────

const ProfileTab = () => {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "saving" | "saved" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetchProfile()
      .then((data) => {
        setApiKey(data.apiKey ?? "");
        setStatus("idle");
      })
      .catch(() => {
        setStatus("error");
        setErrorMsg("Failed to load profile.");
      });
  }, []);

  const handleSave = async () => {
    setStatus("saving");
    setErrorMsg("");
    try {
      await updateProfile(apiKey);
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2500);
    } catch {
      setStatus("error");
      setErrorMsg("Failed to save API key.");
    }
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-8 py-8 flex flex-col gap-6 max-w-xl">
      <div>
        <h2 className='m-0 mb-1 text-2xl font-["Bricolage_Grotesque",sans-serif] font-bold tracking-[-0.015em] text-(--text-primary)'>
          Profile
        </h2>
        <p className="m-0 text-[13px] text-(--text-muted)">
          Configure your personal settings for AI features.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-[13px] font-semibold text-(--text-primary)">
          Anthropic API Key
        </label>
        <p className="m-0 text-[12px] text-(--text-muted) leading-relaxed">
          Your API key is stored locally in{" "}
          <code className="font-['Fira_Code',monospace] text-[11px] bg-(--bg-elevated) border border-(--border-faint) px-1.5 py-0.5 rounded">
            ~/.stryde/profile.local.json
          </code>{" "}
          and is never shared.
        </p>
        <div className="relative flex items-center">
          <input
            type={showKey ? "text" : "password"}
            value={apiKey}
            onChange={(e) => { setApiKey(e.target.value); setStatus("idle"); }}
            placeholder="sk-ant-…"
            disabled={status === "loading"}
            className="w-full border border-(--border-subtle) bg-(--bg-surface) rounded-lg text-(--text-primary) px-3 py-2 text-[13px] pr-10 outline-none focus:border-(--accent)/50 transition-colors duration-150 disabled:opacity-60 font-['Fira_Code',monospace] placeholder:font-sans placeholder:text-(--text-muted)"
          />
          <button
            type="button"
            onClick={() => setShowKey((v) => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-(--text-muted) hover:text-(--text-primary) bg-transparent border-none cursor-pointer p-0.5 transition-colors duration-150"
          >
            <EyeIcon crossed={showKey} />
          </button>
        </div>

        <div className="flex items-center gap-3 mt-1">
          <button
            type="button"
            onClick={handleSave}
            disabled={status === "loading" || status === "saving"}
            className="bg-(--accent) text-white rounded-lg px-4 py-2 text-[13px] font-semibold hover:opacity-90 transition-opacity duration-150 cursor-pointer disabled:opacity-60 border-none"
          >
            {status === "saving" ? "Saving…" : "Save"}
          </button>
          {status === "saved" && (
            <span className="text-[13px] text-green-400 font-medium">
              Saved
            </span>
          )}
          {status === "error" && (
            <span className="text-[13px] text-red-400">
              {errorMsg}
            </span>
          )}
        </div>
      </div>
    </div>
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
  const isGlobal = projectPath.endsWith("/.claude");

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
        <TabButton
          id="profile"
          label="Profile"
          active={activeTab}
          onClick={setActiveTab}
        />
      </div>

      {/* Project tab content */}
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
            {isGlobal ? (
              <div>
                <button
                  type="button"
                  disabled
                  className="text-[13px] font-medium px-3 py-1.5 rounded-lg border cursor-not-allowed bg-transparent border-red-500/20 text-red-500/40"
                >
                  Delete project
                </button>
                <p className="mt-2 text-[12px] text-(--text-muted)">
                  The global project (~/.claude) cannot be deleted.
                </p>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="text-[13px] font-medium px-3 py-1.5 rounded-lg border transition-colors duration-150 cursor-pointer bg-transparent border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                Delete project
              </button>
            )}
          </div>
        </div>
      )}

      {/* Profile tab content */}
      {activeTab === "profile" && <ProfileTab />}

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

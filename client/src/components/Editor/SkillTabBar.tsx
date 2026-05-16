import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createSkillFile } from "../../lib/api";

// ── Icons ─────────────────────────────────────────────────────────────────────

const BackArrowIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path
      d="M8.5 2.5L4 7L8.5 11.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// ── Types ─────────────────────────────────────────────────────────────────────

export type SkillTabId =
  | "directory"
  | "reference.md"
  | "examples.md"
  | "scripts"
  | "identity"
  | "instructions"
  | "settings";

export interface SkillTabBarProps {
  activeTab: SkillTabId;
  skillName: string;
  projectPath: string;
  onBack: () => void;
}

interface TabDef {
  id: SkillTabId;
  label: string;
  disabled?: boolean;
  tooltipText?: string;
}

const TABS: TabDef[] = [
  { id: "directory", label: "Skill Directory" },
  { id: "reference.md", label: "References" },
  { id: "examples.md", label: "Examples" },
  {
    id: "scripts",
    label: "Scripts",
    disabled: true,
    tooltipText: "Script support coming soon",
  },
];

// ── SkillTabBar ───────────────────────────────────────────────────────────────

export const SkillTabBar = ({
  activeTab,
  skillName,
  projectPath,
  onBack,
}: SkillTabBarProps) => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const [tooltipTab, setTooltipTab] = useState<SkillTabId | null>(null);

  const handleTabClick = async (tab: TabDef) => {
    if (tab.disabled || tab.id === activeTab || !projectId) return;

    if (tab.id === "directory") {
      navigate(
        `/${encodeURIComponent(projectId)}/skills/${encodeURIComponent(skillName)}`,
      );
      return;
    }

    // For file tabs: create the file if it doesn't exist yet, then navigate
    try {
      await createSkillFile(projectPath, skillName, tab.id);
    } catch {
      // Already exists — fine
    }
    navigate(
      `/${encodeURIComponent(projectId)}/skills/${encodeURIComponent(skillName)}/${encodeURIComponent(tab.id)}`,
    );
  };

  return (
    <div className="shrink-0 flex items-stretch justify-between border-b border-(--border-faint) px-4">
      <div className="flex items-stretch gap-1">
        {/* Back button */}
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 pt-6 pb-5 text-[14px] text-(--text-secondary) hover:text-(--text-primary) bg-transparent border-none cursor-pointer transition-colors duration-150 pr-3 mr-2 border-r border-(--border-subtle)"
        >
          <BackArrowIcon /> Back
        </button>

        {/* Tabs */}
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <div
              key={tab.id}
              className="relative flex items-stretch"
              onMouseEnter={() =>
                tab.tooltipText ? setTooltipTab(tab.id) : undefined
              }
              onMouseLeave={() => setTooltipTab(null)}
            >
              <button
                type="button"
                onClick={() => handleTabClick(tab)}
                disabled={tab.disabled}
                className={[
                  "pt-6 pb-5 px-3 bg-transparent border-none relative transition-colors duration-150",
                  isActive
                    ? "cursor-default text-[15px] font-semibold text-(--text-primary) after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-(--accent)"
                    : tab.disabled
                      ? "cursor-default text-[14px] text-(--text-muted) opacity-50"
                      : "cursor-pointer text-[14px] text-(--text-secondary) hover:text-(--text-primary)",
                ].join(" ")}
              >
                {tab.label}
              </button>

              {/* Tooltip for disabled tabs */}
              {tooltipTab === tab.id && tab.tooltipText && (
                <div className="absolute left-0 top-full mt-2 w-44 px-3 py-2 rounded-lg bg-(--bg-elevated) border border-(--border-subtle) text-[11px] text-(--text-secondary) leading-relaxed shadow-lg z-50 whitespace-normal pointer-events-none">
                  {tab.tooltipText}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

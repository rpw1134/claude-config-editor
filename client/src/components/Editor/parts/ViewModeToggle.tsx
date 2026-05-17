import type { ViewMode } from "./types";

interface ViewModeToggleProps {
  viewMode: ViewMode;
  onToggle: (mode: ViewMode) => void;
}

export const ViewModeToggle = ({ viewMode, onToggle }: ViewModeToggleProps) => (
  <div className="flex items-center bg-(--bg-surface) border border-(--border-subtle) rounded-md p-0.5">
    <button
      type="button"
      onClick={() => onToggle("form")}
      className={[
        "text-[13px] px-2.5 py-0.5 rounded cursor-pointer border-none transition-colors duration-150",
        viewMode === "form"
          ? "bg-(--bg-elevated) text-(--text-primary)"
          : "bg-transparent text-(--text-muted) hover:text-(--text-secondary)",
      ].join(" ")}
    >
      Form
    </button>
    <button
      type="button"
      onClick={() => onToggle("raw")}
      className={[
        "text-[13px] px-2.5 py-0.5 rounded cursor-pointer border-none transition-colors duration-150",
        viewMode === "raw"
          ? "bg-(--bg-elevated) text-(--text-primary)"
          : "bg-transparent text-(--text-muted) hover:text-(--text-secondary)",
      ].join(" ")}
    >
      Raw
    </button>
  </div>
);

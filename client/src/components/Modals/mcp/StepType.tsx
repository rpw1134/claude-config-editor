type ServerType = "stdio" | "http";

interface TypeOptionProps {
  id: ServerType;
  selected: ServerType;
  onSelect: (id: ServerType) => void;
  title: string;
  description: string;
}

const TypeOption = ({
  id,
  selected,
  onSelect,
  title,
  description,
}: TypeOptionProps) => {
  const isActive = selected === id;
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className={[
        "w-full text-left px-5 py-4 rounded-xl border transition-colors duration-150 cursor-pointer",
        isActive
          ? "bg-(--accent-dim) border-(--accent)"
          : "bg-(--bg-elevated) border-(--border-subtle) hover:border-(--border-default)",
      ].join(" ")}
    >
      <div className="flex items-center gap-3 mb-1">
        <div
          className={[
            "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0",
            isActive ? "border-(--accent)" : "border-(--border-default)",
          ].join(" ")}
        >
          {isActive && (
            <div className="w-2 h-2 rounded-full bg-(--accent)" />
          )}
        </div>
        <span
          className={[
            "text-[14px] font-semibold",
            isActive ? "text-(--text-primary)" : "text-(--text-secondary)",
          ].join(" ")}
        >
          {title}
        </span>
      </div>
      <p className="text-[12px] text-(--text-muted) leading-relaxed pl-7">
        {description}
      </p>
    </button>
  );
};

export interface StepTypeProps {
  serverType: ServerType;
  onServerTypeChange: (type: ServerType) => void;
  onContinue: () => void;
  onBack: () => void;
}

export const StepType = ({
  serverType,
  onServerTypeChange,
  onContinue,
  onBack,
}: StepTypeProps) => (
  <div>
    <div className="flex flex-col gap-3">
      <TypeOption
        id="stdio"
        selected={serverType}
        onSelect={onServerTypeChange}
        title="Standard I/O (local process)"
        description="Runs a local command as a subprocess."
      />
      <TypeOption
        id="http"
        selected={serverType}
        onSelect={onServerTypeChange}
        title="HTTP / SSE (remote server)"
        description="Connects to a remote server via URL."
      />
    </div>
    <div className="flex gap-3 mt-6">
      <button
        type="button"
        onClick={onBack}
        className="px-5 py-3 rounded-xl text-[14px] font-medium text-(--text-muted) bg-(--bg-elevated) border border-(--border-subtle) cursor-pointer hover:text-(--text-secondary) hover:border-(--border-default) transition-colors duration-150"
      >
        ← Back
      </button>
      <button
        type="button"
        onClick={onContinue}
        className="flex-1 py-3 rounded-xl text-[14px] font-semibold bg-(--accent) text-(--bg-base) cursor-pointer hover:bg-(--accent-hover) border-none transition-colors duration-150"
      >
        Continue →
      </button>
    </div>
  </div>
);

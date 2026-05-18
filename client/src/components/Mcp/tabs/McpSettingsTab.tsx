interface McpSettingsTabProps {
  name: string;
  deleteConfirm: boolean;
  deleting: boolean;
  onDeleteClick: () => void;
  onDeleteBlur: () => void;
}

export const McpSettingsTab = ({
  name,
  deleteConfirm,
  deleting,
  onDeleteClick,
  onDeleteBlur,
}: McpSettingsTabProps) => (
  <div className="flex-1 min-h-0 overflow-y-auto px-8 py-8 flex flex-col gap-8">
    <div>
      <h2 className='m-0 mb-1 text-2xl font-["Bricolage_Grotesque",sans-serif] font-bold tracking-[-0.015em] text-(--text-primary)'>
        Settings
      </h2>
      <p className="m-0 text-[13px] text-(--text-secondary)">
        Manage this MCP server configuration.
      </p>
    </div>
    <div className="border border-red-500/30 rounded-xl p-5">
      <div className="mb-3">
        <p className="m-0 mb-1 text-[13px] font-semibold text-red-400">
          &#9888; Danger Zone
        </p>
        <p className="m-0 text-[12px] text-(--text-muted)">
          Permanent actions that cannot be undone.
        </p>
      </div>
      <button
        type="button"
        onClick={onDeleteClick}
        disabled={deleting}
        onBlur={onDeleteBlur}
        className={[
          "text-[13px] font-medium px-3 py-1.5 rounded-lg border transition-colors duration-150 cursor-pointer",
          deleteConfirm
            ? "bg-red-500/20 border-red-500/50 text-red-300 hover:bg-red-500/30"
            : deleting
              ? "bg-transparent border-red-500/20 text-red-500/50 cursor-not-allowed"
              : "bg-transparent border-red-500/30 text-red-400 hover:bg-red-500/10",
        ].join(" ")}
      >
        {deleting
          ? "Deleting…"
          : deleteConfirm
            ? "Are you sure? Click again to confirm."
            : `Delete ${name}`}
      </button>
    </div>
  </div>
);

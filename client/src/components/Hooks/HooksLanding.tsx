import { type HooksConfig } from "../../lib/api";
import { PlusIcon, ChevronRightIcon } from "../Icons";

interface HooksLandingProps {
  hooks: HooksConfig;
  dirty: boolean;
  saving: boolean;
  onSelectEvent: (event: string) => void;
  onAddHook: () => void;
  onSave: () => void;
}

export const HooksLanding = ({
  hooks,
  dirty,
  saving,
  onSelectEvent,
  onAddHook,
  onSave,
}: HooksLandingProps) => {
  const eventEntries = Object.entries(hooks);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-8 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className='m-0 mb-1 text-[28px] font-["Bricolage_Grotesque",sans-serif] font-semibold text-(--text-primary) tracking-tight'>
            Hooks
          </h1>
          <p className="m-0 text-[14px] text-(--text-muted)">
            Lifecycle commands triggered by Claude Code events.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={dirty && !saving ? onSave : undefined}
            disabled={!dirty || saving}
            className={[
              "text-[13px] font-medium px-3 py-1.5 rounded-lg border-none transition-colors duration-150",
              !dirty || saving
                ? "bg-(--bg-surface) text-(--text-muted) opacity-50 cursor-not-allowed"
                : "bg-(--accent) text-white cursor-pointer hover:bg-(--accent-hover)",
            ].join(" ")}
          >
            {saving ? "Saving…" : dirty ? "Save" : "Up to date"}
          </button>
          <button
            type="button"
            onClick={onAddHook}
            className="flex items-center gap-1.5 text-[13px] font-medium px-3 py-1.5 rounded-lg border border-(--border-subtle) bg-(--bg-surface) text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--bg-hover) cursor-pointer transition-colors"
          >
            <PlusIcon /> Add Hook
          </button>
        </div>
      </div>

      {/* Event list or empty state */}
      {eventEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <p className="m-0 text-[14px] text-(--text-muted)">No hooks configured.</p>
          <button
            type="button"
            onClick={onAddHook}
            className="flex items-center gap-2 text-[13px] font-medium px-4 py-2 rounded-lg bg-(--accent) text-white border-none cursor-pointer hover:bg-(--accent-hover) transition-colors"
          >
            <PlusIcon /> Add your first hook
          </button>
        </div>
      ) : (
        <ul className="list-none m-0 p-0 flex flex-col gap-0 border border-(--border-subtle) rounded-xl overflow-hidden">
          {eventEntries.map(([event, groups], i) => (
            <li key={event} className={i > 0 ? "border-t border-(--border-subtle)" : ""}>
              <button
                type="button"
                onClick={() => onSelectEvent(event)}
                className="w-full flex items-center justify-between px-5 py-3.5 bg-(--bg-surface) hover:bg-(--bg-hover) transition-colors cursor-pointer border-none text-left"
              >
                <span className="text-[14px] font-medium text-(--text-primary)">{event}</span>
                <div className="flex items-center gap-3">
                  <span className="text-[12px] text-(--text-muted)">
                    {groups.length} {groups.length === 1 ? "group" : "groups"}
                  </span>
                  <ChevronRightIcon />
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

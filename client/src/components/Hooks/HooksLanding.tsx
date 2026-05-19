import { useState } from "react";
import { type HooksConfig } from "../../lib/api";
import { HOOK_EVENTS } from "../../lib/hooksConstants";
import { ChevronRightIcon, SearchIcon } from "../Icons";

interface HooksLandingProps {
  hooks: HooksConfig;
  dirty: boolean;
  saving: boolean;
  onSelectEvent: (event: string) => void;
  onSave: () => void;
}

export const HooksLanding = ({
  hooks,
  dirty,
  saving,
  onSelectEvent,
  onSave,
}: HooksLandingProps) => {
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? HOOK_EVENTS.filter((ev) =>
        ev.toLowerCase().includes(query.trim().toLowerCase())
      )
    : HOOK_EVENTS;

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto bg-(--bg-base)">
      <div className="w-full px-14 pt-16 pb-12">
        {/* Heading row */}
        <div className="flex items-center justify-between mb-10">
          <h1 className="font-['Bricolage_Grotesque',sans-serif] text-[40px] font-bold text-(--text-primary) tracking-[-0.03em] leading-[1.05] m-0">
            Hooks
          </h1>
          {dirty && (
            <button
              type="button"
              onClick={saving ? undefined : onSave}
              disabled={saving}
              className={[
                "text-[14px] font-medium px-4 py-2 rounded-lg border-none transition-colors duration-150 shrink-0",
                saving
                  ? "bg-(--bg-surface) text-(--text-muted) cursor-not-allowed opacity-50"
                  : "bg-(--accent) text-(--bg-base) font-semibold cursor-pointer hover:bg-(--accent-hover)",
              ].join(" ")}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          )}
        </div>

        {/* Search bar */}
        <div className="relative mb-6">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-(--text-muted) flex items-center pointer-events-none">
            <SearchIcon />
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search events…"
            className="w-full h-11 pl-10 pr-3.5 bg-(--bg-surface) border border-(--border-subtle) rounded-2.5 text-[15px] text-(--text-primary) outline-none box-border transition-colors duration-120 focus:border-(--border-default)"
          />
        </div>

        {/* No search results */}
        {filtered.length === 0 && (
          <div className="pt-16 text-center">
            <p className="text-[15px] text-(--text-muted) m-0">
              No results for "{query.trim()}"
            </p>
          </div>
        )}

        {/* Event list */}
        {filtered.length > 0 && (
          <div>
            {filtered.map((event, idx) => {
              const count = (hooks[event] ?? []).length;
              const isLast = idx === filtered.length - 1;
              return (
                <button
                  key={event}
                  type="button"
                  onClick={() => onSelectEvent(event)}
                  className={[
                    "w-full flex items-center pl-4 pr-4 min-h-16 text-left cursor-pointer",
                    "bg-transparent transition-colors duration-120 border-none hover:bg-(--bg-hover)",
                    !isLast ? "border-b border-(--border-faint)" : "",
                  ].join(" ")}
                >
                  <span className="font-['Instrument_Sans',sans-serif] text-[17px] font-medium text-(--text-primary) overflow-hidden text-ellipsis whitespace-nowrap flex-1">
                    {event}
                  </span>
                  <div className="flex items-center gap-2.5 shrink-0 text-(--text-muted)">
                    <span className={[
                      "text-[13px]",
                      count > 0 ? "text-(--accent) font-medium" : "text-(--text-muted)",
                    ].join(" ")}>
                      {count} {count === 1 ? "hook" : "hooks"}
                    </span>
                    <ChevronRightIcon />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

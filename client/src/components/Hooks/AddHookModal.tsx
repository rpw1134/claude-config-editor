import { useState } from "react";
import { HOOK_EVENTS } from "../../lib/hooksConstants";

interface AddHookModalProps {
  onAdd: (event: string, group: { matcher: string; hooks: Array<Record<string, unknown>> }) => void;
  onClose: () => void;
}

const INPUT_CLASS =
  "w-full bg-(--bg-base) border border-(--border-subtle) rounded-lg px-3 py-2 text-[13px] text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--accent) transition-colors";

export const AddHookModal = ({ onAdd, onClose }: AddHookModalProps) => {
  const [event, setEvent] = useState<string>(HOOK_EVENTS[0]);
  const [matcher, setMatcher] = useState("");
  const [hookType, setHookType] = useState<"command" | "http">("command");
  const [command, setCommand] = useState("");
  const [url, setUrl] = useState("");
  const [timeoutVal, setTimeoutVal] = useState("");

  const canAdd = hookType === "command" ? command.trim() !== "" : url.trim() !== "";

  const handleAdd = () => {
    if (!canAdd) return;
    const hookEntry: Record<string, unknown> = { type: hookType };
    if (hookType === "command") hookEntry.command = command.trim();
    else hookEntry.url = url.trim();
    if (timeoutVal.trim()) {
      const t = parseInt(timeoutVal, 10);
      if (!isNaN(t)) hookEntry.timeout = t;
    }
    onAdd(event, { matcher, hooks: [hookEntry] });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-(--bg-elevated) border border-(--border-default) rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
        <h2 className='m-0 mb-5 text-lg font-["Bricolage_Grotesque",sans-serif] font-bold text-(--text-primary)'>
          Add Hook
        </h2>

        <div className="flex flex-col gap-4">
          {/* Event */}
          <div>
            <label className="block text-[11px] font-medium text-(--text-muted) tracking-widest uppercase mb-2">
              Event
            </label>
            <select
              value={event}
              onChange={(e) => setEvent(e.target.value)}
              className={INPUT_CLASS}
            >
              {HOOK_EVENTS.map((ev) => (
                <option key={ev} value={ev}>
                  {ev}
                </option>
              ))}
            </select>
          </div>

          {/* Matcher */}
          <div>
            <label className="block text-[11px] font-medium text-(--text-muted) tracking-widest uppercase mb-2">
              Matcher
            </label>
            <input
              type="text"
              value={matcher}
              onChange={(e) => setMatcher(e.target.value)}
              placeholder="Leave empty to match all"
              className={INPUT_CLASS}
            />
          </div>

          {/* Hook type toggle */}
          <div>
            <label className="block text-[11px] font-medium text-(--text-muted) tracking-widest uppercase mb-2">
              Type
            </label>
            <div className="flex items-center bg-(--bg-surface) border border-(--border-subtle) rounded-md p-0.5 w-fit">
              {(["command", "http"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setHookType(t)}
                  className={[
                    "text-[13px] px-3 py-1 rounded cursor-pointer border-none transition-colors duration-150",
                    hookType === t
                      ? "bg-(--bg-elevated) text-(--text-primary)"
                      : "bg-transparent text-(--text-muted) hover:text-(--text-secondary)",
                  ].join(" ")}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Command or URL */}
          {hookType === "command" ? (
            <div>
              <label className="block text-[11px] font-medium text-(--text-muted) tracking-widest uppercase mb-2">
                Command
              </label>
              <input
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder='e.g. npx prettier --write "$FILE"'
                className={INPUT_CLASS}
                autoFocus
              />
            </div>
          ) : (
            <div>
              <label className="block text-[11px] font-medium text-(--text-muted) tracking-widest uppercase mb-2">
                URL
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="http://localhost:8080/hooks"
                className={INPUT_CLASS}
                autoFocus
              />
            </div>
          )}

          {/* Timeout */}
          <div>
            <label className="block text-[11px] font-medium text-(--text-muted) tracking-widest uppercase mb-2">
              Timeout (seconds, optional)
            </label>
            <input
              type="number"
              value={timeoutVal}
              onChange={(e) => setTimeoutVal(e.target.value)}
              placeholder="Default: 600"
              className={INPUT_CLASS}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="text-[13px] font-medium px-4 py-2 rounded-lg border border-(--border-subtle) bg-transparent text-(--text-secondary) hover:text-(--text-primary) cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!canAdd}
            className={[
              "text-[13px] font-medium px-4 py-2 rounded-lg border-none transition-colors",
              canAdd
                ? "bg-(--accent) text-white cursor-pointer hover:bg-(--accent-hover)"
                : "bg-(--bg-surface) text-(--text-muted) cursor-not-allowed opacity-50",
            ].join(" ")}
          >
            Add Hook
          </button>
        </div>
      </div>
    </div>
  );
};

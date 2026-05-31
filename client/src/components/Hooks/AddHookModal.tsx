import { useState } from "react";
import { HOOK_EVENTS } from "../../lib/hooksConstants";

interface HookGroupData {
  matcher: string;
  hooks: Array<{ type?: string; command?: string; url?: string; timeout?: number }>;
}

interface AddHookModalProps {
  onConfirm: (event: string, group: HookGroupData) => void;
  onClose: () => void;
  fixedEvent?: string;
  initialGroup?: HookGroupData;
}

const INPUT_CLASS =
  "w-full bg-(--bg-base) border border-(--border-subtle) rounded-lg px-3 py-2 text-[13px] text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--accent) transition-colors";

export const AddHookModal = ({ onConfirm, onClose, fixedEvent, initialGroup }: AddHookModalProps) => {
  const firstHook = initialGroup?.hooks?.[0];
  const isEditing = initialGroup != null;

  const [event, setEvent] = useState<string>(fixedEvent ?? HOOK_EVENTS[0]);
  const [matcher, setMatcher] = useState(initialGroup?.matcher ?? "");
  const [hookType, setHookType] = useState<"command" | "http">(
    (firstHook?.type === "http" ? "http" : "command") as "command" | "http"
  );
  const [command, setCommand] = useState(firstHook?.command ?? "");
  const [url, setUrl] = useState(firstHook?.url ?? "");
  const [timeoutVal, setTimeoutVal] = useState(
    firstHook?.timeout != null ? String(firstHook.timeout) : ""
  );

  const canConfirm = hookType === "command" ? command.trim() !== "" : url.trim() !== "";

  const handleConfirm = () => {
    if (!canConfirm) return;
    const hookEntry: Record<string, unknown> = { type: hookType };
    if (hookType === "command") hookEntry.command = command.trim();
    else hookEntry.url = url.trim();
    if (timeoutVal.trim()) {
      const t = parseInt(timeoutVal, 10);
      if (!isNaN(t)) hookEntry.timeout = t;
    }
    const resolvedEvent = fixedEvent ?? event;
    onConfirm(resolvedEvent, { matcher, hooks: [hookEntry] });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        className="bg-(--bg-elevated) border border-(--border-default) rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl animate-[modalFadeIn_200ms_ease-out_both]"
        onSubmit={(e) => { e.preventDefault(); handleConfirm(); }}
      >
        <h2 className='m-0 mb-5 text-lg font-["Bricolage_Grotesque",sans-serif] font-bold text-(--text-primary)'>
          {isEditing ? "Edit Hook" : "Add Hook"}
        </h2>

        <div className="flex flex-col gap-4">
          {/* Event — selector or read-only label */}
          <div>
            <label className="block text-[11px] font-medium text-(--text-muted) tracking-widest uppercase mb-2">
              Event
            </label>
            {fixedEvent ? (
              <p className="m-0 text-[13px] text-(--text-secondary) font-['Fira_Code',monospace]">
                {fixedEvent}
              </p>
            ) : (
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
            )}
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
            type="submit"
            disabled={!canConfirm}
            className={[
              "text-[13px] font-medium px-4 py-2 rounded-lg border-none transition-colors",
              canConfirm
                ? "border border-(--border-subtle) bg-(--bg-elevated) text-(--text-primary) font-semibold cursor-pointer hover:bg-(--bg-hover)"
                : "bg-(--bg-surface) text-(--text-muted) cursor-not-allowed opacity-50",
            ].join(" ")}
          >
            {isEditing ? "Save Changes" : "Add Hook"}
          </button>
        </div>
      </form>
    </div>
  );
};

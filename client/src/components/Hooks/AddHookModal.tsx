import { useState } from "react";
import { HOOK_EVENTS, supportsMatcher, supportsIf } from "../../lib/hooksConstants";

interface HandlerRow {
  type: "command" | "http";
  command: string;
  url: string;
  timeout: string;
  ifField: string;
}

interface HookGroupData {
  matcher: string;
  hooks: Array<Record<string, unknown>>;
}

interface HookHandlerInit {
  type?: string;
  command?: string;
  url?: string;
  timeout?: number;
  if?: string;
}

interface HookGroupInit {
  matcher: string;
  hooks?: HookHandlerInit[];
}

interface AddHookModalProps {
  onConfirm: (event: string, group: HookGroupData) => void;
  onClose: () => void;
  fixedEvent?: string;
  initialGroup?: HookGroupInit;
}

const INPUT_CLASS =
  "w-full bg-(--bg-base) border border-(--border-subtle) rounded-lg px-3 py-2 text-[13px] text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--accent) transition-colors";

const LABEL_CLASS =
  "block text-[11px] font-medium text-(--text-muted) tracking-widest uppercase mb-2";

function makeEmptyHandler(): HandlerRow {
  return { type: "command", command: "", url: "", timeout: "", ifField: "" };
}

function initHandlers(hooks?: HookHandlerInit[]): HandlerRow[] {
  if (!hooks || hooks.length === 0) return [makeEmptyHandler()];
  return hooks.map((h) => ({
    type: h.type === "http" ? "http" : "command",
    command: h.command ?? "",
    url: h.url ?? "",
    timeout: h.timeout != null ? String(h.timeout) : "",
    ifField: h.if ?? "",
  }));
}

function serializeHandler(row: HandlerRow, showIf: boolean): Record<string, unknown> {
  const entry: Record<string, unknown> = { type: row.type };
  if (showIf && row.ifField.trim()) entry.if = row.ifField.trim();
  if (row.type === "command") {
    entry.command = row.command.trim();
  } else {
    entry.url = row.url.trim();
  }
  if (row.timeout.trim()) {
    const t = parseInt(row.timeout, 10);
    if (!isNaN(t)) entry.timeout = t;
  }
  return entry;
}

function isRowValid(row: HandlerRow): boolean {
  return row.type === "command" ? row.command.trim() !== "" : row.url.trim() !== "";
}

// ── HandlerRowEditor ──────────────────────────────────────────────────────────

interface HandlerRowEditorProps {
  row: HandlerRow;
  index: number;
  total: number;
  showIf: boolean;
  onChange: (index: number, next: HandlerRow) => void;
  onRemove: (index: number) => void;
}

const HandlerRowEditor = ({ row, index, total, showIf, onChange, onRemove }: HandlerRowEditorProps) => {
  const set = (patch: Partial<HandlerRow>) => onChange(index, { ...row, ...patch });

  return (
    <div className="flex flex-col gap-3 p-3 rounded-lg border border-(--border-subtle) bg-(--bg-surface)">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-(--text-muted) uppercase tracking-widest">
          Handler {index + 1}
        </span>
        {total > 1 && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="text-[11px] text-(--text-muted) hover:text-red-400 bg-transparent border-none cursor-pointer transition-colors px-1"
          >
            Remove
          </button>
        )}
      </div>

      {/* Type toggle */}
      <div>
        <label className={LABEL_CLASS}>Type</label>
        <div className="flex items-center bg-(--bg-elevated) border border-(--border-subtle) rounded-md p-0.5 w-fit">
          {(["command", "http"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => set({ type: t })}
              className={[
                "text-[13px] px-3 py-1 rounded cursor-pointer border-none transition-colors duration-150",
                row.type === t
                  ? "bg-(--bg-base) text-(--text-primary)"
                  : "bg-transparent text-(--text-muted) hover:text-(--text-secondary)",
              ].join(" ")}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Command or URL */}
      {row.type === "command" ? (
        <div>
          <label className={LABEL_CLASS}>Command</label>
          <input
            type="text"
            value={row.command}
            onChange={(e) => set({ command: e.target.value })}
            placeholder='e.g. npx prettier --write "$FILE"'
            className={INPUT_CLASS}
          />
        </div>
      ) : (
        <div>
          <label className={LABEL_CLASS}>URL</label>
          <input
            type="text"
            value={row.url}
            onChange={(e) => set({ url: e.target.value })}
            placeholder="http://localhost:8080/hooks"
            className={INPUT_CLASS}
          />
        </div>
      )}

      {/* Condition (if) — only for tool events */}
      {showIf && (
        <div>
          <label className={LABEL_CLASS}>
            Condition{" "}
            <span className="normal-case font-normal tracking-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={row.ifField}
            onChange={(e) => set({ ifField: e.target.value })}
            placeholder="Bash(gh *)"
            className={INPUT_CLASS}
          />
          <p className="m-0 mt-1.5 text-[11px] text-(--text-muted) leading-snug">
            Run only when the command matches this one pattern (e.g.{" "}
            <code className="font-['Fira_Code',monospace] text-[10px]">Bash(git commit *)</code>
            ). Add another handler for additional patterns.
          </p>
        </div>
      )}

      {/* Timeout */}
      <div>
        <label className={LABEL_CLASS}>
          Timeout (seconds,{" "}
          <span className="normal-case font-normal tracking-normal">optional</span>)
        </label>
        <input
          type="number"
          value={row.timeout}
          onChange={(e) => set({ timeout: e.target.value })}
          placeholder="Default: 600"
          className={INPUT_CLASS}
        />
      </div>
    </div>
  );
};

// ── AddHookModal ──────────────────────────────────────────────────────────────

export const AddHookModal = ({ onConfirm, onClose, fixedEvent, initialGroup }: AddHookModalProps) => {
  const isEditing = initialGroup != null;

  const [event, setEvent] = useState<string>(fixedEvent ?? HOOK_EVENTS[0]);
  const [matcher, setMatcher] = useState(initialGroup?.matcher ?? "");
  const [handlers, setHandlers] = useState<HandlerRow[]>(() => initHandlers(initialGroup?.hooks));

  const resolvedEvent = fixedEvent ?? event;
  const showMatcher = supportsMatcher(resolvedEvent);
  const showIf = supportsIf(resolvedEvent);

  const canConfirm = handlers.length > 0 && handlers.every(isRowValid);

  const handleChange = (index: number, next: HandlerRow) =>
    setHandlers((prev) => prev.map((r, i) => (i === index ? next : r)));

  const handleRemove = (index: number) =>
    setHandlers((prev) => prev.filter((_, i) => i !== index));

  const handleAddHandler = () => setHandlers((prev) => [...prev, makeEmptyHandler()]);

  const handleConfirm = () => {
    if (!canConfirm) return;
    const hooks = handlers.map((row) => serializeHandler(row, showIf));
    const group: HookGroupData = {
      matcher: showMatcher ? matcher : "",
      hooks,
    };
    onConfirm(resolvedEvent, group);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <form
        className="bg-(--bg-elevated) border border-(--border-default) rounded-2xl p-6 w-full max-w-lg mx-4 shadow-2xl animate-[modalFadeIn_200ms_ease-out_both] flex flex-col gap-0 max-h-[90vh]"
        onSubmit={(e) => { e.preventDefault(); handleConfirm(); }}
      >
        <h2 className='m-0 mb-5 text-lg font-["Bricolage_Grotesque",sans-serif] font-bold text-(--text-primary)'>
          {isEditing ? "Edit Hook" : "Add Hook"}
        </h2>

        <div className="flex flex-col gap-4 overflow-y-auto flex-1 min-h-0 pr-0.5">
          {/* Event — selector or read-only label */}
          <div>
            <label className={LABEL_CLASS}>Event</label>
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

          {/* Matcher — only for events that support it */}
          {showMatcher ? (
            <div>
              <label className={LABEL_CLASS}>Matcher</label>
              <input
                type="text"
                value={matcher}
                onChange={(e) => setMatcher(e.target.value)}
                placeholder="Leave empty to match all"
                className={INPUT_CLASS}
              />
            </div>
          ) : (
            <p className="m-0 text-[12px] text-(--text-muted) italic">
              This event always fires — no tool matcher.
            </p>
          )}

          {/* Handlers */}
          <div className="flex flex-col gap-3">
            {handlers.map((row, i) => (
              <HandlerRowEditor
                key={i}
                row={row}
                index={i}
                total={handlers.length}
                showIf={showIf}
                onChange={handleChange}
                onRemove={handleRemove}
              />
            ))}

            <button
              type="button"
              onClick={handleAddHandler}
              className="text-[13px] font-medium px-3 py-2 rounded-lg border border-(--border-subtle) bg-transparent text-(--text-muted) hover:text-(--text-secondary) hover:border-(--border-default) cursor-pointer transition-colors self-start"
            >
              + Add handler
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6 shrink-0">
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

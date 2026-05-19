import { Field } from "./shared";
import { textareaClass } from "./styles";

export interface StepJsonModeProps {
  rawJson: string;
  onRawJsonChange: (val: string) => void;
  submitError: string | null;
  submitting: boolean;
  onCreate: () => void;
  onBack: () => void;
}

export const StepJsonMode = ({
  rawJson,
  onRawJsonChange,
  submitError,
  submitting,
  onCreate,
  onBack,
}: StepJsonModeProps) => (
  <div className="flex flex-col gap-5">
    <Field label="Configuration JSON">
      <textarea
        rows={10}
        value={rawJson}
        onChange={(e) => onRawJsonChange(e.target.value)}
        placeholder={'{\n  "command": "npx",\n  "args": ["-y", "@modelcontextprotocol/server-filesystem", "/"]\n}'}
        className={textareaClass}
        autoFocus
        spellCheck={false}
      />
    </Field>
    {submitError && (
      <p className="text-[12px] text-(--error) font-['Fira_Code',monospace]">
        {submitError}
      </p>
    )}
    <div className="flex gap-3">
      <button
        type="button"
        onClick={onBack}
        className="px-5 py-3 rounded-xl text-[14px] font-medium text-(--text-muted) bg-(--bg-elevated) border border-(--border-subtle) cursor-pointer hover:text-(--text-secondary) hover:border-(--border-default) transition-colors duration-150"
      >
        ← Back
      </button>
      <button
        type="button"
        onClick={onCreate}
        disabled={!rawJson.trim() || submitting}
        className={[
          "flex-1 py-3 rounded-xl text-[14px] font-semibold transition-colors duration-150",
          rawJson.trim() && !submitting
            ? "border border-(--border-subtle) bg-(--bg-elevated) text-(--text-primary) font-semibold cursor-pointer hover:bg-(--bg-hover)"
            : "bg-(--bg-elevated) text-(--text-muted) border border-(--border-subtle) cursor-not-allowed",
        ].join(" ")}
      >
        {submitting ? "Creating…" : "Create Server"}
      </button>
    </div>
  </div>
);

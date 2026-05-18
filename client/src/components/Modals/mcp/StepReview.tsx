export interface StepReviewProps {
  name: string;
  previewJson: string;
  submitError: string | null;
  submitting: boolean;
  onCreate: () => void;
  onBack: () => void;
}

export const StepReview = ({
  name,
  previewJson,
  submitError,
  submitting,
  onCreate,
  onBack,
}: StepReviewProps) => (
  <div>
    <div className="mb-5">
      <p className="text-[11px] font-medium text-(--text-muted) tracking-widest uppercase mb-3">
        Configuration for{" "}
        <span className='font-["Fira_Code",monospace] normal-case tracking-normal text-(--text-secondary)'>
          {name.trim()}
        </span>
      </p>
      <pre
        className={[
          'font-["Fira_Code",monospace] text-[12px] text-(--text-primary) leading-relaxed',
          "bg-(--bg-elevated) border border-(--border-faint) rounded-xl px-5 py-4",
          "overflow-y-auto max-h-48 whitespace-pre-wrap break-all",
        ].join(" ")}
      >
        {previewJson}
      </pre>
    </div>

    {submitError && (
      <p className="mb-4 text-[12px] text-(--error) font-['Fira_Code',monospace]">
        {submitError}
      </p>
    )}

    <div className="flex gap-3">
      <button
        type="button"
        onClick={onBack}
        disabled={submitting}
        className="px-5 py-3 rounded-xl text-[14px] font-medium text-(--text-muted) bg-(--bg-elevated) border border-(--border-subtle) cursor-pointer hover:text-(--text-secondary) hover:border-(--border-default) transition-colors duration-150"
      >
        ← Back
      </button>
      <button
        type="button"
        onClick={onCreate}
        disabled={submitting}
        className={[
          "flex-1 py-3 rounded-xl text-[14px] font-semibold transition-colors duration-150",
          !submitting
            ? "bg-(--accent) text-white cursor-pointer hover:bg-(--accent-hover) border-none"
            : "bg-(--bg-elevated) text-(--text-muted) border border-(--border-subtle) cursor-not-allowed",
        ].join(" ")}
      >
        {submitting ? "Creating…" : "Create Server"}
      </button>
    </div>
  </div>
);

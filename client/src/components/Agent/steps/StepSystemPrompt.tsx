import { EyeIcon } from "../../Icons";

interface StepHeadingProps {
  heading: string;
  subtext: React.ReactNode;
}

const StepHeading = ({ heading, subtext }: StepHeadingProps) => (
  <div className="mb-6">
    <h1 className="m-0 mb-3 text-4xl font-['Bricolage_Grotesque',sans-serif] font-bold tracking-[-0.02em] leading-[1.1] text-(--text-primary)">
      {heading}
    </h1>
    <p className="m-0 text-[14px] text-(--text-secondary) leading-[1.55]">
      {subtext}
    </p>
  </div>
);

const InlineError = ({ message }: { message: string }) => (
  <p className="mt-2 text-[13px] text-(--error) font-['Fira_Code',monospace]">
    {message}
  </p>
);

interface StepSystemPromptProps {
  value: string;
  onChange: (v: string) => void;
  submitting: boolean;
  error: string | null;
  onSubmit: () => void;
  onBack: () => void;
  showPreview: boolean;
  onPreviewToggle: () => void;
  inputRef?: React.RefObject<HTMLTextAreaElement | null>;
}

export const StepSystemPrompt = ({
  value,
  onChange,
  submitting,
  error,
  onSubmit,
  onBack,
  showPreview,
  onPreviewToggle,
  inputRef,
}: StepSystemPromptProps) => {
  return (
    <div>
      <StepHeading
        heading="Write the system prompt"
        subtext="Detailed instructions for how this agent should behave, what it knows, and how it responds."
      />

      {/* Toolbar row */}
      <div className="flex justify-end mb-2">
        <button
          onClick={onPreviewToggle}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2 text-[13px] border border-(--border-subtle) bg-transparent cursor-pointer transition-colors duration-150 hover:bg-(--bg-hover) focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2 ${showPreview ? "text-(--accent)" : "text-(--text-muted)"}`}
        >
          <EyeIcon crossed={!showPreview} />
          {showPreview ? "Hide preview" : "Preview"}
        </button>
      </div>

      <textarea
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="You are a senior software engineer with expertise in..."
        className="w-full px-4 py-4 rounded-3.5 text-[14px] text-(--text-primary) bg-(--bg-surface) border border-(--border-subtle) outline-none ring-0 focus:ring-0 focus:outline-none box-border transition-colors duration-150 leading-relaxed placeholder:text-(--text-muted) focus:border-(--accent) font-['Fira_Code',monospace] min-h-50 resize-none overflow-y-auto"
        disabled={submitting}
      />

      {error && <InlineError message={error} />}
      <div className="mt-6 flex items-center gap-4">
        <button
          onClick={onSubmit}
          disabled={submitting}
          className={[
            "flex items-center gap-2 px-5 py-2.75 rounded-2.5 text-(--bg-base) text-[15px] font-semibold border-none transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2",
            submitting
              ? "border border-(--border-subtle) bg-(--bg-surface) text-(--text-muted) opacity-60 cursor-not-allowed"
              : "border border-(--border-subtle) bg-(--bg-elevated) text-(--text-primary) cursor-pointer hover:bg-(--bg-hover)",
          ].join(" ")}
        >
          {submitting ? "Creating…" : "Create Agent"}
        </button>
        <button
          onClick={onBack}
          disabled={submitting}
          className="text-[14px] text-(--text-muted) bg-transparent border-none cursor-pointer transition-colors duration-150 hover:text-(--text-secondary) disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2 rounded-md"
        >
          ← Back
        </button>
      </div>
    </div>
  );
};

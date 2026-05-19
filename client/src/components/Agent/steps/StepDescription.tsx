import { ArrowRightIcon } from "../../Icons";

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

interface StepDescriptionProps {
  value: string;
  onChange: (v: string) => void;
  onContinue: () => void;
  onBack: () => void;
  inputRef?: React.RefObject<HTMLTextAreaElement | null>;
}

export const StepDescription = ({
  value,
  onChange,
  onContinue,
  onBack,
  inputRef,
}: StepDescriptionProps) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onContinue();
    }
  };

  return (
    <div>
      <StepHeading
        heading="What does this agent do?"
        subtext="A short summary of this agent's role. Shown in listings and helps Claude route tasks to it."
      />
      <textarea
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="e.g. A senior engineer focused on code review, refactoring, and architecture decisions."
        rows={4}
        className="w-full px-4 py-4 rounded-3.5 text-[15px] text-(--text-primary) bg-(--bg-surface) border border-(--border-subtle) outline-none ring-0 focus:ring-0 focus:outline-none box-border transition-colors duration-150 leading-relaxed placeholder:text-(--text-muted) focus:border-(--accent) resize-none overflow-y-auto"
      />
      <div className="mt-6 flex items-center gap-4">
        <button
          onClick={onContinue}
          className="flex items-center gap-2 px-5 py-2.75 rounded-2.5 border border-(--border-subtle) bg-(--bg-elevated) text-(--text-primary) text-[15px] font-semibold cursor-pointer transition-colors duration-150 hover:bg-(--bg-hover)"
        >
          Continue
          <ArrowRightIcon />
        </button>
        <button
          onClick={onBack}
          className="text-[14px] text-(--text-muted) bg-transparent border-none cursor-pointer transition-colors duration-150 hover:text-(--text-secondary) focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2 rounded-md"
        >
          ← Back
        </button>
      </div>
    </div>
  );
};

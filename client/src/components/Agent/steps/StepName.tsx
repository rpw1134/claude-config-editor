import { agentsDirDisplay } from "../constants";
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

const InlineError = ({ message }: { message: string }) => (
  <p className="mt-2 text-[13px] text-(--error) font-['Fira_Code',monospace]">
    {message}
  </p>
);

interface StepNameProps {
  value: string;
  onChange: (v: string) => void;
  error: string | null;
  onContinue: () => void;
  projectPath: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

export const StepName = ({
  value,
  onChange,
  error,
  onContinue,
  projectPath,
  inputRef,
}: StepNameProps) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") onContinue();
  };

  const displayPath = agentsDirDisplay(projectPath);

  return (
    <div>
      <StepHeading
        heading="What should we call this agent?"
        subtext={
          <>
            Give your agent a unique name. This becomes its filename in{" "}
            <code className="font-['Fira_Code',monospace] text-[13px] bg-(--bg-hover) border border-(--border-subtle) rounded px-1 py-px">
              {displayPath}
            </code>
            .
          </>
        }
      />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="e.g. engineer, reviewer, tutor"
        className={[
          "w-full px-4 py-4 rounded-3.5 text-lg text-(--text-primary) bg-(--bg-surface) outline-none ring-0 focus:ring-0 focus:outline-none box-border transition-colors duration-150",
          "placeholder:text-(--text-muted)",
          error
            ? "border border-[rgba(248,113,113,0.5)]"
            : "border border-(--border-subtle) focus:border-(--accent)",
        ].join(" ")}
      />
      {error && <InlineError message={error} />}
      <div className="mt-6">
        <button
          onClick={onContinue}
          className="flex items-center gap-2 px-5 py-2.75 rounded-2.5 bg-(--accent) text-(--bg-base) text-[15px] font-semibold border-none cursor-pointer transition-colors duration-150 hover:bg-(--accent-hover) focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2"
        >
          Continue
          <ArrowRightIcon />
        </button>
      </div>
    </div>
  );
};

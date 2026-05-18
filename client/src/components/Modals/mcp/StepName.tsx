import type React from "react";
import { NAME_PATTERN } from "../../../lib/validation";
import { Field } from "./shared";
import { inputClass } from "./styles";

export interface StepNameProps {
  name: string;
  nameError: string | null;
  onNameChange: (val: string) => void;
  onContinue: () => void;
  onContinueJson: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

export const StepName = ({
  name,
  nameError,
  onNameChange,
  onContinue,
  onContinueJson,
  inputRef,
}: StepNameProps) => (
  <div>
    <Field label="Name">
      <input
        ref={inputRef}
        type="text"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onContinue();
        }}
        placeholder="e.g. filesystem"
        className={[inputClass, nameError ? "border-(--error)" : ""].join(" ")}
      />
    </Field>
    {nameError && (
      <p className="mt-2 text-[12px] text-(--error) font-['Fira_Code',monospace]">
        {nameError}
      </p>
    )}
    <button
      type="button"
      onClick={onContinue}
      disabled={!name.trim()}
      className={[
        "w-full mt-6 py-3 rounded-xl text-[14px] font-semibold transition-colors duration-150",
        name.trim()
          ? "bg-(--accent) text-white cursor-pointer hover:bg-(--accent-hover) border-none"
          : "bg-(--bg-elevated) text-(--text-muted) border border-(--border-subtle) cursor-not-allowed",
      ].join(" ")}
    >
      Continue →
    </button>
    {NAME_PATTERN.test(name.trim()) && (
      <button
        type="button"
        onClick={onContinueJson}
        className="w-full mt-3 text-[13px] text-(--text-muted) hover:text-(--text-secondary) bg-transparent border-none cursor-pointer transition-colors duration-150"
      >
        Or work directly with JSON →
      </button>
    )}
  </div>
);

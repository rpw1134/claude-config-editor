import { useRef, useState } from "react";
import { tagPillClass } from "./styles";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const TagInput = ({
  value,
  onChange,
  placeholder = "Add…",
  disabled,
}: TagInputProps) => {
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const commit = () => {
    const trimmed = draft.trim().replace(/,+$/, "");
    if (!trimmed) return;
    const parts = trimmed.split(",").map((s) => s.trim()).filter(Boolean);
    const next = [...value, ...parts.filter((p) => !value.includes(p))];
    onChange(next);
    setDraft("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit();
    } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const removeTag = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div
      className="bg-(--bg-surface) border border-(--border-subtle) rounded-xl px-3 py-2 flex flex-wrap gap-2 cursor-text min-h-11 transition-colors duration-150"
      onClick={() => inputRef.current?.focus()}
    >
      {value.map((tag, i) => (
        <span key={i} className={tagPillClass}>
          {tag}
          {!disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(i);
              }}
              className="text-(--text-muted) hover:text-(--text-secondary) leading-none transition-colors"
              aria-label={`Remove ${tag}`}
            >
              ×
            </button>
          )}
        </span>
      ))}
      {!disabled && (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={commit}
          placeholder={value.length === 0 ? placeholder : ""}
          className="bg-transparent text-[13px] text-(--text-primary) outline-none placeholder:text-(--text-muted) min-w-20 flex-1"
        />
      )}
    </div>
  );
};

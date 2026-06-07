import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { tagPillClass } from "./styles";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  suggestions?: string[];
  /** When true, tags can only be added by picking a suggestion (no free text). */
  selectOnly?: boolean;
}

export const TagInput = ({
  value,
  onChange,
  placeholder = "Add…",
  disabled,
  suggestions,
  selectOnly,
}: TagInputProps) => {
  const [draft, setDraft] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filteredSuggestions =
    suggestions && draft.length > 0
      ? suggestions
          .filter(
            (s) =>
              s.toLowerCase().startsWith(draft.toLowerCase()) &&
              !value.includes(s),
          )
          .slice(0, 8)
      : [];

  const showDropdown = dropdownOpen && filteredSuggestions.length > 0;

  // Position the dropdown (rendered in a portal so no ancestor overflow can clip it).
  useLayoutEffect(() => {
    if (!showDropdown) return;
    const update = () => {
      const el = rowRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setMenuPos({ top: r.bottom + 4, left: r.left, width: r.width });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [showDropdown, value.length, draft]);

  const commit = (text?: string) => {
    if (selectOnly) return; // free text not allowed — must pick a suggestion
    const raw = text ?? draft;
    const trimmed = raw.trim().replace(/,+$/, "");
    if (!trimmed) return;
    const parts = trimmed
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const next = [...value, ...parts.filter((p) => !value.includes(p))];
    onChange(next);
    setDraft("");
    setHighlightIndex(-1);
    setDropdownOpen(false);
  };

  const selectSuggestion = (s: string) => {
    const next = value.includes(s) ? value : [...value, s];
    onChange(next);
    setDraft("");
    setHighlightIndex(-1);
    setDropdownOpen(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showDropdown) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightIndex((i) =>
          i < filteredSuggestions.length - 1 ? i + 1 : 0,
        );
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightIndex((i) =>
          i > 0 ? i - 1 : filteredSuggestions.length - 1,
        );
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setDropdownOpen(false);
        setHighlightIndex(-1);
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        // Enter picks the highlighted suggestion, or the top match if none highlighted.
        const pick =
          highlightIndex >= 0
            ? filteredSuggestions[highlightIndex]
            : filteredSuggestions[0];
        if (pick) selectSuggestion(pick);
        else commit();
        return;
      }
    }

    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit();
    } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDraft(e.target.value);
    setHighlightIndex(-1);
    setDropdownOpen(true);
  };

  const handleBlur = () => {
    closeTimer.current = setTimeout(() => {
      setDropdownOpen(false);
      setHighlightIndex(-1);
      if (selectOnly) setDraft(""); // discard unmatched free text
      else commit();
    }, 150);
  };

  const handleFocus = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setDropdownOpen(true);
  };

  const removeTag = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="relative">
      <div
        ref={rowRef}
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
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            onFocus={handleFocus}
            placeholder={value.length === 0 ? placeholder : ""}
            className="bg-transparent text-[13px] text-(--text-primary) outline-none placeholder:text-(--text-muted) min-w-20 flex-1"
          />
        )}
      </div>

      {showDropdown && menuPos &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: menuPos.top,
              left: menuPos.left,
              width: menuPos.width,
            }}
            className="z-50 max-h-60 overflow-y-auto rounded-lg border border-(--border-subtle) bg-(--bg-elevated) shadow-lg"
          >
            {filteredSuggestions.map((s, i) => (
              <button
                key={s}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  if (closeTimer.current) clearTimeout(closeTimer.current);
                  selectSuggestion(s);
                }}
                className={[
                  "w-full text-left px-3 py-2 text-[13px] text-(--text-primary) border-none cursor-pointer transition-colors duration-100",
                  i === highlightIndex
                    ? "bg-(--bg-hover)"
                    : "bg-transparent hover:bg-(--bg-hover)",
                ].join(" ")}
              >
                {s}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
};

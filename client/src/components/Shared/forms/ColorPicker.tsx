interface ColorSwatch {
  name: string;
  bg: string;
  ring: string;
}

const COLORS: ColorSwatch[] = [
  { name: "red", bg: "#ef4444", ring: "rgba(239,68,68,0.35)" },
  { name: "orange", bg: "#f97316", ring: "rgba(249,115,22,0.35)" },
  { name: "yellow", bg: "#eab308", ring: "rgba(234,179,8,0.35)" },
  { name: "green", bg: "#22c55e", ring: "rgba(34,197,94,0.35)" },
  { name: "teal", bg: "#14b8a6", ring: "rgba(20,184,166,0.35)" },
  { name: "blue", bg: "#3b82f6", ring: "rgba(59,130,246,0.35)" },
  { name: "purple", bg: "#a855f7", ring: "rgba(168,85,247,0.35)" },
  { name: "pink", bg: "#ec4899", ring: "rgba(236,72,153,0.35)" },
];

const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path
      d="M2 6L5 9L10 3"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

interface ColorPickerProps {
  value: string | undefined;
  onChange: (color: string | undefined) => void;
  disabled?: boolean;
}

export const ColorPicker = ({
  value,
  onChange,
  disabled,
}: ColorPickerProps) => (
  <div className="flex gap-3 flex-wrap">
    {COLORS.map((c) => {
      const selected = value === c.name;
      return (
        <button
          key={c.name}
          type="button"
          disabled={disabled}
          onClick={() => onChange(selected ? undefined : c.name)}
          aria-label={c.name}
          aria-pressed={selected}
          style={{
            background: c.bg,
            outline: selected ? `3px solid ${c.ring}` : "3px solid transparent",
            outlineOffset: 2,
            transition: "outline 150ms",
          }}
          className="w-7 h-7 rounded-full border-none cursor-pointer flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          {selected && (
            <span className="text-white">
              <CheckIcon />
            </span>
          )}
        </button>
      );
    })}
  </div>
);

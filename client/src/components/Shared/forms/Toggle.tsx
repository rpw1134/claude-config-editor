interface ToggleProps {
  checked: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
}

export const Toggle = ({ checked, onChange, disabled }: ToggleProps) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={[
      "relative inline-flex h-5 w-9 shrink-0 rounded-full border-none transition-colors duration-150",
      disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer",
    ].join(" ")}
    style={{
      background: checked ? "var(--accent)" : "var(--border-default)",
      transition: "background 150ms",
    }}
  >
    <span
      className="absolute top-0.75 w-3.5 h-3.5 rounded-full bg-white"
      style={{ left: checked ? 19 : 3, transition: "left 150ms" }}
    />
  </button>
);

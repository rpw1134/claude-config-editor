import React from "react";

interface NavButtonProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  disabled?: boolean;
  collapsed: boolean;
  onClick: () => void;
}

export const NavButton = ({
  icon,
  label,
  active,
  disabled = false,
  collapsed,
  onClick,
}: NavButtonProps) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={collapsed ? label : undefined}
    className={[
      "group w-full flex items-center gap-2.5 px-2 rounded-md text-left text-[14px] font-medium min-h-10 py-2 border-none transition-all duration-150",
      collapsed ? "border-l-0" : "border-l-[3px]",
      active
        ? "bg-(--bg-elevated) text-(--text-primary) border-l-(--accent)"
        : disabled
          ? "bg-transparent text-(--text-muted) border-l-transparent cursor-not-allowed"
          : "bg-transparent text-(--text-secondary) border-l-transparent cursor-pointer hover:bg-(--bg-hover) hover:text-(--text-primary)",
    ].join(" ")}
  >
    <span
      className={[
        "w-5 h-5 shrink-0 flex items-center justify-center transition-colors duration-150",
        disabled
          ? "text-(--text-muted)"
          : active
            ? "text-(--accent)"
            : "text-(--text-secondary) group-hover:text-(--text-primary)",
      ].join(" ")}
    >
      {icon}
    </span>
    <span
      className="overflow-hidden whitespace-nowrap"
      style={{
        opacity: collapsed ? 0 : 1,
        maxWidth: collapsed ? 0 : 200,
        transition: "opacity 100ms ease, max-width 200ms ease 100ms",
      }}
    >
      {label}
    </span>
  </button>
);

import { useEffect, useRef } from "react";
import { AgentIcon, SkillIcon, McpIcon, HooksIcon } from "../Icons";

interface CreateNewDropdownProps {
  onSelect: (type: "agent" | "skill" | "mcp-server" | "hooks" | "project") => void;
  onClose: () => void;
}

export const CreateNewDropdown = ({
  onSelect,
  onClose,
}: CreateNewDropdownProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const t = setTimeout(
      () => document.addEventListener("mousedown", handler),
      50,
    );
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", handler);
    };
  }, [onClose]);

  const options: {
    type: "agent" | "skill" | "mcp-server" | "hooks";
    label: string;
    icon: React.ReactNode;
  }[] = [
    { type: "agent", label: "Agent", icon: <AgentIcon /> },
    { type: "skill", label: "Skill", icon: <SkillIcon /> },
    { type: "mcp-server", label: "MCP Server", icon: <McpIcon /> },
    { type: "hooks", label: "Hooks", icon: <HooksIcon /> },
  ];

  return (
    <div
      ref={ref}
      className="absolute top-full left-0 right-0 mt-1.5 z-30 bg-(--bg-elevated) border border-(--border-default) rounded-lg overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.4)]"
    >
      {options.map(({ type, label, icon }) => (
        <button
          key={type}
          onClick={() => {
            onSelect(type);
            onClose();
          }}
          className="w-full flex items-center gap-2.5 px-3.5 py-2.25 text-left text-[14px] font-medium text-(--text-secondary) bg-transparent border-none cursor-pointer transition-colors duration-150 hover:bg-(--bg-hover) hover:text-(--text-primary)"
        >
          <span className="text-(--text-muted)">{icon}</span>
          {label}
        </button>
      ))}
    </div>
  );
};

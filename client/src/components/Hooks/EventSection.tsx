import { HookGroupCard } from "./HookGroupCard";

interface HookEntry {
  type?: string;
  command?: string;
  url?: string;
  prompt?: string;
}

interface EventSectionProps {
  event: string;
  groups: Array<{ matcher: string; hooks: HookEntry[] }>;
  onDeleteGroup: (index: number) => void;
}

export const EventSection = ({ event, groups, onDeleteGroup }: EventSectionProps) => (
  <div>
    <div className="flex items-center gap-2 mb-2">
      <span className="text-[11px] font-semibold text-(--text-muted) uppercase tracking-[0.1em]">
        {event}
      </span>
      <span className="text-[11px] text-(--text-muted) opacity-50">
        {groups.length} {groups.length === 1 ? "group" : "groups"}
      </span>
    </div>
    <div className="flex flex-col gap-2">
      {groups.map((group, i) => (
        <HookGroupCard
          key={i}
          group={group}
          onDelete={() => onDeleteGroup(i)}
        />
      ))}
    </div>
  </div>
);

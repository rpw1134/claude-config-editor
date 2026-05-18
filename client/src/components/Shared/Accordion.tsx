import { ChevronDownIcon } from "../Icons";

interface AccordionSectionProps {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  buttonRef?: React.RefObject<HTMLButtonElement | null>;
  onEnterAdvance?: () => void;
}

export const AccordionSection = ({
  title,
  open,
  onToggle,
  children,
  buttonRef,
  onEnterAdvance,
}: AccordionSectionProps) => {
  return (
    <div className="border border-(--border-subtle) rounded-3.5 overflow-hidden shrink-0">
      <button
        ref={buttonRef}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" && onEnterAdvance) {
            e.preventDefault();
            onEnterAdvance();
          }
        }}
        className="w-full flex items-center justify-between px-5 py-4 text-left bg-transparent border-none cursor-pointer text-(--text-primary) transition-colors duration-150 hover:bg-(--bg-hover) focus-visible:outline-2 focus-visible:outline-(--accent)"
      >
        <span className="text-[15px] font-semibold">{title}</span>
        <span
          className="text-(--text-muted) transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          <ChevronDownIcon />
        </span>
      </button>
      <div
        className="overflow-hidden"
        style={{
          maxHeight: open ? 400 : 0,
          transition: "max-height 260ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div className="px-5 pb-5 pt-1">{children}</div>
      </div>
    </div>
  );
};

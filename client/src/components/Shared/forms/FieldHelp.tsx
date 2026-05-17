interface FieldHelpProps {
  text: string;
}

export const FieldHelp = ({ text }: FieldHelpProps) => (
  <span className="relative group inline-flex items-center ml-1.5">
    <span className="w-3.5 h-3.5 rounded-full border border-(--border-subtle) text-(--text-muted) text-[9px] font-medium inline-flex items-center justify-center cursor-default leading-none select-none">
      ?
    </span>
    <span className="absolute bottom-full left-0 mb-1.5 w-56 px-3 py-2 rounded-lg bg-(--bg-elevated) border border-(--border-default) text-[12px] text-(--text-secondary) leading-relaxed shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 text-left whitespace-normal">
      {text}
    </span>
  </span>
);

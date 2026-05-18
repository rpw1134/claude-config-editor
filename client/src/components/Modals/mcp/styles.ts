export const inputClass = [
  'w-full px-4 py-3 rounded-xl text-[14px] font-["Fira_Code",monospace]',
  "bg-(--bg-elevated) text-(--text-primary) outline-none transition-colors duration-150 box-border",
  "border border-(--border-subtle) focus:border-(--accent)",
].join(" ");

export const textareaClass = [inputClass, "resize-none leading-relaxed"].join(" ");

interface GridPromptPreviewProps {
  prompt: string;
}

export const GridPromptPreview = ({ prompt }: GridPromptPreviewProps) => (
  <div className="w-75 shrink-0 flex flex-col border-l border-(--border-faint) bg-(--bg-sidebar)">
    <div className="px-4 pt-5 pb-3 shrink-0 border-b border-(--border-faint)">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-(--text-muted) m-0">
        System Prompt Preview
      </p>
      <p className="text-[11px] text-(--text-muted) mt-1 m-0 leading-relaxed">
        Auto-generated · read-only
      </p>
    </div>
    <div className="flex-1 overflow-y-auto p-4 min-h-0">
      {prompt ? (
        <pre className="text-[11px] font-['Fira_Code',monospace] text-(--text-secondary) leading-relaxed m-0 whitespace-pre-wrap wrap-break-word">
          {prompt}
        </pre>
      ) : (
        <p className="text-[12px] text-(--text-muted) italic m-0">
          Connect nodes to generate the orchestrator prompt.
        </p>
      )}
    </div>
  </div>
);

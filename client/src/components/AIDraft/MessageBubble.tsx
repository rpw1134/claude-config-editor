import { useEffect, useState } from "react";
import Markdown from "react-markdown";
import type { ChatMessage } from "../../types/aiDraft";
import { useAIDraft } from "../../contexts/AIDraftContext";
import { StrydeStatusIcon } from "./StrydeStatusIcon";

// ── Tool chip ─────────────────────────────────────────────────────────────────

function humanizeToolName(tool: string): string {
  const map: Record<string, string> = {
    list_agents: "Listing agents",
    get_agent: "Looking up agent",
    list_skills: "Listing skills",
    get_skill: "Looking up skill",
    read_file: "Reading file",
    write_file: "Writing file",
    list_files: "Listing files",
  };
  return map[tool] ?? tool.replace(/_/g, " ");
}

interface ToolChipProps {
  tool: string;
  done: boolean;
}

const ToolChip = ({ tool, done }: ToolChipProps) => (
  <span className="inline-flex items-center gap-1.5 bg-(--bg-elevated) border border-(--border-subtle) rounded-full px-3 py-1 text-[12px] text-(--text-muted)">
    {done ? (
      <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
        <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ) : (
      <span className="w-2 h-2 rounded-full border border-(--text-muted) animate-spin border-t-transparent shrink-0" />
    )}
    {humanizeToolName(tool)}
  </span>
);

// ── MessageBubble ─────────────────────────────────────────────────────────────

interface MessageBubbleProps {
  message: ChatMessage;
  isLastAssistant?: boolean;
}

export const MessageBubble = ({ message, isLastAssistant }: MessageBubbleProps) => {
  const { buildingArtifact } = useAIDraft();
  const isUser = message.role === "user";
  const isEmpty = !message.content && !message.isStreaming;
  const hasPendingTool = (message.toolCalls ?? []).some((tc) => tc.result === undefined);
  const aiStatus = hasPendingTool ? "thinking" : message.content ? "streaming" : "listening";

  // Once this message has streamed, wasStreaming stays true permanently so the
  // idle icon remains at the bottom of the completed response.
  const [wasStreaming, setWasStreaming] = useState(false);
  useEffect(() => {
    if (!isUser && message.isStreaming) setWasStreaming(true);
  }, [isUser, message.isStreaming]);

  if (isUser) {
    return (
      <div className="flex justify-end w-full">
        <div className="bg-(--bg-elevated) border border-(--border-subtle) rounded-3xl rounded-br-md px-5 py-3 max-w-[75%] text-[16px] text-(--text-primary) whitespace-pre-wrap leading-[1.65]">
          {message.content}
        </div>
      </div>
    );
  }

  // Assistant message — no bubble, just clean text
  return (
    <div className="flex flex-col gap-4 w-full pb-6">
      {/* Tool calls */}
      {(message.toolCalls ?? []).length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-1">
          {(message.toolCalls ?? []).map((tc, i) => (
            <ToolChip key={i} tool={tc.tool} done={tc.result !== undefined} />
          ))}
        </div>
      )}

      {/* Content */}
      {!isEmpty && (
        <div className="text-[18px] text-(--text-primary) leading-[1.7] font-sans
          prose prose-invert max-w-none
          **:font-sans
          prose-p:my-5 prose-p:leading-[1.7]
          prose-headings:text-(--text-primary) prose-headings:font-semibold prose-headings:mt-6 prose-headings:mb-2
          prose-h1:text-[20px] prose-h2:text-[18px] prose-h3:text-[16px]
          prose-code:text-[13.5px] prose-code:bg-(--bg-elevated) prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-(--text-primary) prose-code:font-['Fira_Code',monospace] prose-code:before:content-none prose-code:after:content-none
          prose-pre:bg-(--bg-elevated) prose-pre:border prose-pre:border-(--border-subtle) prose-pre:rounded-xl prose-pre:p-4 prose-pre:text-[13px] prose-pre:overflow-x-auto
          prose-li:my-1.5 prose-ul:my-3 prose-ol:my-3 prose-ul:pl-5 prose-ol:pl-5
          prose-strong:text-(--text-primary) prose-strong:font-semibold
          prose-blockquote:border-l-2 prose-blockquote:border-(--border-default) prose-blockquote:pl-4 prose-blockquote:text-(--text-secondary) prose-blockquote:not-italic prose-blockquote:my-3
          prose-hr:border-(--border-subtle) prose-hr:my-5
        ">
          <Markdown>{message.content}</Markdown>
        </div>
      )}

      {/* Status icon — only on the last assistant message; hidden while buildingArtifact owns the slot */}
      {(message.isStreaming || (wasStreaming && isLastAssistant)) && !buildingArtifact && (
        <StrydeStatusIcon status={message.isStreaming ? aiStatus : "idle"} size={28} />
      )}
    </div>
  );
};

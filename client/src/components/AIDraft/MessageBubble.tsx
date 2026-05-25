import type { ChatMessage } from "../../types/aiDraft";
import { StreamingDots } from "./StreamingDots";

// ── Tool chip ─────────────────────────────────────────────────────────────────

function humanizeToolName(tool: string): string {
  const map: Record<string, string> = {
    list_agents: "Listing agents…",
    get_agent: "Looking up agent…",
    list_skills: "Listing skills…",
    get_skill: "Looking up skill…",
    read_file: "Reading file…",
    write_file: "Writing file…",
    list_files: "Listing files…",
  };
  return map[tool] ?? `${tool.replace(/_/g, " ")}…`;
}

interface ToolChipProps {
  tool: string;
  done: boolean;
}

const ToolChip = ({ tool, done }: ToolChipProps) => (
  <span className="inline-flex items-center gap-1.5 bg-(--bg-elevated) border border-(--border-subtle) rounded-lg px-2.5 py-1 text-[12px] text-(--text-muted) my-1">
    {done ? (
      <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
        <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ) : (
      <span className="w-2 h-2 rounded-full border border-(--text-muted) animate-spin border-t-transparent" />
    )}
    {done ? tool.replace(/_/g, " ") : humanizeToolName(tool)}
  </span>
);

// ── MessageBubble ─────────────────────────────────────────────────────────────

interface MessageBubbleProps {
  message: ChatMessage;
}

export const MessageBubble = ({ message }: MessageBubbleProps) => {
  const isUser = message.role === "user";
  const isEmpty = !message.content && !message.isStreaming;

  if (isUser) {
    return (
      <div className="flex justify-end px-4 py-1">
        <div className="bg-(--accent)/15 border border-(--accent)/20 rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[80%] text-[14px] text-(--text-primary) whitespace-pre-wrap leading-relaxed">
          {message.content}
        </div>
      </div>
    );
  }

  // Assistant message
  return (
    <div className="flex flex-col gap-1.5 px-4 py-1 max-w-[85%]">
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
        <p className="m-0 text-[14px] text-(--text-primary) leading-relaxed whitespace-pre-wrap">
          {message.content}
        </p>
      )}

      {/* Streaming indicator */}
      {message.isStreaming && !message.content && <StreamingDots />}
    </div>
  );
};

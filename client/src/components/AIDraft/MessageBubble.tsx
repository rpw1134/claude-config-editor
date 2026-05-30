import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import Markdown from "react-markdown";
import type { Artifact, ChatMessage, ToolCall } from "../../types/aiDraft";
import { useAIDraft } from "../../contexts/AIDraftContext";
import { AgentIcon, DocumentIcon, SkillIcon } from "../Icons";
import { StrydeStatusIcon } from "./StrydeStatusIcon";

// ── DraftedCard ───────────────────────────────────────────────────────────────

const TYPE_ICONS: Record<Artifact["type"], ReactNode> = {
  agent: <AgentIcon />,
  skill: <SkillIcon />,
  "claude-md": <DocumentIcon />,
};

interface DraftedCardProps {
  artifact: Artifact;
  artifactIndex: number;
}

const DraftedCard = ({ artifact, artifactIndex }: DraftedCardProps) => {
  const { setSidebarOpen, setActiveArtifactIndex } = useAIDraft();
  return (
    <button
      onClick={() => { setActiveArtifactIndex(artifactIndex); setSidebarOpen(true); }}
      className="group inline-flex items-center gap-2 px-2.5 py-1.5 bg-(--bg-elevated) border border-(--border-subtle) rounded-lg hover:border-(--border-default) hover:bg-(--bg-hover) transition-all duration-150 cursor-pointer max-w-xs"
    >
      <span className="shrink-0 text-(--text-muted) group-hover:text-(--accent) transition-colors w-3.5 h-3.5 [&>svg]:w-3.5 [&>svg]:h-3.5">
        {TYPE_ICONS[artifact.type]}
      </span>
      <span className="text-[11px] text-(--text-muted) shrink-0">Drafted</span>
      <span className="text-(--text-muted) text-[10px] shrink-0">·</span>
      <span className="text-[13px] font-medium text-(--text-secondary) group-hover:text-(--text-primary) truncate transition-colors">
        {artifact.name}
      </span>
      <span className="shrink-0 text-[11px] text-(--accent) opacity-0 group-hover:opacity-100 transition-opacity duration-150">↗</span>
    </button>
  );
};

// ── Tool call card ────────────────────────────────────────────────────────────

function describeToolCall(tool: string, args: object): string {
  const a = args as Record<string, unknown>;
  if (tool === "get_agent" && typeof a.name === "string") return `Looking up agent "${a.name}"`;
  if (tool === "get_skill" && typeof a.name === "string") return `Looking up skill "${a.name}"`;
  const map: Record<string, string> = {
    list_agents: "Listing agents",
    list_skills: "Listing skills",
    get_claude_md: "Reading CLAUDE.md",
  };
  return map[tool] ?? tool.replace(/_/g, " ");
}

const ToolCallCard = ({ tc }: { tc: ToolCall }) => {
  const done = tc.result !== undefined;
  return (
    <div className="my-1.5 inline-flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl
      bg-(--accent)/6 border border-(--accent)/18
      shadow-inner shadow-black/[0.07]
      text-[13px] text-(--text-muted) select-none w-fit">
      <span className="shrink-0">
        {done ? (
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="text-(--accent)/60">
            <circle cx="6.5" cy="6.5" r="6" stroke="currentColor" strokeWidth="1" />
            <path d="M3.5 6.5l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <span className="block w-3 h-3 rounded-full border border-(--text-muted)/40 border-t-(--accent)/60 animate-spin" />
        )}
      </span>
      <span>{describeToolCall(tc.tool, tc.args)}</span>
    </div>
  );
};

// ── Prose wrapper (classes must live in JSX for Tailwind scanning) ─────────────

const ProseSegment = ({ children, fadeIn }: { children: ReactNode; fadeIn?: boolean }) => (
  <div className={`${fadeIn ? "content-fade-in " : ""}text-[18px] text-(--text-primary) leading-[1.7] font-sans
    prose prose-invert max-w-none **:font-sans
    prose-p:my-5 prose-p:leading-[1.7]
    prose-headings:text-(--text-primary) prose-headings:font-semibold prose-headings:mt-6 prose-headings:mb-2
    prose-h1:text-[20px] prose-h2:text-[18px] prose-h3:text-[16px]
    prose-code:text-[13.5px] prose-code:bg-(--bg-elevated) prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-(--text-primary) prose-code:font-['Fira_Code',monospace] prose-code:before:content-none prose-code:after:content-none
    prose-pre:bg-(--bg-elevated) prose-pre:border prose-pre:border-(--border-subtle) prose-pre:rounded-xl prose-pre:p-4 prose-pre:text-[13px] prose-pre:overflow-x-auto
    prose-li:my-1.5 prose-ul:my-3 prose-ol:my-3 prose-ul:pl-5 prose-ol:pl-5
    prose-strong:text-(--text-primary) prose-strong:font-semibold
    prose-blockquote:border-l-2 prose-blockquote:border-(--border-default) prose-blockquote:pl-4 prose-blockquote:text-(--text-secondary) prose-blockquote:not-italic prose-blockquote:my-3
    prose-hr:border-(--border-subtle) prose-hr:my-5`}>
    {children}
  </div>
);

// ── MessageBubble ─────────────────────────────────────────────────────────────

interface MessageBubbleProps {
  message: ChatMessage;
  isLastAssistant?: boolean;
}

export const MessageBubble = ({ message, isLastAssistant }: MessageBubbleProps) => {
  const { buildingArtifact, artifacts } = useAIDraft();
  const isUser = message.role === "user";
  const isEmpty = !message.content && !message.isStreaming;
  const hasPendingTool = (message.toolCalls ?? []).some((tc) => tc.result === undefined);
  const aiStatus = hasPendingTool ? "thinking" : message.content ? "streaming" : "listening";

  const [wasStreaming, setWasStreaming] = useState(false);
  useEffect(() => {
    if (!isUser && message.isStreaming) setWasStreaming(true);
  }, [isUser, message.isStreaming]);

  const [showContent, setShowContent] = useState(false);
  const contentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!isUser && message.content && !showContent && !contentTimerRef.current) {
      contentTimerRef.current = setTimeout(() => setShowContent(true), 350);
    }
  }, [isUser, message.content, showContent]);
  useEffect(() => {
    return () => { if (contentTimerRef.current) clearTimeout(contentTimerRef.current); };
  }, []);

  const shouldShowContent = !isEmpty && (!message.isStreaming || showContent);

  if (isUser) {
    return (
      <div className="flex justify-end w-full">
        <div className="bg-(--bg-elevated) border border-(--border-subtle) rounded-3xl rounded-br-md px-5 py-3 max-w-[75%] text-[16px] text-(--text-primary) whitespace-pre-wrap leading-[1.65]">
          {message.content}
        </div>
      </div>
    );
  }

  const draftedArtifact = message.draftedArtifactId
    ? artifacts.find(a => a.id === message.draftedArtifactId && !a.discarded)
    : null;
  const draftedArtifactIndex = draftedArtifact ? artifacts.indexOf(draftedArtifact) : -1;

  const toolCalls = message.toolCalls ?? [];
  const sortedCalls = [...toolCalls].sort((a, b) => (a.textPosition ?? 0) - (b.textPosition ?? 0));
  const hasPositions = toolCalls.length > 0 && toolCalls.every(tc => tc.textPosition !== undefined);

  function renderBody() {
    // No tool calls: just markdown
    if (toolCalls.length === 0) {
      return shouldShowContent ? (
        <ProseSegment fadeIn>
          <Markdown>{message.content}</Markdown>
        </ProseSegment>
      ) : null;
    }

    // Interleave text segments with tool call cards at their recorded positions
    if (hasPositions) {
      const nodes: ReactNode[] = [];
      let cursor = 0;

      sortedCalls.forEach((tc, i) => {
        const pos = tc.textPosition!;
        const before = message.content.slice(cursor, pos);
        if (before && shouldShowContent) {
          nodes.push(
            <ProseSegment key={`t${i}`} fadeIn={i === 0 && cursor === 0}>
              <Markdown>{before}</Markdown>
            </ProseSegment>
          );
        }
        nodes.push(<ToolCallCard key={`tc${i}`} tc={tc} />);
        cursor = pos;
      });

      const after = message.content.slice(cursor);
      if (after && shouldShowContent) {
        nodes.push(
          <ProseSegment key="tf">
            <Markdown>{after}</Markdown>
          </ProseSegment>
        );
      }

      return <>{nodes}</>;
    }

    // Fallback (no positions): text then cards stacked below
    return (
      <>
        {shouldShowContent && (
          <ProseSegment fadeIn>
            <Markdown>{message.content}</Markdown>
          </ProseSegment>
        )}
        <div className="flex flex-col gap-1.5">
          {toolCalls.map((tc, i) => <ToolCallCard key={i} tc={tc} />)}
        </div>
      </>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full pb-6">
      <div className="flex flex-col gap-2">
        {renderBody()}

        {isLastAssistant && buildingArtifact && (
          <div className="flex items-center gap-3 py-0.5">
            <StrydeStatusIcon status="thinking" size={28} />
            <span className="thinking-text text-[14px]">
              Drafting {buildingArtifact.name}…
            </span>
          </div>
        )}

        {!message.isStreaming && draftedArtifact && (
          <DraftedCard artifact={draftedArtifact} artifactIndex={draftedArtifactIndex} />
        )}
      </div>

      {(message.isStreaming || (wasStreaming && isLastAssistant)) && !buildingArtifact && (
        <StrydeStatusIcon status={message.isStreaming ? aiStatus : "idle"} size={28} />
      )}
    </div>
  );
};

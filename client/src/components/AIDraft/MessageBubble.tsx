import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import Markdown from "react-markdown";
import type { Artifact, ChatMessage, DraftedArtifactRef, ToolCall } from "../../types/aiDraft";
import { useAIDraft } from "../../contexts/AIDraftContext";
import { ArtifactsIcon } from "../Icons";
import { StrydeStatusIcon } from "./StrydeStatusIcon";
import { ToolStack } from "./ToolStack";

// ── DraftedCard ───────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  agent: "Agent",
  skill: "Skill",
  "claude-md": "CLAUDE.md",
  link: "Link",
  mcp: "MCP Server",
  hook: "Hook",
};

interface DraftedCardProps {
  artifact: Artifact;
  artifactIndex: number;
  isEdit?: boolean;
}

const DraftedCard = ({ artifact, artifactIndex, isEdit }: DraftedCardProps) => {
  const { setSidebarOpen, setActiveArtifactIndex } = useAIDraft();
  return (
    <button
      onClick={() => { setActiveArtifactIndex(artifactIndex); setSidebarOpen(true); }}
      className="group flex items-center gap-4 w-full px-5 py-4 bg-(--bg-elevated) border border-(--border-subtle) rounded-xl hover:border-(--border-default) hover:bg-(--bg-hover) transition-all duration-150 cursor-pointer"
    >
      <span className="shrink-0 text-(--text-muted) group-hover:text-(--accent) transition-colors w-5 h-5 [&>svg]:w-5 [&>svg]:h-5">
        <ArtifactsIcon />
      </span>
      <span className="text-[12px] font-semibold uppercase tracking-wider text-(--text-muted) shrink-0">
        {TYPE_LABELS[artifact.type] ?? artifact.type}
      </span>
      <span className="text-(--text-muted) text-[12px] shrink-0">·</span>
      <span className="text-[16px] font-medium text-(--text-secondary) group-hover:text-(--text-primary) flex-1 min-w-0 truncate text-left transition-colors">
        {artifact.name}
      </span>
      {isEdit && (
        <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wider text-(--accent)/60">
          Editing
        </span>
      )}
      <span className="shrink-0 text-[13px] text-(--accent) opacity-0 group-hover:opacity-100 transition-opacity duration-150">↗</span>
    </button>
  );
};

// ── Prose wrapper ─────────────────────────────────────────────────────────────

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
  const aiStatus = hasPendingTool ? "thinking" : "streaming";

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

  // Resolve all drafted artifact refs to live artifacts (discarded refs resolve to null and are skipped)
  const resolvedDrafts = (message.draftedArtifacts ?? []).flatMap((ref: DraftedArtifactRef) => {
    const artifact = artifacts.find((a) => a.name === ref.name && a.type === ref.type);
    if (!artifact) return [];
    return [{ artifact, index: artifacts.indexOf(artifact), isEdit: ref.isEdit, textPosition: ref.textPosition }];
  });

  const toolCalls = message.toolCalls ?? [];
  const hasToolPositions = toolCalls.length > 0 && toolCalls.every((tc) => tc.textPosition !== undefined);

  // Build ordered list of inline insertions (tool row + one card per artifact)
  interface Insertion {
    position: number;
    node: ReactNode;
  }
  const insertions: Insertion[] = [];

  if (hasToolPositions) {
    // Group tool calls by their position so each agent loop's tools render as one
    // stack at the point they occurred. Lumping them all at the earliest position
    // would float a later loop's tools above the text that introduces them.
    const groups = new Map<number, ToolCall[]>();
    for (const tc of toolCalls) {
      const pos = tc.textPosition!;
      const arr = groups.get(pos);
      if (arr) arr.push(tc);
      else groups.set(pos, [tc]);
    }
    for (const [pos, group] of groups) {
      insertions.push({
        position: pos,
        node: (
          <div key={`tools-${pos}`}>
            <ToolStack toolCalls={group} />
          </div>
        ),
      });
    }
  }

  for (const d of resolvedDrafts) {
    insertions.push({
      position: d.textPosition,
      node: (
        <div key={`artifact-${d.artifact.id}`} className="my-2 w-full">
          <DraftedCard artifact={d.artifact} artifactIndex={d.index} isEdit={d.isEdit} />
        </div>
      ),
    });
  }

  insertions.sort((a, b) => a.position - b.position);

  // While streaming, only show insertions (tool stacks, drafted cards) once the
  // drain has revealed the text up to their position — so a card never appears
  // above text that is still typing in.
  const visibleInsertions = message.isStreaming
    ? insertions.filter((ins) => ins.position <= message.content.length)
    : insertions;

  function renderBody() {
    // No insertions: plain text (+ fallback artifact cards below)
    if (insertions.length === 0) {
      if (toolCalls.length > 0) {
        return (
          <>
            {shouldShowContent && (
              <ProseSegment fadeIn><Markdown>{message.content}</Markdown></ProseSegment>
            )}
            <ToolStack toolCalls={toolCalls} />
            {resolvedDrafts.map((d) => (
              <div key={d.artifact.id} className="mt-2 w-full">
                <DraftedCard artifact={d.artifact} artifactIndex={d.index} isEdit={d.isEdit} />
              </div>
            ))}
          </>
        );
      }
      return (
        <>
          {shouldShowContent && (
            <ProseSegment fadeIn><Markdown>{message.content}</Markdown></ProseSegment>
          )}
          {resolvedDrafts.map((d) => (
            <div key={d.artifact.id} className="mt-2 w-full">
              <DraftedCard artifact={d.artifact} artifactIndex={d.index} isEdit={d.isEdit} />
            </div>
          ))}
        </>
      );
    }

    // Interleaved rendering: split text at each insertion point
    const nodes: ReactNode[] = [];
    let cursor = 0;
    let firstText = true;

    for (const ins of visibleInsertions) {
      const textBefore = message.content.slice(cursor, ins.position);
      if (textBefore && shouldShowContent) {
        nodes.push(
          <ProseSegment key={`t${cursor}`} fadeIn={firstText}>
            <Markdown>{textBefore}</Markdown>
          </ProseSegment>
        );
        firstText = false;
      }
      nodes.push(ins.node);
      cursor = ins.position;
    }

    const textAfter = message.content.slice(cursor);
    if (textAfter && shouldShowContent) {
      nodes.push(
        <ProseSegment key="tf" fadeIn={firstText}>
          <Markdown>{textAfter}</Markdown>
        </ProseSegment>
      );
    }

    return <>{nodes}</>;
  }

  return (
    <div className="flex flex-col gap-4 w-full pb-6">
      <div className="flex flex-col gap-2">
        {renderBody()}

        {isLastAssistant && buildingArtifact && (
          <div className="flex items-center gap-3 py-0.5">
            <StrydeStatusIcon status="thinking" size={28} />
            <span className="thinking-text text-[14px]">
              {buildingArtifact.isEdit ? "Editing" : "Drafting"} {buildingArtifact.name}…
            </span>
          </div>
        )}
      </div>

      {(message.isStreaming || (wasStreaming && isLastAssistant)) && !buildingArtifact && (
        <StrydeStatusIcon status={message.isStreaming ? aiStatus : "idle"} size={28} />
      )}
    </div>
  );
};

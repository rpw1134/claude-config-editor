import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { Artifact, ChatMessage, ToolCall } from "../types/aiDraft";
import { useShell } from "./ShellContext";

const BASE_URL = "http://localhost:3000";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AIDraftContextValue {
  messages: ChatMessage[];
  artifacts: Artifact[];
  isStreaming: boolean;
  buildingArtifact: { type: string; name: string } | null;
  sidebarOpen: boolean;
  activeArtifactIndex: number;
  noApiKey: boolean;
  sendMessage: (text: string) => Promise<void>;
  saveArtifact: (id: string) => Promise<void>;
  discardArtifact: (id: string) => void;
  setSidebarOpen: (open: boolean) => void;
  setActiveArtifactIndex: (i: number) => void;
  clearSession: () => void;
  unsavedCount: number;
}

// ── Context ───────────────────────────────────────────────────────────────────

const AIDraftContext = createContext<AIDraftContextValue | null>(null);

export const useAIDraft = (): AIDraftContextValue => {
  const ctx = useContext(AIDraftContext);
  if (!ctx) throw new Error("useAIDraft must be used inside AIDraftContext.Provider");
  return ctx;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeId(): string {
  return Math.random().toString(36).slice(2, 10);
}

interface ParsedEvent {
  type: string;
  data: Record<string, unknown>;
}

function parseSSEBlock(block: string): ParsedEvent | null {
  const lines = block.split("\n").filter(Boolean);
  let eventType = "message";
  let dataStr = "";
  for (const line of lines) {
    if (line.startsWith("event: ")) eventType = line.slice(7).trim();
    else if (line.startsWith("data: ")) dataStr = line.slice(6).trim();
  }
  if (!dataStr) return null;
  try {
    return { type: eventType, data: JSON.parse(dataStr) as Record<string, unknown> };
  } catch {
    return null;
  }
}

// ── Provider ──────────────────────────────────────────────────────────────────

interface AIDraftProviderProps {
  children: ReactNode;
  projectPath: string;
}

// ── Provider ──────────────────────────────────────────────────────────────────

export const AIDraftProvider = ({ children, projectPath }: AIDraftProviderProps) => {
  const { showToast } = useShell();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [buildingArtifact, setBuildingArtifact] = useState<{ type: string; name: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeArtifactIndex, setActiveArtifactIndex] = useState(0);
  const [noApiKey, setNoApiKey] = useState(false);

  // Ref for synchronous access inside the stream loop
  const pendingArtifactRef = useRef<{ type: string; name: string } | null>(null);

  // Word-by-word drain
  const contentBufferRef = useRef("");
  const displayedLengthRef = useRef(0);
  const drainRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamingMsgIdRef = useRef<string | null>(null);
  const streamDoneRef = useRef(false);
  // Tool calls queued until the drain reaches their buffer position
  const pendingToolCallsRef = useRef<Array<{ flushAt: number; toolCall: ToolCall }>>([]);

  const clearSession = useCallback(() => {
    setMessages([]);
    setArtifacts([]);
    setIsStreaming(false);
    setBuildingArtifact(null);
    setSidebarOpen(false);
    setActiveArtifactIndex(0);
    setNoApiKey(false);
    pendingArtifactRef.current = null;
  }, []);

  const stopDrain = useCallback(() => {
    if (drainRef.current) {
      clearInterval(drainRef.current);
      drainRef.current = null;
    }
  }, []);

  const startDrain = useCallback(() => {
    if (drainRef.current) return;
    drainRef.current = setInterval(() => {
      const buffer = contentBufferRef.current;
      const displayed = displayedLengthRef.current;

      if (displayed >= buffer.length) {
        if (streamDoneRef.current) {
          clearInterval(drainRef.current!);
          drainRef.current = null;
          const id = streamingMsgIdRef.current;
          if (id) setMessages(prev => prev.map(m => m.id === id ? { ...m, isStreaming: false } : m));
          setIsStreaming(false);
        }
        return;
      }

      // Advance to next whitespace boundary
      let end = -1;
      for (let i = displayed; i < buffer.length; i++) {
        const ch = buffer[i];
        if (ch === " " || ch === "\n" || ch === "\t") { end = i + 1; break; }
      }
      if (end === -1) {
        if (!streamDoneRef.current) return; // wait for more
        end = buffer.length;
      }

      displayedLengthRef.current = end;
      const id = streamingMsgIdRef.current;
      if (id) setMessages(prev => prev.map(m => m.id === id ? { ...m, content: buffer.slice(0, end) } : m));

      // Flush any tool calls whose buffer position has been reached
      const ready = pendingToolCallsRef.current.filter(p => end >= p.flushAt);
      if (ready.length > 0) {
        pendingToolCallsRef.current = pendingToolCallsRef.current.filter(p => end < p.flushAt);
        if (id) {
          setMessages(prev => prev.map(m => {
            if (m.id !== id) return m;
            return { ...m, toolCalls: [...(m.toolCalls ?? []), ...ready.map(p => p.toolCall)] };
          }));
        }
      }
    }, 30);
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (isStreaming) return;

      // Reset drain state for this turn
      contentBufferRef.current = "";
      displayedLengthRef.current = 0;
      streamDoneRef.current = false;
      pendingToolCallsRef.current = [];
      stopDrain();

      const userMsg: ChatMessage = { id: makeId(), role: "user", content: text };
      const assistantMsg: ChatMessage = {
        id: makeId(),
        role: "assistant",
        content: "",
        toolCalls: [],
        isStreaming: true,
      };
      streamingMsgIdRef.current = assistantMsg.id;

      // Capture before any state update — messages is the history up to (not including) this turn
      const capturedMessages = [...messages, userMsg];

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setIsStreaming(true);
      setNoApiKey(false);

      try {
        const res = await fetch(`${BASE_URL}/api/ai-draft/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: capturedMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            projectPath,
          }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({})) as { message?: string };
          const errorText = body.message ?? `Error ${res.status}`;
          if (errorText === "no_api_key") {
            setNoApiKey(true);
          }
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsg.id
                ? { ...m, content: errorText === "no_api_key" ? "" : `Error: ${errorText}`, isStreaming: false }
                : m
            )
          );
          setIsStreaming(false);
          return;
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response body");
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const blocks = buffer.split("\n\n");
          buffer = blocks.pop() ?? "";

          for (const block of blocks) {
            if (!block.trim()) continue;
            const event = parseSSEBlock(block);
            if (!event) continue;

            if (event.type === "token") {
              const text = (event.data.text as string) ?? "";
              contentBufferRef.current += text;
              startDrain();
            } else if (event.type === "artifact-start") {
              const pending = {
                type: (event.data.type as string) ?? "agent",
                name: (event.data.name as string) ?? "Untitled",
              };
              pendingArtifactRef.current = pending;
              setBuildingArtifact(pending);
            } else if (event.type === "artifact-end") {
              const pending = pendingArtifactRef.current;
              const artifactType = ((event.data.type as string) ?? pending?.type ?? "agent") as Artifact["type"];
              const artifactName = (event.data.name as string) ?? pending?.name ?? "Untitled";
              const content = (event.data.content as string) ?? "";
              const newArtifact: Artifact = {
                id: makeId(),
                type: artifactType,
                name: artifactName,
                content,
                saved: false,
                discarded: false,
              };
              setArtifacts((prev) => {
                const next = [...prev, newArtifact];
                setActiveArtifactIndex(next.length - 1);
                return next;
              });
              setSidebarOpen(true);
              pendingArtifactRef.current = null;
              setBuildingArtifact(null);
            } else if (event.type === "tool-call") {
              const toolCall: ToolCall = {
                tool: (event.data.tool as string) ?? "unknown",
                args: (event.data.args as object) ?? {},
              };
              // Queue until the drain reaches this position in the buffer
              pendingToolCallsRef.current.push({
                flushAt: contentBufferRef.current.length,
                toolCall,
              });
            } else if (event.type === "tool-result") {
              const toolName = (event.data.tool as string) ?? "";
              const result = (event.data.result as string) ?? "";
              // If the matching tool call is still queued, flush it now with the result attached
              const pendingIdx = pendingToolCallsRef.current.findIndex(p => p.toolCall.tool === toolName);
              if (pendingIdx !== -1) {
                const [pending] = pendingToolCallsRef.current.splice(pendingIdx, 1);
                displayedLengthRef.current = Math.max(displayedLengthRef.current, pending.flushAt);
                setMessages((prev) =>
                  prev.map((m) => {
                    if (m.id !== assistantMsg.id) return m;
                    return {
                      ...m,
                      content: contentBufferRef.current.slice(0, displayedLengthRef.current),
                      toolCalls: [...(m.toolCalls ?? []), { ...pending.toolCall, result }],
                    };
                  })
                );
              } else {
                setMessages((prev) =>
                  prev.map((m) => {
                    if (m.id !== assistantMsg.id) return m;
                    const updated = (m.toolCalls ?? []).map((tc) =>
                      tc.tool === toolName && tc.result === undefined
                        ? { ...tc, result }
                        : tc
                    );
                    return { ...m, toolCalls: updated };
                  })
                );
              }
            } else if (event.type === "error") {
              stopDrain();
              const msg = (event.data.message as string) ?? "Unknown error";
              if (msg === "no_api_key") {
                setNoApiKey(true);
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsg.id ? { ...m, content: "", isStreaming: false } : m
                  )
                );
              } else {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsg.id
                      ? { ...m, content: `Error: ${msg}`, isStreaming: false }
                      : m
                  )
                );
              }
              setBuildingArtifact(null);
              setIsStreaming(false);
              return;
            } else if (event.type === "done") {
              break;
            }
          }
        }
      } catch (err) {
        stopDrain();
        const msg = err instanceof Error ? err.message : "Unknown error";
        setBuildingArtifact(null);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id
              ? { ...m, content: `Error: ${msg}`, isStreaming: false }
              : m
          )
        );
        setIsStreaming(false);
      } finally {
        setBuildingArtifact(null);
        // Signal drain to finish and handle isStreaming cleanup.
        // If drain never started (no tokens), clean up immediately.
        streamDoneRef.current = true;
        if (!drainRef.current) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsg.id ? { ...m, isStreaming: false } : m
            )
          );
          setIsStreaming(false);
        }
      }
    },
    [isStreaming, messages, projectPath, startDrain, stopDrain]
  );

  const saveArtifact = useCallback(
    async (id: string) => {
      const artifact = artifacts.find((a) => a.id === id);
      if (!artifact) return;
      try {
        if (artifact.type === "agent") {
          await fetch(`${BASE_URL}/api/agents`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ projectPath, name: artifact.name, content: artifact.content }),
          });
        } else if (artifact.type === "skill") {
          await fetch(`${BASE_URL}/api/skills`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ projectPath, name: artifact.name, content: artifact.content }),
          });
        } else if (artifact.type === "claude-md") {
          await fetch(`${BASE_URL}/api/projects/file`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ projectPath, content: artifact.content }),
          });
        }
        setArtifacts((prev) =>
          prev.map((a) => (a.id === id ? { ...a, saved: true } : a))
        );
        showToast(`${artifact.name} saved`, "success");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Save failed";
        showToast(msg, "error");
      }
    },
    [artifacts, projectPath, showToast]
  );

  const discardArtifact = useCallback((id: string) => {
    setArtifacts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, discarded: true } : a))
    );
  }, []);

  const unsavedCount = artifacts.filter((a) => !a.saved && !a.discarded).length;

  return (
    <AIDraftContext.Provider
      value={{
        messages,
        artifacts,
        isStreaming,
        buildingArtifact,
        sidebarOpen,
        activeArtifactIndex,
        noApiKey,
        sendMessage,
        saveArtifact,
        discardArtifact,
        setSidebarOpen,
        setActiveArtifactIndex,
        clearSession,
        unsavedCount,
      }}
    >
      {children}
    </AIDraftContext.Provider>
  );
};

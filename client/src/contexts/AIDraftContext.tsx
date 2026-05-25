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

export const AIDraftProvider = ({ children, projectPath }: AIDraftProviderProps) => {
  const { showToast } = useShell();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeArtifactIndex, setActiveArtifactIndex] = useState(0);
  const [noApiKey, setNoApiKey] = useState(false);

  // Track the pending artifact being built during a stream
  const pendingArtifactRef = useRef<{ type: string; name: string } | null>(null);

  const clearSession = useCallback(() => {
    setMessages([]);
    setArtifacts([]);
    setIsStreaming(false);
    setSidebarOpen(false);
    setActiveArtifactIndex(0);
    setNoApiKey(false);
    pendingArtifactRef.current = null;
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (isStreaming) return;

      const userMsg: ChatMessage = { id: makeId(), role: "user", content: text };
      const assistantMsg: ChatMessage = {
        id: makeId(),
        role: "assistant",
        content: "",
        toolCalls: [],
        isStreaming: true,
      };

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
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsg.id ? { ...m, content: m.content + text } : m
                )
              );
            } else if (event.type === "artifact-start") {
              pendingArtifactRef.current = {
                type: (event.data.type as string) ?? "agent",
                name: (event.data.name as string) ?? "Untitled",
              };
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
            } else if (event.type === "tool-call") {
              const toolCall: ToolCall = {
                tool: (event.data.tool as string) ?? "unknown",
                args: (event.data.args as object) ?? {},
              };
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsg.id
                    ? { ...m, toolCalls: [...(m.toolCalls ?? []), toolCall] }
                    : m
                )
              );
            } else if (event.type === "tool-result") {
              const toolName = (event.data.tool as string) ?? "";
              const result = (event.data.result as string) ?? "";
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
            } else if (event.type === "error") {
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
              setIsStreaming(false);
              return;
            } else if (event.type === "done") {
              break;
            }
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id
              ? { ...m, content: `Error: ${msg}`, isStreaming: false }
              : m
          )
        );
      } finally {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id ? { ...m, isStreaming: false } : m
          )
        );
        setIsStreaming(false);
      }
    },
    [isStreaming, projectPath]
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

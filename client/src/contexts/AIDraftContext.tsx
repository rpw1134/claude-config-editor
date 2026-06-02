import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { Artifact, ChatMessage, DraftedArtifactRef, ToolCall } from "../types/aiDraft";
import { useShell } from "./ShellContext";

const BASE_URL = "http://localhost:3000";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AIDraftContextValue {
  messages: ChatMessage[];
  artifacts: Artifact[];
  isStreaming: boolean;
  buildingArtifact: { type: string; name: string; isEdit?: boolean } | null;
  sidebarOpen: boolean;
  activeArtifactIndex: number;
  noApiKey: boolean;
  sendMessage: (text: string) => Promise<void>;
  saveArtifact: (id: string) => Promise<void>;
  saveAll: () => Promise<void>;
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

// ── Dev mock (remove before shipping) ────────────────────────────────────────
const DEV_MOCK = typeof window !== "undefined" && localStorage.getItem("dev-sidebar") === "1";
const DEV_ARTIFACTS: Artifact[] = DEV_MOCK ? [
  { id: "dev-1", type: "agent", name: "code-reviewer", saved: false,
    content: `---\nname: Code Reviewer\ndescription: Reviews pull requests for bugs, style issues, and security vulnerabilities.\nmodel: claude-opus-4-7\ntools:\n  - Read\n  - Bash\n  - Grep\ndisallowedTools:\n  - Write\npermissionMode: default\nmaxTurns: 20\neffort: high\n---\n\nYou are an expert code reviewer. When given a PR or set of files to review:\n\n1. Check for **logic bugs** and edge cases\n2. Flag \`security vulnerabilities\` (injections, auth issues)\n3. Review for performance anti-patterns\n4. Ensure error handling is thorough\n\nAlways cite specific line numbers. Be constructive, not critical.` },
  { id: "dev-2", type: "skill", name: "deploy-staging", saved: true,
    content: `---\nname: Deploy to Staging\ndescription: Runs the full deploy pipeline to the staging environment.\nwhen_to_use: When the user says "deploy to staging" or asks to deploy their changes for review.\nargument-hint: "[branch-name]"\nuser-invocable: true\nallowed-tools:\n  - Bash\nmodel: claude-sonnet-4-6\neffort: medium\n---\n\nDeploy the current branch to staging.\n\n## Steps\n\n1. Run \`npm test\` — abort if tests fail\n2. Run \`npm run build\`\n3. Push to the \`staging\` remote\n4. Wait for health check to return 200\n5. Report the staging URL` },
] : [];

// ── Dev messages (remove before shipping) ────────────────────────────────────
const DEV_MESSAGES: ChatMessage[] = DEV_MOCK ? [
  { id: "dm-1", role: "user", content: "Create a code review agent" },
  { id: "dm-2", role: "assistant", content: "I'll create a code review agent for you.", draftedArtifacts: [{ name: "code-reviewer", type: "agent", isEdit: false, textPosition: 0 }] },
] : [];

// ── Provider ──────────────────────────────────────────────────────────────────

export const AIDraftProvider = ({ children, projectPath }: AIDraftProviderProps) => {
  const { showToast } = useShell();
  const [messages, setMessages] = useState<ChatMessage[]>(DEV_MESSAGES);
  const [artifacts, setArtifacts] = useState<Artifact[]>(DEV_ARTIFACTS);
  const [isStreaming, setIsStreaming] = useState(false);
  const [buildingArtifact, setBuildingArtifact] = useState<{ type: string; name: string; isEdit?: boolean } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(DEV_MOCK);
  const [activeArtifactIndex, setActiveArtifactIndex] = useState(0);
  const [noApiKey, setNoApiKey] = useState(false);

  // Ref for synchronous access to current artifacts inside the stream loop
  // (avoids calling setMessages inside setArtifacts updater)
  const artifactsRef = useRef<Artifact[]>(DEV_ARTIFACTS);
  useEffect(() => { artifactsRef.current = artifacts; }, [artifacts]);

  // Full Anthropic message history (with tool use/result blocks) from the last completed turn.
  // Sent to the API on the next turn so the model retains tool call context across turns.
  const rawHistoryRef = useRef<unknown[]>([]);

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
    rawHistoryRef.current = [];
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
            return { ...m, toolCalls: [...(m.toolCalls ?? []), ...ready.map(p => ({ ...p.toolCall, textPosition: p.flushAt }))] };
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

      // Build the API message list. If we have raw history from previous turns (with full
      // tool use/result blocks), use that so the model retains tool call context. Otherwise
      // fall back to the simplified {role, content} format for the first turn.
      const prevRawHistory = rawHistoryRef.current;
      const apiMessages = prevRawHistory.length > 0
        ? [...prevRawHistory, { role: "user", content: text }]
        : [{ role: "user", content: text }];

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setIsStreaming(true);
      setNoApiKey(false);

      try {
        const res = await fetch(`${BASE_URL}/api/ai-draft/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: apiMessages,
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
              const isEditArtifact = artifactsRef.current.some(
                (a) => a.name === pending.name && a.type === pending.type
              );
              pendingArtifactRef.current = pending;
              setBuildingArtifact({ ...pending, isEdit: isEditArtifact });
            } else if (event.type === "artifact-end") {
              const pending = pendingArtifactRef.current;
              const artifactType = ((event.data.type as string) ?? pending?.type ?? "agent") as Artifact["type"];
              const artifactName = (event.data.name as string) ?? pending?.name ?? "Untitled";
              const content = (event.data.content as string) ?? "";
              const artifactTextPosition = contentBufferRef.current.length;
              const msgId = streamingMsgIdRef.current;

              // Name+type dedup: check current artifacts via ref (synchronous, no setState nesting)
              const currentArtifacts = artifactsRef.current;
              const existingIdx = currentArtifacts.findIndex(
                (a) => a.name === artifactName && a.type === artifactType
              );
              const isEdit = existingIdx !== -1;

              // Append to the message's draftedArtifacts array (supports multiple per message)
              const artifactRef: DraftedArtifactRef = {
                name: artifactName,
                type: artifactType,
                isEdit,
                textPosition: artifactTextPosition,
              };
              if (msgId) {
                setMessages((ms) =>
                  ms.map((m) =>
                    m.id === msgId
                      ? { ...m, draftedArtifacts: [...(m.draftedArtifacts ?? []), artifactRef] }
                      : m
                  )
                );
              }

              // Update artifacts and active index
              if (isEdit) {
                setActiveArtifactIndex(existingIdx);
                setArtifacts((prev) =>
                  prev.map((a, i) => (i === existingIdx ? { ...a, content, saved: false } : a))
                );
              } else {
                setActiveArtifactIndex(currentArtifacts.length);
                setArtifacts((prev) => [
                  ...prev,
                  { id: makeId(), type: artifactType, name: artifactName, content, saved: false },
                ]);
              }

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
                      toolCalls: [...(m.toolCalls ?? []), { ...pending.toolCall, result, textPosition: pending.flushAt }],
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
            } else if (event.type === "history") {
              rawHistoryRef.current = (event.data.messages as unknown[]) ?? [];
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
    [isStreaming, projectPath, startDrain, stopDrain]
  );

  const saveArtifact = useCallback(
    async (id: string) => {
      const artifact = artifacts.find((a) => a.id === id);
      if (!artifact) return;
      try {
        if (artifact.type === "agent") {
          // Use PUT if agent already exists on disk (edit), POST to create
          const res = await fetch(`${BASE_URL}/api/agents/${encodeURIComponent(artifact.name)}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ projectPath, content: artifact.content }),
          });
          if (res.status === 404) {
            await fetch(`${BASE_URL}/api/agents`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectPath, name: artifact.name, content: artifact.content }),
            });
          }
        } else if (artifact.type === "skill") {
          // Extract <skill.md> block if present; fall back to raw content for plain artifacts
          const skillMdMatch = artifact.content.match(/<skill\.md>([\s\S]*?)<\/skill\.md>/);
          const skillContent = skillMdMatch ? skillMdMatch[1].trim() : artifact.content;

          const res = await fetch(`${BASE_URL}/api/skills/${encodeURIComponent(artifact.name)}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ projectPath, content: skillContent }),
          });
          if (res.status === 404) {
            await fetch(`${BASE_URL}/api/skills`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectPath, name: artifact.name, content: skillContent }),
            });
          }

          // Save any embedded scripts
          const scriptsMatch = artifact.content.match(/<scripts>([\s\S]*?)<\/scripts>/);
          if (scriptsMatch) {
            const scriptRegex = /<script name="([^"]+)">([\s\S]*?)<\/script>/g;
            let m;
            while ((m = scriptRegex.exec(scriptsMatch[1])) !== null) {
              const [, fileName, scriptContent] = m;
              const postRes = await fetch(
                `${BASE_URL}/api/skills/${encodeURIComponent(artifact.name)}/script`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ projectPath, file: fileName, content: scriptContent.trim() }),
                }
              );
              if (postRes.status === 409) {
                await fetch(
                  `${BASE_URL}/api/skills/${encodeURIComponent(artifact.name)}/script`,
                  {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ projectPath, file: fileName, content: scriptContent.trim() }),
                  }
                );
              }
            }
          }
        } else if (artifact.type === "claude-md") {
          await fetch(`${BASE_URL}/api/projects/file`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ projectPath, content: artifact.content }),
          });
        } else if (artifact.type === "mcp") {
          await fetch(`${BASE_URL}/api/mcp-servers`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ projectPath, name: artifact.name, content: artifact.content }),
          });
        } else if (artifact.type === "hook") {
          // Merge new hook groups into existing hooks config.
          // Artifact content is the full nested format:
          // { "PreToolUse": [{ matcher: "", hooks: [{ type: "command", command: "..." }] }] }
          const currentRes = await fetch(`${BASE_URL}/api/hooks?projectPath=${encodeURIComponent(projectPath)}`);
          const currentData = await currentRes.json() as { hooks: Record<string, unknown[]> };
          const hooks = currentData.hooks ?? {};
          const hookConfig = JSON.parse(artifact.content) as Record<string, unknown[]>;
          for (const [event, groups] of Object.entries(hookConfig)) {
            if (Array.isArray(groups)) {
              hooks[event] = [...(hooks[event] ?? []), ...groups];
            }
          }
          await fetch(`${BASE_URL}/api/hooks`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ projectPath, hooks }),
          });
        } else if (artifact.type === "link") {
          const linkData: Record<string, string> = {};
          for (const line of artifact.content.trim().split("\n")) {
            const idx = line.indexOf(":");
            if (idx !== -1) linkData[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
          }
          const { agent: agentName, skill: skillName, trigger } = linkData;
          if (!agentName || !skillName) {
            showToast("Link is missing agent or skill fields", "error");
            return;
          }
          const skillSection = `\n\n## Linked Skill: ${skillName}\n\nWhen ${trigger ?? "triggered"}, invoke the \`${skillName}\` skill using \`/${skillName}\`.`;

          // Use session artifact content if present, otherwise fetch from disk
          const sessionAgent = artifacts.find((a) => a.name === agentName && a.type === "agent");
          let agentContent: string;
          if (sessionAgent) {
            agentContent = sessionAgent.content;
          } else {
            const agentRes = await fetch(
              `${BASE_URL}/api/agents/${encodeURIComponent(agentName)}?projectPath=${encodeURIComponent(projectPath)}`
            );
            if (!agentRes.ok) {
              showToast(`Agent "${agentName}" not found — save the agent first`, "error");
              return;
            }
            agentContent = ((await agentRes.json()) as { content: string }).content;
          }

          const updatedContent = agentContent + skillSection;

          // Write the updated agent to disk (stages it via the PUT handler)
          const putRes = await fetch(`${BASE_URL}/api/agents/${encodeURIComponent(agentName)}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ projectPath, content: updatedContent }),
          });
          if (!putRes.ok && putRes.status !== 404) throw new Error("Failed to save agent");
          if (putRes.status === 404) {
            const postRes = await fetch(`${BASE_URL}/api/agents`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectPath, name: agentName, content: updatedContent }),
            });
            if (!postRes.ok) throw new Error("Failed to create agent");
          }

          // Mark the session agent as saved with updated content
          if (sessionAgent) {
            setArtifacts((prev) =>
              prev.map((a) =>
                a.id === sessionAgent.id ? { ...a, content: updatedContent, saved: true } : a
              )
            );
          }
          showToast(`${agentName} saved`, "success");
        }
        setArtifacts((prev) =>
          prev.map((a) => (a.id === id ? { ...a, saved: true } : a))
        );
        if (artifact.type !== "link") showToast(`${artifact.name} saved`, "success");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Save failed";
        showToast(msg, "error");
      }
    },
    [artifacts, projectPath, showToast]
  );

  const saveAll = useCallback(async () => {
    const unsaved = artifacts.filter((a) => !a.saved);
    const links = unsaved.filter((a) => a.type === "link");
    const others = unsaved.filter((a) => a.type !== "link");

    // Collect agent names that links will save, so we don't double-save them
    const agentNamesSavedByLinks = new Set<string>();
    for (const a of links) {
      for (const line of a.content.trim().split("\n")) {
        const idx = line.indexOf(":");
        if (idx !== -1 && line.slice(0, idx).trim() === "agent") {
          agentNamesSavedByLinks.add(line.slice(idx + 1).trim());
        }
      }
    }

    for (const a of links) await saveArtifact(a.id);
    for (const a of others) {
      if (a.type === "agent" && agentNamesSavedByLinks.has(a.name)) continue;
      await saveArtifact(a.id);
    }
  }, [artifacts, saveArtifact]);

  const discardArtifact = useCallback((id: string) => {
    setArtifacts((prev) => {
      const next = prev.filter((a) => a.id !== id);
      if (next.length === 0) {
        setSidebarOpen(false);
        setActiveArtifactIndex(0);
      } else {
        setActiveArtifactIndex((curr) => Math.min(curr, next.length - 1));
      }
      return next;
    });
  }, []);

  const unsavedCount = artifacts.filter((a) => !a.saved).length;

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
        saveAll,
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

import { useEffect, useRef, useState } from "react";
import {
  fetchAgentContent,
  fetchSkillContent,
  updateAgentContent,
  updateSkillContent,
} from "../../lib/api";
import { Editor } from "./Editor";

interface EditorPaneProps {
  name: string;
  type: "agent" | "skill";
  onClose: () => void;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

function filePath(name: string, type: "agent" | "skill"): string {
  return type === "agent"
    ? `~/.claude/agents/${name}`
    : `~/.claude/skills/${name}/SKILL.md`;
}

export const EditorPane = ({ name, type, onClose }: EditorPaneProps) => {
  const [content, setContent] = useState("");
  const [savedContent, setSavedContent] = useState("");
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const statusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentKey = `${type}:${name}`;
  const loading = loadedKey !== currentKey;
  const dirty = !loading && content !== savedContent;
  const saving = saveStatus === "saving";

  useEffect(() => {
    const fetchFn = type === "agent" ? fetchAgentContent : fetchSkillContent;
    fetchFn(name)
      .then((text) => {
        setContent(text);
        setSavedContent(text);
        setLoadedKey(currentKey);
        setSaveStatus("idle");
      })
      .catch(() => {
        setContent("");
        setSavedContent("");
        setLoadedKey(currentKey);
        setSaveStatus("idle");
      });
  }, [name, type, currentKey]);

  // Clear any pending status timer on unmount
  useEffect(() => {
    return () => {
      if (statusTimer.current !== null) clearTimeout(statusTimer.current);
    };
  }, []);

  const handleSave = async () => {
    if (loading || !dirty || saving) return;
    setSaveStatus("saving");
    try {
      const updateFn =
        type === "agent" ? updateAgentContent : updateSkillContent;
      await updateFn(name, content);
      setSavedContent(content);
      setSaveStatus("saved");
      statusTimer.current = setTimeout(() => setSaveStatus("idle"), 1500);
    } catch {
      setSaveStatus("error");
      statusTimer.current = setTimeout(() => setSaveStatus("idle"), 2000);
    }
  };

  const saveLabel =
    saveStatus === "saving"
      ? "Saving…"
      : saveStatus === "saved"
      ? "Saved"
      : saveStatus === "error"
      ? "Error"
      : "Save";

  const saveDisabled = loading || !dirty || saving;

  const saveClassName = [
    "font-mono text-[11px] px-2 py-0.5 rounded transition-colors",
    saveDisabled
      ? "opacity-40 cursor-not-allowed text-white/40"
      : saveStatus === "saved"
      ? "text-green-400/70 hover:text-green-400"
      : saveStatus === "error"
      ? "text-red-400/70"
      : "text-white/50 hover:text-white/80",
  ].join(" ");

  return (
    <div className="flex flex-col h-full bg-[#0d0d10] border-l border-white/6">
      <div className="px-4 py-2.5 border-b border-white/6 flex items-center justify-between shrink-0">
        <span className="font-mono text-[11px] text-white/30">
          {filePath(name, type)}
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saveDisabled}
            className={saveClassName}
            aria-label="Save file"
          >
            {saveLabel}
          </button>
          <button
            onClick={onClose}
            className="text-white/30 hover:text-white/60 transition-colors text-[16px] leading-none"
            aria-label="Close editor"
          >
            ×
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <Editor
          value={loading ? "" : content}
          onChange={(val) => setContent(val ?? "")}
          language="markdown"
          readOnly={loading}
        />
      </div>
    </div>
  );
};

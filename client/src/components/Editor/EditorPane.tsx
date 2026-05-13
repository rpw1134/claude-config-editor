import { useEffect, useState } from "react";
import { fetchAgentContent, fetchSkillContent } from "../../lib/api";
import { Editor } from "./Editor";

interface EditorPaneProps {
  name: string;
  type: "agent" | "skill";
  onClose: () => void;
}

function filePath(name: string, type: "agent" | "skill"): string {
  return type === "agent"
    ? `~/.claude/agents/${name}`
    : `~/.claude/skills/${name}/SKILL.md`;
}

export const EditorPane = ({ name, type, onClose }: EditorPaneProps) => {
  const [content, setContent] = useState("");
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const currentKey = `${type}:${name}`;
  const loading = loadedKey !== currentKey;

  useEffect(() => {
    const fetchFn = type === "agent" ? fetchAgentContent : fetchSkillContent;
    fetchFn(name)
      .then((text) => { setContent(text); setLoadedKey(currentKey); })
      .catch(() => { setContent(""); setLoadedKey(currentKey); });
  }, [name, type, currentKey]);

  return (
    <div className="flex flex-col h-full bg-[#0d0d10] border-l border-white/6">
      <div className="px-4 py-2.5 border-b border-white/6 flex items-center justify-between shrink-0">
        <span className="font-mono text-[11px] text-white/30">
          {filePath(name, type)}
        </span>
        <button
          onClick={onClose}
          className="text-white/30 hover:text-white/60 transition-colors text-[16px] leading-none"
          aria-label="Close editor"
        >
          ×
        </button>
      </div>
      <div className="flex-1 min-h-0">
        <Editor
          value={loading ? "" : content}
          onChange={() => {}}
          language="markdown"
          readOnly={loading}
        />
      </div>
    </div>
  );
};

import { useEffect, useMemo, useRef, useState } from "react";
import {
  parseSkillFrontmatter,
  serializeSkillFrontmatter,
  type SkillFrontmatter,
} from "../../lib/frontmatter";
import { IdentityTab } from "./tabs/IdentityTab";
import { InstructionsTab } from "./tabs/InstructionsTab";
import { SkillSettingsTab } from "./tabs/SkillSettingsTab";

type Tab = "identity" | "instructions" | "settings";

// ── IdentityTab ───────────────────────────────────────────────────────────────
// ── SkillFormEditor ───────────────────────────────────────────────────────────
// ── SkillFormEditor ───────────────────────────────────────────────────────────

export interface SkillFormEditorProps {
  content: string;
  onChange: (content: string) => void;
  onDelete?: () => void;
  deleteStatus?: "idle" | "confirm" | "deleting" | "error";
  disabled?: boolean;
  activeSection?: Tab;
  previewMode?: boolean;
  onSetPreviewMode?: (val: boolean) => void;
}

export const SkillFormEditor = ({
  content,
  onChange,
  onDelete,
  deleteStatus = "idle",
  disabled,
  activeSection,
  previewMode = false,
  onSetPreviewMode,
}: SkillFormEditorProps) => {
  const { frontmatter: initialFm, body: initialBody } = useMemo(
    () => parseSkillFrontmatter(content),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [fm, setFm] = useState<SkillFrontmatter>(initialFm);
  const [body, setBody] = useState(initialBody);
  const activeTab = activeSection ?? "identity";
  const lastExternalContent = useRef(content);

  useEffect(() => {
    if (content !== lastExternalContent.current) {
      lastExternalContent.current = content;
      const { frontmatter, body: newBody } = parseSkillFrontmatter(content);
      setFm(frontmatter);
      setBody(newBody);
    }
  }, [content]);

  const emit = (nextFm: SkillFrontmatter, nextBody: string) => {
    const serialized = serializeSkillFrontmatter(nextFm, nextBody);
    lastExternalContent.current = serialized;
    onChange(serialized);
  };

  const handleFieldChange = <K extends keyof SkillFrontmatter>(
    key: K,
    value: SkillFrontmatter[K],
  ) => {
    const nextFm = { ...fm, [key]: value };
    setFm(nextFm);
    emit(nextFm, body);
  };

  const handleBodyChange = (val: string) => {
    setBody(val);
    emit(fm, val);
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-(--bg-base)">
      {/* Tab content */}
      <div className="flex-1 min-h-0">
        {activeTab === "identity" && (
          <IdentityTab
            fm={fm}
            onFieldChange={handleFieldChange}
            disabled={disabled}
          />
        )}
        {activeTab === "instructions" && (
          <InstructionsTab
            body={body}
            onBodyChange={handleBodyChange}
            previewMode={previewMode}
            disabled={disabled}
            onSetPreviewMode={onSetPreviewMode}
          />
        )}
        {activeTab === "settings" && (
          <SkillSettingsTab
            fm={fm}
            onFieldChange={handleFieldChange}
            onDelete={onDelete ?? (() => {})}
            deleteStatus={deleteStatus}
            disabled={disabled}
          />
        )}
      </div>
    </div>
  );
};

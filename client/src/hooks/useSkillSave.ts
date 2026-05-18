import { useCallback, useEffect, useRef, useState } from "react";
import type { SkillDraft } from "../contexts/SkillDraftContext";
import type { SaveStatus } from "../contexts/SkillDraftContext";
import {
  updateSkillContent,
  updateSkillFile,
  updateSkillScript,
} from "../lib/api";

export function useSkillSave(
  projectPath: string,
  skillName: string,
  draftStore: React.RefObject<Record<string, SkillDraft>>,
) {
  const [dirtyFiles, setDirtyFiles] = useState<Record<string, boolean>>({});
  const anyDirty = Object.values(dirtyFiles).some(Boolean);
  const saveHandlerRefs = useRef<Record<string, () => Promise<void>>>({});
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const headerSaveLabel =
    saveStatus === "saving"
      ? "Saving…"
      : saveStatus === "saved"
        ? "Saved ✓"
        : anyDirty
          ? "Save"
          : "Up to date";
  const headerSaveDisabled = !anyDirty || saveStatus === "saving";

  // Clear stale handlers and dirty state when the skill changes
  useEffect(() => {
    saveHandlerRefs.current = {};
    const timer = setTimeout(() => {
      setDirtyFiles({});
      setSaveStatus("idle");
    }, 0);
    return () => clearTimeout(timer);
  }, [projectPath, skillName]);

  // Cleanup save timer on unmount
  useEffect(
    () => () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    },
    [],
  );

  const reportDirty = useCallback((file: string, isDirty: boolean) => {
    setDirtyFiles((prev) => {
      if (prev[file] === isDirty) return prev;
      return { ...prev, [file]: isDirty };
    });
  }, []);

  const registerSaveHandler = useCallback(
    (file: string, fn: () => Promise<void>) => {
      saveHandlerRefs.current[file] = fn;
    },
    [],
  );

  const unregisterSaveHandler = useCallback((file: string) => {
    delete saveHandlerRefs.current[file];
  }, []);

  const handleGlobalSave = useCallback(async () => {
    if (saveStatus === "saving") return;
    const drafts = draftStore.current;
    const pending = Object.entries(drafts).filter(
      ([, draft]) =>
        draft.initialized &&
        !draft.contentLoading &&
        draft.fileContent !== draft.savedContent,
    );
    if (pending.length === 0) return;
    setSaveStatus("saving");
    try {
      await Promise.all(
        pending.map(([file, draft]) =>
          file === "SKILL.md"
            ? updateSkillContent(projectPath, skillName, draft.fileContent)
            : file.startsWith("scripts/")
              ? updateSkillScript(
                  projectPath,
                  skillName,
                  file.slice(8),
                  draft.fileContent,
                )
              : updateSkillFile(
                  projectPath,
                  skillName,
                  file,
                  draft.fileContent,
                ),
        ),
      );
      pending.forEach(([file, draft]) => {
        drafts[file] = {
          ...draft,
          savedContent: draft.fileContent,
          hasEdits: false,
        };
      });
      setDirtyFiles((prev) => {
        const next = { ...prev };
        pending.forEach(([file]) => {
          next[file] = false;
        });
        return next;
      });
      setSaveStatus("saved");
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => setSaveStatus("idle"), 1500);
    } catch {
      setSaveStatus("error");
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => setSaveStatus("idle"), 2000);
    }
  }, [projectPath, skillName, saveStatus, draftStore]);

  // Cmd+S — global for the whole skill
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        void handleGlobalSave();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [handleGlobalSave]);

  return {
    anyDirty,
    saveStatus,
    reportDirty,
    registerSaveHandler,
    unregisterSaveHandler,
    handleGlobalSave,
    headerSaveLabel,
    headerSaveDisabled,
  };
}

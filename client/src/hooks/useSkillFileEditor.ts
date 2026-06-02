import { useEffect, useRef, useState } from "react";
import type { SkillDraftContextValue, SkillDraft } from "../contexts/SkillDraftContext";

export interface UseSkillFileEditorOpts {
  fileName: string;
  draftStore: SkillDraftContextValue;
  reportDirty: (file: string, isDirty: boolean) => void;
  registerSaveHandler: (file: string, fn: () => Promise<void>) => void;
  fetchFn: () => Promise<string>;
  saveFn: (content: string) => Promise<void>;
  onNotFound?: () => Promise<void>;
  extraDraftFields?: () => Partial<SkillDraft>;
}

export function useSkillFileEditor({
  fileName,
  draftStore,
  reportDirty,
  registerSaveHandler,
  fetchFn,
  saveFn,
  onNotFound,
  extraDraftFields,
}: UseSkillFileEditorOpts) {
  const cachedDraft = draftStore.getDraft(fileName);
  const cachedEdits =
    cachedDraft?.hasEdits ??
    (cachedDraft
      ? cachedDraft.fileContent !== cachedDraft.savedContent
      : false);

  const [fileContent, setFileContent] = useState(cachedDraft?.fileContent ?? "");
  const [savedContent, setSavedContent] = useState(cachedDraft?.savedContent ?? "");
  const [contentLoading, setContentLoading] = useState(cachedDraft?.contentLoading ?? true);
  const [hasEdits, setHasEdits] = useState(cachedEdits);

  const dirty = !contentLoading && hasEdits;

  // Report dirty to SkillLayout
  useEffect(() => {
    reportDirty(fileName, dirty);
  }, [dirty, fileName, reportDirty]);

  // Stable ref pattern: the registered handler is stable (never re-registered),
  // but always delegates to the latest save closure via this ref.
  const saveFnRef = useRef<(() => Promise<void>) | undefined>(undefined);
  useEffect(() => {
    saveFnRef.current = async () => {
      const draft = draftStore.getDraft(fileName);
      const nextContent = draft?.fileContent ?? fileContent;
      const nextSaved = draft?.savedContent ?? savedContent;
      if (nextContent === nextSaved) return;
      await saveFn(nextContent);
      setSavedContent(nextContent);
      setHasEdits(false);
      const cached = draftStore.getDraft(fileName);
      if (cached) {
        draftStore.setDraft(fileName, {
          ...cached,
          savedContent: nextContent,
          hasEdits: false,
        });
      }
      reportDirty(fileName, false);
    };
  }, [fileName, fileContent, savedContent, reportDirty, draftStore, saveFn]);

  useEffect(() => {
    registerSaveHandler(fileName, async () => saveFnRef.current?.());
    // No cleanup — handler must persist across tab switches so SkillLayout
    // can save this file even when this component is unmounted.
  }, [fileName, registerSaveHandler]);

  // Load: check draft cache first, then fetch from API
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const cached = draftStore.getDraft(fileName);
      if (cached?.initialized) {
        setFileContent(cached.fileContent);
        setSavedContent(cached.savedContent);
        setHasEdits(cached.hasEdits ?? cached.fileContent !== cached.savedContent);
        setContentLoading(false);
        return;
      }
      setContentLoading(true);
      setFileContent("");
      setSavedContent("");
      setHasEdits(false);
      let raw = "";
      try {
        raw = await fetchFn();
      } catch {
        if (!cancelled && onNotFound) {
          try {
            await onNotFound();
          } catch {
            /* ignore */
          }
        }
      }
      if (!cancelled) {
        setFileContent(raw);
        setSavedContent(raw);
        setHasEdits(false);
        setContentLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  // fetchFn and onNotFound are intentionally excluded — they're created inline
  // and would cause an infinite loop. The fileName/draftStore identity drives reloads.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileName, draftStore]);

  // Sync state to draft cache on every change
  useEffect(() => {
    draftStore.setDraft(fileName, {
      initialized: !contentLoading,
      fileContent,
      savedContent,
      contentLoading,
      saveStatus: "idle",
      hasEdits,
      ...(extraDraftFields ? extraDraftFields() : {}),
    });
  // extraDraftFields excluded for same reason — it's inline
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftStore, fileName, fileContent, savedContent, contentLoading, hasEdits]);

  const setContent = (next: string) => {
    setHasEdits(next !== savedContent);
    setFileContent(next);
  };

  return {
    fileContent,
    setFileContent: setContent,
    savedContent,
    contentLoading,
    hasEdits,
  };
}

import { useCallback, useEffect, useState } from "react";
import { fetchHooks, updateHooks, type HooksConfig } from "../lib/api";

export type HookTabId = "visual" | "json";

export function useHooksEditor(projectPath: string) {
  const [hooks, setHooks] = useState<HooksConfig>({});
  const [rawJson, setRawJson] = useState("{}");
  const [savedJson, setSavedJson] = useState("{}");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTabState] = useState<HookTabId>("visual");
  const [saving, setSaving] = useState(false);

  const dirty = rawJson !== savedJson;

  useEffect(() => {
    let cancelled = false;
    fetchHooks(projectPath)
      .then((data) => {
        if (cancelled) return;
        const json = JSON.stringify(data, null, 2);
        setHooks(data);
        setRawJson(json);
        setSavedJson(json);
        setLoadError(null);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : "Failed to load hooks");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [projectPath]);

  const setActiveTab = useCallback(
    (tab: HookTabId) => {
      if (activeTab === "visual" && tab === "json") {
        setRawJson(JSON.stringify(hooks, null, 2));
      } else if (activeTab === "json" && tab === "visual") {
        try {
          setHooks(JSON.parse(rawJson) as HooksConfig);
        } catch {
          return; // don't switch if JSON is invalid
        }
      }
      setActiveTabState(tab);
    },
    [activeTab, hooks, rawJson]
  );

  // Force the visual tab (e.g. when navigating into an event). Syncs any
  // pending JSON edits into `hooks` first so the visual view isn't stale.
  const resetToVisual = useCallback(() => {
    setActiveTabState((curr) => {
      if (curr === "json") {
        try {
          setHooks(JSON.parse(rawJson) as HooksConfig);
        } catch {
          /* invalid JSON — keep last good hooks */
        }
      }
      return "visual";
    });
  }, [rawJson]);

  const addHookGroup = useCallback(
    (event: string, group: { matcher: string; hooks: Array<Record<string, unknown>> }) => {
      setHooks((prev) => {
        const entry: Record<string, unknown> = { matcher: group.matcher, hooks: group.hooks };
        const updated = { ...prev, [event]: [...(prev[event] ?? []), entry] };
        setRawJson(JSON.stringify(updated, null, 2));
        return updated;
      });
    },
    []
  );

  const deleteHookGroup = useCallback((event: string, index: number) => {
    setHooks((prev) => {
      const updated = { ...prev };
      updated[event] = (prev[event] ?? []).filter((_, i) => i !== index);
      if (updated[event].length === 0) delete updated[event];
      setRawJson(JSON.stringify(updated, null, 2));
      return updated;
    });
  }, []);

  const editHookGroup = useCallback(
    (event: string, index: number, group: { matcher: string; hooks: Array<Record<string, unknown>> }) => {
      setHooks((prev) => {
        const updated = { ...prev };
        const eventGroups = [...(prev[event] ?? [])];
        const entry: Record<string, unknown> = { matcher: group.matcher, hooks: group.hooks };
        eventGroups[index] = entry;
        updated[event] = eventGroups;
        setRawJson(JSON.stringify(updated, null, 2));
        return updated;
      });
    },
    []
  );

  const handleSave = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    try {
      let data: HooksConfig;
      if (activeTab === "json") {
        data = JSON.parse(rawJson) as HooksConfig;
        setHooks(data);
      } else {
        data = hooks;
      }
      await updateHooks(projectPath, data);
      const json = JSON.stringify(data, null, 2);
      setSavedJson(json);
      setRawJson(json);
    } catch {
      // save failed — leave dirty
    } finally {
      setSaving(false);
    }
  }, [saving, activeTab, rawJson, hooks, projectPath]);

  return {
    hooks,
    rawJson,
    setRawJson,
    loading,
    loadError,
    activeTab,
    setActiveTab,
    resetToVisual,
    dirty,
    saving,
    addHookGroup,
    deleteHookGroup,
    editHookGroup,
    handleSave,
  };
}

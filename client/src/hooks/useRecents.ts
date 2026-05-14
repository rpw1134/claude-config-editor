import { useCallback, useMemo } from 'react';

export type RecentItemType = 'agent' | 'skill' | 'mcp-server';

export interface RecentItem {
  type: RecentItemType;
  name: string;
  timestamp: number;
}

const MAX_RECENTS = 15;

function storageKey(projectPath: string): string {
  return `ccs:recents:${projectPath}`;
}

function readRecents(projectPath: string): RecentItem[] {
  try {
    const raw = localStorage.getItem(storageKey(projectPath));
    if (!raw) return [];
    return JSON.parse(raw) as RecentItem[];
  } catch {
    return [];
  }
}

function writeRecents(projectPath: string, items: RecentItem[]): void {
  try {
    localStorage.setItem(storageKey(projectPath), JSON.stringify(items));
  } catch {
    // localStorage unavailable — ignore
  }
}

export function addRecentItem(projectPath: string, type: RecentItemType, name: string): RecentItem[] {
  const existing = readRecents(projectPath);

  // Remove any existing entry with same type+name, then prepend fresh entry
  const filtered = existing.filter((r) => !(r.type === type && r.name === name));
  const updated = [{ type, name, timestamp: Date.now() }, ...filtered].slice(0, MAX_RECENTS);

  writeRecents(projectPath, updated);
  return updated;
}

export function useRecents(projectPath: string | null): RecentItem[] {
  return useMemo(() => {
    if (!projectPath) return [];
    return readRecents(projectPath);
  // Re-run whenever projectPath changes. Callers that write recents must
  // trigger a re-render at the App level (via a recentsVersion counter).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectPath]);
}

// Export for direct reads without the hook (used in App handlers)
export { readRecents };

export function useAddRecent(projectPath: string | null) {
  return useCallback(
    (type: RecentItemType, name: string): RecentItem[] => {
      if (!projectPath) return [];
      return addRecentItem(projectPath, type, name);
    },
    [projectPath]
  );
}

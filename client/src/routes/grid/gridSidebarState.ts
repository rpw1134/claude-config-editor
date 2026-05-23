export const LS_COLLAPSED = "stryde:grid:sidebarCollapsed";
export const LS_AGENTS_OPEN = "stryde:grid:agentsOpen";
export const LS_SKILLS_OPEN = "stryde:grid:skillsOpen";

export function readBool(key: string, fallback: boolean): boolean {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : v === "true";
  } catch {
    return fallback;
  }
}

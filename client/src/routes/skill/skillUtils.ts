export const SKILL_SECTIONS = new Set(["identity", "instructions", "settings"]);

export const matchSkillRoute = (pathname: string) => {
  const match = pathname.match(/^\/([^/]+)\/skills\/([^/]+)(?:\/|$)/);
  if (!match) return null;
  return { projectId: match[1], skillName: match[2] };
};

export const isSameSkillRoute = (current: string, next: string) => {
  const currentMatch = matchSkillRoute(current);
  const nextMatch = matchSkillRoute(next);
  if (!currentMatch || !nextMatch) return false;
  return (
    currentMatch.projectId === nextMatch.projectId &&
    currentMatch.skillName === nextMatch.skillName
  );
};

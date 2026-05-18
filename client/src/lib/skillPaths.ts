function shortenHome(p: string): string {
  return p.replace(/^(\/Users\/[^/]+|\/home\/[^/]+)/, "~");
}

export function resolvedFilePath(
  projectPath: string,
  skillName: string,
  file: string,
): string {
  const isGlobal = projectPath?.endsWith("/.claude") ?? true;
  const configDir = isGlobal ? "~/.claude" : shortenHome(projectPath) + "/.claude";
  return `${configDir}/skills/${skillName}/${file}`;
}

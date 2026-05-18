export type AuthType = "none" | "bearer" | "api-key";

export function detectAuthType(
  headers: Record<string, string> | undefined,
): AuthType {
  if (!headers) return "none";
  if ("Authorization" in headers) return "bearer";
  if ("x-api-key" in headers) return "api-key";
  return "none";
}

export function extractToken(
  headers: Record<string, string> | undefined,
  authType: AuthType,
): string {
  if (!headers) return "";
  if (authType === "bearer") {
    const val = headers["Authorization"] ?? "";
    return val.startsWith("Bearer ") ? val.slice(7) : val;
  }
  if (authType === "api-key") return headers["x-api-key"] ?? "";
  return "";
}

export function buildStdioJson(
  command: string,
  argsRaw: string,
  envRaw: string,
): string {
  const args = argsRaw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const env = parseEnv(envRaw);
  const obj: Record<string, unknown> = { command: command.trim() };
  if (args.length) obj.args = args;
  if (Object.keys(env).length) obj.env = env;
  return JSON.stringify(obj, null, 2);
}

export function buildHttpJson(
  url: string,
  authType: AuthType,
  token: string,
): string {
  const obj: Record<string, unknown> = { type: "http", url: url.trim() };
  if (authType === "bearer" && token.trim()) {
    obj.headers = { Authorization: `Bearer ${token.trim()}` };
  } else if (authType === "api-key" && token.trim()) {
    obj.headers = { "x-api-key": token.trim() };
  }
  return JSON.stringify(obj, null, 2);
}

export function parseEnv(raw: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)) {
    const eqIdx = line.indexOf("=");
    if (eqIdx === -1) continue;
    const key = line.slice(0, eqIdx).trim();
    const value = line.slice(eqIdx + 1).trim();
    if (key) result[key] = value;
  }
  return result;
}

export function envToRaw(env: Record<string, string>): string {
  return Object.entries(env)
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");
}

export function buildMcpJson(
  serverType: "stdio" | "http",
  command: string,
  argsRaw: string,
  envRaw: string,
  url: string,
  authType: AuthType,
  token: string,
): object {
  if (serverType === "stdio") {
    return JSON.parse(buildStdioJson(command, argsRaw, envRaw)) as object;
  }
  return JSON.parse(buildHttpJson(url, authType, token)) as object;
}

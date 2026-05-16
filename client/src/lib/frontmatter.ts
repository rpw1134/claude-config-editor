import yaml from 'js-yaml';

export interface AgentFrontmatter {
  name?: string;
  description?: string;
  model?: string;
  tools?: string[];
  disallowedTools?: string[];
  permissionMode?: string;
  maxTurns?: number;
  memory?: string;
  background?: boolean;
  effort?: string;
  isolation?: string;
  color?: string;
  initialPrompt?: string;
  mcpServers?: string[];
  [key: string]: unknown;
}

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;

const PRIORITY_KEYS: (keyof AgentFrontmatter)[] = ['name', 'description'];

function isEmpty(value: unknown): boolean {
  if (value === undefined || value === null || value === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
}

export function parseFrontmatter(content: string): { frontmatter: AgentFrontmatter; body: string } {
  const match = FRONTMATTER_RE.exec(content);
  if (!match) {
    return { frontmatter: {}, body: content };
  }

  try {
    const parsed = yaml.load(match[1]);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return { frontmatter: {}, body: content };
    }
    const frontmatter = parsed as AgentFrontmatter;
    const body = content.slice(match[0].length);
    return { frontmatter, body };
  } catch {
    return { frontmatter: {}, body: content };
  }
}

export interface SkillFrontmatter {
  name?: string;
  description?: string;
  when_to_use?: string;
  'argument-hint'?: string;
  'user-invocable'?: boolean;
  'disable-model-invocation'?: boolean;
  'allowed-tools'?: string[];
  model?: string;
  effort?: string;
  context?: string;
  [key: string]: unknown;
}

const SKILL_PRIORITY_KEYS: (keyof SkillFrontmatter)[] = ['name', 'description'];

export function parseSkillFrontmatter(content: string): { frontmatter: SkillFrontmatter; body: string } {
  const match = FRONTMATTER_RE.exec(content);
  if (!match) {
    return { frontmatter: {}, body: content };
  }
  try {
    const parsed = yaml.load(match[1]);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return { frontmatter: {}, body: content };
    }
    const frontmatter = parsed as SkillFrontmatter;
    const body = content.slice(match[0].length);
    return { frontmatter, body };
  } catch {
    return { frontmatter: {}, body: content };
  }
}

export function serializeSkillFrontmatter(frontmatter: SkillFrontmatter, body: string): string {
  const filtered: Record<string, unknown> = {};

  for (const key of SKILL_PRIORITY_KEYS) {
    const value = frontmatter[key];
    if (!isEmpty(value)) {
      filtered[key] = value;
    }
  }

  const remaining = Object.keys(frontmatter)
    .filter((k) => !SKILL_PRIORITY_KEYS.includes(k as keyof SkillFrontmatter))
    .sort();

  for (const key of remaining) {
    const value = frontmatter[key];
    if (!isEmpty(value)) {
      filtered[key] = value;
    }
  }

  if (Object.keys(filtered).length === 0) {
    return body;
  }

  const yamlStr = yaml.dump(filtered, { lineWidth: -1, quotingType: '"', forceQuotes: false });
  const separator = body.startsWith('\n') ? '' : '\n';
  return `---\n${yamlStr}---\n${separator}${body}`;
}

export function serializeFrontmatter(frontmatter: AgentFrontmatter, body: string): string {
  const filtered: Record<string, unknown> = {};

  for (const key of PRIORITY_KEYS) {
    const value = frontmatter[key];
    if (!isEmpty(value)) {
      filtered[key] = value;
    }
  }

  const remaining = Object.keys(frontmatter)
    .filter((k) => !PRIORITY_KEYS.includes(k as keyof AgentFrontmatter))
    .sort();

  for (const key of remaining) {
    const value = frontmatter[key];
    if (!isEmpty(value)) {
      filtered[key] = value;
    }
  }

  if (Object.keys(filtered).length === 0) {
    return body;
  }

  const yamlStr = yaml.dump(filtered, { lineWidth: -1, quotingType: '"', forceQuotes: false });
  const separator = body.startsWith('\n') ? '' : '\n';
  return `---\n${yamlStr}---\n${separator}${body}`;
}

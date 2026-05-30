export interface ToolCall {
  tool: string;
  args: object;
  result?: string;
  textPosition?: number;
}

export interface DraftedArtifactRef {
  name: string;
  type: string;
  isEdit: boolean;
  textPosition: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: ToolCall[];
  isStreaming?: boolean;
  draftedArtifacts?: DraftedArtifactRef[];
}

export interface Artifact {
  id: string;
  type: 'agent' | 'skill' | 'claude-md' | 'link' | 'mcp' | 'hook';
  name: string;
  content: string;
  saved: boolean;
}

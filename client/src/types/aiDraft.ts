export interface ToolCall {
  tool: string;
  args: object;
  result?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: ToolCall[];
  isStreaming?: boolean;
}

export interface Artifact {
  id: string;
  type: 'agent' | 'skill' | 'claude-md';
  name: string;
  content: string;
  saved: boolean;
  discarded: boolean;
}

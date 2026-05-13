import { SectionHeader } from '../SectionHeader';

type ServerStatus = 'online' | 'offline' | 'error';
type TransportType = 'stdio' | 'sse' | 'http';

interface McpServer {
  id: string;
  name: string;
  command: string;
  transport: TransportType;
  status: ServerStatus;
  description: string;
  lastSeen: string;
}

const MOCK_SERVERS: McpServer[] = [
  {
    id: '1',
    name: 'claude-ai-Gmail',
    command: 'npx @anthropic-ai/mcp-server-gmail',
    transport: 'stdio',
    status: 'online',
    description: 'Read, search, and send Gmail messages. OAuth2 authenticated.',
    lastSeen: 'now',
  },
  {
    id: '2',
    name: 'claude-ai-Google_Drive',
    command: 'npx @anthropic-ai/mcp-server-gdrive',
    transport: 'stdio',
    status: 'online',
    description: 'Browse, read, and create files in Google Drive.',
    lastSeen: 'now',
  },
  {
    id: '3',
    name: 'filesystem',
    command: 'npx @modelcontextprotocol/server-filesystem /Users/ryanwilliams',
    transport: 'stdio',
    status: 'offline',
    description: 'Local filesystem access scoped to home directory.',
    lastSeen: '14 min ago',
  },
  {
    id: '4',
    name: 'github',
    command: 'npx @modelcontextprotocol/server-github',
    transport: 'stdio',
    status: 'error',
    description: 'GitHub API access — repos, issues, PRs, and code search.',
    lastSeen: '2 hours ago',
  },
];

const STATUS_CONFIG: Record<ServerStatus, { dot: string; label: string; labelColor: string }> = {
  online: {
    dot: 'bg-emerald-400',
    label: 'Online',
    labelColor: 'text-emerald-400',
  },
  offline: {
    dot: 'bg-zinc-500',
    label: 'Offline',
    labelColor: 'text-zinc-500',
  },
  error: {
    dot: 'bg-rose-400',
    label: 'Error',
    labelColor: 'text-rose-400',
  },
};

const TRANSPORT_STYLES: Record<TransportType, { bg: string; text: string; border: string }> = {
  stdio: {
    bg: 'bg-zinc-500/10',
    text: 'text-zinc-400',
    border: 'border-zinc-500/20',
  },
  sse: {
    bg: 'bg-sky-500/10',
    text: 'text-sky-400',
    border: 'border-sky-500/20',
  },
  http: {
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-400',
    border: 'border-indigo-500/20',
  },
};

interface McpServerRowProps {
  server: McpServer;
}

const McpServerRow = ({ server }: McpServerRowProps) => {
  const statusCfg = STATUS_CONFIG[server.status];
  const transportStyle = TRANSPORT_STYLES[server.transport];

  return (
    <div className="group px-4 py-3 rounded-md bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.09] transition-all duration-150">
      <div className="flex items-start gap-3">
        {/* Status dot with pulse for online */}
        <div className="mt-1.5 flex-shrink-0 relative">
          <div className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
          {server.status === 'online' && (
            <div
              className={`absolute inset-0 rounded-full ${statusCfg.dot} opacity-40`}
              style={{ animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite' }}
            />
          )}
        </div>

        <div className="min-w-0 flex-1">
          {/* Name row */}
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="text-[13px] font-semibold text-white/80 group-hover:text-white/90 transition-colors font-mono">
              {server.name}
            </span>
            <span
              className={[
                'inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider border',
                transportStyle.bg,
                transportStyle.text,
                transportStyle.border,
              ].join(' ')}
            >
              {server.transport}
            </span>
            <span className={`text-[11px] font-medium ${statusCfg.labelColor}`}>
              {statusCfg.label}
            </span>
          </div>

          {/* Description */}
          <p className="text-[12px] text-white/35 mb-2">{server.description}</p>

          {/* Command */}
          <p className="font-mono text-[11px] text-white/20 truncate">{server.command}</p>
        </div>

        {/* Last seen */}
        <div className="shrink-0 text-right">
          <span className="text-[11px] text-white/20 font-mono">{server.lastSeen}</span>
        </div>
      </div>
    </div>
  );
};

export const McpServersSection = () => {
  const onlineCount = MOCK_SERVERS.filter((s) => s.status === 'online').length;

  return (
    <div>
      <SectionHeader
        title="MCP Servers"
        description="Model Context Protocol servers configured in settings.json. Each server extends Claude's tool capabilities."
        actionLabel="Add Server"
        count={MOCK_SERVERS.length}
      />

      {/* Summary strip */}
      <div className="flex items-center gap-4 mb-4 px-1">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-[11px] text-white/30">
            {onlineCount} online
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
          <span className="text-[11px] text-white/30">
            {MOCK_SERVERS.filter((s) => s.status === 'offline').length} offline
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
          <span className="text-[11px] text-white/30">
            {MOCK_SERVERS.filter((s) => s.status === 'error').length} error
          </span>
        </div>
      </div>

      <div className="space-y-1.5">
        {MOCK_SERVERS.map((server) => (
          <McpServerRow key={server.id} server={server} />
        ))}
      </div>

      <p className="mt-4 px-1 text-[11px] text-white/20 font-mono">
        Source: ~/.claude/settings.json → mcpServers
      </p>
    </div>
  );
};

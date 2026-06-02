export interface McpServerTemplate {
  name: string;
  description: string;
  definition: Record<string, unknown>;
}

const REGISTRY: McpServerTemplate[] = [
  {
    name: "github-remote",
    description: "Remote GitHub Copilot MCP for managing repos, issues, pull requests, and workflows directly via HTTP.",
    definition: {
      type: "http",
      url: "https://api.githubcopilot.com/mcp/",
      headers: { Authorization: "Bearer ${GITHUB_TOKEN}" },
    },
  },
  {
    name: "postman",
    description: "Postman HTTP MCP to discover, execute, and test REST API requests and collections.",
    definition: {
      type: "http",
      url: "https://mcp.postman.com/minimal",
      headers: { "X-Api-Key": "${POSTMAN_API_KEY}" },
    },
  },
  {
    name: "notion",
    description: "Notion HTTP server to index, write, search, and organize engineering documentation and wikis.",
    definition: {
      type: "http",
      url: "https://mcp.notion.com/mcp",
      headers: { Authorization: "Bearer ${NOTION_INTEGRATION_TOKEN}" },
    },
  },
  {
    name: "asana",
    description: "Asana SSE server for tracking developer tasks, sprints, and ticket updates.",
    definition: {
      type: "sse",
      url: "https://mcp.asana.com/sse",
      headers: { Authorization: "Bearer ${ASANA_PAT}" },
    },
  },
  {
    name: "openapi-proxy",
    description: "Universal OpenAPI proxy that dynamically transforms standard Swagger/OpenAPI schemas into executable LLM tools.",
    definition: {
      command: "npx",
      args: ["-y", "openapi-mcp-server"],
      env: {
        OPENAPI_SPEC_URL: "https://api.example.com/openapi.json",
        OPENAPI_MCP_HEADERS: '{"Authorization": "Bearer ${YOUR_API_TOKEN}"}',
      },
    },
  },
  {
    name: "sqlite",
    description: "Local SQLite database manager for inspecting, creating schemas, and running test queries against application DB files.",
    definition: {
      command: "uvx",
      args: ["mcp-server-sqlite", "--db-path", "${PROJECT_ROOT}/database.db"],
    },
  },
  {
    name: "postgres",
    description: "PostgreSQL database connector allowing real-time schema discovery and querying.",
    definition: {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-postgres"],
      env: {
        PG_CONNECTION_STRING:
          "postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}",
      },
    },
  },
  {
    name: "filesystem",
    description: "Secure file architecture bridge for reading, writing, searching, and managing code within specified directories.",
    definition: {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-filesystem", "${ALLOWED_WORKSPACE_PATH}"],
    },
  },
  {
    name: "brave-search",
    description: "Brave API server to search the web for documentation, stack overflow threads, and open-source updates.",
    definition: {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-brave-search"],
      env: { BRAVE_API_KEY: "${BRAVE_API_KEY}" },
    },
  },
  {
    name: "fetch",
    description: "Web scraping tool optimized for downloading and parsing pure web content or raw documentation strings into markdown.",
    definition: {
      command: "uvx",
      args: ["mcp-server-fetch"],
    },
  },
  {
    name: "jira",
    description: "Atlassian Jira project management integration for creating, transitioning, and querying software bug cards.",
    definition: {
      command: "npx",
      args: ["-y", "openapi-mcp-server@1.1.0", "/path/to/openapi-specs/jira-openapi.json"],
      env: {
        JIRA_HOST: "${YOUR_WORKSPACE}.atlassian.net",
        JIRA_EMAIL: "${YOUR_EMAIL}",
        JIRA_API_TOKEN: "${JIRA_TOKEN}",
      },
    },
  },
  {
    name: "docker",
    description: "Docker container orchestrator to monitor container lifecycles, read logs, and inspect local development images.",
    definition: {
      command: "npx",
      args: ["-y", "mcp-server-docker"],
      env: { DOCKER_HOST: "unix:///var/run/docker.sock" },
    },
  },
  {
    name: "kubernetes",
    description: "Kubernetes cluster agent allowing direct inspection of pods, services, deployment logs, and cluster events.",
    definition: {
      command: "uvx",
      args: ["mcp-server-kubernetes"],
      env: { KUBECONFIG: "${HOME}/.kube/config" },
    },
  },
  {
    name: "aws",
    description: "AWS cloud controller providing discovery and actions across EC2, S3, Lambda, and CloudWatch metrics.",
    definition: {
      command: "npx",
      args: ["-y", "mcp-server-aws"],
      env: {
        AWS_ACCESS_KEY_ID: "${AWS_ACCESS_KEY_ID}",
        AWS_SECRET_ACCESS_KEY: "${AWS_SECRET_ACCESS_KEY}",
        AWS_DEFAULT_REGION: "us-east-1",
      },
    },
  },
  {
    name: "supabase",
    description: "Supabase project assistant to administer edge functions, database parameters, and auth policies.",
    definition: {
      command: "npx",
      args: ["-y", "mcp-supabase"],
      env: {
        SUPABASE_URL: "https://${PROJECT_ID}.supabase.co",
        SUPABASE_ANON_KEY: "${SUPABASE_ANON_KEY}",
        SUPABASE_SERVICE_ROLE_KEY: "${SUPABASE_SERVICE_ROLE_KEY}",
      },
    },
  },
  {
    name: "figma",
    description: "Figma design system connector to pull tokens, inspect component tree hierarchies, and query asset styles.",
    definition: {
      command: "npx",
      args: ["-y", "figma-mcp-server"],
      env: { FIGMA_ACCESS_TOKEN: "${FIGMA_TOKEN}" },
    },
  },
  {
    name: "slack",
    description: "Slack operations monitor for reading developer channel feeds and generating alert pings or status threads.",
    definition: {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-slack"],
      env: {
        SLACK_BOT_TOKEN: "${SLACK_BOT_TOKEN}",
        SLACK_TEAM_ID: "${SLACK_TEAM_ID}",
      },
    },
  },
  {
    name: "discord",
    description: "Discord channel tool allowing bots/assistants to parse developer community support threads.",
    definition: {
      command: "uvx",
      args: ["discord-mcp"],
      env: { DISCORD_BOT_TOKEN: "${DISCORD_BOT_TOKEN}" },
    },
  },
  {
    name: "linear",
    description: "High-performance ticketing tool integration for issue tracking, cycle management, and backlog items in Linear.",
    definition: {
      command: "npx",
      args: ["-y", "linear-mcp-server"],
      env: { LINEAR_API_KEY: "${LINEAR_API_KEY}" },
    },
  },
  {
    name: "redis",
    description: "Cache database pipeline for checking key-value entries, debugging TTL states, and purging cached objects.",
    definition: {
      command: "uvx",
      args: ["mcp-server-redis"],
      env: { REDIS_URL: "redis://127.0.0.1:6379/0" },
    },
  },
  {
    name: "sentry",
    description: "Application crash reporter to capture real-time application exceptions, issue traces, and production debugging events.",
    definition: {
      command: "npx",
      args: ["-y", "mcp-server-sentry"],
      env: {
        SENTRY_AUTH_TOKEN: "${SENTRY_AUTH_TOKEN}",
        SENTRY_ORG: "${SENTRY_ORGANIZATION_SLUG}",
      },
    },
  },
  {
    name: "datadog",
    description: "Datadog monitoring metrics explorer for querying system traces, logs, and APM dashboard telemetry.",
    definition: {
      command: "uvx",
      args: ["mcp-server-datadog"],
      env: {
        DATADOG_API_KEY: "${DD_API_KEY}",
        DATADOG_APP_KEY: "${DD_APP_KEY}",
        DATADOG_SITE: "datadoghq.com",
      },
    },
  },
  {
    name: "cloudflare",
    description: "Cloudflare Network controller for managing DNS records, updating cache rules, or checking Cloudflare Workers settings.",
    definition: {
      command: "npx",
      args: ["-y", "mcp-server-cloudflare"],
      env: {
        CLOUDFLARE_API_TOKEN: "${CF_API_TOKEN}",
        CLOUDFLARE_ACCOUNT_ID: "${CF_ACCOUNT_ID}",
      },
    },
  },
  {
    name: "git",
    description: "Local version control utility for examining git statuses, stage diffs, and automating atomic commits.",
    definition: {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-git"],
      env: { GIT_EXTENDED_DIFF_CONTEXT: "true" },
    },
  },
  {
    name: "python-executor",
    description: "Isolated Conda/Python processing sandbox for executing micro-computations, data analytics, or chart renders.",
    definition: {
      command: "uvx",
      args: ["mcp-server-code-executor"],
      env: { CONDA_ENV_NAME: "mcp-sandbox" },
    },
  },
];

export function listMcpRegistryNames(): { name: string; description: string }[] {
  return REGISTRY.map(({ name, description }) => ({ name, description }));
}

export function getMcpRegistryServer(name: string): McpServerTemplate | undefined {
  return REGISTRY.find((s) => s.name === name);
}

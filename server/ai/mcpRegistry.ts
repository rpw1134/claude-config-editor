export interface McpServerTemplate {
  name: string;
  description: string;
  category: string;
  definition: Record<string, unknown>;
  notes?: string;
}

const REGISTRY: McpServerTemplate[] = [
  {
    name: "github",
    description: "Official GitHub MCP server. Manage repos, issues, PRs, Actions workflows, and code search. Maintained by GitHub.",
    category: "code-hosting",
    definition: {
      type: "http",
      url: "https://api.githubcopilot.com/mcp/",
      headers: { Authorization: "Bearer ${GITHUB_TOKEN}" },
    },
    notes: "Remote server hosted by GitHub. Requires a GitHub PAT or OAuth token. The old @modelcontextprotocol/server-github npm package is deprecated (April 2025); use this remote endpoint instead.",
  },
  {
    name: "github-local",
    description: "Official GitHub MCP server — local Docker variant for air-gapped or offline environments.",
    category: "code-hosting",
    definition: {
      command: "docker",
      args: ["run", "-i", "--rm", "-e", "GITHUB_PERSONAL_ACCESS_TOKEN", "ghcr.io/github/github-mcp-server"],
      env: { GITHUB_PERSONAL_ACCESS_TOKEN: "${GITHUB_TOKEN}" },
    },
    notes: "Use when the remote endpoint is not accessible. Same capability set. Image maintained by GitHub.",
  },
  {
    name: "playwright",
    description: "Microsoft's official Playwright MCP server. Full browser automation using accessibility snapshots — no vision model needed. Cross-browser (Chromium, Firefox, WebKit).",
    category: "browser",
    definition: {
      command: "npx",
      args: ["-y", "@playwright/mcp@latest"],
    },
    notes: "Maintained by Microsoft. No API key required. Requires Node.js 18+. Add --isolated flag for test isolation, or --browser firefox to change browser.",
  },
  {
    name: "fetch",
    description: "Official Anthropic fetch server. Retrieves web pages and converts them to clean markdown for LLM consumption.",
    category: "search",
    definition: {
      command: "uvx",
      args: ["mcp-server-fetch"],
    },
    notes: "Actively maintained by Anthropic. No credentials needed. Requires uv/uvx.",
  },
  {
    name: "filesystem",
    description: "Official Anthropic filesystem server. Secure file read/write/search within explicitly allowed directories.",
    category: "infra",
    definition: {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-filesystem", "${ALLOWED_WORKSPACE_PATH}"],
    },
    notes: "Actively maintained by Anthropic. Pass one or more allowed paths as additional args. No credentials needed.",
  },
  {
    name: "git",
    description: "Official Anthropic Git server. Read, search, and manipulate local Git repositories: log, diff, blame, status, commit.",
    category: "code-hosting",
    definition: {
      command: "uvx",
      args: ["mcp-server-git", "--repository", "${GIT_REPO_PATH}"],
    },
    notes: "Actively maintained by Anthropic. Requires uv/uvx. Replace ${GIT_REPO_PATH} with the path to a local repo. Operates on a single repo per server instance.",
  },
  {
    name: "memory",
    description: "Official Anthropic knowledge-graph memory server. Persists entities and relationships across Claude sessions.",
    category: "productivity",
    definition: {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-memory"],
      env: { MEMORY_FILE_PATH: "${HOME}/.claude-memory/memory.json" },
    },
    notes: "Actively maintained by Anthropic. MEMORY_FILE_PATH is optional but strongly recommended to persist data outside the npx cache. Without it, memory is lost on package updates.",
  },
  {
    name: "brave-search",
    description: "Official Brave Search MCP server. Web and local search via Brave's independent index. Maintained directly by Brave Software.",
    category: "search",
    definition: {
      command: "npx",
      args: ["-y", "@brave/brave-search-mcp-server"],
      env: { BRAVE_API_KEY: "${BRAVE_API_KEY}" },
    },
    notes: "The old @modelcontextprotocol/server-brave-search package is archived. This is the official Brave-maintained replacement with more tools (web, image, news, video, local).",
  },
  {
    name: "tavily",
    description: "Official Tavily MCP server. AI-native web search and content extraction with deep research capabilities.",
    category: "search",
    definition: {
      command: "npx",
      args: ["-y", "tavily-mcp@latest"],
      env: { TAVILY_API_KEY: "${TAVILY_API_KEY}" },
    },
    notes: "Alternatively, use the remote endpoint: https://mcp.tavily.com/mcp/?tavilyApiKey=<key>. API key from app.tavily.com. Free tier available.",
  },
  {
    name: "firecrawl",
    description: "Official Firecrawl MCP server. Web scraping, crawling, and search that returns clean, structured markdown.",
    category: "search",
    definition: {
      command: "npx",
      args: ["-y", "firecrawl-mcp"],
      env: { FIRECRAWL_API_KEY: "${FIRECRAWL_API_KEY}" },
    },
    notes: "API key from firecrawl.dev (free tier available). Supports scrape, crawl, search, batch-scrape, and deep-research tools.",
  },
  {
    name: "stripe",
    description: "Official Stripe MCP server. Customer management, payments, subscriptions, and financial operations via the Stripe API.",
    category: "payments",
    definition: {
      command: "npx",
      args: ["-y", "@stripe/mcp", "--tools=all", "--api-key=${STRIPE_SECRET_KEY}"],
    },
    notes: "Use a Restricted API Key (RAK) scoped to only the permissions you need. Create one at dashboard.stripe.com/apikeys. Remote endpoint also available at mcp.stripe.com.",
  },
  {
    name: "notion",
    description: "Official Notion remote MCP server. Search, read, and write Notion pages and databases.",
    category: "productivity",
    definition: {
      type: "http",
      url: "https://mcp.notion.com/mcp",
    },
    notes: "OAuth authentication is triggered automatically on first connect — no bearer token needed in config.",
  },
  {
    name: "postman",
    description: "Official Postman remote MCP server. Discover and execute REST API requests, manage collections and environments.",
    category: "productivity",
    definition: {
      type: "http",
      url: "https://mcp.postman.com/mcp",
    },
    notes: "OAuth authentication handled automatically by client. EU users: https://mcp.eu.postman.com/mcp.",
  },
  {
    name: "asana",
    description: "Official Asana V2 MCP server. Create, update, and search tasks, projects, and workspaces via the Asana Work Graph.",
    category: "productivity",
    definition: {
      type: "http",
      url: "https://mcp.asana.com/v2/mcp",
    },
    notes: "V1 SSE endpoint (mcp.asana.com/sse) was shut down May 2026. V2 requires pre-registered OAuth credentials.",
  },
  {
    name: "linear",
    description: "Linear MCP server. Issue tracking, cycle management, and backlog operations in Linear.",
    category: "productivity",
    definition: {
      command: "npx",
      args: ["-y", "linear-mcp-server"],
      env: { LINEAR_API_KEY: "${LINEAR_API_KEY}" },
    },
    notes: "API key from linear.app/settings/api.",
  },
  {
    name: "sentry",
    description: "Official Sentry MCP server. Capture exceptions, inspect issue traces, and query production debugging events.",
    category: "monitoring",
    definition: {
      command: "npx",
      args: ["@sentry/mcp-server"],
      env: { SENTRY_ACCESS_TOKEN: "${SENTRY_ACCESS_TOKEN}" },
    },
    notes: "Env var is SENTRY_ACCESS_TOKEN (not SENTRY_AUTH_TOKEN). Remote endpoint also available at mcp.sentry.dev.",
  },
  {
    name: "datadog",
    description: "Datadog MCP server. Query metrics, logs, traces, and APM dashboard telemetry.",
    category: "monitoring",
    definition: {
      command: "uvx",
      args: ["mcp-server-datadog"],
      env: {
        DATADOG_API_KEY: "${DD_API_KEY}",
        DATADOG_APP_KEY: "${DD_APP_KEY}",
        DATADOG_SITE: "datadoghq.com",
      },
    },
    notes: "Requires uv/uvx. Change DATADOG_SITE to datadoghq.eu for EU region.",
  },
  {
    name: "slack",
    description: "Slack MCP server. Read channels, post messages, reply to threads, add reactions, and list users.",
    category: "comms",
    definition: {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-slack"],
      env: {
        SLACK_BOT_TOKEN: "${SLACK_BOT_TOKEN}",
        SLACK_TEAM_ID: "${SLACK_TEAM_ID}",
      },
    },
    notes: "SLACK_BOT_TOKEN must start with xoxb-. SLACK_TEAM_ID starts with T.",
  },
  {
    name: "discord",
    description: "Discord MCP server. Parse developer community support threads and channel messages.",
    category: "comms",
    definition: {
      command: "uvx",
      args: ["discord-mcp"],
      env: { DISCORD_BOT_TOKEN: "${DISCORD_BOT_TOKEN}" },
    },
    notes: "Requires uv/uvx. Create a bot at discord.com/developers and enable the Message Content privileged intent.",
  },
  {
    name: "figma",
    description: "Figma MCP server (Framelink). Pull design tokens, component hierarchy, and asset styles from Figma files.",
    category: "design",
    definition: {
      command: "npx",
      args: ["-y", "figma-developer-mcp", "--stdio"],
      env: { FIGMA_API_KEY: "${FIGMA_API_KEY}" },
    },
    notes: "Package is 'figma-developer-mcp'. Env var is FIGMA_API_KEY. The --stdio flag is required. Generate token at figma.com > Account Settings > Personal Access Tokens.",
  },
  {
    name: "sqlite",
    description: "Official Anthropic SQLite server. Inspect schemas, run queries, and manage SQLite database files.",
    category: "data",
    definition: {
      command: "uvx",
      args: ["mcp-server-sqlite", "--db-path", "${PROJECT_ROOT}/database.db"],
    },
    notes: "Actively maintained by Anthropic. Requires uv/uvx.",
  },
  {
    name: "postgres",
    description: "PostgreSQL MCP server. Read-only schema discovery and query execution against a PostgreSQL database.",
    category: "data",
    definition: {
      command: "npx",
      args: [
        "-y",
        "@modelcontextprotocol/server-postgres",
        "postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}",
      ],
    },
    notes: "Connection string is passed as a CLI argument — there is no PG_CONNECTION_STRING env var.",
  },
  {
    name: "redis",
    description: "Redis MCP server. Inspect key-value entries, debug TTL states, and purge cached objects.",
    category: "data",
    definition: {
      command: "uvx",
      args: ["mcp-server-redis"],
      env: { REDIS_URL: "redis://127.0.0.1:6379/0" },
    },
    notes: "Requires uv/uvx. Update REDIS_URL for remote Redis instances.",
  },
  {
    name: "openapi-proxy",
    description: "Universal OpenAPI proxy. Dynamically transforms any Swagger/OpenAPI spec into executable LLM tools.",
    category: "infra",
    definition: {
      command: "npx",
      args: ["-y", "openapi-mcp-server"],
      env: {
        OPENAPI_SPEC_URL: "https://api.example.com/openapi.json",
        OPENAPI_MCP_HEADERS: "{\"Authorization\": \"Bearer ${YOUR_API_TOKEN}\"}",
      },
    },
    notes: "Replace OPENAPI_SPEC_URL with your API's OpenAPI/Swagger schema URL.",
  },
  {
    name: "kubernetes",
    description: "Kubernetes MCP server. Inspect pods, services, deployments, logs, and cluster events.",
    category: "infra",
    definition: {
      command: "uvx",
      args: ["mcp-server-kubernetes"],
      env: { KUBECONFIG: "${HOME}/.kube/config" },
    },
    notes: "Requires uv/uvx. Set KUBECONFIG to a specific context file if managing multiple clusters.",
  },
  {
    name: "docker",
    description: "Docker MCP server. Monitor container lifecycles, read logs, and inspect local images.",
    category: "infra",
    definition: {
      command: "uvx",
      args: ["mcp-server-docker"],
      env: { DOCKER_HOST: "unix:///var/run/docker.sock" },
    },
    notes: "Runtime is uvx (Python package), NOT npx. For remote Docker over SSH, set DOCKER_HOST to ssh://user@host.",
  },
  {
    name: "aws",
    description: "AWS MCP server. Discovery and actions across EC2, S3, Lambda, and CloudWatch metrics.",
    category: "infra",
    definition: {
      command: "npx",
      args: ["-y", "mcp-server-aws"],
      env: {
        AWS_ACCESS_KEY_ID: "${AWS_ACCESS_KEY_ID}",
        AWS_SECRET_ACCESS_KEY: "${AWS_SECRET_ACCESS_KEY}",
        AWS_DEFAULT_REGION: "us-east-1",
      },
    },
    notes: "Prefer IAM roles or AWS SSO over long-lived access keys in production.",
  },
  {
    name: "supabase",
    description: "Supabase MCP server. Administer edge functions, database parameters, and auth policies.",
    category: "data",
    definition: {
      command: "npx",
      args: ["-y", "mcp-supabase"],
      env: {
        SUPABASE_URL: "https://${PROJECT_ID}.supabase.co",
        SUPABASE_ANON_KEY: "${SUPABASE_ANON_KEY}",
        SUPABASE_SERVICE_ROLE_KEY: "${SUPABASE_SERVICE_ROLE_KEY}",
      },
    },
    notes: "SERVICE_ROLE_KEY gives full admin access — use ANON_KEY for read-only operations with RLS enforced.",
  },
  {
    name: "cloudflare",
    description: "Cloudflare MCP server. Manage DNS records, cache rules, and Workers settings.",
    category: "infra",
    definition: {
      command: "npx",
      args: ["-y", "mcp-server-cloudflare"],
      env: {
        CLOUDFLARE_API_TOKEN: "${CF_API_TOKEN}",
        CLOUDFLARE_ACCOUNT_ID: "${CF_ACCOUNT_ID}",
      },
    },
    notes: "Create a scoped API token at dash.cloudflare.com/profile/api-tokens.",
  },
  {
    name: "google-maps",
    description: "Google Maps MCP server. Geocoding, places search, directions, and geospatial operations.",
    category: "productivity",
    definition: {
      command: "npx",
      args: ["-y", "@cablate/mcp-google-map", "--stdio"],
      env: { GOOGLE_MAPS_API_KEY: "${GOOGLE_MAPS_API_KEY}" },
    },
    notes: "API key from Google Cloud Console; enable Places API (New) and Routes API. The old @modelcontextprotocol/server-google-maps package is archived.",
  },
  {
    name: "vercel",
    description: "Official Vercel remote MCP server. Manage deployments, projects, domains, and query Vercel documentation.",
    category: "infra",
    definition: {
      type: "http",
      url: "https://mcp.vercel.com",
    },
    notes: "OAuth authentication is handled automatically. Only approved MCP clients can connect.",
  },
  {
    name: "python-executor",
    description: "Python code execution sandbox. Run micro-computations, data analytics, and chart rendering in an isolated Conda environment.",
    category: "infra",
    definition: {
      command: "uvx",
      args: ["mcp-server-code-executor"],
      env: { CONDA_ENV_NAME: "mcp-sandbox" },
    },
    notes: "Requires uv/uvx and a Conda installation with a pre-created environment matching CONDA_ENV_NAME.",
  },
  {
    name: "sequential-thinking",
    description: "Official Anthropic sequential-thinking server. Encourages step-by-step reasoning, branching, and self-correction for complex problem solving.",
    category: "productivity",
    definition: {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-sequential-thinking"],
    },
    notes: "Actively maintained by Anthropic. No credentials required. Pairs well with filesystem and GitHub for research-heavy tasks.",
  },
  {
    name: "jira",
    description: "Jira MCP server via OpenAPI proxy. Create, transition, and query Jira issues using your workspace's OpenAPI spec.",
    category: "productivity",
    definition: {
      command: "npx",
      args: ["-y", "openapi-mcp-server@1.1.0", "${JIRA_OPENAPI_SPEC_PATH}"],
      env: {
        JIRA_HOST: "${YOUR_WORKSPACE}.atlassian.net",
        JIRA_EMAIL: "${YOUR_EMAIL}",
        JIRA_API_TOKEN: "${JIRA_API_TOKEN}",
      },
    },
    notes: "JIRA_OPENAPI_SPEC_PATH must point to a local copy of the Jira REST API OpenAPI spec (download from developer.atlassian.com).",
  },
];

export function listMcpRegistryNames(): { name: string; description: string; category: string }[] {
  return REGISTRY.map(({ name, description, category }) => ({ name, description, category }));
}

export function getMcpRegistryServer(name: string): McpServerTemplate | undefined {
  return REGISTRY.find((s) => s.name === name);
}

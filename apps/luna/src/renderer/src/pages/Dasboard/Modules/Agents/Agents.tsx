import React, { useState } from 'react'
import { AgentCard, AgentTool } from './Components/AgentCard'

export const Agents: React.FC = () => {
  const [tools, setTools] = useState<AgentTool[]>([
    {
      id: 'notion',
      name: 'Notion Workspace Connector',
      provider: 'Notion MCP Server',
      description:
        'Allows Luna to read, search, update, create, and append blocks/pages inside your personal databases and Notion documentation spaces.',
      permissionsCount: 22,
      enabled: true,
      mcpId: 'notion-mcp-server'
    },
    {
      id: 'github',
      name: 'GitHub Agent Suite',
      provider: 'GitHub Developer API',
      description:
        'Gives the assistant permission to track issues, view pull request telemetry, search commits, and submit file edits natively to repositories.',
      permissionsCount: 15,
      enabled: true
    },
    {
      id: 'neon',
      name: 'Neon Database Serverless',
      provider: 'Neon MCP Server',
      description:
        'Enables real-time serverless Postgres schema comparisons, slow query analyses, SQL sandboxing, and schema fetches.',
      permissionsCount: 12,
      enabled: false,
      mcpId: 'mcp-server-neon'
    },
    {
      id: 'files',
      name: 'Local System Organizer',
      provider: 'Operating System Node',
      description:
        'Intelligent background file sorter and search pipeline. Accesses Downloads, Documents, and desktop folders safely with authorization.',
      permissionsCount: 8,
      enabled: true
    },
    {
      id: 'mochi',
      name: 'Mochi Telemetry Monitor',
      provider: 'Mochi Client MCP',
      description:
        'Monitors running offline agent background script status, logs performance metrics, and triggers alerts for active server issues.',
      permissionsCount: 1,
      enabled: false,
      mcpId: 'mochi'
    },
    {
      id: 'spotify',
      name: 'Spotify Controller',
      provider: 'Spotify System Integration',
      description:
        'Grants control over background audio music players. Play, pause, skip, and retrieve currently playing soundtrack details.',
      permissionsCount: 4,
      enabled: false
    }
  ])

  const handleToggle = (id: string) => {
    setTools((prev) =>
      prev.map((tool) => (tool.id === id ? { ...tool, enabled: !tool.enabled } : tool))
    )
  }

  return (
    <div className="flex-1 flex flex-col p-8 sm:p-10 md:p-12 overflow-y-auto bg-background text-foreground transition-colors duration-300 relative">
      {/* Background Glow */}
      <img
        src="/bg.png"
        alt="Glow Horizon"
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-5xl pointer-events-none select-none z-0 opacity-15 dark:opacity-30"
      />

      <div className="w-full z-10 space-y-4 animate-[fadeIn_0.3s_ease-out]">
        {/* Header Section */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              AI Agents & Desktop Automations
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Securely connect and authorize background task workers and system integrations.
            </p>
          </div>
        </header>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool) => (
            <AgentCard key={tool.id} tool={tool} onToggle={handleToggle} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default Agents

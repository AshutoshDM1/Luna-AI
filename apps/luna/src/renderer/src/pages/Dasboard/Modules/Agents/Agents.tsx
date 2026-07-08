import React, { useState } from 'react'
import { AgentCard, AgentTool } from './Components/AgentCard'

export const Agents: React.FC = () => {
  const tools: AgentTool[] = [
    {
      id: 'notion',
      name: 'Notion Workspace Connector',
      provider: 'Notion MCP Server',
      description:
        'Allows Luna to read, search, update, create, and append blocks/pages inside your personal databases and Notion documentation spaces.',
      permissionsCount: 24,
      enabled: true,
      mcpId: 'notion-mcp-server'
    },
    {
      id: 'terminal',
      name: 'Local System Terminal',
      provider: 'System Shell',
      description:
        'Run terminal commands on the local machine. Supports executing multiple commands seamlessly in the same working directory.',
      permissionsCount: 1,
      enabled: true
    },
    {
      id: 'web_search',
      name: 'DuckDuckGo Web Search',
      provider: 'Web Scraper',
      description:
        'Search the internet using DuckDuckGo to find real-time information, documentation, and answers.',
      permissionsCount: 1,
      enabled: true
    },
    {
      id: 'open_app',
      name: 'Desktop App Launcher',
      provider: 'System Integration',
      description:
        'Launch desktop applications natively on macOS and Windows (e.g., "Google Chrome", "Spotify").',
      permissionsCount: 1,
      enabled: true
    },
    {
      id: 'make_note',
      name: 'Local Note Writer',
      provider: 'File System',
      description: 'Create and save notes directly to a local notes folder securely.',
      permissionsCount: 1,
      enabled: true
    },
    {
      id: 'youtube_search',
      name: 'YouTube Browser',
      provider: 'Google Chrome',
      description: 'Open YouTube in Chrome and automatically search for specific videos or topics.',
      permissionsCount: 1,
      enabled: true
    },
    {
      id: 'open_website',
      name: 'Web Browser',
      provider: 'Google Chrome',
      description: 'Open any specific website in Google Chrome by its name or full URL.',
      permissionsCount: 1,
      enabled: true
    }
  ]

  return (
    <div className="flex-1 flex flex-col p-8 sm:p-10 md:p-12 overflow-y-auto bg-background text-foreground transition-colors duration-300 relative">
      {/* Background Glow */}
      <img
        src="./bg.png"
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
            <AgentCard
              key={tool.id}
              tool={tool}
              onConfigure={(id) => {
                if (id === 'notion') {
                  const event = new CustomEvent('open-settings', { detail: { tab: 'notion' } })
                  window.dispatchEvent(event)
                }
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default Agents

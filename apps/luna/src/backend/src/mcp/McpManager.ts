import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { getSettings } from '../routes/settings.route'

export class McpManager {
  private notionClient: Client | null = null
  private notionTransport: StdioClientTransport | null = null
  private notionTools: any[] = []

  constructor() {
    this.initialize()
  }

  public async initialize() {
    const settings = getSettings()
    if (settings.notionToken) {
      await this.connectNotion(settings.notionToken)
    }
  }

  public async connectNotion(token: string) {
    try {
      if (this.notionClient) {
        await this.disconnectNotion()
      }

      console.log('[MCP] Connecting to Notion server...')

      const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx'

      this.notionTransport = new StdioClientTransport({
        command: npxCommand,
        args: ['-y', '@notionhq/notion-mcp-server'],
        env: {
          ...process.env,
          NOTION_TOKEN: token.trim()
        }
      })

      this.notionClient = new Client(
        {
          name: 'luna-ai-client',
          version: '1.0.0'
        },
        {
          capabilities: {}
        }
      )

      await this.notionClient.connect(this.notionTransport)

      const res = await this.notionClient.listTools()
      // Prefix tools to avoid collisions and easily route them later, and map to Ollama format
      this.notionTools = res.tools.map((t) => ({
        type: 'function',
        function: {
          name: `mcp_notion_${t.name}`,
          description: t.description || `MCP Notion tool: ${t.name}`,
          parameters: t.inputSchema || { type: 'object', properties: {} }
        }
      }))

      console.log(`[MCP] Connected to Notion server. Loaded ${this.notionTools.length} tools.`)
    } catch (err: any) {
      console.error('[MCP] Failed to connect to Notion:', err.message)
      this.notionClient = null
      this.notionTransport = null
      this.notionTools = []
    }
  }

  public async disconnectNotion() {
    if (this.notionTransport) {
      try {
        await this.notionTransport.close()
      } catch (e) {
        // ignore
      }
    }
    this.notionClient = null
    this.notionTransport = null
    this.notionTools = []
    console.log('[MCP] Disconnected from Notion server.')
  }

  public getTools(): any[] {
    return [...this.notionTools]
  }

  public async executeTool(
    name: string,
    args: Record<string, any>
  ): Promise<{ success: boolean; output: string }> {
    if (name.startsWith('mcp_notion_') && this.notionClient) {
      const originalName = name.replace('mcp_notion_', '')
      console.log(
        `[MCP] Calling Notion tool: ${originalName} with args:`,
        JSON.stringify(args, null, 2)
      )
      try {
        const result = await this.notionClient.callTool({
          name: originalName,
          arguments: args
        })

        // Extract raw text if possible so small models don't choke on escaped JSON
        let outputText = ''
        if (result.content && Array.isArray(result.content)) {
          outputText = result.content
            .map((c: any) => (c.type === 'text' ? c.text : JSON.stringify(c)))
            .join('\n')
        } else {
          outputText = JSON.stringify(result.content, null, 2)
        }

        return { success: !result.isError, output: outputText }
      } catch (err: any) {
        return { success: false, output: `MCP Notion error: ${err.message}` }
      }
    }

    return { success: false, output: `Unknown MCP tool or server not connected: ${name}` }
  }
}

// Singleton instance
export const mcpManager = new McpManager()

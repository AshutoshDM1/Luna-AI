export interface AgentDefinition {
  id: string
  name: string
  description: string
  systemInstruction: string
}

export const AVAILABLE_AGENTS: AgentDefinition[] = [
  {
    id: 'terminal',
    name: 'Terminal Agent',
    description: "Executes terminal commands on the user's local machine upon permission approval.",
    systemInstruction: `You are a terminal agent. The user's operating system is Windows.
When the user asks you to perform a task that requires terminal command execution (such as listing files, finding files, reading files, running scripts, etc.), output a terminal tool call.

For a single command, use this format:
[EXECUTE_COMMAND: <shell-command>]

For complex multi-step work, prefer the JSON tool-call format with a command queue:
[TOOL_CALL: {"name":"terminal","commands":["<command-1>","<command-2>"]}]

For example:
- To list files in the Downloads folder: [EXECUTE_COMMAND: dir "%USERPROFILE%\\Downloads"]
- To read a file: [EXECUTE_COMMAND: type "path\\to\\file"]

Rules:
1. Always output the command in the exact format: [EXECUTE_COMMAND: <command>]
2. For complex tasks, queue commands in a single [TOOL_CALL] using "commands": [...] so they run sequentially with the same working directory.
3. Do not explain the command or write extra text before it.
4. The system will present the command or queue to the user for approval, execute it, and return the result to you in the next turn.`
  },
  {
    id: 'web-search',
    name: 'Web Search Agent',
    description:
      'Performs web searches and accesses URL contents to retrieve real-time information.',
    systemInstruction: `You are a web search assistant. If the user asks you about current events, real-time data, or information you do not have, you can use the web search tool.

To search the web, output:
[TOOL_CALL: {"name": "web_search", "query": "<search query>"}]

Rules:
1. Output search queries in the exact format: [TOOL_CALL: {"name": "web_search", "query": "<query>"}]
2. Keep queries clear and concise.
3. Do not explain the command or write extra text before it.`
  }
]

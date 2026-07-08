import { exec } from 'child_process'
import { IRouter, Router } from 'express'
import fs from 'fs'
import os from 'os'
import path from 'path'

const router: IRouter = Router()

const DEFAULT_TIMEOUT_MS = 60_000
const MAX_BUFFER_BYTES = 10 * 1024 * 1024
const MAX_BATCH_COMMANDS = 20

export const sessionsCwd: Record<string, string> = {}

const sessionQueues = new Map<string, Promise<unknown>>()

interface CommandPayload {
  command?: string
  commands?: string[]
  sessionId?: string
  stopOnError?: boolean
  timeoutMs?: number
}

interface TerminalCommandResult {
  command: string
  success: boolean
  output: string
  cwd: string
  exitCode: number
  durationMs: number
}

interface TerminalBatchResult {
  success: boolean
  output: string
  cwd: string
  exitCode: number
  results: TerminalCommandResult[]
}

function defaultCwd(): string {
  return os.homedir()
}

function getSessionCwd(sessionId: string): string {
  const cwd = sessionsCwd[sessionId]
  if (cwd && fs.existsSync(cwd)) return cwd
  const fallback = defaultCwd()
  sessionsCwd[sessionId] = fallback
  return fallback
}

function expandEnvVars(value: string): string {
  return value
    .replace(/%([^%]+)%/g, (_, key) => process.env[key] ?? `%${key}%`)
    .replace(/\$\{([^}]+)\}/g, (_, key) => process.env[key] ?? `\${${key}}`)
    .replace(/\$([A-Za-z_][A-Za-z0-9_]*)/g, (_, key) => process.env[key] ?? `$${key}`)
}

function normalizeCommands(command?: string, commands?: string[]): string[] {
  const normalized = Array.isArray(commands) ? commands : command ? [command] : []
  return normalized
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .slice(0, MAX_BATCH_COMMANDS)
}

function stripOuterQuotes(value: string): string {
  return value.replace(/^["']|["']$/g, '').trim()
}

function parseCdCommand(command: string): string | null {
  const trimmed = command.trim()
  const isWindows = process.platform === 'win32'
  const cdRegex = isWindows ? /^(?:cd|chdir)(?=$|[\s.\\\/])/i : /^cd(?=$|[\s.\\\/])/

  if (!cdRegex.test(trimmed)) return null

  const prefixRegex = isWindows ? /^(?:cd|chdir)(?:\s+\/d)?/i : /^cd/
  const rest = trimmed.replace(prefixRegex, '').trim()
  return rest ? stripOuterQuotes(expandEnvVars(rest)) : defaultCwd()
}

function resolveTargetCwd(currentCwd: string, target: string): string {
  if (target === '~') return defaultCwd()
  if (target.startsWith('~/') || target.startsWith('~\\')) {
    return path.resolve(defaultCwd(), target.slice(2))
  }
  return path.isAbsolute(target) ? path.resolve(target) : path.resolve(currentCwd, target)
}

function formatBatchOutput(results: TerminalCommandResult[], finalCwd: string): string {
  const body = results
    .map((result, index) => {
      const status = result.success ? 'OK' : `FAILED exit=${result.exitCode}`
      return [
        `#${index + 1} ${status}: ${result.command}`,
        result.output || 'Command completed with no output.',
        `[CWD: ${result.cwd}]`
      ].join('\n')
    })
    .join('\n\n')

  return `${body}\n\n[FINAL_CWD: ${finalCwd}]`
}

function runQueued<T>(sessionId: string, task: () => Promise<T>): Promise<T> {
  const previous = sessionQueues.get(sessionId) || Promise.resolve()
  const next = previous.catch(() => undefined).then(task)

  sessionQueues.set(
    sessionId,
    next.finally(() => {
      if (sessionQueues.get(sessionId) === next) {
        sessionQueues.delete(sessionId)
      }
    })
  )

  return next
}

async function executeCdCommand(
  command: string,
  sessionId: string,
  currentCwd: string
): Promise<TerminalCommandResult> {
  const startedAt = Date.now()
  const target = parseCdCommand(command) || defaultCwd()
  const resolved = resolveTargetCwd(currentCwd, target)

  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) {
    return {
      command,
      success: false,
      output: `ERROR: Cannot access '${target}'. Directory does not exist.\nCurrent directory: ${currentCwd}`,
      cwd: currentCwd,
      exitCode: 1,
      durationMs: Date.now() - startedAt
    }
  }

  sessionsCwd[sessionId] = resolved
  return {
    command,
    success: true,
    output: `Changed directory to: ${resolved}`,
    cwd: resolved,
    exitCode: 0,
    durationMs: Date.now() - startedAt
  }
}

function executeShellCommand(
  command: string,
  currentCwd: string,
  timeoutMs: number
): Promise<TerminalCommandResult> {
  const startedAt = Date.now()
  const expandedCommand = expandEnvVars(command)
  const shell = process.platform === 'win32' ? 'cmd.exe' : '/bin/bash'

  console.log(`[TerminalAgent] Executing command in "${currentCwd}": ${expandedCommand}`)

  return new Promise((resolve) => {
    exec(
      expandedCommand,
      {
        cwd: currentCwd,
        shell,
        env: process.env,
        maxBuffer: MAX_BUFFER_BYTES,
        timeout: timeoutMs,
        windowsHide: true
      },
      (err, stdout, stderr) => {
        const output = (stdout + stderr).trim()
        const exitCode = err ? ((err as any).code ?? 1) : 0

        resolve({
          command,
          success: !err,
          output: output || (err ? err.message : 'Command completed with no output.'),
          cwd: currentCwd,
          exitCode,
          durationMs: Date.now() - startedAt
        })
      }
    )
  })
}

async function executeCommandNow(
  command: string,
  sessionId: string,
  timeoutMs: number
): Promise<TerminalCommandResult> {
  const currentCwd = getSessionCwd(sessionId)
  const cdTarget = parseCdCommand(command)

  if (cdTarget !== null) {
    return executeCdCommand(command, sessionId, currentCwd)
  }

  return executeShellCommand(command, currentCwd, timeoutMs)
}

export async function runTerminalCommands(
  commands: string[],
  sessionId: string = 'default',
  options: { stopOnError?: boolean; timeoutMs?: number } = {}
): Promise<TerminalBatchResult> {
  const commandList = normalizeCommands(undefined, commands)
  const stopOnError = options.stopOnError ?? true
  const timeoutMs = Math.max(1_000, Math.min(options.timeoutMs || DEFAULT_TIMEOUT_MS, 5 * 60_000))

  if (commandList.length === 0) {
    return {
      success: false,
      output: 'Command is required',
      cwd: getSessionCwd(sessionId),
      exitCode: 1,
      results: []
    }
  }

  return runQueued(sessionId, async () => {
    const results: TerminalCommandResult[] = []

    for (const command of commandList) {
      const result = await executeCommandNow(command, sessionId, timeoutMs)
      results.push(result)

      if (!result.success && stopOnError) {
        break
      }
    }

    const finalCwd = getSessionCwd(sessionId)
    const success = results.every((result) => result.success)
    const lastFailed = results.find((result) => !result.success)
    const lastResult = results[results.length - 1]

    return {
      success,
      output: formatBatchOutput(results, finalCwd),
      cwd: finalCwd,
      exitCode: lastFailed?.exitCode ?? lastResult?.exitCode ?? 0,
      results
    }
  })
}

export async function runTerminalCommand(
  command: string,
  sessionId: string = 'default'
): Promise<{ success: boolean; output: string; cwd: string; exitCode: number }> {
  const result = await runTerminalCommands([command], sessionId)
  return {
    success: result.success,
    output: result.output,
    cwd: result.cwd,
    exitCode: result.exitCode
  }
}

router.post('/run', async (req, res) => {
  try {
    const { command, commands, sessionId, stopOnError, timeoutMs } = req.body as CommandPayload
    const commandList = normalizeCommands(command, commands)

    const result = await runTerminalCommands(commandList, sessionId || 'terminal-session', {
      stopOnError,
      timeoutMs
    })

    return res.status(result.exitCode === 500 ? 500 : 200).json(result)
  } catch (error: any) {
    console.error(`[TerminalAgent] Request failed:`, error)
    return res.status(500).json({
      success: false,
      output: `Internal Server Error: ${error.message || error}`,
      cwd: defaultCwd(),
      exitCode: 500,
      results: []
    })
  }
})

export default router

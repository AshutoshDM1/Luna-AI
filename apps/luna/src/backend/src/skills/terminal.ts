import { exec } from 'child_process'
import { IRouter, Router } from 'express'
import { resolve as pathResolve } from 'path'
import os from 'os'

const router: IRouter = Router()

// Simple in-memory session store for current working directories
export const sessionsCwd: Record<string, string> = {}
// Note: removed global isRunning lock — it caused permanent hangs when commands errored

interface CommandPayload {
  command: string
  sessionId?: string
}

// Expand Windows-style environment variables like %USERPROFILE%
function expandEnvVars(str: string): string {
  return str
    .replace(/%([^%]+)%/g, (_, key) => process.env[key] ?? `%${key}%`)
    .replace(/\$([A-Z_]+)/g, (_, key) => process.env[key] ?? `$${key}`)
}

/**
 * Execute a command inside the session's current directory.
 * Exported for direct backend loop calling.
 */
export function runTerminalCommand(
  command: string,
  sessionId: string = 'default'
): Promise<{ success: boolean; output: string; cwd: string; exitCode: number }> {
  return new Promise((resolve) => {
    if (!command || !command.trim()) {
      return resolve({
        success: false,
        output: 'Command is required',
        cwd: '',
        exitCode: 1
      })
    }

    const defaultCwd = os.homedir()
    let currentCwd = sessionsCwd[sessionId] || defaultCwd
    const trimmedCommand = expandEnvVars(command.trim())

    // No global lock — commands execute concurrently (each session is independent)

    try {
      // Handle `cd` separately to track CWD state across commands
      if (/^cd(\s+.*)?$/.test(trimmedCommand)) {
        const parts = trimmedCommand.split(/\s+/, 2)
        if (parts.length === 1) {
          sessionsCwd[sessionId] = defaultCwd
          return resolve({
            success: true,
            output: `Changed directory to: ${defaultCwd}`,
            cwd: defaultCwd,
            exitCode: 0
          })
        }

        const targetDir = parts[1].replace(/^["']|["']$/g, '').trim()
        const isAbsolute = /^[a-zA-Z]:\\/.test(targetDir) || targetDir.startsWith('/')
        const resolvedPath = isAbsolute ? targetDir : pathResolve(currentCwd, targetDir)

        console.log(`[TerminalAgent] Executing: cd "${targetDir}"`)
        exec(`cd /d "${resolvedPath}" && cd`, { shell: 'cmd.exe' }, (err, stdout) => {
          if (err) {
            console.error(`[TerminalAgent] Failed to change directory: ${err.message}`)
            return resolve({
              success: false,
              output: `ERROR: Cannot access '${targetDir}'. Directory does not exist.\nCurrent directory: ${currentCwd}`,
              cwd: currentCwd,
              exitCode: 1
            })
          }
          const newCwd = stdout.trim()
          sessionsCwd[sessionId] = newCwd
          console.log(`[TerminalAgent] Changed directory successfully to: ${newCwd}`)
          return resolve({
            success: true,
            output: `Changed directory to: ${newCwd}`,
            cwd: newCwd,
            exitCode: 0
          })
        })
        return
      }

      // Run any other command in the tracked CWD
      console.log(`[TerminalAgent] Executing command: "${trimmedCommand}" in CWD: "${currentCwd}"`)
      exec(
        trimmedCommand,
        {
          cwd: currentCwd,
          shell: 'cmd.exe',
          env: process.env,
          maxBuffer: 10 * 1024 * 1024, // 10MB limit
          timeout: 30000 // 30s timeout
        },
        (err, stdout, stderr) => {
          const output = (stdout + stderr).trim()
          const status = !err ? 'SUCCESS' : 'FAILURE'
          console.log(`[TerminalAgent] Command completed. Status: ${status}, CWD: ${currentCwd}`)
          if (err) {
            console.error(`[TerminalAgent] Error: ${err.message}`)
          }
          // Always append CWD to output so the AI knows where it is
          const cwdLine = `\n[CWD: ${currentCwd}]`
          return resolve({
            success: !err,
            output: (output || (err ? err.message : 'Command completed with no output.')) + cwdLine,
            cwd: currentCwd,
            exitCode: err ? ((err as any).code ?? 1) : 0
          })
        }
      )
    } catch (unexpectedErr: any) {
      return resolve({
        success: false,
        output: `Internal agent error: ${unexpectedErr.message}`,
        cwd: currentCwd,
        exitCode: 500
      })
    }
  })
}

// REST route delegates to helper
router.post('/run', async (req, res) => {
  const { command, sessionId } = req.body as CommandPayload
  const result = await runTerminalCommand(command, sessionId)
  if (result.exitCode === 500) {
    return res.status(500).json(result)
  }
  return res.json(result)
})

export default router

import { exec } from 'child_process'
import { IRouter, Router } from 'express'
import { resolve } from 'path'
import os from 'os'

const router: IRouter = Router()

// Simple in-memory session store for current working directories
const sessionsCwd: Record<string, string> = {}

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

// Execute a command inside the session's current directory
router.post('/run', (req, res) => {
  try {
    const { command, sessionId } = req.body as CommandPayload

    if (!command || !command.trim()) {
      return res.status(400).json({ success: false, error: 'Command is required', output: '' })
    }

    const sessionKey = sessionId || 'default'
    const defaultCwd = os.homedir()
    let currentCwd = sessionsCwd[sessionKey] || defaultCwd

    const trimmedCommand = expandEnvVars(command.trim())

    // Handle `cd` separately to track CWD state across commands
    if (/^cd(\s+.*)?$/.test(trimmedCommand)) {
      const parts = trimmedCommand.split(/\s+/, 2)
      if (parts.length === 1) {
        // bare `cd` → go home
        sessionsCwd[sessionKey] = defaultCwd
        return res.json({ success: true, output: defaultCwd, cwd: defaultCwd })
      }

      const targetDir = parts[1].replace(/^["']|["']$/g, '').trim()
      // Resolve relative or absolute path
      const isAbsolute = /^[a-zA-Z]:\\/.test(targetDir) || targetDir.startsWith('/')
      const resolvedPath = isAbsolute ? targetDir : resolve(currentCwd, targetDir)

      exec(`cd /d "${resolvedPath}" && cd`, { shell: 'cmd.exe' }, (err, stdout) => {
        if (err) {
          return res.json({
            success: false,
            output: `cd: cannot access '${targetDir}': No such file or directory`,
            cwd: currentCwd
          })
        }
        const newCwd = stdout.trim()
        sessionsCwd[sessionKey] = newCwd
        return res.json({ success: true, output: `Changed directory to ${newCwd}`, cwd: newCwd })
      })
      return
    }

    // Run any other command in the tracked CWD
    exec(
      trimmedCommand,
      {
        cwd: currentCwd,
        shell: 'cmd.exe',
        env: process.env,
        maxBuffer: 10 * 1024 * 1024, // 10MB output limit
        timeout: 30000 // 30s timeout
      },
      (err, stdout, stderr) => {
        const output = (stdout + stderr).trim()
        // Always return JSON — never let it crash
        return res.json({
          success: !err,
          output: output || (err ? err.message : 'Command completed with no output.'),
          cwd: currentCwd,
          exitCode: err ? ((err as any).code ?? 1) : 0
        })
      }
    )
  } catch (unexpectedErr: any) {
    // Safety net: always return JSON, never HTML
    return res.status(500).json({
      success: false,
      output: `Internal agent error: ${unexpectedErr.message}`,
      cwd: ''
    })
  }
})

export default router

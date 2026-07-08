import React, { useState } from 'react'
import { Loader } from 'lucide-react'
import { API_BASE_URL } from '@/services/api'

interface TerminalAgentProps {
  command: string
  commands?: string[]
  onPermissionGranted: (execute: boolean) => void
  onCommandExecuted?: (command: string, success: boolean, output: string) => void
  isSystemBusy?: boolean
  onStartExecuting?: () => void
  preExecutedOutput?: string
  preExecutedSuccess?: boolean
  isBackendExecuted?: boolean
}

export const TerminalAgent: React.FC<TerminalAgentProps> = ({
  command,
  commands,
  onPermissionGranted,
  onCommandExecuted,
  isSystemBusy = false,
  onStartExecuting,
  preExecutedOutput,
  preExecutedSuccess = true,
  isBackendExecuted = false
}) => {
  const [decision, setDecision] = useState<
    'pending' | 'executing' | 'approved' | 'failed' | 'denied'
  >(preExecutedOutput !== undefined ? (preExecutedSuccess ? 'approved' : 'failed') : 'pending')
  const [result, setResult] = useState<string>(preExecutedOutput || '')

  const [cwd, setCwd] = useState<string>('')
  const commandList = commands && commands.length > 0 ? commands : [command]
  const commandLabel = commandList.join('\n')

  React.useEffect(() => {
    if (decision === 'pending' && !isBackendExecuted) {
      if (!isSystemBusy) {
        handleApprove()
      }
    }
  }, [decision, isSystemBusy, isBackendExecuted])

  React.useEffect(() => {
    if (isBackendExecuted && preExecutedOutput !== undefined) {
      setDecision(preExecutedSuccess ? 'approved' : 'failed')
      setResult(preExecutedOutput)
    }
  }, [preExecutedOutput, preExecutedSuccess, isBackendExecuted])

  const handleApprove = async () => {
    if (isSystemBusy) return
    onStartExecuting?.()
    setDecision('executing')
    try {
      const response = await fetch(`${API_BASE_URL}/agent/terminal/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(commands && commands.length > 0 ? { commands } : { command }),
          sessionId: 'terminal-session'
        })
      })
      const data = await response.json()
      if (response.ok && data.success) {
        setDecision('approved')
        setResult(data.output)
        setCwd(data.cwd)
        onPermissionGranted(true)
        if (onCommandExecuted) {
          onCommandExecuted(commandLabel, true, data.output)
        }
      } else {
        setDecision('failed')
        setResult(data.output || 'Execution failed')
        onPermissionGranted(false)
        if (onCommandExecuted) {
          onCommandExecuted(commandLabel, false, data.output || 'Execution failed')
        }
      }
    } catch (err: any) {
      setDecision('failed')
      setResult(`Network Error: ${err.message}`)
      onPermissionGranted(false)
      if (onCommandExecuted) {
        onCommandExecuted(commandLabel, false, `Network Error: ${err.message}`)
      }
    }
  }

  return (
    <div className="w-full max-w-xl p-3 space-y-2.5 my-1.5 text-foreground font-sans animate-[fadeIn_0.2s_ease-out]">
      <div className="text-[11px] text-muted-foreground ">
        {decision === 'pending' || decision === 'executing'
          ? 'Executing Command...'
          : 'Terminal Command'}
      </div>

      {/* Target command preview */}
      <div className="bg-black/30 border border-border/40 rounded-lg p-2.5 font-mono text-[11px] text-indigo-300">
        <span className="text-muted-foreground mr-1.5 select-none">$</span>
        <span className="whitespace-pre-wrap">{commandLabel}</span>
      </div>

      {/* Decision / Output panel */}
      {decision === 'pending' && isSystemBusy && (
        <div className="flex items-center gap-2 text-[10px] text-amber-500 font-medium select-none animate-pulse">
          <span>Another command is running. Waiting to execute...</span>
        </div>
      )}

      {decision === 'executing' && (
        <div className="flex items-center justify-center gap-2 py-1 text-xs text-indigo-400">
          <Loader className="w-3.5 h-3.5 animate-spin" />
          <span>Executing system command...</span>
        </div>
      )}

      {(decision === 'approved' || decision === 'denied' || decision === 'failed') && (
        <div className="space-y-2">
          <div className="flex justify-between items-center text-[10px] text-muted-foreground font-medium">
            <span>
              Status:{' '}
              {decision === 'approved' ? 'Success' : decision === 'failed' ? 'Failed' : 'Rejected'}
            </span>
            {cwd && <span className="truncate max-w-[200px]">CWD: {cwd}</span>}
          </div>
          {result && (
            <pre className="bg-black/50 border border-border/20 rounded-xl p-3 max-h-[160px] overflow-y-auto font-mono text-[10px] text-neutral-300 whitespace-pre-wrap leading-relaxed">
              {result}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}
export default TerminalAgent

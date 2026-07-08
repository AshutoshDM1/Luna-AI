import React, { useState } from 'react'
import { Check, X, Loader } from 'lucide-react'
import { API_BASE_URL } from '@/services/api'

interface TerminalAgentProps {
  command: string
  onPermissionGranted: (execute: boolean) => void
  onCommandExecuted?: (command: string, success: boolean, output: string) => void
}

export const TerminalAgent: React.FC<TerminalAgentProps> = ({
  command,
  onPermissionGranted,
  onCommandExecuted
}) => {
  const [decision, setDecision] = useState<'pending' | 'executing' | 'approved' | 'denied'>(
    'pending'
  )
  const [result, setResult] = useState<string>('')
  const [cwd, setCwd] = useState<string>('')

  const handleApprove = async () => {
    setDecision('executing')
    try {
      const response = await fetch(`${API_BASE_URL}/agent/terminal/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, sessionId: 'terminal-session' })
      })
      const data = await response.json()
      if (response.ok && data.success) {
        setDecision('approved')
        setResult(data.output)
        setCwd(data.cwd)
        onPermissionGranted(true)
        if (onCommandExecuted) {
          onCommandExecuted(command, true, data.output)
        }
      } else {
        setDecision('denied')
        setResult(data.output || 'Execution failed')
        onPermissionGranted(false)
        if (onCommandExecuted) {
          onCommandExecuted(command, false, data.output || 'Execution failed')
        }
      }
    } catch (err: any) {
      setDecision('denied')
      setResult(`Network Error: ${err.message}`)
      onPermissionGranted(false)
      if (onCommandExecuted) {
        onCommandExecuted(command, false, `Network Error: ${err.message}`)
      }
    }
  }

  const handleDeny = () => {
    setDecision('denied')
    setResult('Execution denied by user.')
    onPermissionGranted(false)
    if (onCommandExecuted) {
      onCommandExecuted(command, false, 'Execution denied by user.')
    }
  }

  return (
    <div className="w-full max-w-xl border border-border bg-neutral-900/40 rounded-xl p-3 shadow-md space-y-2.5 my-1.5 text-foreground font-sans animate-[fadeIn_0.2s_ease-out]">
      <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
        Requesting Permission
      </div>

      {/* Target command preview */}
      <div className="bg-black/30 border border-border/40 rounded-lg p-2.5 font-mono text-[11px] text-indigo-300">
        <span className="text-muted-foreground mr-1.5 select-none">$</span>
        <span>{command}</span>
      </div>

      {/* Decision / Output panel */}
      {decision === 'pending' && (
        <div className="flex gap-2">
          <button
            onClick={handleApprove}
            className="px-3 py-1 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[10px] cursor-pointer transition-all flex items-center justify-center gap-1"
          >
            <Check className="w-3 h-3" />
            Approve & Run
          </button>
          <button
            onClick={handleDeny}
            className="px-3 py-1 rounded-md border border-border hover:bg-accent text-foreground font-semibold text-[10px] cursor-pointer transition-all flex items-center justify-center gap-1"
          >
            <X className="w-3 h-3" />
            Deny
          </button>
        </div>
      )}

      {decision === 'executing' && (
        <div className="flex items-center justify-center gap-2 py-1 text-xs text-indigo-400">
          <Loader className="w-3.5 h-3.5 animate-spin" />
          <span>Executing system command...</span>
        </div>
      )}

      {(decision === 'approved' || decision === 'denied') && (
        <div className="space-y-2">
          <div className="flex justify-between items-center text-[10px] text-muted-foreground font-medium">
            <span>Status: {decision === 'approved' ? 'Success' : 'Rejected'}</span>
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

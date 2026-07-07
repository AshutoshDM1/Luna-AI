import React, { useState, useEffect } from 'react'
import { CheckCircle2, Loader2, Download, Terminal, Sparkles } from 'lucide-react'
import axios from 'axios'

interface StepOllamaProps {
  model: string
  onComplete: () => void
}

export const StepOllama: React.FC<StepOllamaProps> = ({ model, onComplete }) => {
  const [, setPlatform] = useState<string>('win32')
  const [isChecking, setIsChecking] = useState(true)
  const [hasOllama, setHasOllama] = useState(false)
  const [installStatus, setInstallStatus] = useState<string>('')
  const [isInstalling, setIsInstalling] = useState(false)
  const [isPulling, setIsPulling] = useState(false)
  const [downloadPercent, setDownloadPercent] = useState<number | null>(null)
  const [, setPullProgress] = useState<string>('')
  const [pullLogs, setPullLogs] = useState<string[]>([])

  useEffect(() => {
    checkOllamaStatus()
    detectPlatform()
  }, [])

  const detectPlatform = async () => {
    try {
      const res = await axios.get('http://localhost:3001/api/ollama/platform')
      setPlatform(res.data.platform)
    } catch (e) {
      console.error(e)
    }
  }

  const checkOllamaStatus = async () => {
    setIsChecking(true)
    try {
      const res = await axios.get('http://localhost:3001/api/ollama/check')
      setHasOllama(res.data.installed)
    } catch (e) {
      console.error(e)
      setHasOllama(false)
    } finally {
      setIsChecking(false)
    }
  }

  const handleInstallOllama = async () => {
    setIsInstalling(true)
    setInstallStatus('Downloading Ollama installer from official site...')
    try {
      const res = await axios.post('http://localhost:3001/api/ollama/install')
      if (res.data.manual) {
        setInstallStatus('Opening browser download page...')
      } else {
        setInstallStatus('Launching setup. Please complete the installer dialog on your desktop...')
      }

      const interval = setInterval(async () => {
        try {
          const checkRes = await axios.get('http://localhost:3001/api/ollama/check')
          if (checkRes.data.installed) {
            setHasOllama(true)
            setInstallStatus('Ollama installed successfully!')
            clearInterval(interval)
            setIsInstalling(false)
          }
        } catch (e) {
          console.error(e)
        }
      }, 3000)

      setTimeout(() => {
        clearInterval(interval)
        setIsInstalling(false)
      }, 180000)
    } catch (e: any) {
      setInstallStatus(`Installation trigger failed: ${e.response?.data?.error || e.message}`)
      setIsInstalling(false)
    }
  }

  const handlePullModel = () => {
    setIsPulling(true)
    setPullLogs([])
    setDownloadPercent(0)

    const eventSource = new EventSource(`http://localhost:3001/api/ollama/pull?model=${model}`)

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.status === 'progress') {
          // Clean ANSI escape sequences
          const cleanLog = data.log
            .replace(
              /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
              ''
            )
            .trim()

          if (!cleanLog) return

          // Parse percentage
          const percentMatch = cleanLog.match(/(\d+)%/)
          if (percentMatch) {
            const percent = parseInt(percentMatch[1], 10)
            setDownloadPercent(percent)
          }

          setPullProgress(cleanLog)

          setPullLogs((prev) => {
            const next = [...prev]
            if (next[next.length - 1] !== cleanLog) {
              next.push(cleanLog)
            }
            return next.slice(-3) // Keep last 3 logs
          })
        } else if (data.status === 'success') {
          eventSource.close()
          setDownloadPercent(100)
          setTimeout(() => {
            onComplete()
          }, 1000)
        } else if (data.status === 'error') {
          eventSource.close()
          setPullProgress(`Error: ${data.log}`)
          setIsPulling(false)
        }
      } catch (e) {
        console.error(e)
      }
    }

    eventSource.onerror = () => {
      eventSource.close()
      setPullProgress('Failed to maintain connection to server.')
      setIsPulling(false)
    }
  }

  return (
    <div className="space-y-5 animate-[fadeIn_0.3s_ease-out]">
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-foreground">Local Engine Setup</h3>
        <p className="text-[11px] text-muted-foreground">
          Verify and pull your local model offline brain configuration.
        </p>
      </div>

      {isChecking ? (
        <div className="flex flex-col items-center justify-center py-6 gap-3 text-xs text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span>Verifying Ollama core dependency...</span>
        </div>
      ) : !hasOllama ? (
        <div className="space-y-4 pt-1">
          <div className="bg-black/50 border border-border rounded-lg p-4 font-mono text-[10px] text-muted-foreground space-y-1.5 leading-relaxed text-left">
            <div className="flex items-center gap-1.5 text-primary pb-1.5 font-sans border-b border-border/40 mb-1.5">
              <Terminal className="w-3.5 h-3.5 text-red-500" />
              <span className="font-bold text-foreground">System Console Output</span>
            </div>
            <p className="text-slate-500">luna@workspace ~</p>
            <p className="text-foreground">$ ollama --version</p>
            <p className="text-red-500 font-semibold">
              cmd: 'ollama' is not recognized as an internal or external command
            </p>
          </div>

          <div className="space-y-2">
            <button
              onClick={handleInstallOllama}
              disabled={isInstalling}
              className="w-full py-2.5 rounded-md bg-primary hover:bg-primary/95 text-primary-foreground font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              {isInstalling ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Installing Ollama...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Install Ollama Core</span>
                </>
              )}
            </button>

            {installStatus && (
              <p className="text-[10px] text-center text-muted-foreground animate-pulse">
                {installStatus}
              </p>
            )}

            <button
              onClick={checkOllamaStatus}
              className="w-full py-1.5 rounded-md border border-border bg-accent/40 text-foreground font-medium text-[10px] transition-all cursor-pointer"
            >
              Check Status Again
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 pt-1">
          <div className="p-4 border border-emerald-500/25 bg-emerald-500/5 rounded-xl flex gap-3 text-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div className="space-y-0.5 leading-relaxed text-muted-foreground">
              <p className="font-semibold text-foreground">Ollama installation verified</p>
              <p>Ready to initialize local LLM backend engine.</p>
            </div>
          </div>

          {!isPulling ? (
            <button
              onClick={handlePullModel}
              className="w-full py-2.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-indigo-600/10"
            >
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>Initialize {model}</span>
            </button>
          ) : (
            <div className="space-y-4">
              {/* Progress bar and percentage */}
              <div className="space-y-2 text-left font-sans">
                <div className="flex justify-between items-center text-xs font-bold text-foreground">
                  <span>Downloading Model Brain ({model})...</span>
                  <span>{downloadPercent !== null ? `${downloadPercent}%` : 'Connecting...'}</span>
                </div>
                <div className="w-full bg-accent border border-border h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full transition-all duration-300 rounded-full"
                    style={{ width: `${downloadPercent || 0}%` }}
                  />
                </div>
              </div>

              {/* Pull logs box (cleaned) */}
              <div className="p-3 bg-black/40 border border-border rounded-lg font-mono text-[9px] text-muted-foreground space-y-1 min-h-[60px] flex flex-col justify-end leading-relaxed text-left">
                {pullLogs.map((log, i) => (
                  <p key={i} className="truncate">
                    {log}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

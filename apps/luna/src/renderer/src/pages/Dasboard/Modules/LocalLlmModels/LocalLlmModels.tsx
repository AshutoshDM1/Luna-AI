import React, { useState, useEffect } from 'react'
import { ModelCard, LLMModel } from './Components/ModelCard'
import { api, API_BASE_URL } from '@/services/api'

const CATALOG: Omit<LLMModel, 'status'>[] = [
  {
    id: 'qwen3:4b',
    name: 'Qwen3 4B',
    developer: 'Alibaba Group',
    size: '2.3 GB',
    params: '4 Billion',
    useCase:
      'Default offline brain. Fast, capable text model optimized for reasoning and instruction following.',
    speed: '~60 t/s'
  },
  {
    id: 'qwen2.5-vl:3b',
    name: 'Qwen 2.5 VL (3B)',
    developer: 'Alibaba Group',
    size: '2.1 GB',
    params: '3 Billion',
    useCase:
      'Vision model — understands images and text. Lightweight yet highly capable at reasoning and visual understanding.',
    speed: '~55 t/s'
  }
]

export const LocalLlmModels: React.FC = () => {
  const [models, setModels] = useState<LLMModel[]>(
    CATALOG.map((m) => ({ ...m, status: 'not-downloaded' }))
  )

  // Check which models are installed and what the active model is on mount
  useEffect(() => {
    const initModels = async () => {
      // Get active model from localStorage
      let activeModelId: string | null = null
      try {
        const dataStr = localStorage.getItem('luna_setup')
        if (dataStr) {
          activeModelId = JSON.parse(dataStr).model ?? null
        }
      } catch {
        /* ignore */
      }

      // Query Ollama for installed models
      let installedIds: Set<string> = new Set()
      try {
        const res = await api.get<{ models: { name: string }[] }>('/ollama/models')
        if (res.data?.models) {
          installedIds = new Set(res.data.models.map((m) => m.name))
        }
      } catch {
        /* Ollama may be offline — leave all as not-downloaded */
      }

      setModels(
        CATALOG.map((m) => {
          const normalize = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '')
          const activeNormalized = activeModelId ? normalize(activeModelId) : ''
          const currentNormalized = normalize(m.id)

          const isInstalled = Array.from(installedIds).some(
            (installedName) => normalize(installedName) === currentNormalized
          )

          if (activeNormalized === currentNormalized) return { ...m, status: 'active' }
          if (isInstalled) return { ...m, status: 'installed' }
          return { ...m, status: 'not-downloaded' }
        })
      )
    }

    initModels()
  }, [])

  const handleActivate = (id: string) => {
    // Persist to localStorage
    try {
      const dataStr = localStorage.getItem('luna_setup')
      if (dataStr) {
        const setup = JSON.parse(dataStr)
        setup.model = id
        localStorage.setItem('luna_setup', JSON.stringify(setup))
      }
    } catch {
      /* ignore */
    }

    setModels((prev) =>
      prev.map((m) => {
        if (m.id === id) return { ...m, status: 'active' }
        if (m.status === 'active') return { ...m, status: 'installed' }
        return m
      })
    )
  }

  const handleDownload = (id: string) => {
    // Mark as downloading
    setModels((prev) =>
      prev.map((m) =>
        m.id === id
          ? { ...m, status: 'downloading', downloadProgress: 0, downloadLog: 'Connecting...' }
          : m
      )
    )

    const eventSource = new EventSource(
      `${API_BASE_URL}/ollama/pull?model=${encodeURIComponent(id)}`
    )

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        if (data.status === 'progress') {
          const cleanLog = data.log
            .replace(
              /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
              ''
            )
            .trim()

          if (!cleanLog) return

          const percentMatch = cleanLog.match(/(\d+)%/)
          const percent = percentMatch ? parseInt(percentMatch[1], 10) : undefined

          setModels((prev) =>
            prev.map((m) =>
              m.id === id
                ? {
                    ...m,
                    status: 'downloading',
                    downloadLog: cleanLog,
                    downloadProgress: percent ?? m.downloadProgress
                  }
                : m
            )
          )
        } else if (data.status === 'success') {
          eventSource.close()
          setModels((prev) =>
            prev.map((m) =>
              m.id === id
                ? { ...m, status: 'installed', downloadProgress: undefined, downloadLog: undefined }
                : m
            )
          )
        } else if (data.status === 'error') {
          eventSource.close()
          setModels((prev) =>
            prev.map((m) =>
              m.id === id
                ? {
                    ...m,
                    status: 'not-downloaded',
                    downloadProgress: undefined,
                    downloadLog: undefined
                  }
                : m
            )
          )
        }
      } catch {
        /* parse error — ignore */
      }
    }

    eventSource.onerror = () => {
      eventSource.close()
      setModels((prev) =>
        prev.map((m) =>
          m.id === id
            ? {
                ...m,
                status: 'not-downloaded',
                downloadProgress: undefined,
                downloadLog: undefined
              }
            : m
        )
      )
    }
  }

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
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">Local LLM Models</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Select your active brain or download new model architectures.
            </p>
          </div>
        </header>

        {/* Model Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {models.map((model) => (
            <ModelCard
              key={model.id}
              model={model}
              onActivate={handleActivate}
              onDownload={handleDownload}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default LocalLlmModels

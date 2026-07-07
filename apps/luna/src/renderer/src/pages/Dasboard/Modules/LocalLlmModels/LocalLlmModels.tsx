import React, { useState, useEffect } from 'react'
import { ModelCard, LLMModel } from './Components/ModelCard'

export const LocalLlmModels: React.FC = () => {
  const [models, setModels] = useState<LLMModel[]>([
    {
      id: 'gemma3:4b',
      name: 'Gemma 3 (4B)',
      developer: 'Google',
      size: '2.5 GB',
      params: '4 Billion',
      status: 'active',
      useCase:
        'Primary compact model. Optimally balanced for speed and memory efficiency on consumer machines.',
      speed: '~62 t/s'
    },
    {
      id: 'llama3',
      name: 'Llama 3 (8B Instruct)',
      developer: 'Meta AI',
      size: '4.7 GB',
      params: '8 Billion',
      status: 'installed',
      useCase:
        'Balanced and fast. Perfect for general assistant tasks, email drafting, and summarization.',
      speed: '~45 t/s'
    },
    {
      id: 'gemma2',
      name: 'Gemma 2 (9B Instruct)',
      developer: 'Google',
      size: '5.4 GB',
      params: '9 Billion',
      status: 'installed',
      useCase:
        'Highly optimized for text reasoning, creative writing, and complex multi-turn dialogs.',
      speed: '~38 t/s'
    },
    {
      id: 'qwen2.5',
      name: 'Qwen 2.5 (7B Coder)',
      developer: 'Alibaba Group',
      size: '4.3 GB',
      params: '7 Billion',
      status: 'not-downloaded',
      useCase:
        'Elite coding copilot. Extremely proficient at writing, debugging, and parsing source code.',
      speed: '~48 t/s'
    },
    {
      id: 'phi3',
      name: 'Phi-3 (3.8B Mini)',
      developer: 'Microsoft',
      size: '2.2 GB',
      params: '3.8 Billion',
      status: 'not-downloaded',
      useCase:
        'Ultra-lightweight. Perfect for lower-end machines or background automation routines.',
      speed: '~65 t/s'
    }
  ])

  // Sync active model state with localStorage settings
  useEffect(() => {
    try {
      const dataStr = localStorage.getItem('luna_setup')
      if (dataStr) {
        const setupData = JSON.parse(dataStr)
        const activeModelId = setupData.model

        setModels((prev) =>
          prev.map((model) => {
            if (model.id === activeModelId) {
              return { ...model, status: 'active' }
            } else if (model.status === 'active') {
              // If it was active but is no longer the active one in setup data, downgrade to installed
              return { ...model, status: 'installed' }
            }
            return model
          })
        )
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  const handleActivate = (id: string) => {
    // 1. Update localStorage
    try {
      const dataStr = localStorage.getItem('luna_setup')
      if (dataStr) {
        const setupData = JSON.parse(dataStr)
        setupData.model = id
        localStorage.setItem('luna_setup', JSON.stringify(setupData))
      }
    } catch (e) {
      console.error(e)
    }

    // 2. Update local state
    setModels((prev) =>
      prev.map((model) => {
        if (model.id === id) {
          return { ...model, status: 'active' }
        } else if (model.status === 'active') {
          return { ...model, status: 'installed' }
        }
        return model
      })
    )
  }

  const handleDownload = (id: string) => {
    // Mock download action by marking as installed
    setModels((prev) =>
      prev.map((model) => {
        if (model.id === id) {
          return { ...model, status: 'installed' }
        }
        return model
      })
    )
  }

  return (
    <div className="flex-1 flex flex-col p-8 sm:p-10 md:p-12 overflow-y-auto bg-background text-foreground transition-colors duration-300 relative">
      {/* Background Glow */}
      <img
        src="/bg.png"
        alt="Glow Horizon"
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-5xl pointer-events-none select-none z-0 opacity-15 dark:opacity-30"
      />

      <div className="w-full z-10 space-y-4 animate-[fadeIn_0.3s_ease-out]">
        {/* Header Section */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 ">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">Local LLM Models</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Select your active brain or download new model architectures.
            </p>
          </div>
        </header>

        {/* Model Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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

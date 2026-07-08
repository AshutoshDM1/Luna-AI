import { useState, useCallback } from 'react'

export interface SetupFormData {
  userName: string
  assistantName: string
  model: string
  launchOnStartup: boolean
  hotkeyEnabled: boolean
  memoryEnabled: boolean
  language: string
  theme: string
}

export function useSetupNavigation(
  onComplete: (data: SetupFormData) => void,
  onCancel: () => void
) {
  const [currentStep, setCurrentStep] = useState(0)

  // Setup Form States (Default to gemma3:4b)
  const [userName, setUserName] = useState('')
  const [assistantName, setAssistantName] = useState('Luna')
  const [selectedModel, setSelectedModel] = useState('qwen3:4b')
  const [launchOnStartup, setLaunchOnStartup] = useState(true)
  const [hotkeyEnabled, setHotkeyEnabled] = useState(true)
  const [memoryEnabled, setMemoryEnabled] = useState(true)
  const [language, setLanguage] = useState('en')
  const [theme, setTheme] = useState('dark')

  const nextStep = useCallback(() => {
    if (currentStep < 3) {
      setCurrentStep((prev) => prev + 1)
    } else {
      onComplete({
        userName,
        assistantName,
        model: selectedModel,
        launchOnStartup,
        hotkeyEnabled,
        memoryEnabled,
        language,
        theme
      })
    }
  }, [
    currentStep,
    userName,
    assistantName,
    selectedModel,
    launchOnStartup,
    hotkeyEnabled,
    memoryEnabled,
    language,
    theme,
    onComplete
  ])

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    } else {
      onCancel()
    }
  }, [currentStep, onCancel])

  const isNextDisabled = currentStep === 0 && !userName.trim()

  return {
    currentStep,
    nextStep,
    prevStep,
    isNextDisabled,

    // Form Values & Setters
    formState: {
      userName,
      assistantName,
      selectedModel,
      launchOnStartup,
      hotkeyEnabled,
      memoryEnabled,
      language,
      theme
    },
    setters: {
      setUserName,
      setAssistantName,
      setSelectedModel,
      setLaunchOnStartup,
      setHotkeyEnabled,
      setMemoryEnabled,
      setLanguage,
      setTheme
    }
  }
}

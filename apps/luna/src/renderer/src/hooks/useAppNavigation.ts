import { useState, useCallback } from 'react'
import { SetupFormData } from './useSetupNavigation'

export type Step = 'welcome' | 'setup' | 'home'

export function useAppNavigation() {
  const [step, setStep] = useState<Step>(() => {
    const hasSetup = localStorage.getItem('luna_setup')
    return hasSetup ? 'home' : 'welcome'
  })

  const goToWelcome = useCallback(() => setStep('welcome'), [])
  const goToSetup = useCallback(() => setStep('setup'), [])

  const completeSetup = useCallback((data: SetupFormData) => {
    localStorage.setItem('luna_setup', JSON.stringify(data))
    setStep('home')
  }, [])

  return {
    step,
    goToWelcome,
    goToSetup,
    completeSetup
  }
}

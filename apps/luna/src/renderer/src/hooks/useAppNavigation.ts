import { useState, useCallback, useEffect } from 'react'
import { SetupFormData } from './useSetupNavigation'
import ApiClient from '@/lib/apiClient'

export type Step = 'welcome' | 'setup' | 'home'

interface UserData {
  id: string
  name: string
}

export function useAppNavigation() {
  const [currentUser, setCurrentUser] = useState<UserData | null>(() => {
    try {
      const setupStr = localStorage.getItem('luna_setup')
      const userId = localStorage.getItem('luna_user_id')
      if (setupStr && userId) {
        const parsed = JSON.parse(setupStr)
        return { id: userId, name: parsed.userName }
      }
    } catch {}
    return null
  })

  const [step, setStep] = useState<Step>(() => {
    const hasSetup = localStorage.getItem('luna_setup')
    return hasSetup ? 'home' : 'welcome'
  })

  // Sync user in database on launch if setup exists
  useEffect(() => {
    const setupStr = localStorage.getItem('luna_setup')
    const userId = localStorage.getItem('luna_user_id')
    if (setupStr && userId) {
      try {
        const parsed = JSON.parse(setupStr)
        ApiClient.post('/users/sync', { id: userId, name: parsed.userName })
      } catch (e) {
        console.error('Failed to sync user on launch:', e)
      }
    }
  }, [step])

  const goToWelcome = useCallback(() => setStep('welcome'), [])
  const goToSetup = useCallback(() => setStep('setup'), [])

  const handleLogout = useCallback(() => {
    localStorage.removeItem('luna_setup')
    localStorage.removeItem('luna_user_id')
    setCurrentUser(null)
    setStep('welcome')
  }, [])

  const completeSetup = useCallback((data: SetupFormData) => {
    localStorage.setItem('luna_setup', JSON.stringify(data))

    let userId = localStorage.getItem('luna_user_id')
    if (!userId) {
      userId = crypto.randomUUID()
      localStorage.setItem('luna_user_id', userId)
    }

    setCurrentUser({ id: userId, name: data.userName })

    // Sync to DB
    ApiClient.post('/users/sync', { id: userId, name: data.userName }).catch((err) =>
      console.error('Error syncing user on setup complete:', err)
    )

    setStep('home')
  }, [])

  return {
    step,
    currentUser,
    goToWelcome,
    goToSetup,
    handleLogout,
    completeSetup
  }
}

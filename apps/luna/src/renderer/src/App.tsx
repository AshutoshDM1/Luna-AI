import { useState } from 'react'
import Welcome from './pages/Welcome/Welcome'
import Setup from './pages/Setup/Setup'
import Provider from '@/shared/Provider/Provider'

type Step = 'welcome' | 'setup' | 'home'

function App(): React.JSX.Element {
  const [step, setStep] = useState<Step>('welcome')

  const handleStartSetup = () => {
    setStep('setup')
  }

  const handleSetupComplete = (data: {
    userName: string
    assistantName: string
    model: string
    launchOnStartup: boolean
    hotkeyEnabled: boolean
    memoryEnabled: boolean
  }) => {
    localStorage.setItem('luna_setup', JSON.stringify(data))
    setStep('home')
  }

  const handleBackToWelcome = () => {
    setStep('welcome')
  }

  return (
    <Provider>
      {step === 'welcome' && <Welcome onGetStarted={handleStartSetup} />}
      {step === 'setup' && <Setup onComplete={handleSetupComplete} onBack={handleBackToWelcome} />}
      {step === 'home' && (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-foreground font-sans">
          <h1 className="text-3xl font-bold">Luna Workspace</h1>
          <p className="text-muted-foreground mt-2 font-medium">
            Setup complete! Workspace is ready.
          </p>
        </div>
      )}
    </Provider>
  )
}

export default App

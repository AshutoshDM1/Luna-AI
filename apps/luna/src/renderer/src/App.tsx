import Welcome from './pages/Welcome/Welcome'
import Setup from './pages/Setup/Setup'
import Dashboard from './pages/Dasboard/Dasboard'
import Provider from '@/shared/Provider/Provider'
import { useAppNavigation } from '@/hooks/useAppNavigation'

function App(): React.JSX.Element {
  const { step, goToSetup, goToWelcome, completeSetup, handleLogout } = useAppNavigation()

  return (
    <Provider>
      {step === 'welcome' && <Welcome onGetStarted={goToSetup} />}
      {step === 'setup' && <Setup onComplete={completeSetup} onBack={goToWelcome} />}
      {step === 'home' && <Dashboard onLogout={handleLogout} />}
    </Provider>
  )
}
export default App

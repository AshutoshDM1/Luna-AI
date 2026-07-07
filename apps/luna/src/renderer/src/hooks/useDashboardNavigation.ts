import { useState, useCallback } from 'react'
import { MessageSquare, Cpu, Bot, User, Settings, Astroid, Sparkle } from 'lucide-react'

export type DashboardTab = 'chat' | 'models' | 'agents' | 'profile' | 'settings'

export interface MenuItem {
  id: DashboardTab
  name: string
  icon: React.ComponentType<{ className?: string }>
}

export const DASHBOARD_MENU_ITEMS: MenuItem[] = [
  { id: 'chat', name: 'AI Chat', icon: MessageSquare },
  { id: 'models', name: 'Local LLM', icon: Bot },
  { id: 'agents', name: 'AI Agents', icon: Sparkle },
  { id: 'profile', name: 'Profile', icon: User }
]

export function useDashboardNavigation(initialTab: DashboardTab = 'chat') {
  const [activeTab, setActiveTab] = useState<DashboardTab>(initialTab)

  const changeTab = useCallback((tab: DashboardTab) => {
    setActiveTab(tab)
  }, [])

  return {
    activeTab,
    changeTab,
    menuItems: DASHBOARD_MENU_ITEMS
  }
}

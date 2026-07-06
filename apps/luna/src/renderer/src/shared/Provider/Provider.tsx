import React from 'react'
import { ThemeProvider } from '@/components/theme-provider'

interface ProviderProps {
  children: React.ReactNode
}

export const Provider: React.FC<ProviderProps> = ({ children }) => {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      {children}
    </ThemeProvider>
  )
}

export default Provider

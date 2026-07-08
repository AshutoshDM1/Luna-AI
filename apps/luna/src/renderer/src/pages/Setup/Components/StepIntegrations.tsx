import React from 'react'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

interface StepIntegrationsProps {
  assistantName: string
  launchOnStartup: boolean
  setLaunchOnStartup: (val: boolean) => void
  hotkeyEnabled: boolean
  setHotkeyEnabled: (val: boolean) => void
  memoryEnabled: boolean
  setMemoryEnabled: (val: boolean) => void
  language: string
  setLanguage: (val: string) => void
  theme: string
  setTheme: (val: string) => void
}

export const StepIntegrations: React.FC<StepIntegrationsProps> = ({
  assistantName,
  launchOnStartup,
  setLaunchOnStartup,
  hotkeyEnabled,
  setHotkeyEnabled,
  language,
  setLanguage
}) => {
  return (
    <div className="space-y-4 animate-[fadeIn_0.3s_ease-out] max-h-[360px] overflow-y-auto pr-1 scrollbar-none">
      <div>
        <h3 className="text-base font-bold tracking-tight text-foreground">Preferences</h3>
      </div>

      <div className="space-y-4 pt-1">
        {/* Preference 1: Preferred Language */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-xs text-foreground">Language</div>
          </div>
          <div className="w-[110px]">
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="h-8 text-[11px] bg-background border-border text-foreground px-2">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border text-popover-foreground">
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="de">Deutsch</SelectItem>
                <SelectItem value="zh">中文</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Preference 2: Theme Selection */}
        {/* <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-xs text-foreground">Theme Selection</div>
            <div className="text-[10px] text-muted-foreground leading-normal mt-0.5">
              Select your interface display style.
            </div>
          </div>
          <div className="w-[110px]">
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger className="h-8 text-[11px] bg-background border-border text-foreground px-2">
                <SelectValue placeholder="Theme" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border text-popover-foreground">
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div> */}

        {/* Toggle 1: Open at Login */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-xs text-foreground">Launch on Startup</div>
          </div>
          <Switch checked={launchOnStartup} onCheckedChange={setLaunchOnStartup} />
        </div>

        {/* Toggle 2: Keyboard Hotkey */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
              Keyboard Shortcut
              <kbd className="px-1.5 py-0.5 rounded border border-border bg-muted text-[9px] font-normal">
                Alt + Space
              </kbd>
            </div>
          </div>
          <Switch checked={hotkeyEnabled} onCheckedChange={setHotkeyEnabled} />
        </div>
      </div>
    </div>
  )
}

import React, { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import ApiClient from '@/lib/apiClient'
import { Terminal, Globe, AppWindow, FileText, Bell } from 'lucide-react'
import { CustomYoutubeIcon } from '@/Agents/YoutubeSearch/YoutubeSearch'

interface SettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultTab?: 'integrations' | 'skills'
}

const SKILLS = [
  {
    name: 'Terminal',
    icon: <Terminal className="w-4 h-4" />,
    description: 'Executes commands in your local terminal.'
  },
  {
    name: 'Web Search',
    icon: <Globe className="w-4 h-4" />,
    description: 'Searches the web for real-time information.'
  },
  {
    name: 'Open App',
    icon: <AppWindow className="w-4 h-4" />,
    description: 'Opens local applications installed on your computer.'
  },
  {
    name: 'Make Note',
    icon: <FileText className="w-4 h-4" />,
    description: 'Creates and saves notes or code snippets to your local file system.'
  },
  {
    name: 'Set Alarm',
    icon: <Bell className="w-4 h-4" />,
    description: 'Sets a local reminder or alarm using your OS notifications.'
  },
  {
    name: 'YouTube Search',
    icon: <CustomYoutubeIcon className="w-4 h-4" />,
    description: 'Searches for and plays videos on YouTube.'
  }
]

export const SettingsModal: React.FC<SettingsModalProps> = ({
  open,
  onOpenChange,
  defaultTab = 'integrations'
}) => {
  const [notionToken, setNotionToken] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      // Load current settings
      ApiClient.get<any>('/settings').then((res) => {
        if (res.ok && res.data) {
          setNotionToken(res.data.notionToken || '')
        }
      })
    }
  }, [open])

  const handleSaveIntegrations = async () => {
    setLoading(true)
    try {
      await ApiClient.post('/settings', { notionToken })
    } catch (err) {
      console.error('Failed to save settings:', err)
    } finally {
      setLoading(false)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
        <DialogHeader>
          <DialogTitle>Agent Configuration</DialogTitle>
          <DialogDescription>
            Manage your AI agent's integrations and built-in skills.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue={defaultTab} className="w-full mt-2">
          <TabsList className="grid w-full grid-cols-2 bg-accent/50 text-muted-foreground">
            <TabsTrigger
              value="integrations"
              className="data-[state=active]:bg-background data-[state=active]:text-foreground"
            >
              Integrations
            </TabsTrigger>
            <TabsTrigger
              value="skills"
              className="data-[state=active]:bg-background data-[state=active]:text-foreground"
            >
              Skills Overview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="integrations" className="pt-4 space-y-4">
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="notionToken" className="text-sm font-medium">
                  Notion API Token
                </Label>
                <Input
                  id="notionToken"
                  type="password"
                  value={notionToken}
                  onChange={(e) => setNotionToken(e.target.value)}
                  placeholder="secret_..."
                  className="bg-background/50 border-border h-9 text-sm"
                />
                <p className="text-[11px] text-muted-foreground pt-1">
                  Connects the Notion MCP Server. Requires a Notion internal integration token.
                </p>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button
                onClick={handleSaveIntegrations}
                disabled={loading}
                className="h-8 px-4 text-xs"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="skills" className="pt-4 space-y-2">
            <p className="text-[11px] text-muted-foreground pb-2">
              The agent has access to these native skills out of the box. Hover for details.
            </p>
            <TooltipProvider>
              <div className="grid grid-cols-2 gap-2">
                {SKILLS.map((skill) => (
                  <Tooltip key={skill.name}>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 p-2 rounded-md border border-border/50 bg-accent/20 hover:bg-accent/40 cursor-default transition-colors">
                        <div className="text-indigo-400">{skill.icon}</div>
                        <span className="text-xs font-medium">{skill.name}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-[11px] max-w-[200px]">
                      {skill.description}
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </TooltipProvider>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

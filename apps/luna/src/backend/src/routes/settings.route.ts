import { IRouter, Router } from 'express'
import fs from 'fs'
import path from 'path'
import { mcpManager } from '../mcp/McpManager'

const router: IRouter = Router()
const dataDir = path.join(__dirname, '../../data')
const settingsFile = path.join(dataDir, 'settings.json')

// Ensure data dir exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

export function getSettings() {
  try {
    if (fs.existsSync(settingsFile)) {
      const data = fs.readFileSync(settingsFile, 'utf-8')
      return JSON.parse(data)
    }
  } catch (err) {
    console.error('Failed to read settings', err)
  }
  return {}
}

export function saveSettings(newSettings: Record<string, any>) {
  const current = getSettings()
  const merged = { ...current, ...newSettings }
  fs.writeFileSync(settingsFile, JSON.stringify(merged, null, 2))
  return merged
}

router.get('/', (_req, res) => {
  res.json(getSettings())
})

router.post('/', (req, res) => {
  const oldSettings = getSettings()
  const updated = saveSettings(req.body)

  if (req.body.notionToken !== undefined && req.body.notionToken !== oldSettings.notionToken) {
    if (req.body.notionToken) {
      mcpManager.connectNotion(req.body.notionToken).catch(console.error)
    } else {
      mcpManager.disconnectNotion().catch(console.error)
    }
  }

  res.json({ success: true, settings: updated })
})

export default router

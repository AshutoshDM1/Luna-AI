import fs from 'fs'
import path from 'path'

const dataDir = path.join(__dirname, '../../data')
const settingsFile = path.join(dataDir, 'settings.json')

// Ensure data dir exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

export function getSettings() {
  try {
    if (fs.existsSync(settingsFile)) {
      const data = fs.readFileSync(settingsFile, 'utf-8').trim()
      if (!data) {
        return {}
      }
      return JSON.parse(data)
    }
  } catch (err: any) {
    console.error('Failed to read settings:', err.message)
  }
  return {}
}

export function saveSettings(newSettings: Record<string, any>) {
  const current = getSettings()
  const merged = { ...current, ...newSettings }
  fs.writeFileSync(settingsFile, JSON.stringify(merged, null, 2))
  return merged
}

import { PrismaClient } from '../../prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import path from 'path'
import fs from 'fs'

let dbPath: string

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { app } = require('electron')
  if (app) {
    const isDev = !app.isPackaged
    if (isDev) {
      dbPath = path.resolve(__dirname, '../../src/backend/src/db/dev.db')
    } else {
      dbPath = path.join(app.getPath('userData'), 'luna-database.db')

      // Ensure the directory for the database exists
      const dir = path.dirname(dbPath)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }

      // If database file does not exist in userData, copy the template from resources
      if (!fs.existsSync(dbPath)) {
        const templatePath = path.join(process.resourcesPath, 'template.db')
        if (fs.existsSync(templatePath)) {
          try {
            fs.copyFileSync(templatePath, dbPath)
            console.log('🚀 Copied database template to:', dbPath)
          } catch (err: any) {
            console.error('❌ Failed to copy template database:', err.message)
          }
        } else {
          console.warn('⚠️ Template database not found at:', templatePath)
        }
      }
    }
  } else {
    dbPath = path.resolve(__dirname, 'dev.db')
  }
} catch {
  dbPath = path.resolve(__dirname, 'dev.db')
}

// Ensure the directory for the database exists
const dir = path.dirname(dbPath)
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true })
}

// Normalize and pass config object to the SQLite adapter
const absoluteDbPath = path.resolve(dbPath).replace(/\\/g, '/')
console.log('🚀 SQLite database path resolved to:', absoluteDbPath)
const adapter = new PrismaBetterSqlite3({
  url: `file:${absoluteDbPath}`
})

export const prisma = new PrismaClient({ adapter })

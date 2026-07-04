import * as PrismaClientPackage from '../../prisma/client'
const { PrismaClient } = PrismaClientPackage
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import path from 'path'
import fs from 'fs'

let dbPath: string

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { app } = require('electron')
  if (app) {
    const isDev = !app.isPackaged
    dbPath = isDev
      ? path.resolve(__dirname, '../../src/backend/src/db/dev.db')
      : path.join(app.getPath('userData'), 'luna-database.db')
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

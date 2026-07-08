import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import tailwindcss from '@tailwindcss/vite'

const copyPrismaClient = () => ({
  name: 'copy-prisma-client',
  writeBundle() {
    const src = resolve(__dirname, 'src/backend/prisma/client')
    const dest = resolve(__dirname, 'out/backend/prisma/client')
    if (fs.existsSync(src)) {
      fs.mkdirSync(dest, { recursive: true })
      fs.cpSync(src, dest, { recursive: true })
      console.log('✅ Prisma client copied to out/backend/prisma/client')
    }
  }
})

const copyAgentPrompt = () => ({
  name: 'copy-agent-prompt',
  writeBundle() {
    const src = resolve(__dirname, 'src/backend/src/skills/agent_system_prompt.txt')
    const destDir = resolve(__dirname, 'out/skills')
    const dest = resolve(destDir, 'agent_system_prompt.txt')
    if (fs.existsSync(src)) {
      fs.mkdirSync(destDir, { recursive: true })
      fs.copyFileSync(src, dest)
      console.log('✅ Agent system prompt copied to out/skills/agent_system_prompt.txt')
    }
  }
})

export default defineConfig({
  main: {
    build: {
      rollupOptions: {
        external: ['better-sqlite3', '@prisma/adapter-better-sqlite3', /prisma\/client/]
      }
    },
    plugins: [copyPrismaClient(), copyAgentPrompt()]
  },
  preload: {},
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@': resolve('src/renderer/src')
      }
    },
    plugins: [react(), tailwindcss()]
  }
})

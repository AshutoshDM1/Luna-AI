import { IRouter, Router } from 'express'
import healthRouter from './health.route'
import userRouter from './user.route'
import ollamaRouter from './ollama.route'
import chatRouter from './chat.route'
import terminalAgentRouter from '../skills/terminal'
import webSearchRouter from '../skills/web_search'
import settingsRouter from './settings.route'

const router: IRouter = Router()

router.use('/', healthRouter) // GET /api
router.use('/users', userRouter) // /api/users
router.use('/ollama', ollamaRouter) // /api/ollama
router.use('/chat', chatRouter) // /api/chat
router.use('/agent/terminal', terminalAgentRouter) // /api/agent/terminal
router.use('/agent/web-search', webSearchRouter) // /api/agent/web-search
router.use('/settings', settingsRouter) // /api/settings

export default router

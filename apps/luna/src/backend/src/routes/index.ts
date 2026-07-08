import { IRouter, Router } from 'express'
import healthRouter from './health.route'
import userRouter from './user.route'
import ollamaRouter from './ollama.route'
import chatRouter from './chat.route'
import terminalAgentRouter from '../skills/terminal'

const router: IRouter = Router()

router.use('/', healthRouter) // This handles GET /api
router.use('/users', userRouter) // This handles GET/POST /api/users
router.use('/ollama', ollamaRouter) // This handles /api/ollama
router.use('/chat', chatRouter) // This handles /api/chat
router.use('/agent/terminal', terminalAgentRouter) // This handles /api/agent/terminal

export default router

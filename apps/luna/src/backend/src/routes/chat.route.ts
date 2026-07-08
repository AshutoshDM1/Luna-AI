import { IRouter, Router } from 'express'
import {
  getSessions,
  createSession,
  updateSessionTitle,
  deleteSession,
  getSessionMessages,
  addMessageToSession
} from '../controllers/chat/session.controller'
import { handleChatRequest } from '../controllers/chat/chat.contoller'

const router: IRouter = Router()

// ─── Session CRUD & History Routes ────────────────────────────────────────────
router.get('/sessions', getSessions)
router.post('/sessions', createSession)
router.put('/sessions/:id', updateSessionTitle)
router.delete('/sessions/:id', deleteSession)
router.get('/sessions/:id/messages', getSessionMessages)
router.post('/sessions/:id/messages', addMessageToSession)

// ─── Main Chat Inference Route ────────────────────────────────────────────────
router.post('/', handleChatRequest)

export default router

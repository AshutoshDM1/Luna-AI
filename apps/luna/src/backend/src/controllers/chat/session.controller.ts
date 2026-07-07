import { Request, Response } from 'express'
import { prisma } from '../../db/db'

// Get all sessions for a user
export const getSessions = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.query

  if (!userId) {
    res.status(400).json({ error: 'userId is required' })
    return
  }

  try {
    const sessions = await prisma.chatSession.findMany({
      where: { userId: userId as string },
      orderBy: { updatedAt: 'desc' }
    })
    res.json(sessions)
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
}

// Create a new session
export const createSession = async (req: Request, res: Response): Promise<void> => {
  const { userId, title } = req.body

  if (!userId || !title) {
    res.status(400).json({ error: 'userId and title are required' })
    return
  }

  try {
    const session = await prisma.chatSession.create({
      data: {
        userId: userId as string,
        title
      }
    })
    res.status(201).json(session)
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
}

// Update session title
export const updateSessionTitle = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params
  const { title } = req.body

  if (!title) {
    res.status(400).json({ error: 'title is required' })
    return
  }

  try {
    const session = await prisma.chatSession.update({
      where: { id: id as string },
      data: { title }
    })
    res.json(session)
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
}

// Delete session
export const deleteSession = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params

  try {
    await prisma.chatSession.delete({ where: { id: id as string } })
    res.json({ message: 'Session deleted successfully' })
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
}

// Get messages for a session
export const getSessionMessages = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params

  try {
    const messages = await prisma.chatMessage.findMany({
      where: { sessionId: id as string },
      orderBy: { createdAt: 'asc' }
    })
    res.json(messages)
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
}

// Save a single message in a session manually
export const addMessageToSession = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params
  const { role, content } = req.body

  if (!role || !content) {
    res.status(400).json({ error: 'role and content are required' })
    return
  }

  try {
    const message = await prisma.chatMessage.create({
      data: {
        sessionId: id as string,
        role,
        content
      }
    })

    // Update session timestamp
    await prisma.chatSession.update({
      where: { id: id as string },
      data: { updatedAt: new Date() }
    })

    res.status(201).json(message)
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
}

import { Request, Response } from 'express'
import { prisma } from '../../db/db'

export const getUsers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany()
    res.json(users)
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
}

export const createUser = async (req: Request, res: Response): Promise<void> => {
  const { email, name } = req.body
  try {
    const user = await prisma.user.create({
      data: { email, name }
    })
    res.status(201).json(user)
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
}

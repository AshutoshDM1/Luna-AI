import { Request, Response } from 'express'
import { prisma } from '../../db/db'

// Get all users
export const getUsers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    })
    res.json(users)
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
}

// Sync User (Upsert based on local UUID)
export const syncUser = async (req: Request, res: Response): Promise<void> => {
  const { id, name } = req.body

  if (!id || !name) {
    res.status(400).json({ error: 'Please provide both id (UUID) and name.' })
    return
  }

  try {
    const user = await prisma.user.upsert({
      where: { id },
      update: { name },
      create: { id, name }
    })
    res.json(user)
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
}

// Update User details
export const updateUser = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string
  const { name } = req.body

  try {
    const updated = await prisma.user.update({
      where: { id },
      data: { name }
    })
    res.json(updated)
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
}

// Delete User
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string

  try {
    await prisma.user.delete({ where: { id } })
    res.json({ message: 'User deleted successfully.' })
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
}

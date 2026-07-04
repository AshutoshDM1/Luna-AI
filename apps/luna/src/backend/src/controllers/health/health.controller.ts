import { Request, Response } from 'express'

export const getHealth = (_req: Request, res: Response): void => {
  res.json({
    message: 'Welcome to the Luna local AI Assistant API!',
    status: 'healthy',
    timestamp: new Date().toISOString()
  })
}

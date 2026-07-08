import { IRouter, Router } from 'express'
import { getHealth } from '../controllers/health/health.controller'

const router: IRouter = Router()

router.get('/', getHealth)

export default router

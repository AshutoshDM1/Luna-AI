import { Router } from 'express'
import healthRouter from './health.route'
import userRouter from './user.route'

const router = Router()

router.use('/', healthRouter) // This handles GET /api
router.use('/users', userRouter) // This handles GET/POST /api/users

export default router

import { Router } from 'express'
import { getUsers, syncUser, updateUser, deleteUser } from '../controllers/user/user.controller'

const router = Router()

router.get('/', getUsers)
router.post('/sync', syncUser)
router.put('/:id', updateUser)
router.delete('/:id', deleteUser)

export default router

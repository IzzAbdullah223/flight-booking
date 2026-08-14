import { Router } from 'express'
import { verifyToken } from '../controllers/authController.js'
import { requireRole } from '../middleware/requireRole.js'
import { getFlights, getFlight, createFlight, updateFlight, deleteFlight } from '../controllers/flightController.js'

const flightRouter = Router()

flightRouter.get('/', getFlights)
flightRouter.get('/:id', getFlight)
flightRouter.post('/', verifyToken, requireRole('ADMIN'), createFlight)
flightRouter.put('/:id', verifyToken, requireRole('ADMIN'), updateFlight)
flightRouter.delete('/:id', verifyToken, requireRole('ADMIN'), deleteFlight)

export default flightRouter
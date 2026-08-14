import { Router } from 'express'
 
import { verifyToken } from '../controllers/authController.js'
import { createBookingPost, getOwnBookings, getOwnBooking } from '../controllers/bookingController.js'

const bookingRouter = Router()

bookingRouter.use(verifyToken)  

bookingRouter.post('/', createBookingPost)
bookingRouter.get('/', getOwnBookings)
bookingRouter.get('/:id', getOwnBooking)

export default bookingRouter

 
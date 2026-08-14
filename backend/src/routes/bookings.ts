import { Router } from 'express'
import { verifyToken } from '../controllers/authController.js'
import { requireRole } from '../middleware/requireRole.js'
import {
    createBookingPost,
    getOwnBookings,
    getOwnBooking,
    cancelOwnBookingPost,
    adminCancelBookingPost,
    adminGetAllBookings,
} from '../controllers/bookingController.js'

const bookingRouter = Router()

bookingRouter.use(verifyToken)  

bookingRouter.post('/', createBookingPost)
bookingRouter.get('/', getOwnBookings)
bookingRouter.get('/admin/all', requireRole('ADMIN'), adminGetAllBookings)
bookingRouter.get('/:id', getOwnBooking)
bookingRouter.post('/:id/cancel', cancelOwnBookingPost)
bookingRouter.post('/:id/admin-cancel', requireRole('ADMIN'), adminCancelBookingPost)

export default bookingRouter

 
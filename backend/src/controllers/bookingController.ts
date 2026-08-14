import { type Request, type Response } from 'express'
import { createBookingSchema, listBookingsQuerySchema } from '../schemas/bookingSchemas.js'
import * as bookingService from '../services/bookingService.js'
import { AppError } from '../utils/Apperror.js'

export async function createBookingPost(req: Request, res: Response) {
    const result = createBookingSchema.safeParse(req.body)
    if (!result.success) {
        return res.status(400).json({ error: 'Invalid booking data', details: result.error.flatten() })
    }

 
    const userId = req.user!.id

    try {
        const booking = await bookingService.createBooking(userId, result.data.flightId, result.data.passengers)
        res.status(201).json(booking)
    } catch (err) {
        if (err instanceof AppError) return res.status(err.statusCode).json({ error: err.message })
        console.error(err)
        res.status(500).json({ error: 'Something went wrong' })
    }
}

export async function getOwnBookings(req: Request, res: Response) {
    const result = listBookingsQuerySchema.safeParse(req.query)
    if (!result.success) return res.status(400).json({ error: 'Invalid query parameters', details: result.error.flatten() })

    const userId = req.user!.id
    const { page, limit, status } = result.data

    const { data, pagination } = await bookingService.getOwnBookings(userId, page, limit, status)
    res.json({ data, pagination })
}

export async function getOwnBooking(req: Request, res: Response) {
    const userId = req.user!.id
    const bookingId = req.params.id as string

    try {
        const booking = await bookingService.getOwnBookingById(userId, bookingId)
        res.json(booking)
    } catch (err) {
        if (err instanceof AppError) return res.status(err.statusCode).json({ error: err.message })
        console.error(err)
        res.status(500).json({ error: 'Something went wrong' })
    }
}
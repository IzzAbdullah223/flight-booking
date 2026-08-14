import { z } from 'zod'

export const passengerSchema = z.object({
    fullName: z.string().min(1),
    dateOfBirth: z.coerce.date(),
    nationality: z.string().min(1),
    passportNumber: z.string().min(1),
    email: z.string().email(),
    contactNumber: z.string().min(1),
})

export const createBookingSchema = z.object({
    flightId: z.string().uuid(),
    passengers: z.array(passengerSchema).min(1),
})

export const listBookingsQuerySchema = z.object({
    status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED']).optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
})

export const adminListBookingsQuerySchema = z.object({
    status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED']).optional(),
    origin: z.string().min(1).optional(),
    destination: z.string().min(1).optional(),
    date: z.string().optional(), // ISO date - matches flight.departureTime day
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
})
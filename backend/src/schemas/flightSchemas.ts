import { z } from 'zod'

export const createFlightSchema = z.object({
    flightNumber: z.string().min(1),
    origin: z.string().min(1),
    destination: z.string().min(1),
    departureTime: z.coerce.date(),
    arrivalTime: z.coerce.date(),
    price: z.number().positive(),
    totalSeats: z.number().int().positive(),
})


export const searchFlightsQuerySchema = z.object({
    origin: z.string().min(1).optional(),
    destination: z.string().min(1).optional(),
    date: z.string().optional(), // ISO date string, e.g. "2026-09-01"
    passengers: z.coerce.number().int().positive().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
})
 
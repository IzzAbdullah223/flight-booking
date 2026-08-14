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
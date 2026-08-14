import { prisma } from '../db/prisma.js'
import * as flightService from './flightService.js'
import { AppError } from '../utils/Apperror.js'
import type { z } from 'zod'
import type { passengerSchema } from '../schemas/bookingSchemas.js'

type PassengerInput = z.infer<typeof passengerSchema>

 
export async function createBooking(userId: string, flightId: string, passengers: PassengerInput[]) {
    const seatCount = passengers.length

    return prisma.$transaction(async (tx) => {
        await flightService.reserveSeats(tx, flightId, seatCount)

        const booking = await tx.booking.create({
            data: {
                userId,
                flightId,
                seats: seatCount,
                status: 'PENDING',
                passengers: {
                    create: passengers.map((p) => ({
                        fullName: p.fullName,
                        dateOfBirth: p.dateOfBirth,
                        nationality: p.nationality,
                        passportNumber: p.passportNumber,
                        email: p.email,
                        contactNumber: p.contactNumber,
                    })),
                },
            },
            include: { passengers: true, flight: true },
        })

        return booking
    })
}
 
export async function getOwnBookings(userId: string, page: number, limit: number, status?: string) {
    const where = { userId, ...(status ? { status: status as any } : {}) }

    const [data, total] = await prisma.$transaction([
        prisma.booking.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
            include: { flight: true, passengers: true, payment: true },
        }),
        prisma.booking.count({ where }),
    ])

    return { data, pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } }
}

export async function getOwnBookingById(userId: string, bookingId: string) {
    const booking = await prisma.booking.findFirst({
        where: { id: bookingId, userId },
        include: { flight: true, passengers: true, payment: true },
    })
    if (!booking) throw new AppError('BOOKING_NOT_FOUND', 404, 'Booking not found')
    return booking
}
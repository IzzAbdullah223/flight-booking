import { prisma } from '../db/prisma.js'
import { stripe } from '../config/stripe.js'
import { CANCELLATION_CUTOFF_HOURS } from '../config/policy.js'
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

export async function getAllBookings(params: {
    status?: string | undefined
    origin?: string | undefined
    destination?: string | undefined
    date?: string | undefined
    page: number
    limit: number
}) {
    const { status, origin, destination, date, page, limit } = params

    const where: any = {}
    if (status) where.status = status
    if (origin || destination || date) {
        where.flight = {}
        if (origin) where.flight.origin = { equals: origin, mode: 'insensitive' }
        if (destination) where.flight.destination = { equals: destination, mode: 'insensitive' }
        if (date) {
            const start = new Date(date)
            if (isNaN(start.getTime())) throw new AppError('INVALID_DATE', 400, 'Invalid date format')
            const end = new Date(start)
            end.setUTCDate(end.getUTCDate() + 1)
            where.flight.departureTime = { gte: start, lt: end }
        }
    }

    const [data, total] = await prisma.$transaction([
        prisma.booking.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
            include: { flight: true, passengers: true, payment: true, user: { select: { id: true, email: true, name: true } } },
        }),
        prisma.booking.count({ where }),
    ])

    return { data, pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } }
}

export async function cancelBooking(userId: string, bookingId: string, isAdmin: boolean) {
    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { flight: true, payment: true },
    })

    if (!booking) throw new AppError('BOOKING_NOT_FOUND', 404, 'Booking not found')
    if (!isAdmin && booking.userId !== userId) throw new AppError('BOOKING_NOT_FOUND', 404, 'Booking not found')

    if (booking.status === 'CANCELLED') {
        throw new AppError('ALREADY_CANCELLED', 400, 'This booking is already cancelled')
    }

    if (!isAdmin && booking.status === 'CONFIRMED') {
        const cutoffMs = CANCELLATION_CUTOFF_HOURS * 60 * 60 * 1000
        const cutoff = new Date(booking.flight.departureTime.getTime() - cutoffMs)
        if (new Date() > cutoff) {
            throw new AppError(
                'CANCELLATION_WINDOW_PASSED',
                400,
                `Cancellations must be made at least ${CANCELLATION_CUTOFF_HOURS}h before departure`
            )
        }
    }

    const needsRefund = booking.status === 'CONFIRMED' && booking.payment?.status === 'SUCCEEDED'

    if (needsRefund && booking.payment?.stripePaymentIntentId) {
        await stripe.refunds.create({ payment_intent: booking.payment.stripePaymentIntentId })
    }

    await prisma.$transaction(async (tx) => {
        await tx.booking.update({ where: { id: bookingId }, data: { status: 'CANCELLED' } })
        if (booking.payment) {
            await tx.payment.update({
                where: { bookingId },
                data: { status: needsRefund ? 'REFUNDED' : booking.payment.status },
            })
        }
        await flightService.releaseSeats(tx, booking.flightId, booking.seats)
    })

    return { bookingId, refunded: needsRefund }
}
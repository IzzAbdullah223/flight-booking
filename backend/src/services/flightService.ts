import { prisma } from '../db/prisma.js'
import { Prisma } from '../db/generated/prisma/client.js'
import { AppError } from '../utils/Apperror.js'

type Tx = Prisma.TransactionClient

export interface SearchFlightsParams {
    origin?: string | undefined
    destination?: string | undefined
    date?: string | undefined
    passengers?: number | undefined
    page: number
    limit: number
}

export async function searchFlights(params: SearchFlightsParams) {
    const { origin, destination, date, passengers, page, limit } = params

    const where: Prisma.FlightWhereInput = {}

    if (origin) where.origin = { equals: origin, mode: 'insensitive' }
    if (destination) where.destination = { equals: destination, mode: 'insensitive' }

    if (date) {
        // date is treated as a calendar day match on departureTime
        const start = new Date(date)
        if (isNaN(start.getTime())) throw new AppError('INVALID_DATE', 400, 'Invalid date format')
        const end = new Date(start)
        end.setUTCDate(end.getUTCDate() + 1)
        where.departureTime = { gte: start, lt: end }
    }

    if (passengers) where.availableSeats = { gte: passengers }

    const [data, total] = await prisma.$transaction([
        prisma.flight.findMany({
            where,
            orderBy: { departureTime: 'asc' },
            skip: (page - 1) * limit,
            take: limit,
            select: {
                id: true,
                flightNumber: true,
                origin: true,
                destination: true,
                departureTime: true,
                arrivalTime: true,
                price: true,
                availableSeats: true,
            },
        }),
        prisma.flight.count({ where }),
    ])

    return {
        data,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.max(1, Math.ceil(total / limit)),
        },
    }
}

export async function getFlightById(id: string) {
    const flight = await prisma.flight.findUnique({ where: { id } })
    if (!flight) throw new AppError('FLIGHT_NOT_FOUND', 404, 'Flight not found')
    return flight
}

export async function createFlight(data: Prisma.FlightCreateInput) {
    return prisma.flight.create({ data })
}

export async function updateFlight(id: string, data: Prisma.FlightUpdateInput) {
    await getFlightById(id) // 404s cleanly instead of letting Prisma throw P2025
    return prisma.flight.update({ where: { id }, data })
}

export async function deleteFlight(id: string) {
    await getFlightById(id)
    await prisma.flight.delete({ where: { id } })
}

export async function reserveSeats(tx: Tx, flightId: string, seatCount: number) {
    const updated = await tx.flight.updateMany({
        where: { id: flightId, availableSeats: { gte: seatCount } },
        data: { availableSeats: { decrement: seatCount } },
    })

    if (updated.count === 0) {
        const flight = await tx.flight.findUnique({ where: { id: flightId } })
        if (!flight) throw new AppError('FLIGHT_NOT_FOUND', 404, 'Flight not found')
        throw new AppError('SOLD_OUT', 409, 'Not enough seats available on this flight')
    }
}

 
export async function releaseSeats(tx: Tx, flightId: string, seatCount: number) {
    await tx.flight.update({
        where: { id: flightId },
        data: { availableSeats: { increment: seatCount } },
    })
}
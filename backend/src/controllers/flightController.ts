import { type Request, type Response } from 'express'
import { prisma } from '../db/prisma.js'
import { createFlightSchema } from '../schemas/flightSchemas.js'

export async function getFlights(req: Request, res: Response) {
    const flights = await prisma.flight.findMany()
    res.json(flights)
}

export async function getFlight(req: Request, res: Response) {
    const id = req.params.id as string
    const flight = await prisma.flight.findUnique({ where: {id} })
    if (!flight) return res.status(404).json({ error: "Flight not found" })
    res.json(flight)
}

export async function createFlight(req: Request, res: Response) {
    const result = createFlightSchema.safeParse(req.body)
    if (!result.success) return res.status(400).json({ error: "Invalid flight data" })

    const flight = await prisma.flight.create({
        data: {
            ...result.data,
            availableSeats: result.data.totalSeats,
        }
    })
    res.status(201).json(flight)
}

export async function updateFlight(req: Request, res: Response) {
    const id = req.params.id as string
    const flight = await prisma.flight.update({
        where: { id },
        data: req.body
    })
    res.json(flight)
}

export async function deleteFlight(req: Request, res: Response) {
    const id = req.params.id as string
    await prisma.flight.delete({ where: { id} })
    res.status(204).send()
}
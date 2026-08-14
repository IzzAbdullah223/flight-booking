import { type Request, type Response } from 'express'
import { createFlightSchema, searchFlightsQuerySchema } from '../schemas/flightSchemas.js'
import * as flightService from '../services/flightService.js'
import { AppError } from '../utils/Apperror.js'
 

export async function getFlights(req: Request, res: Response) {
    const result = searchFlightsQuerySchema.safeParse(req.query)
    if (!result.success) {
        return res.status(400).json({ error: 'Invalid search parameters', details: result.error.flatten() })
    }

    try {
        const { data, pagination } = await flightService.searchFlights(result.data)
        res.json({ data, pagination })
    } catch (err) {
        if (err instanceof AppError) return res.status(err.statusCode).json({ error: err.message })
        console.error(err)
        res.status(500).json({ error: 'Something went wrong' })
    }
}

export async function getFlight(req: Request, res: Response) {
    const id = req.params.id as string
    try {
        const flight = await flightService.getFlightById(id)
        res.json(flight)
    } catch (err) {
        if (err instanceof AppError) return res.status(err.statusCode).json({ error: err.message })
        console.error(err)
        res.status(500).json({ error: 'Something went wrong' })
    }
}

export async function createFlight(req: Request, res: Response) {
    const result = createFlightSchema.safeParse(req.body)
    if (!result.success) return res.status(400).json({ error: 'Invalid flight data', details: result.error.flatten() })

    const flight = await flightService.createFlight({
        ...result.data,
        availableSeats: result.data.totalSeats,
    })
    res.status(201).json(flight)
}

export async function updateFlight(req: Request, res: Response) {
    const id = req.params.id as string
    try {
        const flight = await flightService.updateFlight(id, req.body)
        res.json(flight)
    } catch (err) {
        if (err instanceof AppError) return res.status(err.statusCode).json({ error: err.message })
        console.error(err)
        res.status(500).json({ error: 'Something went wrong' })
    }
}

export async function deleteFlight(req: Request, res: Response) {
    const id = req.params.id as string
    try {
        await flightService.deleteFlight(id)
        res.status(204).send()
    } catch (err) {
        if (err instanceof AppError) return res.status(err.statusCode).json({ error: err.message })
        console.error(err)
        res.status(500).json({ error: 'Something went wrong' })
    }
}